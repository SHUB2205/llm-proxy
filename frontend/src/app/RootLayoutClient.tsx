'use client'
import './globals.css'
import { usePathname } from 'next/navigation'
import Link from 'next/link'
import Image from 'next/image'
import { Inter } from 'next/font/google'
import { AuthProvider } from '@/contexts/AuthContext'
import { ThemeProvider, useTheme } from '@/contexts/ThemeContext'

const inter = Inter({ subsets: ['latin'] })

export default function RootLayoutClient({ children }: { children: React.ReactNode }) {
  return (
    <AuthProvider>
      <ThemeProvider>
        <LayoutContent>{children}</LayoutContent>
      </ThemeProvider>
    </AuthProvider>
  )
}

function LayoutContent({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  const isLandingPage = pathname === '/' || pathname === '/landing'
  const { theme } = useTheme()
  
  return (
    <div className={`${inter.className} ${theme === 'light' ? 'bg-gray-50 text-slate-900' : 'bg-slate-950 text-gray-100'} flex min-h-screen`}>
      {!isLandingPage && <Sidebar />}
      <main className={`${!isLandingPage ? 'ml-64' : ''} flex-1 ${theme === 'light' ? 'bg-gray-50' : 'bg-slate-950'}`}>{children}</main>
    </div>
  )
}

function Sidebar() {
  const pathname = usePathname()
  const { isAuthenticated, userEmail, logout } = require('@/contexts/AuthContext').useAuth()
  const { theme, toggleTheme } = useTheme()
  
  const links = [
    { name: 'Dashboard', href: '/dashboard', icon: '' },
    { name: 'FinOps', href: '/finops', icon: '' },
    { name: 'Drift Detection', href: '/drift', icon: '' },
    { name: 'Prompt Optimizer', href: '/optimizer', icon: '' },
    { name: 'Safety Flags', href: '/flags', icon: '' },
    { name: 'All Requests', href: '/runs', icon: '' },
    { name: 'Settings', href: '/settings', icon: '' },
  ]

  return (
    <aside className={`fixed inset-y-0 left-0 w-64 ${
      theme === 'light' 
        ? 'bg-white border-r border-gray-200 shadow-sm' 
        : 'bg-slate-900/50 border-r border-white/10 backdrop-blur-xl'
    } flex flex-col`}>
      {/* Logo + Header */}
      <div className={`p-6 border-b ${theme === 'light' ? 'border-gray-200' : 'border-white/10'}`}>
        <div className="flex flex-col items-center mb-3">
          <div className="flex items-center gap-2 mb-2">
            <div className="w-8 h-8 rounded-lg bg-blue-600 flex items-center justify-center font-bold text-white text-sm">M</div>
            <span className={`text-xl font-bold tracking-tight ${theme === 'light' ? 'text-slate-900' : 'text-white'}`}>
              ModelSight
            </span>
          </div>
        </div>
        <p className={`text-sm text-center ${theme === 'light' ? 'text-gray-500' : 'text-gray-400'}`}>
          Analytics & Insights
        </p>
        {isAuthenticated && userEmail && (
          <div className={`mt-3 pt-3 border-t ${theme === 'light' ? 'border-gray-200' : 'border-white/10'}`}>
            <p className={`text-xs truncate text-center ${theme === 'light' ? 'text-gray-500' : 'text-gray-400'}`}>
              {userEmail}
            </p>
          </div>
        )}
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-4 py-6 space-y-1">
        {links.map((link) => {
          const isActive = pathname === link.href
          return (
            <Link
              key={link.href}
              href={link.href}
              className={`flex items-center gap-3 px-4 py-2.5 rounded-xl text-sm font-medium transition-all duration-200 ${
                theme === 'light'
                  ? isActive
                    ? 'bg-slate-900 text-white shadow-sm'
                    : 'text-gray-600 hover:bg-gray-100 hover:text-slate-900'
                  : isActive
                    ? 'bg-white/10 text-white shadow-sm border border-white/5'
                    : 'text-gray-400 hover:text-white hover:bg-white/5'
              }`}
            >
              {link.icon && <span className="text-lg">{link.icon}</span>}
              {link.name}
            </Link>
          )
        })}
      </nav>

      {/* Theme Toggle Button */}
      <div className="px-4 py-3">
        <button
          onClick={toggleTheme}
          className={`w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium transition-all duration-200 ${
            theme === 'light'
              ? 'bg-gray-100 text-gray-600 hover:bg-gray-200 hover:text-slate-900'
              : 'bg-white/5 text-gray-400 hover:bg-white/10 hover:text-white'
          }`}
          aria-label="Toggle theme"
        >
          {theme === 'light' ? (
            <>
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" />
              </svg>
              Dark Mode
            </>
          ) : (
            <>
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" />
              </svg>
              Light Mode
            </>
          )}
        </button>
      </div>

      {/* Footer */}
      <div className={`px-6 py-4 border-t text-xs ${
        theme === 'light' 
          ? 'border-gray-200 text-gray-500' 
          : 'border-white/10 text-gray-500'
      }`}>
        <div className="flex items-center justify-between">
          <span>v1.0</span>
          <span className={`font-medium ${theme === 'light' ? 'text-slate-900' : 'text-gray-300'}`}>
            ModelSight
          </span>
        </div>
      </div>
    </aside>
  )
}
