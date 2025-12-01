import { Router } from 'express'
import db from '../database.js'
import { authMiddleware } from '../middleware/auth.js'

const router = Router()

// Obtenir le profil de l'utilisateur connecté
router.get('/profile', authMiddleware, (req, res) => {
  try {
    const user = db.prepare(`
      SELECT id, username, email, bio, avatar_url, created_at
      FROM users WHERE id = ?
    `).get(req.user.id)

    if (!user) {
      return res.status(404).json({ message: 'Utilisateur non trouvé' })
    }

    // Statistiques
    const uploads = db.prepare(
      'SELECT COUNT(*) as count FROM tracks WHERE user_id = ?'
    ).get(req.user.id)

    const likes = db.prepare(`
      SELECT COUNT(*) as count FROM likes l
      JOIN tracks t ON l.track_id = t.id
      WHERE t.user_id = ?
    `).get(req.user.id)

    const plays = db.prepare(`
      SELECT COALESCE(SUM(plays), 0) as total FROM tracks WHERE user_id = ?
    `).get(req.user.id)

    // Dernières pistes
    const tracks = db.prepare(`
      SELECT * FROM tracks
      WHERE user_id = ?
      ORDER BY created_at DESC
      LIMIT 10
    `).all(req.user.id)

    res.json({
      user: {
        id: user.id,
        username: user.username,
        email: user.email,
        bio: user.bio,
        avatarUrl: user.avatar_url,
        createdAt: user.created_at
      },
      stats: {
        uploads: uploads.count,
        likes: likes.count,
        plays: plays.total
      },
      tracks: tracks.map(t => ({
        id: t.id,
        title: t.title,
        artist: t.artist,
        coverUrl: t.cover_url,
        duration: t.duration
      }))
    })
  } catch (error) {
    console.error('Erreur récupération profil:', error)
    res.status(500).json({ message: 'Erreur serveur' })
  }
})

// Mettre à jour le profil
router.put('/profile', authMiddleware, (req, res) => {
  try {
    const { username, bio } = req.body

    if (username) {
      // Vérifier si le username est déjà pris
      const existing = db.prepare(
        'SELECT id FROM users WHERE username = ? AND id != ?'
      ).get(username, req.user.id)

      if (existing) {
        return res.status(400).json({ message: 'Ce nom d\'utilisateur est déjà pris' })
      }
    }

    db.prepare(`
      UPDATE users 
      SET username = COALESCE(?, username),
          bio = COALESCE(?, bio),
          updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `).run(username || null, bio || null, req.user.id)

    const user = db.prepare(
      'SELECT id, username, email, bio, avatar_url, created_at FROM users WHERE id = ?'
    ).get(req.user.id)

    res.json({
      message: 'Profil mis à jour',
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
    console.error('Erreur mise à jour profil:', error)
    res.status(500).json({ message: 'Erreur serveur' })
  }
})

// Obtenir le profil public d'un utilisateur
router.get('/:id', (req, res) => {
  try {
    const user = db.prepare(`
      SELECT id, username, bio, avatar_url, created_at
      FROM users WHERE id = ?
    `).get(req.params.id)

    if (!user) {
      return res.status(404).json({ message: 'Utilisateur non trouvé' })
    }

    // Pistes publiques
    const tracks = db.prepare(`
      SELECT * FROM tracks
      WHERE user_id = ?
      ORDER BY created_at DESC
    `).all(req.params.id)

    // Stats
    const stats = {
      uploads: tracks.length,
      plays: tracks.reduce((sum, t) => sum + t.plays, 0)
    }

    res.json({
      user: {
        id: user.id,
        username: user.username,
        bio: user.bio,
        avatarUrl: user.avatar_url,
        createdAt: user.created_at
      },
      stats,
      tracks: tracks.map(t => ({
        id: t.id,
        title: t.title,
        artist: t.artist,
        coverUrl: t.cover_url,
        duration: t.duration,
        plays: t.plays
      }))
    })
  } catch (error) {
    console.error('Erreur récupération utilisateur:', error)
    res.status(500).json({ message: 'Erreur serveur' })
  }
})

export default router

