import { useState, useRef, useEffect } from 'react'
import { usePlayer } from '../context/PlayerContext'
import { 
  Play, 
  Pause, 
  SkipBack, 
  SkipForward, 
  Volume2, 
  VolumeX,
  Volume1,
  Repeat,
  Repeat1,
  Shuffle,
  Music,
  Heart,
  ListMusic,
  X,
  ChevronUp,
  ChevronDown,
  Maximize2,
  Share2
} from 'lucide-react'
import './Player.css'

function Player() {
  const {
    currentTrack,
    playlist,
    isPlaying,
    currentTime,
    duration,
    volume,
    shuffle,
    repeat,
    togglePlay,
    seek,
    playNext,
    playPrevious,
    setVolume,
    toggleShuffle,
    toggleRepeat,
    playTrack
  } = usePlayer()

  const [showQueue, setShowQueue] = useState(false)
  const [showFullPlayer, setShowFullPlayer] = useState(false)
  const [liked, setLiked] = useState(false)
  const [isDragging, setIsDragging] = useState(false)
  const progressRef = useRef(null)
  const volumeRef = useRef(null)

  // Visualizer bars animation
  const [visualizerBars] = useState(Array(20).fill(0).map(() => Math.random()))

  const formatTime = (time) => {
    if (isNaN(time)) return '0:00'
    const minutes = Math.floor(time / 60)
    const seconds = Math.floor(time % 60)
    return `${minutes}:${seconds.toString().padStart(2, '0')}`
  }

  const handleProgressClick = (e) => {
    const rect = progressRef.current.getBoundingClientRect()
    const percent = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width))
    seek(percent * duration)
  }

  const handleProgressDrag = (e) => {
    if (!isDragging) return
    const rect = progressRef.current.getBoundingClientRect()
    const percent = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width))
    seek(percent * duration)
  }

  const handleVolumeChange = (e) => {
    const rect = volumeRef.current.getBoundingClientRect()
    const percent = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width))
    setVolume(percent)
  }

  useEffect(() => {
    const handleMouseUp = () => setIsDragging(false)
    const handleMouseMove = (e) => handleProgressDrag(e)
    
    if (isDragging) {
      window.addEventListener('mousemove', handleMouseMove)
      window.addEventListener('mouseup', handleMouseUp)
    }
    
    return () => {
      window.removeEventListener('mousemove', handleMouseMove)
      window.removeEventListener('mouseup', handleMouseUp)
    }
  }, [isDragging])

  const progress = duration ? (currentTime / duration) * 100 : 0

  const getVolumeIcon = () => {
    if (volume === 0) return <VolumeX size={20} />
    if (volume < 0.5) return <Volume1 size={20} />
    return <Volume2 size={20} />
  }

  // Empty state
  if (!currentTrack) {
    return (
      <div className="player glass-strong">
        <div className="player-container">
          <div className="player-empty">
            <div className="player-empty-icon">
              <Music size={22} />
            </div>
            <span>Sélectionnez une piste pour commencer l'écoute</span>
          </div>
        </div>
      </div>
    )
  }

  return (
    <>
      {/* Main Player */}
      <div className={`player glass-strong ${showFullPlayer ? 'expanded' : ''}`}>
        {/* Progress bar at top (compact mode) */}
        <div 
          className="player-progress-top"
          ref={progressRef}
          onClick={handleProgressClick}
          onMouseDown={() => setIsDragging(true)}
        >
          <div className="progress-track">
            <div 
              className="progress-fill" 
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>

        <div className="player-container">
          {/* Track Info */}
          <div className="player-track">
            <div className="track-cover" onClick={() => setShowFullPlayer(!showFullPlayer)}>
              {currentTrack.coverUrl ? (
                <img src={currentTrack.coverUrl} alt={currentTrack.title} />
              ) : (
                <div className="cover-placeholder">
                  <Music size={24} />
                </div>
              )}
              
              {/* Visualizer overlay */}
              {isPlaying && (
                <div className="cover-visualizer">
                  {visualizerBars.slice(0, 4).map((height, i) => (
                    <span 
                      key={i} 
                      style={{ 
                        animationDelay: `${i * 0.1}s`,
                        height: `${30 + height * 70}%`
                      }}
                    />
                  ))}
                </div>
              )}
              
              <div className="cover-expand">
                {showFullPlayer ? <ChevronDown size={20} /> : <ChevronUp size={20} />}
              </div>
            </div>
            
            <div className="track-info">
              <div className="track-title">{currentTrack.title}</div>
              <div className="track-artist">{currentTrack.artist || 'Artiste inconnu'}</div>
            </div>
            
            <button 
              className={`like-btn ${liked ? 'active' : ''}`}
              onClick={() => setLiked(!liked)}
              title={liked ? 'Retirer des favoris' : 'Ajouter aux favoris'}
            >
              <Heart size={20} fill={liked ? 'currentColor' : 'none'} />
            </button>
          </div>

          {/* Controls */}
          <div className="player-controls">
            <div className="controls-buttons">
              <button 
                className={`control-btn control-secondary ${shuffle ? 'active' : ''}`}
                onClick={toggleShuffle}
                title="Lecture aléatoire"
              >
                <Shuffle size={18} />
              </button>
              
              <button 
                className="control-btn"
                onClick={playPrevious}
                title="Précédent"
              >
                <SkipBack size={22} fill="currentColor" />
              </button>
              
              <button 
                className="control-btn play-btn"
                onClick={togglePlay}
              >
                <div className="play-btn-inner">
                  {isPlaying ? <Pause size={26} fill="currentColor" /> : <Play size={26} fill="currentColor" />}
                </div>
              </button>
              
              <button 
                className="control-btn"
                onClick={playNext}
                title="Suivant"
              >
                <SkipForward size={22} fill="currentColor" />
              </button>
              
              <button 
                className={`control-btn control-secondary ${repeat !== 'none' ? 'active' : ''}`}
                onClick={toggleRepeat}
                title={repeat === 'one' ? 'Répéter la piste' : repeat === 'all' ? 'Répéter tout' : 'Répéter'}
              >
                {repeat === 'one' ? <Repeat1 size={18} /> : <Repeat size={18} />}
              </button>
            </div>
            
            {/* Progress bar (expanded mode) */}
            <div className="controls-progress">
              <span className="time-current">{formatTime(currentTime)}</span>
              <div 
                className="progress-bar"
                ref={progressRef}
                onClick={handleProgressClick}
                onMouseDown={() => setIsDragging(true)}
              >
                <div className="progress-track">
                  <div className="progress-fill" style={{ width: `${progress}%` }}>
                    <div className="progress-thumb" />
                  </div>
                </div>
              </div>
              <span className="time-duration">{formatTime(duration)}</span>
            </div>
          </div>

          {/* Right section */}
          <div className="player-right">
            {/* Visualizer */}
            <div className="mini-visualizer">
              {visualizerBars.slice(0, 8).map((height, i) => (
                <span 
                  key={i}
                  className={isPlaying ? 'active' : ''}
                  style={{ 
                    animationDelay: `${i * 0.05}s`,
                    height: isPlaying ? `${20 + height * 80}%` : '20%'
                  }}
                />
              ))}
            </div>

            {/* Volume */}
            <div className="player-volume">
              <button 
                className="volume-btn"
                onClick={() => setVolume(volume > 0 ? 0 : 0.7)}
                title={volume === 0 ? 'Activer le son' : 'Couper le son'}
              >
                {getVolumeIcon()}
              </button>
              <div 
                className="volume-bar"
                ref={volumeRef}
                onClick={handleVolumeChange}
              >
                <div className="volume-track">
                  <div className="volume-fill" style={{ width: `${volume * 100}%` }}>
                    <div className="volume-thumb" />
                  </div>
                </div>
              </div>
            </div>
            
            {/* Queue button */}
            <button 
              className={`control-btn control-secondary ${showQueue ? 'active' : ''}`}
              onClick={() => setShowQueue(!showQueue)}
              title="File d'attente"
            >
              <ListMusic size={20} />
            </button>
            
            {/* Full screen */}
            <button 
              className="control-btn control-secondary"
              onClick={() => setShowFullPlayer(!showFullPlayer)}
              title="Agrandir"
            >
              <Maximize2 size={18} />
            </button>
          </div>
        </div>
      </div>

      {/* Queue Panel */}
      {showQueue && (
        <div className="queue-panel glass-strong">
          <div className="queue-header">
            <h3>
              <ListMusic size={20} />
              File d'attente
            </h3>
            <button 
              className="queue-close"
              onClick={() => setShowQueue(false)}
            >
              <X size={20} />
            </button>
          </div>
          
          <div className="queue-current">
            <span className="queue-label">En cours de lecture</span>
            <div className="queue-track active">
              <div className="queue-track-cover">
                {currentTrack.coverUrl ? (
                  <img src={currentTrack.coverUrl} alt={currentTrack.title} />
                ) : (
                  <div className="cover-placeholder">
                    <Music size={16} />
                  </div>
                )}
                <div className="playing-indicator">
                  <span></span>
                  <span></span>
                  <span></span>
                </div>
              </div>
              <div className="queue-track-info">
                <div className="queue-track-title">{currentTrack.title}</div>
                <div className="queue-track-artist">{currentTrack.artist}</div>
              </div>
            </div>
          </div>
          
          {playlist.length > 1 && (
            <div className="queue-next">
              <span className="queue-label">À suivre ({playlist.length - 1})</span>
              <div className="queue-list">
                {playlist
                  .filter(track => track.id !== currentTrack.id)
                  .map((track, index) => (
                    <div 
                      key={track.id}
                      className="queue-track"
                      onClick={() => playTrack(track, playlist)}
                    >
                      <span className="queue-index">{index + 1}</span>
                      <div className="queue-track-cover">
                        {track.coverUrl ? (
                          <img src={track.coverUrl} alt={track.title} />
                        ) : (
                          <div className="cover-placeholder">
                            <Music size={14} />
                          </div>
                        )}
                      </div>
                      <div className="queue-track-info">
                        <div className="queue-track-title">{track.title}</div>
                        <div className="queue-track-artist">{track.artist}</div>
                      </div>
                      <div className="queue-track-duration">
                        {track.duration ? formatTime(track.duration) : '--:--'}
                      </div>
                    </div>
                  ))
                }
              </div>
            </div>
          )}
          
          {playlist.length <= 1 && (
            <div className="queue-empty">
              <Music size={32} />
              <p>La file d'attente est vide</p>
            </div>
          )}
        </div>
      )}

      {/* Full screen player overlay */}
      {showFullPlayer && (
        <div className="fullscreen-player">
          <div className="fullscreen-bg">
            {currentTrack.coverUrl && (
              <img src={currentTrack.coverUrl} alt="" />
            )}
          </div>
          
          <button 
            className="fullscreen-close"
            onClick={() => setShowFullPlayer(false)}
          >
            <ChevronDown size={32} />
          </button>
          
          <div className="fullscreen-content">
            <div className="fullscreen-cover">
              {currentTrack.coverUrl ? (
                <img src={currentTrack.coverUrl} alt={currentTrack.title} />
              ) : (
                <div className="cover-placeholder">
                  <Music size={80} />
                </div>
              )}
              
              {/* Animated ring */}
              <div className={`cover-ring ${isPlaying ? 'playing' : ''}`}>
                <div className="ring-inner" />
              </div>
            </div>
            
            {/* Visualizer */}
            <div className="fullscreen-visualizer">
              {visualizerBars.map((height, i) => (
                <span 
                  key={i}
                  className={isPlaying ? 'active' : ''}
                  style={{ 
                    animationDelay: `${i * 0.05}s`,
                    height: isPlaying ? `${20 + height * 80}%` : '10%'
                  }}
                />
              ))}
            </div>
            
            <div className="fullscreen-info">
              <h1>{currentTrack.title}</h1>
              <p>{currentTrack.artist || 'Artiste inconnu'}</p>
            </div>
            
            <div className="fullscreen-progress">
              <div 
                className="progress-bar large"
                onClick={handleProgressClick}
              >
                <div className="progress-track">
                  <div className="progress-fill" style={{ width: `${progress}%` }}>
                    <div className="progress-thumb" />
                  </div>
                </div>
              </div>
              <div className="progress-times">
                <span>{formatTime(currentTime)}</span>
                <span>{formatTime(duration)}</span>
              </div>
            </div>
            
            <div className="fullscreen-controls">
              <button 
                className={`control-btn control-secondary ${shuffle ? 'active' : ''}`}
                onClick={toggleShuffle}
              >
                <Shuffle size={24} />
              </button>
              
              <button className="control-btn large" onClick={playPrevious}>
                <SkipBack size={32} fill="currentColor" />
              </button>
              
              <button className="control-btn play-btn large" onClick={togglePlay}>
                <div className="play-btn-inner">
                  {isPlaying ? <Pause size={40} fill="currentColor" /> : <Play size={40} fill="currentColor" />}
                </div>
              </button>
              
              <button className="control-btn large" onClick={playNext}>
                <SkipForward size={32} fill="currentColor" />
              </button>
              
              <button 
                className={`control-btn control-secondary ${repeat !== 'none' ? 'active' : ''}`}
                onClick={toggleRepeat}
              >
                {repeat === 'one' ? <Repeat1 size={24} /> : <Repeat size={24} />}
              </button>
            </div>
            
            <div className="fullscreen-actions">
              <button className={`action-btn ${liked ? 'active' : ''}`} onClick={() => setLiked(!liked)}>
                <Heart size={24} fill={liked ? 'currentColor' : 'none'} />
              </button>
              <button className="action-btn">
                <Share2 size={24} />
              </button>
              <button className="action-btn" onClick={() => setShowQueue(!showQueue)}>
                <ListMusic size={24} />
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}

export default Player
