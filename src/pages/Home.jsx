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
  Headphones,
  Zap,
  Star,
  Disc3,
  Radio
} from 'lucide-react'
import './Home.css'

// Données de démonstration
const demoTracks = [
  { id: 1, title: 'Nuit Étoilée', artist: 'Luna Wave', coverUrl: 'https://picsum.photos/seed/track1/300/300', duration: 234, plays: 15420 },
  { id: 2, title: 'Horizon Lointain', artist: 'Solar Beats', coverUrl: 'https://picsum.photos/seed/track2/300/300', duration: 198, plays: 12300 },
  { id: 3, title: 'Rêves Électriques', artist: 'Neon Dreams', coverUrl: 'https://picsum.photos/seed/track3/300/300', duration: 267, plays: 9800 },
  { id: 4, title: 'Voyage Nocturne', artist: 'Midnight Sun', coverUrl: 'https://picsum.photos/seed/track4/300/300', duration: 312, plays: 8500 },
  { id: 5, title: 'Éclat de Lune', artist: 'Aurora', coverUrl: 'https://picsum.photos/seed/track5/300/300', duration: 245, plays: 7200 },
  { id: 6, title: 'Cascade Sonore', artist: 'Flow State', coverUrl: 'https://picsum.photos/seed/track6/300/300', duration: 289, plays: 6100 },
  { id: 7, title: 'Aurore Boréale', artist: 'Nordic Pulse', coverUrl: 'https://picsum.photos/seed/track7/300/300', duration: 201, plays: 5400 },
  { id: 8, title: 'Tempête de Feu', artist: 'Blaze', coverUrl: 'https://picsum.photos/seed/track8/300/300', duration: 276, plays: 4900 },
]

const recentTracks = [
  { id: 9, title: 'Mélodie du Soir', artist: 'Twilight', coverUrl: 'https://picsum.photos/seed/track9/300/300', duration: 223, plays: 3200 },
  { id: 10, title: 'Battement de Coeur', artist: 'Pulse', coverUrl: 'https://picsum.photos/seed/track10/300/300', duration: 256, plays: 2800 },
  { id: 11, title: 'Onde de Choc', artist: 'Impact', coverUrl: 'https://picsum.photos/seed/track11/300/300', duration: 189, plays: 2100 },
  { id: 12, title: 'Symphonie Urbaine', artist: 'City Lights', coverUrl: 'https://picsum.photos/seed/track12/300/300', duration: 301, plays: 1900 },
]

const genres = [
  { id: 'electronic', name: 'Électronique', color: '#7c3aed', icon: Zap },
  { id: 'hiphop', name: 'Hip-Hop', color: '#f59e0b', icon: Disc3 },
  { id: 'rock', name: 'Rock', color: '#ef4444', icon: Radio },
  { id: 'pop', name: 'Pop', color: '#ec4899', icon: Star },
]

function Home() {
  const { isAuthenticated, user } = useAuth()
  const { playTrack } = usePlayer()
  const [tracks, setTracks] = useState(demoTracks)
  const [recent, setRecent] = useState(recentTracks)
  const [stats, setStats] = useState({ tracks: 10000, users: 5000, plays: 1000000 })
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const controller = new AbortController()
    
    const loadData = async () => {
      try {
        // Charger les vraies pistes depuis l'API avec timeout
        const tracksPromise = fetch('/api/tracks/trending', { 
          signal: controller.signal 
        }).then(res => res.ok ? res.json() : null).catch(() => null)

        const statsPromise = fetch('/api/stats', { 
          signal: controller.signal 
        }).then(res => res.ok ? res.json() : null).catch(() => null)

        const [tracksData, statsData] = await Promise.all([tracksPromise, statsPromise])

        if (tracksData?.tracks?.length > 0) {
          setTracks(tracksData.tracks)
        }

        if (statsData?.stats) {
          setStats({
            tracks: statsData.stats.tracks || 10000,
            users: statsData.stats.users || 5000,
            plays: statsData.stats.plays || 1000000
          })
        }
      } catch (error) {
        // Garder les données de démo en cas d'erreur
        console.log('Utilisation des données de démo')
      } finally {
        setLoading(false)
      }
    }

    // Timeout de sécurité pour éviter le chargement infini
    const timeout = setTimeout(() => {
      setLoading(false)
    }, 5000)

    loadData()

    return () => {
      controller.abort()
      clearTimeout(timeout)
    }
  }, [])

  const formatNumber = (num) => {
    if (num >= 1000000) return `${(num / 1000000).toFixed(1)}M`
    if (num >= 1000) return `${(num / 1000).toFixed(1)}K`
    return num.toString()
  }

  return (
    <div className="home-page">
      {/* Hero Section */}
      <section className="hero">
        <div className="hero-background">
          <div className="hero-gradient"></div>
          <div className="hero-orbs">
            <div className="orb orb-1"></div>
            <div className="orb orb-2"></div>
            <div className="orb orb-3"></div>
          </div>
          <div className="hero-grid"></div>
        </div>
        
        <div className="container">
          <div className="hero-content">
            <div className="hero-badge animate-fadeIn">
              <Sparkles size={14} />
              <span>Plateforme de streaming musical</span>
            </div>
            
            <h1 className="hero-title animate-fadeIn delay-1">
              Découvrez la musique
              <span className="gradient-text"> autrement</span>
            </h1>
            
            <p className="hero-subtitle animate-fadeIn delay-2">
              Partagez vos créations, découvrez de nouveaux artistes et rejoignez 
              une communauté passionnée de musique.
            </p>
            
            <div className="hero-actions animate-fadeIn delay-3">
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
                  <Link to="/register" className="btn btn-primary btn-xl">
                    <Sparkles size={20} />
                    Commencer gratuitement
                  </Link>
                  <Link to="/explore" className="btn btn-secondary btn-lg">
                    <Play size={20} />
                    Écouter maintenant
                  </Link>
                </>
              )}
            </div>

            <div className="hero-stats animate-fadeIn delay-4">
              <div className="stat">
                <div className="stat-icon">
                  <Music2 size={24} />
                </div>
                <div className="stat-info">
                  <span className="stat-value">{formatNumber(stats.tracks)}+</span>
                  <span className="stat-label">Pistes</span>
                </div>
              </div>
              <div className="stat-divider"></div>
              <div className="stat">
                <div className="stat-icon">
                  <Users size={24} />
                </div>
                <div className="stat-info">
                  <span className="stat-value">{formatNumber(stats.users)}+</span>
                  <span className="stat-label">Artistes</span>
                </div>
              </div>
              <div className="stat-divider"></div>
              <div className="stat">
                <div className="stat-icon">
                  <Headphones size={24} />
                </div>
                <div className="stat-info">
                  <span className="stat-value">{formatNumber(stats.plays)}+</span>
                  <span className="stat-label">Écoutes</span>
                </div>
              </div>
            </div>
          </div>
          
          {/* Floating music elements */}
          <div className="hero-visual">
            <div className="floating-cards">
              {tracks.slice(0, 3).map((track, index) => (
                <div 
                  key={track.id}
                  className={`floating-card floating-card-${index + 1}`}
                  onClick={() => playTrack(track, tracks)}
                >
                  <img src={track.coverUrl} alt={track.title} />
                  <div className="floating-card-info">
                    <span className="track-name">{track.title}</span>
                    <span className="artist-name">{track.artist}</span>
                  </div>
                  <div className="floating-card-play">
                    <Play size={20} fill="white" />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Genres Section */}
      <section className="section genres-section">
        <div className="container">
          <div className="genres-grid">
            {genres.map((genre, index) => {
              const Icon = genre.icon
              return (
                <Link 
                  to={`/explore?genre=${genre.id}`}
                  key={genre.id}
                  className="genre-card animate-fadeInUp"
                  style={{ 
                    animationDelay: `${index * 0.1}s`,
                    '--genre-color': genre.color 
                  }}
                >
                  <div className="genre-icon">
                    <Icon size={28} />
                  </div>
                  <span className="genre-name">{genre.name}</span>
                  <div className="genre-glow"></div>
                </Link>
              )
            })}
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
          
          <div className="grid grid-4" data-stagger>
            {tracks.slice(0, 4).map((track, index) => (
              <div key={track.id} className="animate-fadeInUp">
                <TrackCard track={track} tracks={tracks} index={index + 1} showRank />
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
          
          <div className="grid grid-4" data-stagger>
            {tracks.slice(4, 8).map((track, index) => (
              <div key={track.id} className="animate-fadeInUp">
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
            
            <div className="grid grid-4" data-stagger>
              {recent.map((track, index) => (
                <div key={track.id} className="animate-fadeInUp">
                  <TrackCard track={track} tracks={recent} />
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Features Section */}
      <section className="section features-section">
        <div className="container">
          <div className="features-header">
            <h2 className="features-title">Pourquoi FlowMusic ?</h2>
            <p className="features-subtitle">
              La plateforme idéale pour les artistes et les passionnés de musique
            </p>
          </div>
          
          <div className="features-grid">
            <div className="feature-card animate-fadeInUp">
              <div className="feature-icon">
                <Upload size={28} />
              </div>
              <h3>Upload illimité</h3>
              <p>Partagez autant de pistes que vous le souhaitez, sans restrictions</p>
            </div>
            
            <div className="feature-card animate-fadeInUp delay-1">
              <div className="feature-icon">
                <Headphones size={28} />
              </div>
              <h3>Audio haute qualité</h3>
              <p>Écoutez et partagez votre musique en qualité studio</p>
            </div>
            
            <div className="feature-card animate-fadeInUp delay-2">
              <div className="feature-icon">
                <Users size={28} />
              </div>
              <h3>Communauté active</h3>
              <p>Connectez-vous avec d'autres artistes et fans de musique</p>
            </div>
            
            <div className="feature-card animate-fadeInUp delay-3">
              <div className="feature-icon">
                <TrendingUp size={28} />
              </div>
              <h3>Statistiques détaillées</h3>
              <p>Suivez vos performances avec des analytics complets</p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      {!isAuthenticated && (
        <section className="cta-section">
          <div className="container">
            <div className="cta-card">
              <div className="cta-background">
                <div className="cta-orbs">
                  <div className="cta-orb cta-orb-1"></div>
                  <div className="cta-orb cta-orb-2"></div>
                </div>
              </div>
              
              <div className="cta-content">
                <h2 className="cta-title">Prêt à partager votre musique ?</h2>
                <p className="cta-text">
                  Rejoignez FlowMusic et faites découvrir vos créations à des milliers d'auditeurs passionnés.
                </p>
                <Link to="/register" className="btn btn-primary btn-xl">
                  <Sparkles size={20} />
                  Créer mon compte gratuitement
                </Link>
              </div>
            </div>
          </div>
        </section>
      )}
    </div>
  )
}

export default Home
