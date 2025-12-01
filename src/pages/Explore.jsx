import { useState, useEffect } from 'react'
import { useSearchParams } from 'react-router-dom'
import TrackCard from '../components/TrackCard'
import { 
  Search, 
  TrendingUp, 
  Sparkles, 
  Filter,
  ChevronDown,
  Music,
  X
} from 'lucide-react'
import './Explore.css'

const genres = [
  { id: 'all', name: 'Tous les genres' },
  { id: 'pop', name: 'Pop' },
  { id: 'rock', name: 'Rock' },
  { id: 'hiphop', name: 'Hip-Hop' },
  { id: 'electronic', name: 'Électronique' },
  { id: 'jazz', name: 'Jazz' },
  { id: 'classical', name: 'Classique' },
  { id: 'rnb', name: 'R&B' },
  { id: 'metal', name: 'Metal' },
  { id: 'indie', name: 'Indie' }
]

const sortOptions = [
  { id: 'trending', name: 'Tendances', icon: TrendingUp },
  { id: 'new', name: 'Nouveautés', icon: Sparkles },
  { id: 'popular', name: 'Populaires', icon: Music }
]

// Données de démonstration
const demoTracks = [
  { id: 1, title: 'Nuit Étoilée', artist: 'Luna Wave', genre: 'electronic', coverUrl: 'https://picsum.photos/seed/track1/300/300', duration: 234 },
  { id: 2, title: 'Horizon Lointain', artist: 'Solar Beats', genre: 'pop', coverUrl: 'https://picsum.photos/seed/track2/300/300', duration: 198 },
  { id: 3, title: 'Rêves Électriques', artist: 'Neon Dreams', genre: 'electronic', coverUrl: 'https://picsum.photos/seed/track3/300/300', duration: 267 },
  { id: 4, title: 'Voyage Nocturne', artist: 'Midnight Sun', genre: 'jazz', coverUrl: 'https://picsum.photos/seed/track4/300/300', duration: 312 },
  { id: 5, title: 'Éclat de Lune', artist: 'Aurora', genre: 'indie', coverUrl: 'https://picsum.photos/seed/track5/300/300', duration: 245 },
  { id: 6, title: 'Cascade Sonore', artist: 'Flow State', genre: 'electronic', coverUrl: 'https://picsum.photos/seed/track6/300/300', duration: 289 },
  { id: 7, title: 'Aurore Boréale', artist: 'Nordic Pulse', genre: 'classical', coverUrl: 'https://picsum.photos/seed/track7/300/300', duration: 201 },
  { id: 8, title: 'Tempête de Feu', artist: 'Blaze', genre: 'rock', coverUrl: 'https://picsum.photos/seed/track8/300/300', duration: 276 },
  { id: 9, title: 'Mélodie du Soir', artist: 'Twilight', genre: 'pop', coverUrl: 'https://picsum.photos/seed/track9/300/300', duration: 223 },
  { id: 10, title: 'Battement de Coeur', artist: 'Pulse', genre: 'rnb', coverUrl: 'https://picsum.photos/seed/track10/300/300', duration: 256 },
  { id: 11, title: 'Onde de Choc', artist: 'Impact', genre: 'hiphop', coverUrl: 'https://picsum.photos/seed/track11/300/300', duration: 189 },
  { id: 12, title: 'Symphonie Urbaine', artist: 'City Lights', genre: 'jazz', coverUrl: 'https://picsum.photos/seed/track12/300/300', duration: 301 },
]

function Explore() {
  const [searchParams, setSearchParams] = useSearchParams()
  const [searchQuery, setSearchQuery] = useState(searchParams.get('q') || '')
  const [selectedGenre, setSelectedGenre] = useState('all')
  const [selectedSort, setSelectedSort] = useState(searchParams.get('sort') || 'trending')
  const [showFilters, setShowFilters] = useState(false)
  const [tracks, setTracks] = useState(demoTracks)
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    loadTracks()
  }, [selectedGenre, selectedSort, searchQuery])

  const loadTracks = async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams()
      if (searchQuery) params.set('q', searchQuery)
      if (selectedGenre !== 'all') params.set('genre', selectedGenre)
      params.set('sort', selectedSort)

      const res = await fetch(`/api/tracks/search?${params}`)
      if (res.ok) {
        const data = await res.json()
        if (data.tracks?.length > 0) {
          setTracks(data.tracks)
        }
      }
    } catch (error) {
      // Garder les données de démo
    } finally {
      setLoading(false)
    }
  }

  const handleSearch = (e) => {
    e.preventDefault()
    const params = new URLSearchParams(searchParams)
    if (searchQuery) {
      params.set('q', searchQuery)
    } else {
      params.delete('q')
    }
    setSearchParams(params)
  }

  const filteredTracks = tracks.filter(track => {
    const matchesSearch = !searchQuery || 
      track.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      track.artist.toLowerCase().includes(searchQuery.toLowerCase())
    
    const matchesGenre = selectedGenre === 'all' || track.genre === selectedGenre
    
    return matchesSearch && matchesGenre
  })

  return (
    <div className="page explore-page">
      <div className="container">
        {/* Search Header */}
        <div className="explore-header">
          <form onSubmit={handleSearch} className="explore-search">
            <Search size={22} />
            <input
              type="text"
              placeholder="Rechercher des artistes, titres, albums..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
            {searchQuery && (
              <button 
                type="button" 
                className="clear-search"
                onClick={() => setSearchQuery('')}
              >
                <X size={18} />
              </button>
            )}
          </form>
          
          <button 
            className={`btn btn-secondary filter-toggle ${showFilters ? 'active' : ''}`}
            onClick={() => setShowFilters(!showFilters)}
          >
            <Filter size={18} />
            Filtres
            <ChevronDown size={16} className={showFilters ? 'rotated' : ''} />
          </button>
        </div>

        {/* Filters */}
        {showFilters && (
          <div className="explore-filters animate-fadeIn">
            <div className="filter-section">
              <label className="filter-label">Genre</label>
              <div className="filter-options">
                {genres.map(genre => (
                  <button
                    key={genre.id}
                    className={`filter-chip ${selectedGenre === genre.id ? 'active' : ''}`}
                    onClick={() => setSelectedGenre(genre.id)}
                  >
                    {genre.name}
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Sort Options */}
        <div className="explore-sort">
          {sortOptions.map(option => {
            const Icon = option.icon
            return (
              <button
                key={option.id}
                className={`sort-btn ${selectedSort === option.id ? 'active' : ''}`}
                onClick={() => setSelectedSort(option.id)}
              >
                <Icon size={18} />
                {option.name}
              </button>
            )
          })}
        </div>

        {/* Results */}
        {searchQuery && (
          <p className="search-results-info">
            {filteredTracks.length} résultat{filteredTracks.length > 1 ? 's' : ''} pour "{searchQuery}"
          </p>
        )}

        {loading ? (
          <div className="loading">
            <div className="spinner"></div>
          </div>
        ) : filteredTracks.length === 0 ? (
          <div className="empty-state">
            <div className="empty-state-icon">
              <Search />
            </div>
            <h3 className="empty-state-title">Aucun résultat</h3>
            <p className="empty-state-text">
              Essayez avec d'autres termes ou modifiez vos filtres
            </p>
          </div>
        ) : (
          <div className="grid grid-4">
            {filteredTracks.map((track, index) => (
              <div 
                key={track.id} 
                className="animate-fadeIn" 
                style={{ animationDelay: `${index * 0.05}s` }}
              >
                <TrackCard track={track} tracks={filteredTracks} />
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

export default Explore

