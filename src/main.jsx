import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.jsx'

// StrictMode causes double renders in dev (intentional — helps catch side effects).
// Remove it if you see API calls firing twice during development.
ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
)
