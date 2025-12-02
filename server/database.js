import Database from 'better-sqlite3'
import { mkdirSync, existsSync } from 'fs'
import config from './config.js'

// Créer le dossier data s'il n'existe pas
if (!existsSync(config.database.dataDir)) {
  mkdirSync(config.database.dataDir, { recursive: true })
}

// Créer les dossiers d'upload s'ils n'existent pas
const uploadDirs = [
  config.upload.audioDir,
  config.upload.coversDir,
  config.upload.avatarsDir
]

uploadDirs.forEach(dir => {
  if (!existsSync(dir)) {
    mkdirSync(dir, { recursive: true })
  }
})

const db = new Database(config.database.path)

// Activer les foreign keys et le mode WAL pour de meilleures performances
db.pragma('foreign_keys = ON')
db.pragma('journal_mode = WAL')

export function initDatabase() {
  return new Promise((resolve, reject) => {
    try {
      // Table utilisateurs
      db.exec(`
        CREATE TABLE IF NOT EXISTS users (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          username TEXT UNIQUE NOT NULL,
          email TEXT UNIQUE NOT NULL,
          password TEXT NOT NULL,
          bio TEXT DEFAULT '',
          avatar_url TEXT DEFAULT '',
          banner_url TEXT DEFAULT '',
          website TEXT DEFAULT '',
          location TEXT DEFAULT '',
          is_verified INTEGER DEFAULT 0,
          is_artist INTEGER DEFAULT 0,
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
        )
      `)

      // Table pistes audio
      db.exec(`
        CREATE TABLE IF NOT EXISTS tracks (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          user_id INTEGER NOT NULL,
          title TEXT NOT NULL,
          artist TEXT NOT NULL,
          album TEXT DEFAULT '',
          genre TEXT DEFAULT '',
          description TEXT DEFAULT '',
          duration INTEGER DEFAULT 0,
          audio_url TEXT NOT NULL,
          cover_url TEXT DEFAULT '',
          waveform_data TEXT DEFAULT '',
          plays INTEGER DEFAULT 0,
          downloads INTEGER DEFAULT 0,
          is_public INTEGER DEFAULT 1,
          allow_download INTEGER DEFAULT 0,
          bpm INTEGER DEFAULT 0,
          key TEXT DEFAULT '',
          tags TEXT DEFAULT '',
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
        )
      `)

      // Table likes
      db.exec(`
        CREATE TABLE IF NOT EXISTS likes (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          user_id INTEGER NOT NULL,
          track_id INTEGER NOT NULL,
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
          FOREIGN KEY (track_id) REFERENCES tracks(id) ON DELETE CASCADE,
          UNIQUE(user_id, track_id)
        )
      `)

      // Table historique d'écoute
      db.exec(`
        CREATE TABLE IF NOT EXISTS play_history (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          user_id INTEGER NOT NULL,
          track_id INTEGER NOT NULL,
          played_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          listen_duration INTEGER DEFAULT 0,
          FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
          FOREIGN KEY (track_id) REFERENCES tracks(id) ON DELETE CASCADE
        )
      `)

      // Table playlists
      db.exec(`
        CREATE TABLE IF NOT EXISTS playlists (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          user_id INTEGER NOT NULL,
          title TEXT NOT NULL,
          description TEXT DEFAULT '',
          cover_url TEXT DEFAULT '',
          is_public INTEGER DEFAULT 1,
          is_collaborative INTEGER DEFAULT 0,
          track_count INTEGER DEFAULT 0,
          total_duration INTEGER DEFAULT 0,
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
        )
      `)

      // Table pistes dans les playlists
      db.exec(`
        CREATE TABLE IF NOT EXISTS playlist_tracks (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          playlist_id INTEGER NOT NULL,
          track_id INTEGER NOT NULL,
          position INTEGER NOT NULL,
          added_by INTEGER NOT NULL,
          added_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          FOREIGN KEY (playlist_id) REFERENCES playlists(id) ON DELETE CASCADE,
          FOREIGN KEY (track_id) REFERENCES tracks(id) ON DELETE CASCADE,
          FOREIGN KEY (added_by) REFERENCES users(id) ON DELETE CASCADE,
          UNIQUE(playlist_id, track_id)
        )
      `)

      // Table commentaires
      db.exec(`
        CREATE TABLE IF NOT EXISTS comments (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          user_id INTEGER NOT NULL,
          track_id INTEGER NOT NULL,
          parent_id INTEGER DEFAULT NULL,
          content TEXT NOT NULL,
          timestamp_position INTEGER DEFAULT NULL,
          likes_count INTEGER DEFAULT 0,
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
          FOREIGN KEY (track_id) REFERENCES tracks(id) ON DELETE CASCADE,
          FOREIGN KEY (parent_id) REFERENCES comments(id) ON DELETE CASCADE
        )
      `)

      // Table likes sur commentaires
      db.exec(`
        CREATE TABLE IF NOT EXISTS comment_likes (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          user_id INTEGER NOT NULL,
          comment_id INTEGER NOT NULL,
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
          FOREIGN KEY (comment_id) REFERENCES comments(id) ON DELETE CASCADE,
          UNIQUE(user_id, comment_id)
        )
      `)

      // Table followers
      db.exec(`
        CREATE TABLE IF NOT EXISTS followers (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          follower_id INTEGER NOT NULL,
          following_id INTEGER NOT NULL,
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          FOREIGN KEY (follower_id) REFERENCES users(id) ON DELETE CASCADE,
          FOREIGN KEY (following_id) REFERENCES users(id) ON DELETE CASCADE,
          UNIQUE(follower_id, following_id)
        )
      `)

      // Table notifications
      db.exec(`
        CREATE TABLE IF NOT EXISTS notifications (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          user_id INTEGER NOT NULL,
          type TEXT NOT NULL,
          title TEXT NOT NULL,
          message TEXT DEFAULT '',
          data TEXT DEFAULT '{}',
          is_read INTEGER DEFAULT 0,
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
        )
      `)

      // Table reposts
      db.exec(`
        CREATE TABLE IF NOT EXISTS reposts (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          user_id INTEGER NOT NULL,
          track_id INTEGER NOT NULL,
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
          FOREIGN KEY (track_id) REFERENCES tracks(id) ON DELETE CASCADE,
          UNIQUE(user_id, track_id)
        )
      `)

      // Index pour performances
      db.exec(`
        CREATE INDEX IF NOT EXISTS idx_tracks_user ON tracks(user_id);
        CREATE INDEX IF NOT EXISTS idx_tracks_plays ON tracks(plays DESC);
        CREATE INDEX IF NOT EXISTS idx_tracks_created ON tracks(created_at DESC);
        CREATE INDEX IF NOT EXISTS idx_tracks_genre ON tracks(genre);
        CREATE INDEX IF NOT EXISTS idx_likes_track ON likes(track_id);
        CREATE INDEX IF NOT EXISTS idx_likes_user ON likes(user_id);
        CREATE INDEX IF NOT EXISTS idx_comments_track ON comments(track_id);
        CREATE INDEX IF NOT EXISTS idx_followers_following ON followers(following_id);
        CREATE INDEX IF NOT EXISTS idx_followers_follower ON followers(follower_id);
        CREATE INDEX IF NOT EXISTS idx_playlist_tracks ON playlist_tracks(playlist_id);
        CREATE INDEX IF NOT EXISTS idx_notifications_user ON notifications(user_id);
        CREATE INDEX IF NOT EXISTS idx_notifications_unread ON notifications(user_id, is_read);
        CREATE INDEX IF NOT EXISTS idx_play_history_user ON play_history(user_id);
      `)

      console.log('✅ Base de données initialisée avec succès')
      resolve()
    } catch (error) {
      console.error('❌ Erreur initialisation BDD:', error)
      reject(error)
    }
  })
}

// Helper pour obtenir des statistiques
export function getStats() {
  try {
    const users = db.prepare('SELECT COUNT(*) as count FROM users').get()
    const tracks = db.prepare('SELECT COUNT(*) as count FROM tracks').get()
    const plays = db.prepare('SELECT COALESCE(SUM(plays), 0) as count FROM tracks').get()
    const playlists = db.prepare('SELECT COUNT(*) as count FROM playlists').get()
    
    return {
      users: users?.count || 0,
      tracks: tracks?.count || 0,
      plays: plays?.count || 0,
      playlists: playlists?.count || 0
    }
  } catch (error) {
    console.error('Erreur récupération stats:', error)
    return { users: 0, tracks: 0, plays: 0, playlists: 0 }
  }
}

export default db
