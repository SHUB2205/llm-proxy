'use client'
import './globals.css'
import { usePathname } from 'next/navigation'
import Link from 'next/link'
import Image from 'next/image'
import { Inter } from 'next/font/google'
import { AuthProvider } from '@/contexts/AuthContext'

const inter = Inter({ subsets: ['latin'] })

export default function RootLayoutClient({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  const isLandingPage = pathname === '/landing'
  
  return (
    <AuthProvider>
      <div className={`${inter.className} bg-[#0f172a] text-white flex min-h-screen`}>
        {!isLandingPage && <Sidebar />}
        <main className={`${!isLandingPage ? 'ml-64' : ''} flex-1 bg-[#0f172a]`}>{children}</main>
      </div>
    </AuthProvider>
  )
}

function Sidebar() {
  const pathname = usePathname()
  const { isAuthenticated, userEmail, logout } = require('@/contexts/AuthContext').useAuth()
  
  const links = [
    { name: 'Dashboard', href: '/', icon: '' },
    { name: 'FinOps', href: '/finops', icon: '' },
    { name: 'Drift Detection', href: '/drift', icon: '' },
    { name: 'Prompt Optimizer', href: '/optimizer', icon: '' },
    { name: 'Safety Flags', href: '/flags', icon: '' },
    { name: 'All Requests', href: '/runs', icon: '' },
    { name: 'Settings', href: '/settings', icon: '' },
  ]

  return (
    <aside className="fixed inset-y-0 left-0 w-64 bg-slate-800/70 border-r border-slate-700 backdrop-blur-xl flex flex-col shadow-[0_0_15px_rgba(79,70,229,0.15)]">
      {/* Logo + Header */}
      <div className="p-6 border-b border-slate-700">
        <div className="flex flex-col items-center mb-3">
          <Image 
            src="/logo_llm_proxy-removebg-preview.png" 
            alt="LLM Proxy Logo" 
            width={120} 
            height={80}
            className="object-contain mb-2"
          />
          <h1 className="text-2xl font-bold tracking-tight text-indigo-400">ModelSight</h1>
        </div>
        <p className="text-sm text-slate-400 mt-1 text-center">Analytics & Insights</p>
        {isAuthenticated && userEmail && (
          <div className="mt-3 pt-3 border-t border-slate-600">
            <p className="text-xs text-gray-400 truncate text-center">{userEmail}</p>
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
              className={`flex items-center gap-3 px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${
                isActive
                  ? 'bg-gradient-to-r from-indigo-500/20 to-purple-500/20 border border-indigo-500/50 text-white shadow-[0_0_10px_rgba(99,102,241,0.4)]'
                  : 'text-slate-300 hover:text-indigo-300 hover:bg-slate-700/40'
              }`}
            >
              <span className="text-lg">{link.icon}</span>
              {link.name}
            </Link>
          )
        })}
      </nav>

      {/* Footer */}
      <div className="px-6 py-4 border-t border-slate-700 text-xs text-slate-400">
        <div className="flex items-center justify-between">
          <span>v1.0</span>
          <span className="text-indigo-400 font-medium">ModelSight</span>
        </div>
      </div>
    </aside>
  )
}
