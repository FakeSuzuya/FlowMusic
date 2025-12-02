import { createContext, useContext, useState, useEffect, useCallback } from 'react'

const AuthContext = createContext(null)

const API_URL = '/api'

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)
  const [token, setToken] = useState(() => {
    try {
      return localStorage.getItem('token')
    } catch {
      return null
    }
  })

  const clearAuth = useCallback(() => {
    try {
      localStorage.removeItem('token')
    } catch (e) {
      console.error('Erreur localStorage:', e)
    }
    setToken(null)
    setUser(null)
  }, [])

  const fetchUser = useCallback(async () => {
    if (!token) {
      setLoading(false)
      return
    }

    try {
      const controller = new AbortController()
      const timeoutId = setTimeout(() => controller.abort(), 10000) // 10s timeout

      const res = await fetch(`${API_URL}/auth/me`, {
        headers: {
          'Authorization': `Bearer ${token}`
        },
        signal: controller.signal
      })

      clearTimeout(timeoutId)

      if (res.ok) {
        const data = await res.json()
        setUser(data.user)
      } else {
        // Token invalide ou expiré
        clearAuth()
      }
    } catch (error) {
      if (error.name === 'AbortError') {
        console.warn('Timeout lors de la récupération utilisateur')
      } else {
        console.error('Erreur lors de la récupération utilisateur:', error)
      }
      // En cas d'erreur réseau, on garde le token mais on ne définit pas l'utilisateur
      // L'utilisateur devra se reconnecter au prochain refresh si le serveur est inaccessible
    } finally {
      setLoading(false)
    }
  }, [token, clearAuth])

  useEffect(() => {
    fetchUser()
  }, [fetchUser])

  const login = async (email, password) => {
    const res = await fetch(`${API_URL}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password })
    })
    
    const data = await res.json()
    
    if (!res.ok) {
      throw new Error(data.message || 'Erreur de connexion')
    }
    
    try {
      localStorage.setItem('token', data.token)
    } catch (e) {
      console.error('Erreur localStorage:', e)
    }
    
    setToken(data.token)
    setUser(data.user)
    return data
  }

  const register = async (username, email, password) => {
    const res = await fetch(`${API_URL}/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username, email, password })
    })
    
    const data = await res.json()
    
    if (!res.ok) {
      throw new Error(data.message || 'Erreur d\'inscription')
    }
    
    try {
      localStorage.setItem('token', data.token)
    } catch (e) {
      console.error('Erreur localStorage:', e)
    }
    
    setToken(data.token)
    setUser(data.user)
    return data
  }

  const logout = () => {
    clearAuth()
  }

  const updateUser = (userData) => {
    setUser(prev => ({ ...prev, ...userData }))
  }

  const value = {
    user,
    token,
    loading,
    login,
    register,
    logout,
    updateUser,
    isAuthenticated: !!user
  }

  // Afficher un écran de chargement pendant la vérification initiale
  if (loading) {
    return (
      <AuthContext.Provider value={value}>
        <div className="app-loading">
          <div className="loading-content">
            <div className="spinner"></div>
            <p>Chargement...</p>
          </div>
        </div>
      </AuthContext.Provider>
    )
  }

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error('useAuth doit être utilisé dans un AuthProvider')
  }
  return context
}
