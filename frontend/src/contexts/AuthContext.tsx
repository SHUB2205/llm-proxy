'use client'
import { createContext, useContext, useState, useEffect, ReactNode } from 'react'

interface AuthContextType {
  proxyKey: string | null
  userEmail: string | null
  isAuthenticated: boolean
  login: (proxyKey: string, email: string) => void
  logout: () => void
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [proxyKey, setProxyKey] = useState<string | null>(null)
  const [userEmail, setUserEmail] = useState<string | null>(null)
  const [isAuthenticated, setIsAuthenticated] = useState(false)

  useEffect(() => {
    // Load from localStorage on mount
    const savedKey = localStorage.getItem('proxy_key')
    const savedEmail = localStorage.getItem('user_email')
    
    if (savedKey && savedEmail) {
      setProxyKey(savedKey)
      setUserEmail(savedEmail)
      setIsAuthenticated(true)
    }
  }, [])

  const login = (key: string, email: string) => {
    localStorage.setItem('proxy_key', key)
    localStorage.setItem('user_email', email)
    setProxyKey(key)
    setUserEmail(email)
    setIsAuthenticated(true)
  }

  const logout = () => {
    localStorage.removeItem('proxy_key')
    localStorage.removeItem('user_email')
    setProxyKey(null)
    setUserEmail(null)
    setIsAuthenticated(false)
  }

  return (
    <AuthContext.Provider value={{ proxyKey, userEmail, isAuthenticated, login, logout }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}
