import { Router } from 'express'
import multer from 'multer'
import { v4 as uuidv4 } from 'uuid'
import { fileURLToPath } from 'url'
import { dirname, join, extname } from 'path'
import { mkdirSync, existsSync, createReadStream, statSync } from 'fs'
import db from '../database.js'
import { authMiddleware, optionalAuth } from '../middleware/auth.js'

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)

const router = Router()

// Configuration Multer pour l'upload
const uploadsDir = join(__dirname, '..', 'uploads')
const audioDir = join(uploadsDir, 'audio')
const coversDir = join(uploadsDir, 'covers')

// Créer les dossiers s'ils n'existent pas
;[uploadsDir, audioDir, coversDir].forEach(dir => {
  if (!existsSync(dir)) {
    mkdirSync(dir, { recursive: true })
  }
})

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    if (file.fieldname === 'audio') {
      cb(null, audioDir)
    } else if (file.fieldname === 'cover') {
      cb(null, coversDir)
    }
  },
  filename: (req, file, cb) => {
    const uniqueName = `${uuidv4()}${extname(file.originalname)}`
    cb(null, uniqueName)
  }
})

const upload = multer({
  storage,
  limits: {
    fileSize: 50 * 1024 * 1024 // 50MB max
  },
  fileFilter: (req, file, cb) => {
    if (file.fieldname === 'audio') {
      const allowedTypes = ['audio/mpeg', 'audio/wav', 'audio/flac', 'audio/ogg', 'audio/mp3']
      if (allowedTypes.includes(file.mimetype) || file.originalname.match(/\.(mp3|wav|flac|ogg)$/i)) {
        cb(null, true)
      } else {
        cb(new Error('Format audio non supporté'))
      }
    } else if (file.fieldname === 'cover') {
      const allowedTypes = ['image/jpeg', 'image/png', 'image/webp']
      if (allowedTypes.includes(file.mimetype)) {
        cb(null, true)
      } else {
        cb(new Error('Format image non supporté'))
      }
    }
  }
})

// Upload d'une piste
router.post('/upload', authMiddleware, upload.fields([
  { name: 'audio', maxCount: 1 },
  { name: 'cover', maxCount: 1 }
]), (req, res) => {
  try {
    const { title, artist, album, genre, description } = req.body
    const audioFile = req.files?.audio?.[0]
    const coverFile = req.files?.cover?.[0]

    if (!audioFile) {
      return res.status(400).json({ message: 'Fichier audio requis' })
    }

    if (!title) {
      return res.status(400).json({ message: 'Titre requis' })
    }

    const audioUrl = `/uploads/audio/${audioFile.filename}`
    const coverUrl = coverFile ? `/uploads/covers/${coverFile.filename}` : ''

    const result = db.prepare(`
      INSERT INTO tracks (user_id, title, artist, album, genre, description, audio_url, cover_url)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      req.user.id,
      title,
      artist || req.user.username || 'Artiste inconnu',
      album || '',
      genre || '',
      description || '',
      audioUrl,
      coverUrl
    )

    const track = db.prepare('SELECT * FROM tracks WHERE id = ?').get(result.lastInsertRowid)

    res.status(201).json({
      message: 'Piste uploadée avec succès',
      track: formatTrack(track)
    })
  } catch (error) {
    console.error('Erreur upload:', error)
    res.status(500).json({ message: 'Erreur lors de l\'upload' })
  }
})

// Obtenir les pistes tendances
router.get('/trending', optionalAuth, (req, res) => {
  try {
    const tracks = db.prepare(`
      SELECT t.*, u.username as uploader_name
      FROM tracks t
      JOIN users u ON t.user_id = u.id
      ORDER BY t.plays DESC, t.created_at DESC
      LIMIT 20
    `).all()

    res.json({ tracks: tracks.map(formatTrack) })
  } catch (error) {
    console.error('Erreur récupération tendances:', error)
    res.status(500).json({ message: 'Erreur serveur' })
  }
})

// Rechercher des pistes
router.get('/search', optionalAuth, (req, res) => {
  try {
    const { q, genre, sort = 'trending' } = req.query
    
    let query = `
      SELECT t.*, u.username as uploader_name
      FROM tracks t
      JOIN users u ON t.user_id = u.id
      WHERE 1=1
    `
    const params = []

    if (q) {
      query += ` AND (t.title LIKE ? OR t.artist LIKE ? OR u.username LIKE ?)`
      const searchTerm = `%${q}%`
      params.push(searchTerm, searchTerm, searchTerm)
    }

    if (genre && genre !== 'all') {
      query += ` AND t.genre = ?`
      params.push(genre)
    }

    switch (sort) {
      case 'new':
        query += ` ORDER BY t.created_at DESC`
        break
      case 'popular':
        query += ` ORDER BY t.plays DESC`
        break
      default:
        query += ` ORDER BY t.plays DESC, t.created_at DESC`
    }

    query += ` LIMIT 50`

    const tracks = db.prepare(query).all(...params)

    res.json({ tracks: tracks.map(formatTrack) })
  } catch (error) {
    console.error('Erreur recherche:', error)
    res.status(500).json({ message: 'Erreur serveur' })
  }
})

// Obtenir les pistes de l'utilisateur connecté
router.get('/my-uploads', authMiddleware, (req, res) => {
  try {
    const tracks = db.prepare(`
      SELECT * FROM tracks
      WHERE user_id = ?
      ORDER BY created_at DESC
    `).all(req.user.id)

    res.json({ tracks: tracks.map(formatTrack) })
  } catch (error) {
    console.error('Erreur récupération uploads:', error)
    res.status(500).json({ message: 'Erreur serveur' })
  }
})

// Obtenir les pistes likées
router.get('/liked', authMiddleware, (req, res) => {
  try {
    const tracks = db.prepare(`
      SELECT t.*, u.username as uploader_name
      FROM tracks t
      JOIN likes l ON t.id = l.track_id
      JOIN users u ON t.user_id = u.id
      WHERE l.user_id = ?
      ORDER BY l.created_at DESC
    `).all(req.user.id)

    res.json({ tracks: tracks.map(formatTrack) })
  } catch (error) {
    console.error('Erreur récupération likes:', error)
    res.status(500).json({ message: 'Erreur serveur' })
  }
})

// Streamer une piste audio
router.get('/:id/stream', (req, res) => {
  try {
    const track = db.prepare('SELECT * FROM tracks WHERE id = ?').get(req.params.id)

    if (!track) {
      return res.status(404).json({ message: 'Piste non trouvée' })
    }

    const audioPath = join(__dirname, '..', track.audio_url)
    
    if (!existsSync(audioPath)) {
      return res.status(404).json({ message: 'Fichier audio non trouvé' })
    }

    const stat = statSync(audioPath)
    const range = req.headers.range

    if (range) {
      const parts = range.replace(/bytes=/, '').split('-')
      const start = parseInt(parts[0], 10)
      const end = parts[1] ? parseInt(parts[1], 10) : stat.size - 1
      const chunkSize = end - start + 1

      res.writeHead(206, {
        'Content-Range': `bytes ${start}-${end}/${stat.size}`,
        'Accept-Ranges': 'bytes',
        'Content-Length': chunkSize,
        'Content-Type': 'audio/mpeg'
      })

      createReadStream(audioPath, { start, end }).pipe(res)
    } else {
      res.writeHead(200, {
        'Content-Length': stat.size,
        'Content-Type': 'audio/mpeg'
      })

      createReadStream(audioPath).pipe(res)
    }

    // Incrémenter le compteur de lectures
    db.prepare('UPDATE tracks SET plays = plays + 1 WHERE id = ?').run(req.params.id)
  } catch (error) {
    console.error('Erreur streaming:', error)
    res.status(500).json({ message: 'Erreur serveur' })
  }
})

// Liker/Unliker une piste
router.post('/:id/like', authMiddleware, (req, res) => {
  try {
    const trackId = req.params.id
    const userId = req.user.id

    const existingLike = db.prepare(
      'SELECT id FROM likes WHERE user_id = ? AND track_id = ?'
    ).get(userId, trackId)

    if (existingLike) {
      db.prepare('DELETE FROM likes WHERE id = ?').run(existingLike.id)
      res.json({ liked: false, message: 'Like retiré' })
    } else {
      db.prepare(
        'INSERT INTO likes (user_id, track_id) VALUES (?, ?)'
      ).run(userId, trackId)
      res.json({ liked: true, message: 'Piste likée' })
    }
  } catch (error) {
    console.error('Erreur like:', error)
    res.status(500).json({ message: 'Erreur serveur' })
  }
})

// Helper pour formater une piste
function formatTrack(track) {
  return {
    id: track.id,
    title: track.title,
    artist: track.artist,
    album: track.album,
    genre: track.genre,
    description: track.description,
    duration: track.duration,
    audioUrl: track.audio_url,
    coverUrl: track.cover_url,
    plays: track.plays,
    uploaderId: track.user_id,
    uploaderName: track.uploader_name,
    createdAt: track.created_at
  }
}

export default router

