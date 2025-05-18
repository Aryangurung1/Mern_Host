import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.jsx'
import './index.css'
import { AuthProvider } from './context/AuthContext'
import { ChatProvider } from './context/ChatContext'
import { WishlistProvider } from './context/WishlistContext'
import { BrowserRouter as Router } from 'react-router-dom'

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <Router>
      <AuthProvider>
        <ChatProvider>
          <WishlistProvider>
            <App />
          </WishlistProvider>
        </ChatProvider>
      </AuthProvider>
    </Router>
  </React.StrictMode>
)