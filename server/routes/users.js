import { Router } from 'express'
import multer from 'multer'
import { v4 as uuidv4 } from 'uuid'
import { fileURLToPath } from 'url'
import { dirname, join, extname } from 'path'
import { mkdirSync, existsSync } from 'fs'
import db from '../database.js'
import { authMiddleware, optionalAuth } from '../middleware/auth.js'

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)

const router = Router()

// Configuration Multer pour l'upload d'avatar
const avatarsDir = join(__dirname, '..', 'uploads', 'avatars')
if (!existsSync(avatarsDir)) {
  mkdirSync(avatarsDir, { recursive: true })
}

const storage = multer.diskStorage({
  destination: avatarsDir,
  filename: (req, file, cb) => {
    const uniqueName = `${uuidv4()}${extname(file.originalname)}`
    cb(null, uniqueName)
  }
})

const upload = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB max
  fileFilter: (req, file, cb) => {
    const allowedTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/gif']
    if (allowedTypes.includes(file.mimetype)) {
      cb(null, true)
    } else {
      cb(new Error('Format image non supporté'))
    }
  }
})

// Obtenir le profil de l'utilisateur connecté
router.get('/profile', authMiddleware, (req, res) => {
  try {
    const user = db.prepare(`
      SELECT id, username, email, bio, avatar_url, banner_url, website, location, is_verified, is_artist, created_at
      FROM users WHERE id = ?
    `).get(req.user.id)

    if (!user) {
      return res.status(404).json({ message: 'Utilisateur non trouvé' })
    }

    // Statistiques
    const uploads = db.prepare('SELECT COUNT(*) as count FROM tracks WHERE user_id = ?').get(req.user.id)
    const likesReceived = db.prepare(`
      SELECT COUNT(*) as count FROM likes l
      JOIN tracks t ON l.track_id = t.id
      WHERE t.user_id = ?
    `).get(req.user.id)
    const plays = db.prepare('SELECT COALESCE(SUM(plays), 0) as total FROM tracks WHERE user_id = ?').get(req.user.id)
    const followers = db.prepare('SELECT COUNT(*) as count FROM followers WHERE following_id = ?').get(req.user.id)
    const following = db.prepare('SELECT COUNT(*) as count FROM followers WHERE follower_id = ?').get(req.user.id)

    // Dernières pistes
    const tracks = db.prepare(`
      SELECT * FROM tracks WHERE user_id = ? ORDER BY created_at DESC LIMIT 10
    `).all(req.user.id)

    res.json({
      user: formatUser(user),
      stats: {
        uploads: uploads.count,
        likes: likesReceived.count,
        plays: plays.total,
        followers: followers.count,
        following: following.count
      },
      tracks: tracks.map(formatTrack)
    })
  } catch (error) {
    console.error('Erreur récupération profil:', error)
    res.status(500).json({ message: 'Erreur serveur' })
  }
})

// Mettre à jour le profil
router.put('/profile', authMiddleware, (req, res) => {
  try {
    const { username, bio, website, location } = req.body

    if (username) {
      const existing = db.prepare('SELECT id FROM users WHERE username = ? AND id != ?').get(username, req.user.id)
      if (existing) {
        return res.status(400).json({ message: 'Ce nom d\'utilisateur est déjà pris' })
      }
    }

    db.prepare(`
      UPDATE users 
      SET username = COALESCE(?, username),
          bio = COALESCE(?, bio),
          website = COALESCE(?, website),
          location = COALESCE(?, location),
          updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `).run(
      username || null,
      bio !== undefined ? bio : null,
      website !== undefined ? website : null,
      location !== undefined ? location : null,
      req.user.id
    )

    const user = db.prepare(`
      SELECT id, username, email, bio, avatar_url, banner_url, website, location, is_verified, is_artist, created_at
      FROM users WHERE id = ?
    `).get(req.user.id)

    res.json({
      message: 'Profil mis à jour',
      user: formatUser(user)
    })
  } catch (error) {
    console.error('Erreur mise à jour profil:', error)
    res.status(500).json({ message: 'Erreur serveur' })
  }
})

// Upload d'avatar
router.post('/avatar', authMiddleware, upload.single('avatar'), (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: 'Aucune image fournie' })
    }

    const avatarUrl = `/uploads/avatars/${req.file.filename}`
    
    db.prepare('UPDATE users SET avatar_url = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?')
      .run(avatarUrl, req.user.id)

    res.json({
      message: 'Avatar mis à jour',
      avatarUrl
    })
  } catch (error) {
    console.error('Erreur upload avatar:', error)
    res.status(500).json({ message: 'Erreur serveur' })
  }
})

// Obtenir le profil public d'un utilisateur
router.get('/:id', optionalAuth, (req, res) => {
  try {
    const user = db.prepare(`
      SELECT id, username, bio, avatar_url, banner_url, website, location, is_verified, is_artist, created_at
      FROM users WHERE id = ?
    `).get(req.params.id)

    if (!user) {
      return res.status(404).json({ message: 'Utilisateur non trouvé' })
    }

    // Pistes publiques
    const tracks = db.prepare(`
      SELECT * FROM tracks WHERE user_id = ? AND is_public = 1 ORDER BY created_at DESC
    `).all(req.params.id)

    // Stats
    const followers = db.prepare('SELECT COUNT(*) as count FROM followers WHERE following_id = ?').get(req.params.id)
    const following = db.prepare('SELECT COUNT(*) as count FROM followers WHERE follower_id = ?').get(req.params.id)
    
    // Vérifier si l'utilisateur connecté suit ce profil
    let isFollowing = false
    if (req.user) {
      const follow = db.prepare('SELECT id FROM followers WHERE follower_id = ? AND following_id = ?')
        .get(req.user.id, req.params.id)
      isFollowing = Boolean(follow)
    }

    res.json({
      user: formatUser(user),
      stats: {
        uploads: tracks.length,
        plays: tracks.reduce((sum, t) => sum + t.plays, 0),
        followers: followers.count,
        following: following.count
      },
      tracks: tracks.map(formatTrack),
      isFollowing
    })
  } catch (error) {
    console.error('Erreur récupération utilisateur:', error)
    res.status(500).json({ message: 'Erreur serveur' })
  }
})

// Suivre/Ne plus suivre un utilisateur
router.post('/:id/follow', authMiddleware, (req, res) => {
  try {
    const targetId = parseInt(req.params.id)
    
    if (targetId === req.user.id) {
      return res.status(400).json({ message: 'Vous ne pouvez pas vous suivre vous-même' })
    }

    const targetUser = db.prepare('SELECT id, username FROM users WHERE id = ?').get(targetId)
    if (!targetUser) {
      return res.status(404).json({ message: 'Utilisateur non trouvé' })
    }

    const existingFollow = db.prepare(
      'SELECT id FROM followers WHERE follower_id = ? AND following_id = ?'
    ).get(req.user.id, targetId)

    if (existingFollow) {
      db.prepare('DELETE FROM followers WHERE id = ?').run(existingFollow.id)
      res.json({ following: false, message: 'Vous ne suivez plus cet utilisateur' })
    } else {
      db.prepare('INSERT INTO followers (follower_id, following_id) VALUES (?, ?)').run(req.user.id, targetId)
      
      // Créer une notification
      db.prepare(`
        INSERT INTO notifications (user_id, type, title, message, data)
        VALUES (?, 'follow', 'Nouveau follower', ?, ?)
      `).run(
        targetId,
        `${req.user.username} a commencé à vous suivre`,
        JSON.stringify({ userId: req.user.id })
      )
      
      res.json({ following: true, message: 'Vous suivez maintenant cet utilisateur' })
    }
  } catch (error) {
    console.error('Erreur follow:', error)
    res.status(500).json({ message: 'Erreur serveur' })
  }
})

// Obtenir les followers d'un utilisateur
router.get('/:id/followers', (req, res) => {
  try {
    const followers = db.prepare(`
      SELECT u.id, u.username, u.avatar_url, u.bio, u.is_verified
      FROM followers f
      JOIN users u ON f.follower_id = u.id
      WHERE f.following_id = ?
      ORDER BY f.created_at DESC
      LIMIT 50
    `).all(req.params.id)

    res.json({ 
      followers: followers.map(u => ({
        id: u.id,
        username: u.username,
        avatarUrl: u.avatar_url,
        bio: u.bio,
        isVerified: Boolean(u.is_verified)
      }))
    })
  } catch (error) {
    console.error('Erreur récupération followers:', error)
    res.status(500).json({ message: 'Erreur serveur' })
  }
})

// Obtenir les utilisateurs suivis par un utilisateur
router.get('/:id/following', (req, res) => {
  try {
    const following = db.prepare(`
      SELECT u.id, u.username, u.avatar_url, u.bio, u.is_verified
      FROM followers f
      JOIN users u ON f.following_id = u.id
      WHERE f.follower_id = ?
      ORDER BY f.created_at DESC
      LIMIT 50
    `).all(req.params.id)

    res.json({ 
      following: following.map(u => ({
        id: u.id,
        username: u.username,
        avatarUrl: u.avatar_url,
        bio: u.bio,
        isVerified: Boolean(u.is_verified)
      }))
    })
  } catch (error) {
    console.error('Erreur récupération following:', error)
    res.status(500).json({ message: 'Erreur serveur' })
  }
})

// Obtenir les notifications
router.get('/notifications/all', authMiddleware, (req, res) => {
  try {
    const notifications = db.prepare(`
      SELECT * FROM notifications
      WHERE user_id = ?
      ORDER BY created_at DESC
      LIMIT 50
    `).all(req.user.id)

    const unreadCount = db.prepare(
      'SELECT COUNT(*) as count FROM notifications WHERE user_id = ? AND is_read = 0'
    ).get(req.user.id)

    res.json({ 
      notifications: notifications.map(n => ({
        id: n.id,
        type: n.type,
        title: n.title,
        message: n.message,
        data: JSON.parse(n.data || '{}'),
        isRead: Boolean(n.is_read),
        createdAt: n.created_at
      })),
      unreadCount: unreadCount.count
    })
  } catch (error) {
    console.error('Erreur récupération notifications:', error)
    res.status(500).json({ message: 'Erreur serveur' })
  }
})

// Marquer les notifications comme lues
router.post('/notifications/read', authMiddleware, (req, res) => {
  try {
    const { notificationIds } = req.body
    
    if (notificationIds && notificationIds.length > 0) {
      const placeholders = notificationIds.map(() => '?').join(',')
      db.prepare(`
        UPDATE notifications SET is_read = 1 
        WHERE id IN (${placeholders}) AND user_id = ?
      `).run(...notificationIds, req.user.id)
    } else {
      db.prepare('UPDATE notifications SET is_read = 1 WHERE user_id = ?').run(req.user.id)
    }

    res.json({ message: 'Notifications marquées comme lues' })
  } catch (error) {
    console.error('Erreur marquage notifications:', error)
    res.status(500).json({ message: 'Erreur serveur' })
  }
})

// Rechercher des utilisateurs
router.get('/search/users', (req, res) => {
  try {
    const { q } = req.query
    
    if (!q || q.length < 2) {
      return res.json({ users: [] })
    }

    const users = db.prepare(`
      SELECT id, username, avatar_url, bio, is_verified, is_artist
      FROM users
      WHERE username LIKE ?
      ORDER BY 
        CASE WHEN username LIKE ? THEN 0 ELSE 1 END,
        is_verified DESC
      LIMIT 20
    `).all(`%${q}%`, `${q}%`)

    res.json({ 
      users: users.map(u => ({
        id: u.id,
        username: u.username,
        avatarUrl: u.avatar_url,
        bio: u.bio,
        isVerified: Boolean(u.is_verified),
        isArtist: Boolean(u.is_artist)
      }))
    })
  } catch (error) {
    console.error('Erreur recherche utilisateurs:', error)
    res.status(500).json({ message: 'Erreur serveur' })
  }
})

// Helper pour formater un utilisateur
function formatUser(user) {
  return {
    id: user.id,
    username: user.username,
    email: user.email,
    bio: user.bio,
    avatarUrl: user.avatar_url,
    bannerUrl: user.banner_url,
    website: user.website,
    location: user.location,
    isVerified: Boolean(user.is_verified),
    isArtist: Boolean(user.is_artist),
    createdAt: user.created_at
  }
}

// Helper pour formater une piste
function formatTrack(track) {
  return {
    id: track.id,
    title: track.title,
    artist: track.artist,
    album: track.album,
    genre: track.genre,
    duration: track.duration,
    audioUrl: track.audio_url,
    coverUrl: track.cover_url,
    plays: track.plays,
    createdAt: track.created_at
  }
}

export default router
