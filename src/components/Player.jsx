import { usePlayer } from '../context/PlayerContext'
import { 
  Play, 
  Pause, 
  SkipBack, 
  SkipForward, 
  Volume2, 
  VolumeX,
  Repeat,
  Repeat1,
  Shuffle,
  Music
} from 'lucide-react'
import './Player.css'

function Player() {
  const {
    currentTrack,
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
    toggleRepeat
  } = usePlayer()

  const formatTime = (time) => {
    if (isNaN(time)) return '0:00'
    const minutes = Math.floor(time / 60)
    const seconds = Math.floor(time % 60)
    return `${minutes}:${seconds.toString().padStart(2, '0')}`
  }

  const handleSeek = (e) => {
    const rect = e.currentTarget.getBoundingClientRect()
    const percent = (e.clientX - rect.left) / rect.width
    seek(percent * duration)
  }

  const handleVolume = (e) => {
    const rect = e.currentTarget.getBoundingClientRect()
    const percent = (e.clientX - rect.left) / rect.width
    setVolume(Math.max(0, Math.min(1, percent)))
  }

  const progress = duration ? (currentTime / duration) * 100 : 0

  if (!currentTrack) {
    return (
      <div className="player glass">
        <div className="player-container">
          <div className="player-empty">
            <Music size={20} />
            <span>Sélectionnez une piste pour commencer</span>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="player glass">
      <div className="player-container">
        {/* Track Info */}
        <div className="player-track">
          <div className="track-cover">
            {currentTrack.coverUrl ? (
              <img src={currentTrack.coverUrl} alt={currentTrack.title} />
            ) : (
              <div className="cover-placeholder">
                <Music size={24} />
              </div>
            )}
            <div className={`cover-animation ${isPlaying ? 'playing' : ''}`}>
              <span></span>
              <span></span>
              <span></span>
            </div>
          </div>
          <div className="track-info">
            <div className="track-title">{currentTrack.title}</div>
            <div className="track-artist">{currentTrack.artist || 'Artiste inconnu'}</div>
          </div>
        </div>

        {/* Controls */}
        <div className="player-controls">
          <div className="controls-buttons">
            <button 
              className={`control-btn ${shuffle ? 'active' : ''}`}
              onClick={toggleShuffle}
              title="Lecture aléatoire"
            >
              <Shuffle size={18} />
            </button>
            
            <button className="control-btn" onClick={playPrevious} title="Précédent">
              <SkipBack size={22} />
            </button>
            
            <button className="control-btn play-btn" onClick={togglePlay}>
              {isPlaying ? <Pause size={24} /> : <Play size={24} />}
            </button>
            
            <button className="control-btn" onClick={playNext} title="Suivant">
              <SkipForward size={22} />
            </button>
            
            <button 
              className={`control-btn ${repeat !== 'none' ? 'active' : ''}`}
              onClick={toggleRepeat}
              title={repeat === 'one' ? 'Répéter la piste' : repeat === 'all' ? 'Répéter tout' : 'Répéter'}
            >
              {repeat === 'one' ? <Repeat1 size={18} /> : <Repeat size={18} />}
            </button>
          </div>
          
          <div className="controls-progress">
            <span className="time-current">{formatTime(currentTime)}</span>
            <div className="progress-bar" onClick={handleSeek}>
              <div className="progress-fill" style={{ width: `${progress}%` }}>
                <div className="progress-thumb"></div>
              </div>
            </div>
            <span className="time-duration">{formatTime(duration)}</span>
          </div>
        </div>

        {/* Volume */}
        <div className="player-volume">
          <button 
            className="volume-btn"
            onClick={() => setVolume(volume > 0 ? 0 : 0.7)}
          >
            {volume === 0 ? <VolumeX size={20} /> : <Volume2 size={20} />}
          </button>
          <div className="volume-bar" onClick={handleVolume}>
            <div className="volume-fill" style={{ width: `${volume * 100}%` }}>
              <div className="volume-thumb"></div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default Player

