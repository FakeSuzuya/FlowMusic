import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { Mail, Lock, Eye, EyeOff, Music2 } from 'lucide-react'
import './Auth.css'

function Login() {
  const navigate = useNavigate()
  const { login } = useAuth()
  const [formData, setFormData] = useState({
    email: '',
    password: ''
  })
  const [showPassword, setShowPassword] = useState(false)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    })
    setError('')
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    try {
      await login(formData.email, formData.password)
      navigate('/')
    } catch (err) {
      setError(err.message || 'Erreur de connexion')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="auth-page">
      <div className="auth-container">
        <div className="auth-card glass animate-fadeIn">
          <div className="auth-header">
            <Link to="/" className="auth-logo">
              <div className="logo-icon">
                <Music2 size={28} />
              </div>
              <span>Flow<span className="gradient-text">Music</span></span>
            </Link>
            <h1 className="auth-title">Bon retour parmi nous !</h1>
            <p className="auth-subtitle">Connectez-vous pour accéder à votre musique</p>
          </div>

          <form onSubmit={handleSubmit} className="auth-form">
            {error && (
              <div className="auth-error animate-fadeIn">
                {error}
              </div>
            )}

            <div className="input-group">
              <label className="input-label">Email</label>
              <div className="input-icon">
                <Mail />
                <input
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  className="input"
                  placeholder="votre@email.com"
                  required
                />
              </div>
            </div>

            <div className="input-group">
              <label className="input-label">Mot de passe</label>
              <div className="input-icon">
                <Lock />
                <input
                  type={showPassword ? 'text' : 'password'}
                  name="password"
                  value={formData.password}
                  onChange={handleChange}
                  className="input"
                  placeholder="••••••••"
                  required
                />
                <button
                  type="button"
                  className="password-toggle"
                  onClick={() => setShowPassword(!showPassword)}
                >
                  {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                </button>
              </div>
            </div>

            <div className="auth-options">
              <label className="checkbox-label">
                <input type="checkbox" />
                <span>Se souvenir de moi</span>
              </label>
              <Link to="/forgot-password" className="auth-link">
                Mot de passe oublié ?
              </Link>
            </div>

            <button
              type="submit"
              className="btn btn-primary btn-lg auth-submit"
              disabled={loading}
            >
              {loading ? (
                <div className="spinner" style={{ width: 20, height: 20 }}></div>
              ) : (
                'Se connecter'
              )}
            </button>
          </form>

          <div className="divider">ou continuer avec</div>

          <div className="social-buttons">
            <button className="btn btn-secondary social-btn">
              <svg viewBox="0 0 24 24" width="20" height="20">
                <path fill="currentColor" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                <path fill="currentColor" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                <path fill="currentColor" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                <path fill="currentColor" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
              </svg>
              Google
            </button>
            <button className="btn btn-secondary social-btn">
              <svg viewBox="0 0 24 24" width="20" height="20">
                <path fill="currentColor" d="M12 0C5.37 0 0 5.37 0 12c0 5.31 3.435 9.795 8.205 11.385.6.105.825-.255.825-.57 0-.285-.015-1.23-.015-2.235-3.015.555-3.795-.735-4.035-1.41-.135-.345-.72-1.41-1.23-1.695-.42-.225-1.02-.78-.015-.795.945-.015 1.62.87 1.845 1.23 1.08 1.815 2.805 1.305 3.495.99.105-.78.42-1.305.765-1.605-2.67-.3-5.46-1.335-5.46-5.925 0-1.305.465-2.385 1.23-3.225-.12-.3-.54-1.53.12-3.18 0 0 1.005-.315 3.3 1.23.96-.27 1.98-.405 3-.405s2.04.135 3 .405c2.295-1.56 3.3-1.23 3.3-1.23.66 1.65.24 2.88.12 3.18.765.84 1.23 1.905 1.23 3.225 0 4.605-2.805 5.625-5.475 5.925.435.375.81 1.095.81 2.22 0 1.605-.015 2.895-.015 3.3 0 .315.225.69.825.57A12.02 12.02 0 0024 12c0-6.63-5.37-12-12-12z"/>
              </svg>
              GitHub
            </button>
          </div>

          <p className="auth-footer">
            Pas encore de compte ?{' '}
            <Link to="/register" className="auth-link">
              S'inscrire gratuitement
            </Link>
          </p>
        </div>
      </div>

      <div className="auth-visual">
        <div className="visual-content">
          <div className="visual-circles">
            <div className="v-circle v-circle-1"></div>
            <div className="v-circle v-circle-2"></div>
            <div className="v-circle v-circle-3"></div>
          </div>
          <div className="visual-text">
            <h2>Votre musique vous attend</h2>
            <p>Écoutez vos titres favoris, découvrez de nouveaux artistes et partagez vos créations.</p>
          </div>
        </div>
      </div>
    </div>
  )
}

export default Login

