import jwt from 'jsonwebtoken'
import config from '../config.js'

export function generateToken(user) {
  return jwt.sign(
    { 
      id: user.id, 
      email: user.email,
      username: user.username 
    },
    config.jwt.secret,
    { expiresIn: config.jwt.expiresIn }
  )
}

export function verifyToken(token) {
  return jwt.verify(token, config.jwt.secret)
}

export function authMiddleware(req, res, next) {
  try {
    const authHeader = req.headers.authorization
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ message: 'Token d\'authentification manquant' })
    }

    const token = authHeader.split(' ')[1]
    
    if (!token || token === 'null' || token === 'undefined') {
      return res.status(401).json({ message: 'Token invalide' })
    }
    
    const decoded = verifyToken(token)
    
    // Vérifier que le token contient les informations nécessaires
    if (!decoded.id) {
      return res.status(401).json({ message: 'Token invalide' })
    }
    
    req.user = decoded
    next()
  } catch (error) {
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({ message: 'Session expirée, veuillez vous reconnecter' })
    }
    if (error.name === 'JsonWebTokenError') {
      return res.status(401).json({ message: 'Token invalide' })
    }
    return res.status(401).json({ message: 'Erreur d\'authentification' })
  }
}

export function optionalAuth(req, res, next) {
  try {
    const authHeader = req.headers.authorization
    
    if (authHeader && authHeader.startsWith('Bearer ')) {
      const token = authHeader.split(' ')[1]
      
      if (token && token !== 'null' && token !== 'undefined') {
        const decoded = verifyToken(token)
        if (decoded.id) {
          req.user = decoded
        }
      }
    }
    
    next()
  } catch (error) {
    // En mode optionnel, on continue sans authentification en cas d'erreur
    next()
  }
}
