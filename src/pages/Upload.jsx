import { useState, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { 
  Upload as UploadIcon, 
  Music, 
  Image, 
  X, 
  Check,
  AlertCircle,
  Loader
} from 'lucide-react'
import './Upload.css'

function Upload() {
  const navigate = useNavigate()
  const { user, token, isAuthenticated } = useAuth()
  const audioInputRef = useRef(null)
  const coverInputRef = useRef(null)
  
  const [formData, setFormData] = useState({
    title: '',
    artist: '',
    album: '',
    genre: '',
    description: ''
  })
  
  const [audioFile, setAudioFile] = useState(null)
  const [coverFile, setCoverFile] = useState(null)
  const [coverPreview, setCoverPreview] = useState(null)
  const [uploading, setUploading] = useState(false)
  const [uploadProgress, setUploadProgress] = useState(0)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)

  if (!isAuthenticated) {
    return (
      <div className="page">
        <div className="container">
          <div className="upload-auth-required glass">
            <AlertCircle size={48} />
            <h2>Connexion requise</h2>
            <p>Vous devez être connecté pour uploader de la musique.</p>
            <button onClick={() => navigate('/login')} className="btn btn-primary">
              Se connecter
            </button>
          </div>
        </div>
      </div>
    )
  }

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    })
  }

  const handleAudioSelect = (e) => {
    const file = e.target.files[0]
    if (file) {
      if (file.type.startsWith('audio/')) {
        setAudioFile(file)
        if (!formData.title) {
          setFormData(prev => ({
            ...prev,
            title: file.name.replace(/\.[^/.]+$/, '')
          }))
        }
        setError('')
      } else {
        setError('Veuillez sélectionner un fichier audio valide')
      }
    }
  }

  const handleCoverSelect = (e) => {
    const file = e.target.files[0]
    if (file) {
      if (file.type.startsWith('image/')) {
        setCoverFile(file)
        const reader = new FileReader()
        reader.onload = (e) => setCoverPreview(e.target.result)
        reader.readAsDataURL(file)
        setError('')
      } else {
        setError('Veuillez sélectionner une image valide')
      }
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    
    if (!audioFile) {
      setError('Veuillez sélectionner un fichier audio')
      return
    }

    if (!formData.title.trim()) {
      setError('Veuillez entrer un titre')
      return
    }

    setUploading(true)
    setUploadProgress(0)
    setError('')

    try {
      const data = new FormData()
      data.append('audio', audioFile)
      if (coverFile) {
        data.append('cover', coverFile)
      }
      data.append('title', formData.title)
      data.append('artist', formData.artist || user.username)
      data.append('album', formData.album)
      data.append('genre', formData.genre)
      data.append('description', formData.description)

      // Simuler la progression
      const progressInterval = setInterval(() => {
        setUploadProgress(prev => {
          if (prev >= 90) {
            clearInterval(progressInterval)
            return prev
          }
          return prev + 10
        })
      }, 200)

      const res = await fetch('/api/tracks/upload', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`
        },
        body: data
      })

      clearInterval(progressInterval)
      setUploadProgress(100)

      if (!res.ok) {
        const result = await res.json()
        throw new Error(result.message || 'Erreur lors de l\'upload')
      }

      setSuccess(true)
      setTimeout(() => {
        navigate('/library')
      }, 2000)

    } catch (err) {
      setError(err.message || 'Erreur lors de l\'upload')
      setUploadProgress(0)
    } finally {
      setUploading(false)
    }
  }

  if (success) {
    return (
      <div className="page">
        <div className="container">
          <div className="upload-success glass animate-fadeIn">
            <div className="success-icon">
              <Check size={48} />
            </div>
            <h2>Upload réussi !</h2>
            <p>Votre piste a été ajoutée à votre bibliothèque.</p>
            <p className="redirect-text">Redirection vers votre bibliothèque...</p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="page upload-page">
      <div className="container">
        <div className="page-header">
          <h1 className="page-title">
            <UploadIcon className="title-icon" />
            Uploader une piste
          </h1>
          <p className="page-subtitle">Partagez votre musique avec la communauté</p>
        </div>

        <form onSubmit={handleSubmit} className="upload-form">
          <div className="upload-grid">
            {/* Zone d'upload */}
            <div className="upload-zones">
              {/* Audio upload */}
              <div 
                className={`upload-zone ${audioFile ? 'has-file' : ''}`}
                onClick={() => audioInputRef.current?.click()}
              >
                <input
                  ref={audioInputRef}
                  type="file"
                  accept="audio/*"
                  onChange={handleAudioSelect}
                  hidden
                />
                
                {audioFile ? (
                  <div className="file-preview">
                    <div className="file-icon audio-icon">
                      <Music size={32} />
                    </div>
                    <div className="file-info">
                      <span className="file-name">{audioFile.name}</span>
                      <span className="file-size">
                        {(audioFile.size / (1024 * 1024)).toFixed(2)} MB
                      </span>
                    </div>
                    <button 
                      type="button" 
                      className="remove-file"
                      onClick={(e) => {
                        e.stopPropagation()
                        setAudioFile(null)
                      }}
                    >
                      <X size={18} />
                    </button>
                  </div>
                ) : (
                  <div className="upload-placeholder">
                    <div className="upload-icon">
                      <Music size={32} />
                    </div>
                    <p className="upload-text">
                      Glissez votre fichier audio ici ou <span>parcourir</span>
                    </p>
                    <p className="upload-hint">MP3, WAV, FLAC, OGG (max 50MB)</p>
                  </div>
                )}
              </div>

              {/* Cover upload */}
              <div 
                className={`upload-zone cover-zone ${coverPreview ? 'has-file' : ''}`}
                onClick={() => coverInputRef.current?.click()}
              >
                <input
                  ref={coverInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handleCoverSelect}
                  hidden
                />
                
                {coverPreview ? (
                  <div className="cover-preview">
                    <img src={coverPreview} alt="Cover preview" />
                    <button 
                      type="button" 
                      className="remove-file"
                      onClick={(e) => {
                        e.stopPropagation()
                        setCoverFile(null)
                        setCoverPreview(null)
                      }}
                    >
                      <X size={18} />
                    </button>
                  </div>
                ) : (
                  <div className="upload-placeholder">
                    <div className="upload-icon">
                      <Image size={32} />
                    </div>
                    <p className="upload-text">
                      Ajouter une <span>pochette</span>
                    </p>
                    <p className="upload-hint">JPG, PNG (carré recommandé)</p>
                  </div>
                )}
              </div>
            </div>

            {/* Formulaire de métadonnées */}
            <div className="upload-metadata glass">
              {error && (
                <div className="auth-error animate-fadeIn">
                  {error}
                </div>
              )}

              <div className="input-group">
                <label className="input-label">Titre *</label>
                <input
                  type="text"
                  name="title"
                  value={formData.title}
                  onChange={handleChange}
                  className="input"
                  placeholder="Titre de la piste"
                  required
                />
              </div>

              <div className="input-group">
                <label className="input-label">Artiste</label>
                <input
                  type="text"
                  name="artist"
                  value={formData.artist}
                  onChange={handleChange}
                  className="input"
                  placeholder={user?.username || 'Nom de l\'artiste'}
                />
              </div>

              <div className="input-row">
                <div className="input-group">
                  <label className="input-label">Album</label>
                  <input
                    type="text"
                    name="album"
                    value={formData.album}
                    onChange={handleChange}
                    className="input"
                    placeholder="Nom de l'album"
                  />
                </div>

                <div className="input-group">
                  <label className="input-label">Genre</label>
                  <select
                    name="genre"
                    value={formData.genre}
                    onChange={handleChange}
                    className="input"
                  >
                    <option value="">Sélectionner un genre</option>
                    <option value="pop">Pop</option>
                    <option value="rock">Rock</option>
                    <option value="hiphop">Hip-Hop</option>
                    <option value="electronic">Électronique</option>
                    <option value="jazz">Jazz</option>
                    <option value="classical">Classique</option>
                    <option value="rnb">R&B</option>
                    <option value="metal">Metal</option>
                    <option value="indie">Indie</option>
                    <option value="other">Autre</option>
                  </select>
                </div>
              </div>

              <div className="input-group">
                <label className="input-label">Description</label>
                <textarea
                  name="description"
                  value={formData.description}
                  onChange={handleChange}
                  className="input textarea"
                  placeholder="Décrivez votre piste..."
                  rows={4}
                />
              </div>

              {uploading && (
                <div className="upload-progress">
                  <div className="progress-bar-container">
                    <div 
                      className="progress-bar-fill" 
                      style={{ width: `${uploadProgress}%` }}
                    />
                  </div>
                  <span className="progress-text">{uploadProgress}%</span>
                </div>
              )}

              <button
                type="submit"
                className="btn btn-primary btn-lg upload-submit"
                disabled={uploading || !audioFile}
              >
                {uploading ? (
                  <>
                    <Loader className="spinner-icon" size={20} />
                    Upload en cours...
                  </>
                ) : (
                  <>
                    <UploadIcon size={20} />
                    Publier la piste
                  </>
                )}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  )
}

export default Upload

