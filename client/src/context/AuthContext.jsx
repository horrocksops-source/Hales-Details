import React, { createContext, useContext, useState } from 'react'

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [user, setUser] = useState(() => {
    try {
      const stored = localStorage.getItem('gd_user')
      return stored ? JSON.parse(stored) : null
    } catch {
      return null
    }
  })
  const [token, setToken] = useState(() => localStorage.getItem('gd_token') || null)

  function login(newToken, newUser) {
    localStorage.setItem('gd_token', newToken)
    localStorage.setItem('gd_user', JSON.stringify(newUser))
    setToken(newToken)
    setUser(newUser)
  }

  function logout() {
    localStorage.removeItem('gd_token')
    localStorage.removeItem('gd_user')
    setToken(null)
    setUser(null)
  }

  async function apiFetch(path, options = {}) {
    const headers = {
      'Content-Type': 'application/json',
      ...(options.headers || {}),
    }
    if (token) {
      headers['Authorization'] = `Bearer ${token}`
    }
    const base = import.meta.env.VITE_API_URL || ''
    const res = await fetch(`${base}/api${path}`, {
      ...options,
      headers,
    })
    const data = await res.json()
    if (!res.ok) {
      throw new Error(data.error || data.message || 'Request failed')
    }
    return data
  }

  return (
    <AuthContext.Provider value={{ user, token, login, logout, apiFetch }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used within AuthProvider')
  return ctx
}
