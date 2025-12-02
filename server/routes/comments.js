import { Router } from 'express'
import db from '../database.js'
import { authMiddleware, optionalAuth } from '../middleware/auth.js'

const router = Router()

// Obtenir les commentaires d'une piste
router.get('/track/:trackId', optionalAuth, (req, res) => {
  try {
    const { trackId } = req.params
    const { sort = 'newest' } = req.query

    let orderBy = 'c.created_at DESC'
    if (sort === 'oldest') orderBy = 'c.created_at ASC'
    if (sort === 'top') orderBy = 'c.likes_count DESC, c.created_at DESC'

    const comments = db.prepare(`
      SELECT c.*, 
             u.username, 
             u.avatar_url,
             (SELECT COUNT(*) FROM comment_likes cl WHERE cl.comment_id = c.id) as likes_count
      FROM comments c
      JOIN users u ON c.user_id = u.id
      WHERE c.track_id = ? AND c.parent_id IS NULL
      ORDER BY ${orderBy}
    `).all(trackId)

    // Récupérer les réponses pour chaque commentaire
    const commentsWithReplies = comments.map(comment => {
      const replies = db.prepare(`
        SELECT c.*, 
               u.username, 
               u.avatar_url,
               (SELECT COUNT(*) FROM comment_likes cl WHERE cl.comment_id = c.id) as likes_count
        FROM comments c
        JOIN users u ON c.user_id = u.id
        WHERE c.parent_id = ?
        ORDER BY c.created_at ASC
      `).all(comment.id)

      return {
        ...formatComment(comment),
        replies: replies.map(formatComment),
        isLiked: req.user ? checkCommentLiked(comment.id, req.user.id) : false
      }
    })

    res.json({ 
      comments: commentsWithReplies,
      total: comments.length
    })
  } catch (error) {
    console.error('Erreur récupération commentaires:', error)
    res.status(500).json({ message: 'Erreur serveur' })
  }
})

// Ajouter un commentaire
router.post('/track/:trackId', authMiddleware, (req, res) => {
  try {
    const { trackId } = req.params
    const { content, parentId, timestampPosition } = req.body

    if (!content || content.trim().length === 0) {
      return res.status(400).json({ message: 'Le commentaire ne peut pas être vide' })
    }

    if (content.length > 1000) {
      return res.status(400).json({ message: 'Commentaire trop long (max 1000 caractères)' })
    }

    // Vérifier que la piste existe
    const track = db.prepare('SELECT id, user_id FROM tracks WHERE id = ?').get(trackId)
    if (!track) {
      return res.status(404).json({ message: 'Piste non trouvée' })
    }

    // Si c'est une réponse, vérifier que le commentaire parent existe
    if (parentId) {
      const parent = db.prepare('SELECT id FROM comments WHERE id = ? AND track_id = ?').get(parentId, trackId)
      if (!parent) {
        return res.status(404).json({ message: 'Commentaire parent non trouvé' })
      }
    }

    const result = db.prepare(`
      INSERT INTO comments (user_id, track_id, parent_id, content, timestamp_position)
      VALUES (?, ?, ?, ?, ?)
    `).run(
      req.user.id,
      trackId,
      parentId || null,
      content.trim(),
      timestampPosition || null
    )

    // Créer une notification pour le propriétaire de la piste
    if (track.user_id !== req.user.id) {
      db.prepare(`
        INSERT INTO notifications (user_id, type, title, message, data)
        VALUES (?, 'comment', 'Nouveau commentaire', ?, ?)
      `).run(
        track.user_id,
        `${req.user.username} a commenté votre piste`,
        JSON.stringify({ trackId, commentId: result.lastInsertRowid })
      )
    }

    const comment = db.prepare(`
      SELECT c.*, u.username, u.avatar_url
      FROM comments c
      JOIN users u ON c.user_id = u.id
      WHERE c.id = ?
    `).get(result.lastInsertRowid)

    res.status(201).json({
      message: 'Commentaire ajouté',
      comment: formatComment(comment)
    })
  } catch (error) {
    console.error('Erreur ajout commentaire:', error)
    res.status(500).json({ message: 'Erreur serveur' })
  }
})

// Modifier un commentaire
router.put('/:id', authMiddleware, (req, res) => {
  try {
    const { content } = req.body
    const commentId = req.params.id

    const comment = db.prepare('SELECT * FROM comments WHERE id = ?').get(commentId)
    
    if (!comment) {
      return res.status(404).json({ message: 'Commentaire non trouvé' })
    }

    if (comment.user_id !== req.user.id) {
      return res.status(403).json({ message: 'Non autorisé' })
    }

    if (!content || content.trim().length === 0) {
      return res.status(400).json({ message: 'Le commentaire ne peut pas être vide' })
    }

    db.prepare(`
      UPDATE comments SET content = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?
    `).run(content.trim(), commentId)

    res.json({ message: 'Commentaire modifié' })
  } catch (error) {
    console.error('Erreur modification commentaire:', error)
    res.status(500).json({ message: 'Erreur serveur' })
  }
})

// Supprimer un commentaire
router.delete('/:id', authMiddleware, (req, res) => {
  try {
    const comment = db.prepare('SELECT * FROM comments WHERE id = ?').get(req.params.id)
    
    if (!comment) {
      return res.status(404).json({ message: 'Commentaire non trouvé' })
    }

    // L'utilisateur peut supprimer son propre commentaire ou le propriétaire de la piste peut aussi le faire
    const track = db.prepare('SELECT user_id FROM tracks WHERE id = ?').get(comment.track_id)
    
    if (comment.user_id !== req.user.id && track?.user_id !== req.user.id) {
      return res.status(403).json({ message: 'Non autorisé' })
    }

    db.prepare('DELETE FROM comments WHERE id = ?').run(req.params.id)

    res.json({ message: 'Commentaire supprimé' })
  } catch (error) {
    console.error('Erreur suppression commentaire:', error)
    res.status(500).json({ message: 'Erreur serveur' })
  }
})

// Liker/Unliker un commentaire
router.post('/:id/like', authMiddleware, (req, res) => {
  try {
    const commentId = req.params.id
    const userId = req.user.id

    const comment = db.prepare('SELECT id FROM comments WHERE id = ?').get(commentId)
    if (!comment) {
      return res.status(404).json({ message: 'Commentaire non trouvé' })
    }

    const existingLike = db.prepare(
      'SELECT id FROM comment_likes WHERE user_id = ? AND comment_id = ?'
    ).get(userId, commentId)

    if (existingLike) {
      db.prepare('DELETE FROM comment_likes WHERE id = ?').run(existingLike.id)
      db.prepare('UPDATE comments SET likes_count = likes_count - 1 WHERE id = ?').run(commentId)
      res.json({ liked: false })
    } else {
      db.prepare(
        'INSERT INTO comment_likes (user_id, comment_id) VALUES (?, ?)'
      ).run(userId, commentId)
      db.prepare('UPDATE comments SET likes_count = likes_count + 1 WHERE id = ?').run(commentId)
      res.json({ liked: true })
    }
  } catch (error) {
    console.error('Erreur like commentaire:', error)
    res.status(500).json({ message: 'Erreur serveur' })
  }
})

// Helper pour vérifier si un commentaire est liké
function checkCommentLiked(commentId, userId) {
  const like = db.prepare(
    'SELECT id FROM comment_likes WHERE user_id = ? AND comment_id = ?'
  ).get(userId, commentId)
  return Boolean(like)
}

// Helper pour formater un commentaire
function formatComment(comment) {
  return {
    id: comment.id,
    content: comment.content,
    timestampPosition: comment.timestamp_position,
    likesCount: comment.likes_count || 0,
    userId: comment.user_id,
    username: comment.username,
    avatarUrl: comment.avatar_url,
    parentId: comment.parent_id,
    createdAt: comment.created_at,
    updatedAt: comment.updated_at
  }
}

export default router

