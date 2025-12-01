import { BrowserRouter as Router, Routes, Route } from 'react-router-dom'
import { AuthProvider } from './context/AuthContext'
import { PlayerProvider } from './context/PlayerContext'
import Navbar from './components/Navbar'
import Player from './components/Player'
import Home from './pages/Home'
import Login from './pages/Login'
import Register from './pages/Register'
import Upload from './pages/Upload'
import Library from './pages/Library'
import Profile from './pages/Profile'
import Explore from './pages/Explore'
import './App.css'

function App() {
  return (
    <AuthProvider>
      <PlayerProvider>
        <Router>
          <div className="app">
            <Navbar />
            <main className="main-content">
              <Routes>
                <Route path="/" element={<Home />} />
                <Route path="/login" element={<Login />} />
                <Route path="/register" element={<Register />} />
                <Route path="/upload" element={<Upload />} />
                <Route path="/library" element={<Library />} />
                <Route path="/profile" element={<Profile />} />
                <Route path="/explore" element={<Explore />} />
              </Routes>
            </main>
            <Player />
          </div>
        </Router>
      </PlayerProvider>
    </AuthProvider>
  )
}

export default App

