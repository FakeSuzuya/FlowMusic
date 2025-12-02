import { useState } from 'react'
import { usePlayer } from '../context/PlayerContext'
import { useAuth } from '../context/AuthContext'
import { Play, Pause, Heart, MoreHorizontal, Music, Plus, Share2, ListMusic } from 'lucide-react'
import './TrackCard.css'

function TrackCard({ track, tracks = [], variant = 'default', index, showRank = false }) {
  const { playTrack, currentTrack, isPlaying, togglePlay } = usePlayer()
  const { isAuthenticated, token } = useAuth()
  const [liked, setLiked] = useState(false)
  const [showMenu, setShowMenu] = useState(false)
  const [isHovered, setIsHovered] = useState(false)
  
  const isCurrentTrack = currentTrack?.id === track.id
  
  const handlePlay = (e) => {
    e.stopPropagation()
    if (isCurrentTrack) {
      togglePlay()
    } else {
      playTrack(track, tracks.length > 0 ? tracks : [track])
    }
  }

  const handleLike = async (e) => {
    e.stopPropagation()
    if (!isAuthenticated) return
    
    setLiked(!liked)
    
    try {
      await fetch(`/api/tracks/${track.id}/like`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })
    } catch (error) {
      setLiked(!liked) // Revert on error
    }
  }

  const formatDuration = (seconds) => {
    if (!seconds) return '--:--'
    const mins = Math.floor(seconds / 60)
    const secs = Math.floor(seconds % 60)
    return `${mins}:${secs.toString().padStart(2, '0')}`
  }

  const formatPlays = (plays) => {
    if (!plays) return '0'
    if (plays >= 1000000) return `${(plays / 1000000).toFixed(1)}M`
    if (plays >= 1000) return `${(plays / 1000).toFixed(1)}K`
    return plays.toString()
  }

  if (variant === 'list') {
    return (
      <div 
        className={`track-list-item ${isCurrentTrack ? 'playing' : ''}`}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
      >
        {showRank && (
          <span className="track-rank">{index}</span>
        )}
        
        <div className="track-list-cover" onClick={handlePlay}>
          {track.coverUrl ? (
            <img src={track.coverUrl} alt={track.title} />
          ) : (
            <div className="cover-placeholder">
              <Music size={20} />
            </div>
          )}
          <div className="track-list-play">
            {isCurrentTrack && isPlaying ? <Pause size={18} /> : <Play size={18} />}
          </div>
          
          {isCurrentTrack && isPlaying && (
            <div className="playing-bars">
              <span></span>
              <span></span>
              <span></span>
            </div>
          )}
        </div>
        
        <div className="track-list-info">
          <div className="track-list-title">{track.title}</div>
          <div className="track-list-artist">{track.artist || 'Artiste inconnu'}</div>
        </div>
        
        {track.plays !== undefined && (
          <div className="track-list-plays">
            {formatPlays(track.plays)} plays
          </div>
        )}
        
        <div className="track-list-duration">
          {formatDuration(track.duration)}
        </div>
        
        <div className="track-list-actions">
          <button 
            className={`action-btn ${liked ? 'active' : ''}`}
            onClick={handleLike}
          >
            <Heart size={18} fill={liked ? 'currentColor' : 'none'} />
          </button>
          <button className="action-btn">
            <MoreHorizontal size={18} />
          </button>
        </div>
      </div>
    )
  }

  // Default card variant
  return (
    <div 
      className={`track-card ${isCurrentTrack ? 'playing' : ''} ${isHovered ? 'hovered' : ''}`}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => { setIsHovered(false); setShowMenu(false) }}
    >
      {showRank && index && (
        <div className="track-rank-badge">
          <span className="rank-number">#{index}</span>
        </div>
      )}
      
      <div className="track-card-cover" onClick={handlePlay}>
        {track.coverUrl ? (
          <img src={track.coverUrl} alt={track.title} loading="lazy" />
        ) : (
          <div className="cover-placeholder">
            <Music size={32} />
          </div>
        )}
        
        {/* Overlay */}
        <div className="track-card-overlay">
          <button className="play-button">
            {isCurrentTrack && isPlaying ? (
              <Pause size={26} fill="currentColor" />
            ) : (
              <Play size={26} fill="currentColor" />
            )}
          </button>
        </div>
        
        {/* Playing indicator */}
        {isCurrentTrack && isPlaying && (
          <div className="playing-indicator">
            <span></span>
            <span></span>
            <span></span>
            <span></span>
          </div>
        )}
        
        {/* Glow effect */}
        <div className="cover-glow"></div>
      </div>
      
      <div className="track-card-body">
        <div className="track-card-info">
          <h3 className="track-card-title">{track.title}</h3>
          <p className="track-card-artist">{track.artist || 'Artiste inconnu'}</p>
          
          {track.plays !== undefined && (
            <div className="track-card-meta">
              <span className="plays-count">{formatPlays(track.plays)} écoutes</span>
            </div>
          )}
        </div>
        
        <div className="track-card-actions">
          <button 
            className={`action-btn like-btn ${liked ? 'active' : ''}`}
            onClick={handleLike}
            title={liked ? 'Retirer des favoris' : 'Ajouter aux favoris'}
          >
            <Heart size={18} fill={liked ? 'currentColor' : 'none'} />
          </button>
          
          <div className="more-menu-container">
            <button 
              className="action-btn more-btn"
              onClick={(e) => { e.stopPropagation(); setShowMenu(!showMenu) }}
            >
              <MoreHorizontal size={18} />
            </button>
            
            {showMenu && (
              <div className="more-menu">
                <button className="menu-item" onClick={(e) => e.stopPropagation()}>
                  <ListMusic size={16} />
                  <span>Ajouter à une playlist</span>
                </button>
                <button className="menu-item" onClick={(e) => e.stopPropagation()}>
                  <Plus size={16} />
                  <span>Ajouter à la file</span>
                </button>
                <button className="menu-item" onClick={(e) => e.stopPropagation()}>
                  <Share2 size={16} />
                  <span>Partager</span>
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

export default TrackCard
