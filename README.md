# 🎵 FlowMusic

Une plateforme de streaming musical communautaire moderne, inspirée de Deezer et SoundCloud.

![FlowMusic](https://img.shields.io/badge/FlowMusic-v1.0.0-ff3366)
![React](https://img.shields.io/badge/React-18.2-61dafb)
![Node.js](https://img.shields.io/badge/Node.js-18+-339933)

## ✨ Fonctionnalités

- 🔐 **Authentification complète** - Inscription, connexion avec JWT
- 🎵 **Upload de musique** - Partagez vos créations avec la communauté
- 🎧 **Lecteur audio** - Lecteur moderne avec contrôles avancés
- ❤️ **Système de likes** - Ajoutez des titres à vos favoris
- 🔍 **Recherche & Filtres** - Explorez par genre, tendances, nouveautés
- 👤 **Profils utilisateurs** - Gérez votre bibliothèque musicale
- 📱 **Design responsive** - Optimisé pour tous les écrans

## 🚀 Installation

### Prérequis

- Node.js 18+
- npm ou yarn

### Installation des dépendances

```bash
cd flowmusic
npm install
```

### Démarrage en développement

**Terminal 1 - Backend :**
```bash
npm run server
```

**Terminal 2 - Frontend :**
```bash
npm run dev
```

L'application sera accessible sur :
- Frontend : http://localhost:3000
- Backend API : http://localhost:5000

## 📁 Structure du projet

```
flowmusic/
├── public/                 # Fichiers statiques
├── server/                 # Backend Node.js/Express
│   ├── data/              # Base de données SQLite
│   ├── uploads/           # Fichiers uploadés
│   │   ├── audio/         # Fichiers audio
│   │   └── covers/        # Pochettes
│   ├── middleware/        # Middlewares (auth, etc.)
│   ├── routes/            # Routes API
│   ├── database.js        # Configuration BDD
│   └── index.js           # Point d'entrée serveur
├── src/                    # Frontend React
│   ├── components/        # Composants réutilisables
│   ├── context/           # Contexts React (Auth, Player)
│   ├── pages/             # Pages de l'application
│   ├── App.jsx            # Composant racine
│   └── main.jsx           # Point d'entrée
├── package.json
└── vite.config.js
```

## 🔌 API Endpoints

### Authentification
- `POST /api/auth/register` - Inscription
- `POST /api/auth/login` - Connexion
- `GET /api/auth/me` - Utilisateur actuel

### Pistes
- `POST /api/tracks/upload` - Upload une piste
- `GET /api/tracks/trending` - Pistes tendances
- `GET /api/tracks/search` - Rechercher
- `GET /api/tracks/my-uploads` - Mes uploads
- `GET /api/tracks/liked` - Mes favoris
- `GET /api/tracks/:id/stream` - Streamer
- `POST /api/tracks/:id/like` - Liker/Unliker

### Utilisateurs
- `GET /api/users/profile` - Mon profil
- `PUT /api/users/profile` - Modifier profil
- `GET /api/users/:id` - Profil public

## 🎨 Technologies

### Frontend
- **React 18** - Framework UI
- **React Router** - Navigation
- **Vite** - Build tool
- **Lucide React** - Icônes
- **CSS Variables** - Theming

### Backend
- **Express** - Framework web
- **SQLite** (better-sqlite3) - Base de données
- **JWT** - Authentification
- **Multer** - Upload de fichiers
- **bcryptjs** - Hash des mots de passe

## 🌈 Personnalisation

Les variables CSS sont dans `src/index.css` :

```css
:root {
  --accent-primary: #ff3366;
  --accent-secondary: #ff6b35;
  --accent-tertiary: #f7c531;
  --bg-primary: #0a0a0f;
  /* ... */
}
```

## 📝 Licence

MIT © 2024 FlowMusic

---

Fait avec ❤️ et beaucoup de 🎵
