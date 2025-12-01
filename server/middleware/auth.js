import jwt from 'jsonwebtoken'

const JWT_SECRET = process.env.JWT_SECRET || 'flowmusic_secret_key_2024'

export function generateToken(user) {
  return jwt.sign(
    { id: user.id, email: user.email },
    JWT_SECRET,
    { expiresIn: '7d' }
  )
}

export function verifyToken(token) {
  return jwt.verify(token, JWT_SECRET)
}

export function authMiddleware(req, res, next) {
  try {
    const authHeader = req.headers.authorization
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ message: 'Token manquant' })
    }

    const token = authHeader.split(' ')[1]
    const decoded = verifyToken(token)
    
    req.user = decoded
    next()
  } catch (error) {
    return res.status(401).json({ message: 'Token invalide ou expiré' })
  }
}

export function optionalAuth(req, res, next) {
  try {
    const authHeader = req.headers.authorization
    
    if (authHeader && authHeader.startsWith('Bearer ')) {
      const token = authHeader.split(' ')[1]
      const decoded = verifyToken(token)
      req.user = decoded
    }
    
    next()
  } catch (error) {
    next()
  }
}

