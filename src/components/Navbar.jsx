import { useState } from 'react'
import { Link, useNavigate, useLocation } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { 
  Music2, 
  Search, 
  Upload, 
  Library, 
  User, 
  LogOut, 
  Menu, 
  X,
  Home,
  Compass
} from 'lucide-react'
import './Navbar.css'

function Navbar() {
  const { user, logout, isAuthenticated } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()
  const [searchQuery, setSearchQuery] = useState('')
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)

  const handleSearch = (e) => {
    e.preventDefault()
    if (searchQuery.trim()) {
      navigate(`/explore?q=${encodeURIComponent(searchQuery)}`)
    }
  }

  const handleLogout = () => {
    logout()
    navigate('/')
  }

  const isActive = (path) => location.pathname === path

  return (
    <nav className="navbar glass">
      <div className="navbar-container">
        <Link to="/" className="navbar-brand">
          <div className="brand-icon">
            <Music2 size={24} />
          </div>
          <span className="brand-text">
            Flow<span className="gradient-text">Music</span>
          </span>
        </Link>

        <form onSubmit={handleSearch} className="navbar-search">
          <Search size={18} className="search-icon" />
          <input
            type="text"
            placeholder="Rechercher artistes, titres, albums..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="search-input"
          />
        </form>

        <div className={`navbar-nav ${mobileMenuOpen ? 'active' : ''}`}>
          <Link 
            to="/" 
            className={`nav-link ${isActive('/') ? 'active' : ''}`}
            onClick={() => setMobileMenuOpen(false)}
          >
            <Home size={20} />
            <span>Accueil</span>
          </Link>
          
          <Link 
            to="/explore" 
            className={`nav-link ${isActive('/explore') ? 'active' : ''}`}
            onClick={() => setMobileMenuOpen(false)}
          >
            <Compass size={20} />
            <span>Explorer</span>
          </Link>

          {isAuthenticated ? (
            <>
              <Link 
                to="/library" 
                className={`nav-link ${isActive('/library') ? 'active' : ''}`}
                onClick={() => setMobileMenuOpen(false)}
              >
                <Library size={20} />
                <span>Ma Bibliothèque</span>
              </Link>
              
              <Link 
                to="/upload" 
                className={`nav-link ${isActive('/upload') ? 'active' : ''}`}
                onClick={() => setMobileMenuOpen(false)}
              >
                <Upload size={20} />
                <span>Upload</span>
              </Link>
            </>
          ) : null}
        </div>

        <div className="navbar-actions">
          {isAuthenticated ? (
            <div className="user-menu">
              <Link to="/profile" className="user-button">
                <div className="avatar">
                  {user?.username?.charAt(0).toUpperCase()}
                </div>
                <span className="user-name">{user?.username}</span>
              </Link>
              <button onClick={handleLogout} className="btn btn-ghost btn-icon" title="Déconnexion">
                <LogOut size={20} />
              </button>
            </div>
          ) : (
            <div className="auth-buttons">
              <Link to="/login" className="btn btn-ghost">
                Connexion
              </Link>
              <Link to="/register" className="btn btn-primary">
                S'inscrire
              </Link>
            </div>
          )}
          
          <button 
            className="mobile-menu-btn btn btn-ghost btn-icon"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          >
            {mobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
          </button>
        </div>
      </div>
    </nav>
  )
}

export default Navbar

