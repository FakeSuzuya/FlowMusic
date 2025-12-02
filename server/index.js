import express from 'express'
import cors from 'cors'
import { fileURLToPath } from 'url'
import { dirname, join } from 'path'
import config from './config.js'
import authRoutes from './routes/auth.js'
import trackRoutes from './routes/tracks.js'
import userRoutes from './routes/users.js'
import playlistRoutes from './routes/playlists.js'
import commentRoutes from './routes/comments.js'
import { initDatabase, getStats } from './database.js'

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)

const app = express()

// Middleware de sécurité basique
app.disable('x-powered-by')

// CORS
app.use(cors({
  origin: config.cors.origin,
  credentials: config.cors.credentials,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}))

// Parsers
app.use(express.json({ limit: '10mb' }))
app.use(express.urlencoded({ extended: true, limit: '10mb' }))

// Servir les fichiers statiques (uploads)
app.use('/uploads', express.static(join(__dirname, 'uploads'), {
  maxAge: config.isProd ? '7d' : 0,
  etag: true,
  lastModified: true
}))

// Logger simple pour le développement
if (config.isDev) {
  app.use((req, res, next) => {
    const start = Date.now()
    res.on('finish', () => {
      const duration = Date.now() - start
      const color = res.statusCode >= 400 ? '\x1b[31m' : '\x1b[32m'
      console.log(`${color}${req.method}\x1b[0m ${req.path} - ${res.statusCode} (${duration}ms)`)
    })
    next()
  })
}

// Routes API
app.use('/api/auth', authRoutes)
app.use('/api/tracks', trackRoutes)
app.use('/api/users', userRoutes)
app.use('/api/playlists', playlistRoutes)
app.use('/api/comments', commentRoutes)

// Route de santé
app.get('/api/health', (req, res) => {
  res.json({ 
    status: 'ok', 
    message: 'FlowMusic API is running',
    version: '2.0.0',
    env: config.env,
    uptime: Math.floor(process.uptime())
  })
})

// Route pour les statistiques publiques
app.get('/api/stats', (req, res) => {
  try {
    const stats = getStats()
    res.json({ stats })
  } catch (error) {
    console.error('Erreur stats:', error)
    res.json({ stats: { users: 0, tracks: 0, plays: 0, playlists: 0 } })
  }
})

// Servir le frontend en production
if (config.isProd) {
  const distPath = join(__dirname, '..', 'dist')
  app.use(express.static(distPath, {
    maxAge: '1y',
    etag: true
  }))
  
  // SPA fallback - toutes les routes non-API renvoient index.html
  app.get('*', (req, res, next) => {
    if (req.path.startsWith('/api')) {
      return next()
    }
    res.sendFile(join(distPath, 'index.html'))
  })
}

// Gestion des erreurs 404 API
app.use('/api/*', (req, res) => {
  res.status(404).json({ message: 'Endpoint non trouvé' })
})

// Gestion des erreurs globale
app.use((err, req, res, next) => {
  console.error('❌ Erreur:', err.message)
  
  if (config.isDev) {
    console.error(err.stack)
  }
  
  // Erreurs de validation Multer
  if (err.code === 'LIMIT_FILE_SIZE') {
    return res.status(413).json({ message: 'Fichier trop volumineux' })
  }
  
  if (err.code === 'LIMIT_UNEXPECTED_FILE') {
    return res.status(400).json({ message: 'Type de fichier non accepté' })
  }
  
  res.status(err.status || 500).json({ 
    message: err.message || 'Erreur serveur interne',
    ...(config.isDev && { stack: err.stack })
  })
})

// Initialiser la base de données et démarrer le serveur
initDatabase()
  .then(() => {
    app.listen(config.server.port, config.server.host, () => {
      console.log('')
      console.log('🎵 ═══════════════════════════════════════════')
      console.log(`🎵  FlowMusic API v2.0`)
      console.log(`🎵  Mode: ${config.env}`)
      console.log(`🎵  Running on http://localhost:${config.server.port}`)
      console.log('🎵 ═══════════════════════════════════════════')
      console.log('')
    })
  })
  .catch((err) => {
    console.error('❌ Erreur initialisation:', err)
    process.exit(1)
  })

// Gérer les arrêts propres
const shutdown = () => {
  console.log('\n🛑 Arrêt du serveur...')
  process.exit(0)
}

process.on('SIGINT', shutdown)
process.on('SIGTERM', shutdown)
process.on('uncaughtException', (err) => {
  console.error('❌ Uncaught Exception:', err)
  process.exit(1)
})
process.on('unhandledRejection', (reason, promise) => {
  console.error('❌ Unhandled Rejection at:', promise, 'reason:', reason)
})
