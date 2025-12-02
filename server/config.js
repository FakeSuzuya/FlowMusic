import { fileURLToPath } from 'url'
import { dirname, join } from 'path'
import { randomBytes } from 'crypto'

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)

// Générer une clé secrète si non définie
const generateSecret = () => {
  return randomBytes(64).toString('hex')
}

const config = {
  // Environnement
  env: process.env.NODE_ENV || 'development',
  isDev: (process.env.NODE_ENV || 'development') === 'development',
  isProd: process.env.NODE_ENV === 'production',

  // Serveur
  server: {
    port: parseInt(process.env.PORT, 10) || 5000,
    host: process.env.HOST || '0.0.0.0'
  },

  // Base de données
  database: {
    path: join(__dirname, 'data', 'flowmusic.db'),
    dataDir: join(__dirname, 'data')
  },

  // JWT
  jwt: {
    secret: process.env.JWT_SECRET || 'flowmusic_dev_secret_change_in_production_' + generateSecret().slice(0, 32),
    expiresIn: process.env.JWT_EXPIRES_IN || '7d'
  },

  // Upload
  upload: {
    maxFileSize: parseInt(process.env.MAX_FILE_SIZE, 10) || 50 * 1024 * 1024, // 50MB
    maxAvatarSize: parseInt(process.env.MAX_AVATAR_SIZE, 10) || 5 * 1024 * 1024, // 5MB
    allowedAudioTypes: ['audio/mpeg', 'audio/wav', 'audio/flac', 'audio/ogg', 'audio/mp4', 'audio/x-m4a'],
    allowedImageTypes: ['image/jpeg', 'image/png', 'image/webp', 'image/gif'],
    audioDir: join(__dirname, 'uploads', 'audio'),
    coversDir: join(__dirname, 'uploads', 'covers'),
    avatarsDir: join(__dirname, 'uploads', 'avatars')
  },

  // CORS
  cors: {
    origin: process.env.CORS_ORIGIN || '*',
    credentials: true
  },

  // Rate limiting
  rateLimit: {
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: parseInt(process.env.RATE_LIMIT_MAX, 10) || 100 // requêtes par fenêtre
  },

  // Sécurité
  security: {
    bcryptRounds: parseInt(process.env.BCRYPT_ROUNDS, 10) || 10,
    passwordMinLength: 8,
    usernameMinLength: 3,
    usernameMaxLength: 30
  }
}

// Validation de la configuration en production
if (config.isProd) {
  if (!process.env.JWT_SECRET) {
    console.warn('⚠️  ATTENTION: JWT_SECRET non défini en production!')
    console.warn('   Définissez JWT_SECRET dans vos variables d\'environnement.')
  }
}

export default config

