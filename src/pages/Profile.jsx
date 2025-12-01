import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import TrackCard from '../components/TrackCard'
import { 
  User, 
  Mail, 
  Calendar, 
  Music, 
  Heart, 
  Play,
  Edit2,
  Camera,
  Settings,
  AlertCircle,
  Save,
  X
} from 'lucide-react'
import './Profile.css'

const demoStats = {
  uploads: 12,
  likes: 45,
  plays: 1234
}

const demoTracks = [
  { id: 101, title: 'Ma Première Création', artist: 'Moi', coverUrl: 'https://picsum.photos/seed/mytrack1/300/300', duration: 234 },
  { id: 102, title: 'Souvenirs d\'Été', artist: 'Moi', coverUrl: 'https://picsum.photos/seed/mytrack2/300/300', duration: 198 },
  { id: 103, title: 'Nuit Sans Fin', artist: 'Moi', coverUrl: 'https://picsum.photos/seed/mytrack3/300/300', duration: 267 },
]

function Profile() {
  const navigate = useNavigate()
  const { user, token, isAuthenticated, logout } = useAuth()
  const [editing, setEditing] = useState(false)
  const [stats, setStats] = useState(demoStats)
  const [tracks, setTracks] = useState(demoTracks)
  const [formData, setFormData] = useState({
    username: '',
    bio: ''
  })
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    if (user) {
      setFormData({
        username: user.username || '',
        bio: user.bio || ''
      })
    }
  }, [user])

  useEffect(() => {
    if (isAuthenticated && token) {
      loadProfile()
    }
  }, [isAuthenticated, token])

  const loadProfile = async () => {
    try {
      const res = await fetch('/api/users/profile', {
        headers: { 'Authorization': `Bearer ${token}` }
      })
      if (res.ok) {
        const data = await res.json()
        if (data.stats) setStats(data.stats)
        if (data.tracks?.length > 0) setTracks(data.tracks)
      }
    } catch (error) {
      console.error('Erreur chargement profil:', error)
    }
  }

  const handleSave = async () => {
    setSaving(true)
    try {
      const res = await fetch('/api/users/profile', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(formData)
      })
      
      if (res.ok) {
        setEditing(false)
      }
    } catch (error) {
      console.error('Erreur sauvegarde profil:', error)
    } finally {
      setSaving(false)
    }
  }

  if (!isAuthenticated) {
    return (
      <div className="page">
        <div className="container">
          <div className="profile-auth-required glass">
            <AlertCircle size={48} />
            <h2>Connexion requise</h2>
            <p>Connectez-vous pour accéder à votre profil.</p>
            <button onClick={() => navigate('/login')} className="btn btn-primary">
              Se connecter
            </button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="page profile-page">
      <div className="container">
        {/* Profile Header */}
        <div className="profile-header glass">
          <div className="profile-cover">
            <div className="cover-gradient"></div>
          </div>
          
          <div className="profile-main">
            <div className="profile-avatar-section">
              <div className="avatar-xl profile-avatar">
                {user?.username?.charAt(0).toUpperCase()}
              </div>
              <button className="avatar-edit-btn">
                <Camera size={16} />
              </button>
            </div>
            
            <div className="profile-info">
              {editing ? (
                <div className="profile-edit-form">
                  <input
                    type="text"
                    value={formData.username}
                    onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                    className="input profile-name-input"
                    placeholder="Nom d'utilisateur"
                  />
                  <textarea
                    value={formData.bio}
                    onChange={(e) => setFormData({ ...formData, bio: e.target.value })}
                    className="input profile-bio-input"
                    placeholder="Votre bio..."
                    rows={2}
                  />
                  <div className="edit-actions">
                    <button 
                      onClick={handleSave} 
                      className="btn btn-primary btn-sm"
                      disabled={saving}
                    >
                      <Save size={16} />
                      Sauvegarder
                    </button>
                    <button 
                      onClick={() => setEditing(false)} 
                      className="btn btn-ghost btn-sm"
                    >
                      <X size={16} />
                      Annuler
                    </button>
                  </div>
                </div>
              ) : (
                <>
                  <h1 className="profile-name">{user?.username}</h1>
                  <p className="profile-bio">
                    {user?.bio || 'Aucune bio pour le moment'}
                  </p>
                  <div className="profile-meta">
                    <span className="meta-item">
                      <Mail size={16} />
                      {user?.email}
                    </span>
                    <span className="meta-item">
                      <Calendar size={16} />
                      Membre depuis {new Date(user?.createdAt || Date.now()).toLocaleDateString('fr-FR', { month: 'long', year: 'numeric' })}
                    </span>
                  </div>
                </>
              )}
            </div>
            
            <div className="profile-actions">
              {!editing && (
                <button 
                  onClick={() => setEditing(true)} 
                  className="btn btn-secondary"
                >
                  <Edit2 size={18} />
                  Modifier
                </button>
              )}
              <button className="btn btn-ghost btn-icon">
                <Settings size={20} />
              </button>
            </div>
          </div>
          
          {/* Stats */}
          <div className="profile-stats">
            <div className="stat-item">
              <div className="stat-icon">
                <Music size={20} />
              </div>
              <div className="stat-content">
                <span className="stat-value">{stats.uploads}</span>
                <span className="stat-label">Uploads</span>
              </div>
            </div>
            <div className="stat-item">
              <div className="stat-icon">
                <Heart size={20} />
              </div>
              <div className="stat-content">
                <span className="stat-value">{stats.likes}</span>
                <span className="stat-label">Likes reçus</span>
              </div>
            </div>
            <div className="stat-item">
              <div className="stat-icon">
                <Play size={20} />
              </div>
              <div className="stat-content">
                <span className="stat-value">{stats.plays.toLocaleString()}</span>
                <span className="stat-label">Écoutes</span>
              </div>
            </div>
          </div>
        </div>

        {/* User Tracks */}
        <section className="section">
          <div className="section-header">
            <h2 className="section-title">
              <Music />
              Mes pistes
            </h2>
          </div>
          
          {tracks.length === 0 ? (
            <div className="empty-state">
              <div className="empty-state-icon">
                <Music />
              </div>
              <h3 className="empty-state-title">Aucune piste uploadée</h3>
              <p className="empty-state-text">
                Commencez à partager votre musique !
              </p>
              <button 
                onClick={() => navigate('/upload')} 
                className="btn btn-primary"
              >
                Uploader une piste
              </button>
            </div>
          ) : (
            <div className="grid grid-4">
              {tracks.map((track, index) => (
                <div 
                  key={track.id} 
                  className="animate-fadeIn" 
                  style={{ animationDelay: `${index * 0.1}s` }}
                >
                  <TrackCard track={track} tracks={tracks} />
                </div>
              ))}
            </div>
          )}
        </section>

        {/* Danger Zone */}
        <section className="danger-zone glass">
          <h3>Zone de danger</h3>
          <p>Actions irréversibles sur votre compte</p>
          <div className="danger-actions">
            <button onClick={logout} className="btn btn-ghost danger-btn">
              Se déconnecter
            </button>
            <button className="btn btn-ghost danger-btn">
              Supprimer mon compte
            </button>
          </div>
        </section>
      </div>
    </div>
  )
}

export default Profile

