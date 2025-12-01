import { createContext, useContext, useState, useRef, useEffect } from 'react'

const PlayerContext = createContext(null)

export function PlayerProvider({ children }) {
  const audioRef = useRef(new Audio())
  const [currentTrack, setCurrentTrack] = useState(null)
  const [playlist, setPlaylist] = useState([])
  const [isPlaying, setIsPlaying] = useState(false)
  const [currentTime, setCurrentTime] = useState(0)
  const [duration, setDuration] = useState(0)
  const [volume, setVolume] = useState(0.7)
  const [shuffle, setShuffle] = useState(false)
  const [repeat, setRepeat] = useState('none') // 'none', 'all', 'one'

  useEffect(() => {
    const audio = audioRef.current
    
    const handleTimeUpdate = () => setCurrentTime(audio.currentTime)
    const handleDurationChange = () => setDuration(audio.duration)
    const handleEnded = () => handleTrackEnd()
    
    audio.addEventListener('timeupdate', handleTimeUpdate)
    audio.addEventListener('durationchange', handleDurationChange)
    audio.addEventListener('ended', handleEnded)
    
    return () => {
      audio.removeEventListener('timeupdate', handleTimeUpdate)
      audio.removeEventListener('durationchange', handleDurationChange)
      audio.removeEventListener('ended', handleEnded)
    }
  }, [])

  useEffect(() => {
    audioRef.current.volume = volume
  }, [volume])

  const playTrack = (track, tracks = []) => {
    if (tracks.length > 0) {
      setPlaylist(tracks)
    }
    setCurrentTrack(track)
    audioRef.current.src = track.audioUrl || `/api/tracks/${track.id}/stream`
    audioRef.current.play()
    setIsPlaying(true)
  }

  const togglePlay = () => {
    if (isPlaying) {
      audioRef.current.pause()
    } else {
      audioRef.current.play()
    }
    setIsPlaying(!isPlaying)
  }

  const pause = () => {
    audioRef.current.pause()
    setIsPlaying(false)
  }

  const seek = (time) => {
    audioRef.current.currentTime = time
    setCurrentTime(time)
  }

  const handleTrackEnd = () => {
    if (repeat === 'one') {
      audioRef.current.currentTime = 0
      audioRef.current.play()
    } else if (playlist.length > 0) {
      const currentIndex = playlist.findIndex(t => t.id === currentTrack?.id)
      let nextIndex
      
      if (shuffle) {
        nextIndex = Math.floor(Math.random() * playlist.length)
      } else {
        nextIndex = currentIndex + 1
      }
      
      if (nextIndex < playlist.length) {
        playTrack(playlist[nextIndex])
      } else if (repeat === 'all') {
        playTrack(playlist[0])
      } else {
        setIsPlaying(false)
      }
    } else {
      setIsPlaying(false)
    }
  }

  const playNext = () => {
    if (playlist.length === 0) return
    
    const currentIndex = playlist.findIndex(t => t.id === currentTrack?.id)
    let nextIndex
    
    if (shuffle) {
      nextIndex = Math.floor(Math.random() * playlist.length)
    } else {
      nextIndex = (currentIndex + 1) % playlist.length
    }
    
    playTrack(playlist[nextIndex])
  }

  const playPrevious = () => {
    if (currentTime > 3) {
      seek(0)
      return
    }
    
    if (playlist.length === 0) return
    
    const currentIndex = playlist.findIndex(t => t.id === currentTrack?.id)
    const prevIndex = currentIndex > 0 ? currentIndex - 1 : playlist.length - 1
    playTrack(playlist[prevIndex])
  }

  const toggleShuffle = () => setShuffle(!shuffle)
  
  const toggleRepeat = () => {
    const modes = ['none', 'all', 'one']
    const currentIndex = modes.indexOf(repeat)
    setRepeat(modes[(currentIndex + 1) % modes.length])
  }

  const value = {
    currentTrack,
    playlist,
    isPlaying,
    currentTime,
    duration,
    volume,
    shuffle,
    repeat,
    playTrack,
    togglePlay,
    pause,
    seek,
    playNext,
    playPrevious,
    setVolume,
    toggleShuffle,
    toggleRepeat,
    setPlaylist
  }

  return (
    <PlayerContext.Provider value={value}>
      {children}
    </PlayerContext.Provider>
  )
}

export function usePlayer() {
  const context = useContext(PlayerContext)
  if (!context) {
    throw new Error('usePlayer doit être utilisé dans un PlayerProvider')
  }
  return context
}

