import { Router } from 'express'
import db from '../database.js'
import { authMiddleware, optionalAuth } from '../middleware/auth.js'

const router = Router()

// Créer une playlist
router.post('/', authMiddleware, (req, res) => {
  try {
    const { title, description, isPublic = true } = req.body

    if (!title) {
      return res.status(400).json({ message: 'Titre requis' })
    }

    const result = db.prepare(`
      INSERT INTO playlists (user_id, title, description, is_public)
      VALUES (?, ?, ?, ?)
    `).run(req.user.id, title, description || '', isPublic ? 1 : 0)

    const playlist = db.prepare('SELECT * FROM playlists WHERE id = ?').get(result.lastInsertRowid)

    res.status(201).json({
      message: 'Playlist créée',
      playlist: formatPlaylist(playlist)
    })
  } catch (error) {
    console.error('Erreur création playlist:', error)
    res.status(500).json({ message: 'Erreur serveur' })
  }
})

// Obtenir les playlists de l'utilisateur
router.get('/my', authMiddleware, (req, res) => {
  try {
    const playlists = db.prepare(`
      SELECT p.*, u.username as owner_name
      FROM playlists p
      JOIN users u ON p.user_id = u.id
      WHERE p.user_id = ?
      ORDER BY p.updated_at DESC
    `).all(req.user.id)

    res.json({ playlists: playlists.map(formatPlaylist) })
  } catch (error) {
    console.error('Erreur récupération playlists:', error)
    res.status(500).json({ message: 'Erreur serveur' })
  }
})

// Obtenir les playlists publiques populaires
router.get('/discover', optionalAuth, (req, res) => {
  try {
    const playlists = db.prepare(`
      SELECT p.*, u.username as owner_name,
             (SELECT COUNT(*) FROM playlist_tracks pt WHERE pt.playlist_id = p.id) as track_count
      FROM playlists p
      JOIN users u ON p.user_id = u.id
      WHERE p.is_public = 1
      ORDER BY p.track_count DESC, p.created_at DESC
      LIMIT 20
    `).all()

    res.json({ playlists: playlists.map(formatPlaylist) })
  } catch (error) {
    console.error('Erreur récupération playlists:', error)
    res.status(500).json({ message: 'Erreur serveur' })
  }
})

// Obtenir une playlist par ID
router.get('/:id', optionalAuth, (req, res) => {
  try {
    const playlist = db.prepare(`
      SELECT p.*, u.username as owner_name, u.avatar_url as owner_avatar
      FROM playlists p
      JOIN users u ON p.user_id = u.id
      WHERE p.id = ?
    `).get(req.params.id)

    if (!playlist) {
      return res.status(404).json({ message: 'Playlist non trouvée' })
    }

    // Vérifier l'accès
    if (!playlist.is_public && (!req.user || req.user.id !== playlist.user_id)) {
      return res.status(403).json({ message: 'Playlist privée' })
    }

    // Récupérer les pistes
    const tracks = db.prepare(`
      SELECT t.*, u.username as uploader_name, pt.position, pt.added_at
      FROM playlist_tracks pt
      JOIN tracks t ON pt.track_id = t.id
      JOIN users u ON t.user_id = u.id
      WHERE pt.playlist_id = ?
      ORDER BY pt.position ASC
    `).all(req.params.id)

    res.json({
      playlist: formatPlaylist(playlist),
      tracks: tracks.map(formatTrack)
    })
  } catch (error) {
    console.error('Erreur récupération playlist:', error)
    res.status(500).json({ message: 'Erreur serveur' })
  }
})

// Ajouter une piste à une playlist
router.post('/:id/tracks', authMiddleware, (req, res) => {
  try {
    const { trackId } = req.body
    const playlistId = req.params.id

    // Vérifier que la playlist appartient à l'utilisateur
    const playlist = db.prepare('SELECT * FROM playlists WHERE id = ?').get(playlistId)
    
    if (!playlist) {
      return res.status(404).json({ message: 'Playlist non trouvée' })
    }

    if (playlist.user_id !== req.user.id && !playlist.is_collaborative) {
      return res.status(403).json({ message: 'Non autorisé' })
    }

    // Vérifier que la piste existe
    const track = db.prepare('SELECT id, duration FROM tracks WHERE id = ?').get(trackId)
    if (!track) {
      return res.status(404).json({ message: 'Piste non trouvée' })
    }

    // Obtenir la position suivante
    const maxPos = db.prepare(
      'SELECT COALESCE(MAX(position), 0) as max FROM playlist_tracks WHERE playlist_id = ?'
    ).get(playlistId)

    // Ajouter la piste
    db.prepare(`
      INSERT INTO playlist_tracks (playlist_id, track_id, position, added_by)
      VALUES (?, ?, ?, ?)
    `).run(playlistId, trackId, maxPos.max + 1, req.user.id)

    // Mettre à jour le compteur et la durée
    db.prepare(`
      UPDATE playlists 
      SET track_count = track_count + 1,
          total_duration = total_duration + ?,
          updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `).run(track.duration || 0, playlistId)

    res.json({ message: 'Piste ajoutée à la playlist' })
  } catch (error) {
    if (error.message.includes('UNIQUE constraint')) {
      return res.status(400).json({ message: 'Cette piste est déjà dans la playlist' })
    }
    console.error('Erreur ajout piste:', error)
    res.status(500).json({ message: 'Erreur serveur' })
  }
})

// Retirer une piste d'une playlist
router.delete('/:id/tracks/:trackId', authMiddleware, (req, res) => {
  try {
    const { id: playlistId, trackId } = req.params

    const playlist = db.prepare('SELECT * FROM playlists WHERE id = ?').get(playlistId)
    
    if (!playlist) {
      return res.status(404).json({ message: 'Playlist non trouvée' })
    }

    if (playlist.user_id !== req.user.id) {
      return res.status(403).json({ message: 'Non autorisé' })
    }

    const track = db.prepare('SELECT duration FROM tracks WHERE id = ?').get(trackId)
    
    const result = db.prepare(
      'DELETE FROM playlist_tracks WHERE playlist_id = ? AND track_id = ?'
    ).run(playlistId, trackId)

    if (result.changes > 0) {
      db.prepare(`
        UPDATE playlists 
        SET track_count = track_count - 1,
            total_duration = total_duration - ?,
            updated_at = CURRENT_TIMESTAMP
        WHERE id = ?
      `).run(track?.duration || 0, playlistId)
    }

    res.json({ message: 'Piste retirée de la playlist' })
  } catch (error) {
    console.error('Erreur suppression piste:', error)
    res.status(500).json({ message: 'Erreur serveur' })
  }
})

// Mettre à jour une playlist
router.put('/:id', authMiddleware, (req, res) => {
  try {
    const { title, description, isPublic, coverUrl } = req.body
    const playlistId = req.params.id

    const playlist = db.prepare('SELECT * FROM playlists WHERE id = ?').get(playlistId)
    
    if (!playlist) {
      return res.status(404).json({ message: 'Playlist non trouvée' })
    }

    if (playlist.user_id !== req.user.id) {
      return res.status(403).json({ message: 'Non autorisé' })
    }

    db.prepare(`
      UPDATE playlists 
      SET title = COALESCE(?, title),
          description = COALESCE(?, description),
          is_public = COALESCE(?, is_public),
          cover_url = COALESCE(?, cover_url),
          updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `).run(
      title || null,
      description !== undefined ? description : null,
      isPublic !== undefined ? (isPublic ? 1 : 0) : null,
      coverUrl || null,
      playlistId
    )

    const updated = db.prepare('SELECT * FROM playlists WHERE id = ?').get(playlistId)

    res.json({
      message: 'Playlist mise à jour',
      playlist: formatPlaylist(updated)
    })
  } catch (error) {
    console.error('Erreur mise à jour playlist:', error)
    res.status(500).json({ message: 'Erreur serveur' })
  }
})

// Supprimer une playlist
router.delete('/:id', authMiddleware, (req, res) => {
  try {
    const playlist = db.prepare('SELECT * FROM playlists WHERE id = ?').get(req.params.id)
    
    if (!playlist) {
      return res.status(404).json({ message: 'Playlist non trouvée' })
    }

    if (playlist.user_id !== req.user.id) {
      return res.status(403).json({ message: 'Non autorisé' })
    }

    db.prepare('DELETE FROM playlists WHERE id = ?').run(req.params.id)

    res.json({ message: 'Playlist supprimée' })
  } catch (error) {
    console.error('Erreur suppression playlist:', error)
    res.status(500).json({ message: 'Erreur serveur' })
  }
})

// Helper pour formater une playlist
function formatPlaylist(playlist) {
  return {
    id: playlist.id,
    title: playlist.title,
    description: playlist.description,
    coverUrl: playlist.cover_url,
    isPublic: Boolean(playlist.is_public),
    isCollaborative: Boolean(playlist.is_collaborative),
    trackCount: playlist.track_count,
    totalDuration: playlist.total_duration,
    ownerId: playlist.user_id,
    ownerName: playlist.owner_name,
    ownerAvatar: playlist.owner_avatar,
    createdAt: playlist.created_at,
    updatedAt: playlist.updated_at
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
    description: track.description,
    duration: track.duration,
    audioUrl: track.audio_url,
    coverUrl: track.cover_url,
    plays: track.plays,
    uploaderId: track.user_id,
    uploaderName: track.uploader_name,
    position: track.position,
    addedAt: track.added_at,
    createdAt: track.created_at
  }
}

export default router

