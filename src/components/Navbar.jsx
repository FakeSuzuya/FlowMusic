import { useState, useEffect } from 'react'
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
  Compass,
  Bell,
  Settings,
  ChevronDown
} from 'lucide-react'
import './Navbar.css'

function Navbar() {
  const { user, logout, isAuthenticated } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()
  const [searchQuery, setSearchQuery] = useState('')
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const [userMenuOpen, setUserMenuOpen] = useState(false)
  const [scrolled, setScrolled] = useState(false)

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 20)
    }
    window.addEventListener('scroll', handleScroll)
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  useEffect(() => {
    setMobileMenuOpen(false)
    setUserMenuOpen(false)
  }, [location.pathname])

  const handleSearch = (e) => {
    e.preventDefault()
    if (searchQuery.trim()) {
      navigate(`/explore?q=${encodeURIComponent(searchQuery)}`)
      setSearchQuery('')
    }
  }

  const handleLogout = () => {
    logout()
    navigate('/')
    setUserMenuOpen(false)
  }

  const isActive = (path) => location.pathname === path

  return (
    <nav className={`navbar ${scrolled ? 'scrolled' : ''}`}>
      <div className="navbar-container">
        {/* Logo */}
        <Link to="/" className="navbar-brand">
          <div className="brand-icon">
            <Music2 size={26} />
          </div>
          <span className="brand-text">
            Flow<span className="gradient-text">Music</span>
          </span>
        </Link>

        {/* Search */}
        <form onSubmit={handleSearch} className="navbar-search">
          <Search size={18} className="search-icon" />
          <input
            type="text"
            placeholder="Rechercher artistes, titres, albums..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="search-input"
          />
          <kbd className="search-kbd">⌘K</kbd>
        </form>

        {/* Navigation */}
        <div className={`navbar-nav ${mobileMenuOpen ? 'active' : ''}`}>
          <Link 
            to="/" 
            className={`nav-link ${isActive('/') ? 'active' : ''}`}
          >
            <Home size={20} />
            <span>Accueil</span>
          </Link>
          
          <Link 
            to="/explore" 
            className={`nav-link ${isActive('/explore') ? 'active' : ''}`}
          >
            <Compass size={20} />
            <span>Explorer</span>
          </Link>

          {isAuthenticated && (
            <>
              <Link 
                to="/library" 
                className={`nav-link ${isActive('/library') ? 'active' : ''}`}
              >
                <Library size={20} />
                <span>Bibliothèque</span>
              </Link>
              
              <Link 
                to="/upload" 
                className={`nav-link upload-link ${isActive('/upload') ? 'active' : ''}`}
              >
                <Upload size={20} />
                <span>Upload</span>
              </Link>
            </>
          )}
        </div>

        {/* Actions */}
        <div className="navbar-actions">
          {isAuthenticated ? (
            <>
              {/* Notifications */}
              <button className="action-btn notifications-btn" title="Notifications">
                <Bell size={20} />
                <span className="notification-dot"></span>
              </button>
              
              {/* User Menu */}
              <div className="user-menu-container">
                <button 
                  className="user-button"
                  onClick={() => setUserMenuOpen(!userMenuOpen)}
                >
                  <div className="avatar">
                    {user?.avatarUrl ? (
                      <img src={user.avatarUrl} alt={user.username} />
                    ) : (
                      user?.username?.charAt(0).toUpperCase()
                    )}
                  </div>
                  <span className="user-name">{user?.username}</span>
                  <ChevronDown size={16} className={userMenuOpen ? 'rotated' : ''} />
                </button>
                
                {userMenuOpen && (
                  <>
                    <div className="menu-backdrop" onClick={() => setUserMenuOpen(false)} />
                    <div className="user-menu">
                      <div className="user-menu-header">
                        <div className="avatar avatar-lg">
                          {user?.username?.charAt(0).toUpperCase()}
                        </div>
                        <div className="user-menu-info">
                          <span className="user-menu-name">{user?.username}</span>
                          <span className="user-menu-email">{user?.email}</span>
                        </div>
                      </div>
                      
                      <div className="user-menu-divider" />
                      
                      <Link to="/profile" className="user-menu-item">
                        <User size={18} />
                        <span>Mon profil</span>
                      </Link>
                      <Link to="/library" className="user-menu-item">
                        <Library size={18} />
                        <span>Ma bibliothèque</span>
                      </Link>
                      <button className="user-menu-item">
                        <Settings size={18} />
                        <span>Paramètres</span>
                      </button>
                      
                      <div className="user-menu-divider" />
                      
                      <button onClick={handleLogout} className="user-menu-item logout">
                        <LogOut size={18} />
                        <span>Déconnexion</span>
                      </button>
                    </div>
                  </>
                )}
              </div>
            </>
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
          
          {/* Mobile menu toggle */}
          <button 
            className="mobile-menu-btn"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          >
            {mobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
          </button>
        </div>
      </div>
      
      {/* Mobile menu backdrop */}
      {mobileMenuOpen && (
        <div className="mobile-backdrop" onClick={() => setMobileMenuOpen(false)} />
      )}
    </nav>
  )
}

export default Navbar
