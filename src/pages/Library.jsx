import { useState, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import TrackCard from '../components/TrackCard'
import { 
  Library as LibraryIcon, 
  Music, 
  Heart, 
  Clock, 
  Plus,
  Grid,
  List,
  Search,
  AlertCircle
} from 'lucide-react'
import './Library.css'

// Données de démonstration
const demoTracks = [
  { id: 101, title: 'Ma Première Création', artist: 'Moi', coverUrl: 'https://picsum.photos/seed/mytrack1/300/300', duration: 234 },
  { id: 102, title: 'Souvenirs d\'Été', artist: 'Moi', coverUrl: 'https://picsum.photos/seed/mytrack2/300/300', duration: 198 },
  { id: 103, title: 'Nuit Sans Fin', artist: 'Moi', coverUrl: 'https://picsum.photos/seed/mytrack3/300/300', duration: 267 },
]

const demoLiked = [
  { id: 1, title: 'Nuit Étoilée', artist: 'Luna Wave', coverUrl: 'https://picsum.photos/seed/track1/300/300', duration: 234 },
  { id: 2, title: 'Horizon Lointain', artist: 'Solar Beats', coverUrl: 'https://picsum.photos/seed/track2/300/300', duration: 198 },
]

function Library() {
  const navigate = useNavigate()
  const { user, token, isAuthenticated } = useAuth()
  const [activeTab, setActiveTab] = useState('uploads')
  const [viewMode, setViewMode] = useState('grid')
  const [searchQuery, setSearchQuery] = useState('')
  const [myTracks, setMyTracks] = useState(demoTracks)
  const [likedTracks, setLikedTracks] = useState(demoLiked)
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (isAuthenticated && token) {
      loadTracks()
    }
  }, [isAuthenticated, token])

  const loadTracks = async () => {
    setLoading(true)
    try {
      const [uploadsRes, likedRes] = await Promise.all([
        fetch('/api/tracks/my-uploads', {
          headers: { 'Authorization': `Bearer ${token}` }
        }),
        fetch('/api/tracks/liked', {
          headers: { 'Authorization': `Bearer ${token}` }
        })
      ])

      if (uploadsRes.ok) {
        const data = await uploadsRes.json()
        if (data.tracks?.length > 0) {
          setMyTracks(data.tracks)
        }
      }

      if (likedRes.ok) {
        const data = await likedRes.json()
        if (data.tracks?.length > 0) {
          setLikedTracks(data.tracks)
        }
      }
    } catch (error) {
      console.error('Erreur chargement bibliothèque:', error)
    } finally {
      setLoading(false)
    }
  }

  if (!isAuthenticated) {
    return (
      <div className="page">
        <div className="container">
          <div className="library-auth-required glass">
            <AlertCircle size={48} />
            <h2>Connexion requise</h2>
            <p>Connectez-vous pour accéder à votre bibliothèque musicale.</p>
            <button onClick={() => navigate('/login')} className="btn btn-primary">
              Se connecter
            </button>
          </div>
        </div>
      </div>
    )
  }

  const currentTracks = activeTab === 'uploads' ? myTracks : likedTracks
  const filteredTracks = currentTracks.filter(track =>
    track.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    track.artist.toLowerCase().includes(searchQuery.toLowerCase())
  )

  return (
    <div className="page library-page">
      <div className="container">
        <div className="library-header">
          <div className="header-left">
            <h1 className="page-title">
              <LibraryIcon />
              Ma Bibliothèque
            </h1>
          </div>
          
          <div className="header-right">
            <div className="search-box">
              <Search size={18} />
              <input
                type="text"
                placeholder="Rechercher..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
            
            <div className="view-toggle">
              <button 
                className={`toggle-btn ${viewMode === 'grid' ? 'active' : ''}`}
                onClick={() => setViewMode('grid')}
              >
                <Grid size={18} />
              </button>
              <button 
                className={`toggle-btn ${viewMode === 'list' ? 'active' : ''}`}
                onClick={() => setViewMode('list')}
              >
                <List size={18} />
              </button>
            </div>
          </div>
        </div>

        <div className="library-tabs">
          <button 
            className={`tab-btn ${activeTab === 'uploads' ? 'active' : ''}`}
            onClick={() => setActiveTab('uploads')}
          >
            <Music size={18} />
            Mes Uploads
            <span className="tab-count">{myTracks.length}</span>
          </button>
          <button 
            className={`tab-btn ${activeTab === 'liked' ? 'active' : ''}`}
            onClick={() => setActiveTab('liked')}
          >
            <Heart size={18} />
            Favoris
            <span className="tab-count">{likedTracks.length}</span>
          </button>
          <button 
            className={`tab-btn ${activeTab === 'recent' ? 'active' : ''}`}
            onClick={() => setActiveTab('recent')}
          >
            <Clock size={18} />
            Récents
          </button>
        </div>

        {loading ? (
          <div className="loading">
            <div className="spinner"></div>
          </div>
        ) : filteredTracks.length === 0 ? (
          <div className="empty-state">
            <div className="empty-state-icon">
              {activeTab === 'uploads' ? <Music /> : <Heart />}
            </div>
            <h3 className="empty-state-title">
              {activeTab === 'uploads' 
                ? 'Aucun upload pour le moment' 
                : 'Aucun favori pour le moment'}
            </h3>
            <p className="empty-state-text">
              {activeTab === 'uploads'
                ? 'Commencez à partager votre musique avec la communauté'
                : 'Ajoutez des titres à vos favoris pour les retrouver ici'}
            </p>
            {activeTab === 'uploads' && (
              <Link to="/upload" className="btn btn-primary">
                <Plus size={18} />
                Uploader ma première piste
              </Link>
            )}
          </div>
        ) : (
          <div className={viewMode === 'grid' ? 'grid grid-4' : 'track-list'}>
            {filteredTracks.map((track, index) => (
              <div 
                key={track.id} 
                className="animate-fadeIn" 
                style={{ animationDelay: `${index * 0.05}s` }}
              >
                <TrackCard 
                  track={track} 
                  tracks={filteredTracks}
                  variant={viewMode === 'list' ? 'list' : 'default'} 
                />
              </div>
            ))}
          </div>
        )}

        {activeTab === 'uploads' && filteredTracks.length > 0 && (
          <div className="library-cta">
            <Link to="/upload" className="btn btn-secondary">
              <Plus size={18} />
              Ajouter une piste
            </Link>
          </div>
        )}
      </div>
    </div>
  )
}

export default Library

