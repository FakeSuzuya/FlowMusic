import { Router } from 'express'
import bcrypt from 'bcryptjs'
import db from '../database.js'
import { generateToken, authMiddleware } from '../middleware/auth.js'

const router = Router()

// Inscription
router.post('/register', async (req, res) => {
  try {
    const { username, email, password } = req.body

    // Validation
    if (!username || !email || !password) {
      return res.status(400).json({ message: 'Tous les champs sont requis' })
    }

    if (password.length < 8) {
      return res.status(400).json({ message: 'Le mot de passe doit contenir au moins 8 caractères' })
    }

    // Vérifier si l'utilisateur existe
    const existingUser = db.prepare(
      'SELECT id FROM users WHERE email = ? OR username = ?'
    ).get(email, username)

    if (existingUser) {
      return res.status(400).json({ message: 'Email ou nom d\'utilisateur déjà utilisé' })
    }

    // Hasher le mot de passe
    const hashedPassword = await bcrypt.hash(password, 10)

    // Créer l'utilisateur
    const result = db.prepare(
      'INSERT INTO users (username, email, password) VALUES (?, ?, ?)'
    ).run(username, email, hashedPassword)

    const user = {
      id: result.lastInsertRowid,
      username,
      email,
      bio: '',
      createdAt: new Date().toISOString()
    }

    const token = generateToken(user)

    res.status(201).json({
      message: 'Inscription réussie',
      user,
      token
    })
  } catch (error) {
    console.error('Erreur inscription:', error)
    res.status(500).json({ message: 'Erreur serveur' })
  }
})

// Connexion
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body

    if (!email || !password) {
      return res.status(400).json({ message: 'Email et mot de passe requis' })
    }

    // Trouver l'utilisateur
    const user = db.prepare(
      'SELECT * FROM users WHERE email = ?'
    ).get(email)

    if (!user) {
      return res.status(401).json({ message: 'Email ou mot de passe incorrect' })
    }

    // Vérifier le mot de passe
    const validPassword = await bcrypt.compare(password, user.password)

    if (!validPassword) {
      return res.status(401).json({ message: 'Email ou mot de passe incorrect' })
    }

    const token = generateToken(user)

    res.json({
      message: 'Connexion réussie',
      user: {
        id: user.id,
        username: user.username,
        email: user.email,
        bio: user.bio,
        avatarUrl: user.avatar_url,
        createdAt: user.created_at
      },
      token
    })
  } catch (error) {
    console.error('Erreur connexion:', error)
    res.status(500).json({ message: 'Erreur serveur' })
  }
})

// Obtenir l'utilisateur actuel
router.get('/me', authMiddleware, (req, res) => {
  try {
    const user = db.prepare(
      'SELECT id, username, email, bio, avatar_url, created_at FROM users WHERE id = ?'
    ).get(req.user.id)

    if (!user) {
      return res.status(404).json({ message: 'Utilisateur non trouvé' })
    }

    res.json({
      user: {
        id: user.id,
        username: user.username,
        email: user.email,
        bio: user.bio,
        avatarUrl: user.avatar_url,
        createdAt: user.created_at
      }
    })
  } catch (error) {
    console.error('Erreur récupération utilisateur:', error)
    res.status(500).json({ message: 'Erreur serveur' })
  }
})

export default router

