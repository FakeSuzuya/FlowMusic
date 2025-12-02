import { useState, useRef, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { 
  Upload as UploadIcon, 
  Music, 
  Image, 
  X, 
  Check,
  AlertCircle,
  Loader,
  Sparkles,
  AudioWaveform,
  FileAudio
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
  const [dragActive, setDragActive] = useState(false)
  const [audioDragActive, setAudioDragActive] = useState(false)
  const [coverDragActive, setCoverDragActive] = useState(false)

  if (!isAuthenticated) {
    return (
      <div className="page">
        <div className="container">
          <div className="upload-auth-required glass">
            <div className="auth-required-icon">
              <AlertCircle size={56} />
            </div>
            <h2>Connexion requise</h2>
            <p>Vous devez être connecté pour uploader de la musique.</p>
            <button onClick={() => navigate('/login')} className="btn btn-primary btn-lg">
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

  const handleAudioSelect = (file) => {
    if (file) {
      if (file.type.startsWith('audio/') || file.name.match(/\.(mp3|wav|flac|ogg|m4a)$/i)) {
        setAudioFile(file)
        if (!formData.title) {
          setFormData(prev => ({
            ...prev,
            title: file.name.replace(/\.[^/.]+$/, '')
          }))
        }
        setError('')
      } else {
        setError('Veuillez sélectionner un fichier audio valide (MP3, WAV, FLAC, OGG)')
      }
    }
  }

  const handleCoverSelect = (file) => {
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

  const handleDrag = useCallback((e, type = 'audio') => {
    e.preventDefault()
    e.stopPropagation()
    
    if (e.type === 'dragenter' || e.type === 'dragover') {
      if (type === 'audio') setAudioDragActive(true)
      else setCoverDragActive(true)
    } else if (e.type === 'dragleave') {
      if (type === 'audio') setAudioDragActive(false)
      else setCoverDragActive(false)
    }
  }, [])

  const handleDrop = useCallback((e, type = 'audio') => {
    e.preventDefault()
    e.stopPropagation()
    
    if (type === 'audio') {
      setAudioDragActive(false)
      if (e.dataTransfer.files && e.dataTransfer.files[0]) {
        handleAudioSelect(e.dataTransfer.files[0])
      }
    } else {
      setCoverDragActive(false)
      if (e.dataTransfer.files && e.dataTransfer.files[0]) {
        handleCoverSelect(e.dataTransfer.files[0])
      }
    }
  }, [])

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

      // Simuler la progression avec XMLHttpRequest pour le vrai progress
      const xhr = new XMLHttpRequest()
      
      xhr.upload.addEventListener('progress', (e) => {
        if (e.lengthComputable) {
          const percent = Math.round((e.loaded / e.total) * 100)
          setUploadProgress(percent)
        }
      })
      
      xhr.addEventListener('load', () => {
        if (xhr.status >= 200 && xhr.status < 300) {
          setUploadProgress(100)
          setSuccess(true)
          setTimeout(() => {
            navigate('/library')
          }, 2000)
        } else {
          const result = JSON.parse(xhr.responseText)
          throw new Error(result.message || 'Erreur lors de l\'upload')
        }
      })
      
      xhr.addEventListener('error', () => {
        throw new Error('Erreur réseau lors de l\'upload')
      })
      
      xhr.open('POST', '/api/tracks/upload')
      xhr.setRequestHeader('Authorization', `Bearer ${token}`)
      xhr.send(data)

    } catch (err) {
      setError(err.message || 'Erreur lors de l\'upload')
      setUploadProgress(0)
      setUploading(false)
    }
  }

  if (success) {
    return (
      <div className="page">
        <div className="container">
          <div className="upload-success glass animate-fadeInScale">
            <div className="success-icon">
              <div className="success-ring"></div>
              <Check size={56} />
            </div>
            <h2>Upload réussi !</h2>
            <p>Votre piste a été ajoutée à votre bibliothèque.</p>
            <div className="success-loader">
              <span>Redirection vers votre bibliothèque</span>
              <div className="loading-dots">
                <span></span>
                <span></span>
                <span></span>
              </div>
            </div>
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
          <p className="page-subtitle">Partagez votre musique avec la communauté FlowMusic</p>
        </div>

        <form onSubmit={handleSubmit} className="upload-form">
          <div className="upload-grid">
            {/* Zone d'upload */}
            <div className="upload-zones">
              {/* Audio upload */}
              <div 
                className={`upload-zone ${audioFile ? 'has-file' : ''} ${audioDragActive ? 'drag-active' : ''}`}
                onClick={() => audioInputRef.current?.click()}
                onDragEnter={(e) => handleDrag(e, 'audio')}
                onDragOver={(e) => handleDrag(e, 'audio')}
                onDragLeave={(e) => handleDrag(e, 'audio')}
                onDrop={(e) => handleDrop(e, 'audio')}
              >
                <input
                  ref={audioInputRef}
                  type="file"
                  accept="audio/*,.mp3,.wav,.flac,.ogg,.m4a"
                  onChange={(e) => handleAudioSelect(e.target.files[0])}
                  hidden
                />
                
                {audioFile ? (
                  <div className="file-preview">
                    <div className="file-icon audio-icon">
                      <FileAudio size={36} />
                      <div className="file-icon-ring"></div>
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
                      <X size={20} />
                    </button>
                  </div>
                ) : (
                  <div className="upload-placeholder">
                    <div className="upload-icon-wrapper">
                      <div className="upload-icon-bg"></div>
                      <Music size={40} />
                    </div>
                    <div className="upload-text-content">
                      <p className="upload-text">
                        Glissez-déposez votre fichier audio ici
                      </p>
                      <p className="upload-text-alt">ou <span>parcourir</span></p>
                    </div>
                    <p className="upload-hint">MP3, WAV, FLAC, OGG • Max 50MB</p>
                  </div>
                )}
                
                {/* Decorative elements */}
                <div className="upload-zone-decoration">
                  <div className="decoration-line line-1"></div>
                  <div className="decoration-line line-2"></div>
                  <div className="decoration-line line-3"></div>
                </div>
              </div>

              {/* Cover upload */}
              <div 
                className={`upload-zone cover-zone ${coverPreview ? 'has-file' : ''} ${coverDragActive ? 'drag-active' : ''}`}
                onClick={() => coverInputRef.current?.click()}
                onDragEnter={(e) => handleDrag(e, 'cover')}
                onDragOver={(e) => handleDrag(e, 'cover')}
                onDragLeave={(e) => handleDrag(e, 'cover')}
                onDrop={(e) => handleDrop(e, 'cover')}
              >
                <input
                  ref={coverInputRef}
                  type="file"
                  accept="image/*"
                  onChange={(e) => handleCoverSelect(e.target.files[0])}
                  hidden
                />
                
                {coverPreview ? (
                  <div className="cover-preview">
                    <img src={coverPreview} alt="Cover preview" />
                    <div className="cover-preview-overlay">
                      <span>Changer la pochette</span>
                    </div>
                    <button 
                      type="button" 
                      className="remove-file"
                      onClick={(e) => {
                        e.stopPropagation()
                        setCoverFile(null)
                        setCoverPreview(null)
                      }}
                    >
                      <X size={20} />
                    </button>
                  </div>
                ) : (
                  <div className="upload-placeholder">
                    <div className="upload-icon-wrapper small">
                      <Image size={32} />
                    </div>
                    <p className="upload-text">
                      Ajouter une <span>pochette</span>
                    </p>
                    <p className="upload-hint">JPG, PNG • Carré recommandé</p>
                  </div>
                )}
              </div>
            </div>

            {/* Formulaire de métadonnées */}
            <div className="upload-metadata glass">
              <div className="metadata-header">
                <Sparkles size={20} />
                <h3>Informations de la piste</h3>
              </div>
              
              {error && (
                <div className="auth-error animate-fadeIn">
                  <AlertCircle size={18} />
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
                    <option value="folk">Folk</option>
                    <option value="reggae">Reggae</option>
                    <option value="country">Country</option>
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
                  placeholder="Parlez-nous de cette piste... (optionnel)"
                  rows={4}
                />
              </div>

              {uploading && (
                <div className="upload-progress">
                  <div className="progress-info">
                    <AudioWaveform className="progress-icon" size={20} />
                    <span>Upload en cours...</span>
                    <span className="progress-percent">{uploadProgress}%</span>
                  </div>
                  <div className="progress-bar-container">
                    <div 
                      className="progress-bar-fill" 
                      style={{ width: `${uploadProgress}%` }}
                    />
                  </div>
                </div>
              )}

              <button
                type="submit"
                className="btn btn-primary btn-lg upload-submit"
                disabled={uploading || !audioFile}
              >
                {uploading ? (
                  <>
                    <Loader className="spinner-icon animate-spin" size={22} />
                    Upload en cours...
                  </>
                ) : (
                  <>
                    <UploadIcon size={22} />
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
