import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { usePlayer } from '../context/PlayerContext'
import TrackCard from '../components/TrackCard'
import { 
  TrendingUp, 
  Clock, 
  Sparkles, 
  ArrowRight, 
  Play,
  Music2,
  Users,
  Upload,
  Headphones
} from 'lucide-react'
import './Home.css'

// Données de démonstration
const demoTracks = [
  { id: 1, title: 'Nuit Étoilée', artist: 'Luna Wave', coverUrl: 'https://picsum.photos/seed/track1/300/300', duration: 234 },
  { id: 2, title: 'Horizon Lointain', artist: 'Solar Beats', coverUrl: 'https://picsum.photos/seed/track2/300/300', duration: 198 },
  { id: 3, title: 'Rêves Électriques', artist: 'Neon Dreams', coverUrl: 'https://picsum.photos/seed/track3/300/300', duration: 267 },
  { id: 4, title: 'Voyage Nocturne', artist: 'Midnight Sun', coverUrl: 'https://picsum.photos/seed/track4/300/300', duration: 312 },
  { id: 5, title: 'Éclat de Lune', artist: 'Aurora', coverUrl: 'https://picsum.photos/seed/track5/300/300', duration: 245 },
  { id: 6, title: 'Cascade Sonore', artist: 'Flow State', coverUrl: 'https://picsum.photos/seed/track6/300/300', duration: 289 },
  { id: 7, title: 'Aurore Boréale', artist: 'Nordic Pulse', coverUrl: 'https://picsum.photos/seed/track7/300/300', duration: 201 },
  { id: 8, title: 'Tempête de Feu', artist: 'Blaze', coverUrl: 'https://picsum.photos/seed/track8/300/300', duration: 276 },
]

const recentTracks = [
  { id: 9, title: 'Mélodie du Soir', artist: 'Twilight', coverUrl: 'https://picsum.photos/seed/track9/300/300', duration: 223 },
  { id: 10, title: 'Battement de Coeur', artist: 'Pulse', coverUrl: 'https://picsum.photos/seed/track10/300/300', duration: 256 },
  { id: 11, title: 'Onde de Choc', artist: 'Impact', coverUrl: 'https://picsum.photos/seed/track11/300/300', duration: 189 },
  { id: 12, title: 'Symphonie Urbaine', artist: 'City Lights', coverUrl: 'https://picsum.photos/seed/track12/300/300', duration: 301 },
]

function Home() {
  const { isAuthenticated, user } = useAuth()
  const { playTrack } = usePlayer()
  const [tracks, setTracks] = useState(demoTracks)
  const [recent, setRecent] = useState(recentTracks)

  useEffect(() => {
    // Charger les vraies pistes depuis l'API si disponible
    fetch('/api/tracks/trending')
      .then(res => res.json())
      .then(data => {
        if (data.tracks?.length > 0) {
          setTracks(data.tracks)
        }
      })
      .catch(() => {
        // Garder les données de démo
      })
  }, [])

  return (
    <div className="home-page">
      {/* Hero Section */}
      <section className="hero">
        <div className="hero-background">
          <div className="hero-gradient"></div>
          <div className="hero-pattern"></div>
        </div>
        
        <div className="container">
          <div className="hero-content animate-fadeIn">
            <h1 className="hero-title">
              Découvrez la musique
              <span className="gradient-text"> autrement</span>
            </h1>
            <p className="hero-subtitle">
              Partagez vos créations, découvrez de nouveaux artistes et rejoignez 
              une communauté de passionnés de musique.
            </p>
            
            <div className="hero-actions">
              {isAuthenticated ? (
                <>
                  <Link to="/upload" className="btn btn-primary btn-lg">
                    <Upload size={20} />
                    Uploader ma musique
                  </Link>
                  <Link to="/explore" className="btn btn-secondary btn-lg">
                    <Headphones size={20} />
                    Explorer
                  </Link>
                </>
              ) : (
                <>
                  <Link to="/register" className="btn btn-primary btn-lg">
                    Commencer gratuitement
                  </Link>
                  <Link to="/explore" className="btn btn-secondary btn-lg">
                    <Play size={20} />
                    Écouter maintenant
                  </Link>
                </>
              )}
            </div>

            <div className="hero-stats">
              <div className="stat">
                <div className="stat-icon">
                  <Music2 size={24} />
                </div>
                <div className="stat-info">
                  <span className="stat-value">10K+</span>
                  <span className="stat-label">Pistes</span>
                </div>
              </div>
              <div className="stat">
                <div className="stat-icon">
                  <Users size={24} />
                </div>
                <div className="stat-info">
                  <span className="stat-value">5K+</span>
                  <span className="stat-label">Artistes</span>
                </div>
              </div>
              <div className="stat">
                <div className="stat-icon">
                  <Headphones size={24} />
                </div>
                <div className="stat-info">
                  <span className="stat-value">1M+</span>
                  <span className="stat-label">Écoutes</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Trending Section */}
      <section className="section">
        <div className="container">
          <div className="section-header">
            <h2 className="section-title">
              <TrendingUp />
              Tendances
            </h2>
            <Link to="/explore?sort=trending" className="section-link">
              Voir tout <ArrowRight size={16} />
            </Link>
          </div>
          
          <div className="grid grid-4">
            {tracks.slice(0, 4).map((track, index) => (
              <div key={track.id} className="animate-fadeIn" style={{ animationDelay: `${index * 0.1}s` }}>
                <TrackCard track={track} tracks={tracks} />
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* New Releases */}
      <section className="section">
        <div className="container">
          <div className="section-header">
            <h2 className="section-title">
              <Sparkles />
              Nouveautés
            </h2>
            <Link to="/explore?sort=new" className="section-link">
              Voir tout <ArrowRight size={16} />
            </Link>
          </div>
          
          <div className="grid grid-4">
            {tracks.slice(4, 8).map((track, index) => (
              <div key={track.id} className="animate-fadeIn" style={{ animationDelay: `${index * 0.1}s` }}>
                <TrackCard track={track} tracks={tracks.slice(4, 8)} />
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Recently Played (si connecté) */}
      {isAuthenticated && (
        <section className="section">
          <div className="container">
            <div className="section-header">
              <h2 className="section-title">
                <Clock />
                Écoutés récemment
              </h2>
              <Link to="/library" className="section-link">
                Ma bibliothèque <ArrowRight size={16} />
              </Link>
            </div>
            
            <div className="grid grid-4">
              {recent.map((track, index) => (
                <div key={track.id} className="animate-fadeIn" style={{ animationDelay: `${index * 0.1}s` }}>
                  <TrackCard track={track} tracks={recent} />
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* CTA Section */}
      {!isAuthenticated && (
        <section className="cta-section">
          <div className="container">
            <div className="cta-card glass">
              <div className="cta-content">
                <h2 className="cta-title">Prêt à partager votre musique ?</h2>
                <p className="cta-text">
                  Rejoignez FlowMusic et faites découvrir vos créations à des milliers d'auditeurs.
                </p>
                <Link to="/register" className="btn btn-primary btn-lg">
                  Créer mon compte
                </Link>
              </div>
              <div className="cta-visual">
                <div className="cta-circles">
                  <div className="circle circle-1"></div>
                  <div className="circle circle-2"></div>
                  <div className="circle circle-3"></div>
                </div>
              </div>
            </div>
          </div>
        </section>
      )}
    </div>
  )
}

export default Home

