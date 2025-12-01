import Database from 'better-sqlite3'
import { fileURLToPath } from 'url'
import { dirname, join } from 'path'
import { mkdirSync, existsSync } from 'fs'

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)

// Créer le dossier data s'il n'existe pas
const dataDir = join(__dirname, 'data')
if (!existsSync(dataDir)) {
  mkdirSync(dataDir, { recursive: true })
}

const db = new Database(join(dataDir, 'flowmusic.db'))

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
          plays INTEGER DEFAULT 0,
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
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
          FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
          FOREIGN KEY (track_id) REFERENCES tracks(id) ON DELETE CASCADE
        )
      `)

      console.log('✅ Base de données initialisée')
      resolve()
    } catch (error) {
      reject(error)
    }
  })
}

export default db

