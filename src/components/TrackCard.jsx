import { usePlayer } from '../context/PlayerContext'
import { Play, Pause, Heart, MoreHorizontal, Music } from 'lucide-react'
import './TrackCard.css'

function TrackCard({ track, tracks = [], variant = 'default' }) {
  const { playTrack, currentTrack, isPlaying, togglePlay } = usePlayer()
  
  const isCurrentTrack = currentTrack?.id === track.id
  
  const handlePlay = () => {
    if (isCurrentTrack) {
      togglePlay()
    } else {
      playTrack(track, tracks.length > 0 ? tracks : [track])
    }
  }

  if (variant === 'list') {
    return (
      <div className={`track-list-item ${isCurrentTrack ? 'playing' : ''}`}>
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
        </div>
        
        <div className="track-list-info">
          <div className="track-list-title">{track.title}</div>
          <div className="track-list-artist">{track.artist || 'Artiste inconnu'}</div>
        </div>
        
        <div className="track-list-duration">
          {track.duration ? formatDuration(track.duration) : '--:--'}
        </div>
        
        <div className="track-list-actions">
          <button className="action-btn">
            <Heart size={18} />
          </button>
          <button className="action-btn">
            <MoreHorizontal size={18} />
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className={`track-card ${isCurrentTrack ? 'playing' : ''}`}>
      <div className="track-card-cover" onClick={handlePlay}>
        {track.coverUrl ? (
          <img src={track.coverUrl} alt={track.title} />
        ) : (
          <div className="cover-placeholder">
            <Music size={32} />
          </div>
        )}
        <div className="track-card-overlay">
          <button className="play-button">
            {isCurrentTrack && isPlaying ? <Pause size={24} /> : <Play size={24} />}
          </button>
        </div>
        {isCurrentTrack && isPlaying && (
          <div className="playing-indicator">
            <span></span>
            <span></span>
            <span></span>
          </div>
        )}
      </div>
      
      <div className="track-card-info">
        <h3 className="track-card-title">{track.title}</h3>
        <p className="track-card-artist">{track.artist || 'Artiste inconnu'}</p>
      </div>
      
      <div className="track-card-actions">
        <button className="action-btn">
          <Heart size={16} />
        </button>
      </div>
    </div>
  )
}

function formatDuration(seconds) {
  const mins = Math.floor(seconds / 60)
  const secs = Math.floor(seconds % 60)
  return `${mins}:${secs.toString().padStart(2, '0')}`
}

export default TrackCard

