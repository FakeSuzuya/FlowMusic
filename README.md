# 🎵 FlowMusic

Une plateforme moderne de streaming et partage musical construite avec React et Node.js.

![FlowMusic](https://img.shields.io/badge/version-2.0.0-ff2d75)
![Node](https://img.shields.io/badge/node-%3E%3D18.0.0-green)
![License](https://img.shields.io/badge/license-MIT-blue)

## ✨ Fonctionnalités

- 🎧 **Streaming audio** - Lecteur audio complet avec visualisation
- 📤 **Upload de pistes** - Glisser-déposer pour uploader vos créations
- 💜 **Système de likes** - Ajoutez des pistes à vos favoris
- 📚 **Playlists** - Créez et gérez vos playlists personnalisées
- 💬 **Commentaires** - Commentez les pistes avec timestamps
- 👥 **Système social** - Suivez vos artistes préférés
- 🔔 **Notifications** - Restez informé des interactions
- 🔍 **Recherche avancée** - Filtres par genre, popularité, etc.
- 📱 **Responsive** - Interface adaptée à tous les écrans

## 🚀 Installation

### Prérequis

- Node.js >= 18.0.0
- npm ou yarn

### Installation des dépendances

```bash
npm install
```

### Développement

Lancez le serveur de développement (frontend + backend) :

```bash
npm run dev
```

Ou séparément :

```bash
# Frontend uniquement
npm run dev:client

# Backend uniquement
npm run dev:server
```

Le frontend sera accessible sur `http://localhost:3000`
Le backend API sur `http://localhost:5000`

## 🏭 Production

### Build et démarrage

```bash
npm run start
```

Cette commande va :
1. Builder le frontend React
2. Démarrer le serveur Node.js en mode production

### Démarrer uniquement le serveur (si déjà buildé)

```bash
npm run start:server
```

## 📁 Structure du projet

```
flowmusic/
├── src/                    # Code source React
│   ├── components/         # Composants réutilisables
│   ├── context/           # Contextes React (Auth, Player, Toast)
│   ├── pages/             # Pages de l'application
│   └── main.jsx           # Point d'entrée
├── server/                 # Backend Node.js/Express
│   ├── routes/            # Routes API
│   ├── middleware/        # Middlewares (auth, etc.)
│   ├── uploads/           # Fichiers uploadés
│   │   ├── audio/        # Fichiers audio
│   │   ├── covers/       # Pochettes
│   │   └── avatars/      # Avatars utilisateurs
│   ├── data/             # Base de données SQLite
│   ├── database.js       # Configuration BDD
│   └── index.js          # Point d'entrée serveur
├── public/                # Fichiers statiques
└── dist/                  # Build de production
```

## 🔧 Configuration

### Variables d'environnement

Créez un fichier `.env` à la racine du projet :

```env
# Configuration FlowMusic

# Port du serveur (défaut: 5000)
PORT=5000

# Mode d'environnement (development ou production)
NODE_ENV=development

# Clé secrète JWT - IMPORTANT: Changez cette valeur en production!
# Générez une clé sécurisée avec: node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"
JWT_SECRET=votre_cle_secrete_super_securisee_a_changer

# Durée de validité du token (défaut: 7d)
JWT_EXPIRES_IN=7d

# CORS - Origines autorisées (défaut: * pour dev, spécifiez l'URL en production)
CORS_ORIGIN=http://localhost:3000

# Taille max des fichiers audio (en bytes, défaut: 50MB)
MAX_FILE_SIZE=52428800

# Taille max des avatars (en bytes, défaut: 5MB)
MAX_AVATAR_SIZE=5242880

# Nombre de rounds pour bcrypt (défaut: 10)
BCRYPT_ROUNDS=10
```

### Configuration de sécurité

Le fichier `server/config.js` centralise toute la configuration. En production :

1. **Définissez toujours `JWT_SECRET`** - Une clé unique et sécurisée
2. **Configurez `CORS_ORIGIN`** - L'URL exacte de votre frontend
3. **Utilisez `NODE_ENV=production`** - Active les optimisations

## 📡 API Endpoints

### Authentification
- `POST /api/auth/register` - Inscription
- `POST /api/auth/login` - Connexion
- `GET /api/auth/me` - Profil utilisateur connecté

### Pistes
- `GET /api/tracks/trending` - Pistes tendances
- `GET /api/tracks/search` - Recherche de pistes
- `POST /api/tracks/upload` - Upload une piste
- `GET /api/tracks/:id/stream` - Streamer une piste
- `POST /api/tracks/:id/like` - Liker/Unliker

### Playlists
- `GET /api/playlists/my` - Mes playlists
- `POST /api/playlists` - Créer une playlist
- `GET /api/playlists/:id` - Détails d'une playlist
- `POST /api/playlists/:id/tracks` - Ajouter une piste

### Commentaires
- `GET /api/comments/track/:id` - Commentaires d'une piste
- `POST /api/comments/track/:id` - Ajouter un commentaire

### Utilisateurs
- `GET /api/users/:id` - Profil public
- `POST /api/users/:id/follow` - Suivre/Ne plus suivre
- `GET /api/users/:id/followers` - Liste des followers

## 🎨 Personnalisation

### Thème

Les couleurs du thème sont définies dans `src/index.css` :

```css
:root {
  --accent-primary: #ff2d75;
  --accent-secondary: #7c3aed;
  --accent-tertiary: #06b6d4;
  /* ... */
}
```

## 🚢 Déploiement

### Hébergement recommandé

- **Serveur** : VPS (DigitalOcean, Vultr, Hetzner)
- **Alternative** : Railway, Render, Fly.io

### Avec PM2 (recommandé)

```bash
# Installer PM2
npm install -g pm2

# Build l'application
npm run build

# Démarrer avec PM2
pm2 start server/index.js --name flowmusic

# Sauvegarder la configuration
pm2 save
pm2 startup
```

### Avec Docker

```dockerfile
FROM node:18-alpine

WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production

COPY . .
RUN npm run build

EXPOSE 5000
CMD ["node", "server/index.js"]
```

## 📝 Licence

MIT © FlowMusic

---

Fait avec ❤️ et beaucoup de 🎵
