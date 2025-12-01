import express from 'express'
import cors from 'cors'
import { fileURLToPath } from 'url'
import { dirname, join } from 'path'
import authRoutes from './routes/auth.js'
import trackRoutes from './routes/tracks.js'
import userRoutes from './routes/users.js'
import { initDatabase } from './database.js'

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)

const app = express()
const PORT = process.env.PORT || 5000

// Middleware
app.use(cors())
app.use(express.json())
app.use(express.urlencoded({ extended: true }))

// Servir les fichiers statiques (uploads)
app.use('/uploads', express.static(join(__dirname, 'uploads')))

// Routes API
app.use('/api/auth', authRoutes)
app.use('/api/tracks', trackRoutes)
app.use('/api/users', userRoutes)

// Route de santé
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', message: 'FlowMusic API is running' })
})

// Gestion des erreurs
app.use((err, req, res, next) => {
  console.error(err.stack)
  res.status(500).json({ message: 'Erreur serveur interne' })
})

// Initialiser la base de données et démarrer le serveur
initDatabase()
  .then(() => {
    app.listen(PORT, () => {
      console.log(`🎵 FlowMusic API running on http://localhost:${PORT}`)
    })
  })
  .catch((err) => {
    console.error('Erreur initialisation base de données:', err)
    process.exit(1)
  })

