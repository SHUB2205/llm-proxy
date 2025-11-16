'use client'
import { createContext, useContext, useState, useEffect, ReactNode } from 'react'

interface AuthContextType {
  proxyKey: string | null
  userEmail: string | null
  companyName: string | null
  isAuthenticated: boolean
  login: (proxyKey: string, email: string, companyName?: string) => void
  logout: () => void
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [proxyKey, setProxyKey] = useState<string | null>(null)
  const [userEmail, setUserEmail] = useState<string | null>(null)
  const [companyName, setCompanyName] = useState<string | null>(null)
  const [isAuthenticated, setIsAuthenticated] = useState(false)

  useEffect(() => {
    // Load from localStorage on mount
    const savedKey = localStorage.getItem('proxy_key')
    const savedEmail = localStorage.getItem('user_email')
    const savedCompany = localStorage.getItem('company_name')
    
    if (savedKey && savedEmail) {
      setProxyKey(savedKey)
      setUserEmail(savedEmail)
      setCompanyName(savedCompany)
      setIsAuthenticated(true)
    }
  }, [])

  const login = (key: string, email: string, companyName?: string) => {
    localStorage.setItem('proxy_key', key)
    localStorage.setItem('user_email', email)
    if (companyName) {
      localStorage.setItem('company_name', companyName)
      setCompanyName(companyName)
    }
    setProxyKey(key)
    setUserEmail(email)
    setIsAuthenticated(true)
  }

  const logout = () => {
    localStorage.removeItem('proxy_key')
    localStorage.removeItem('user_email')
    localStorage.removeItem('company_name')
    setProxyKey(null)
    setUserEmail(null)
    setCompanyName(null)
    setIsAuthenticated(false)
  }

  return (
    <AuthContext.Provider value={{ proxyKey, userEmail, companyName, isAuthenticated, login, logout }}>
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
