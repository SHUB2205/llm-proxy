'use client'
import './globals.css'
import { Inter } from 'next/font/google'
import Link from 'next/link'
import { usePathname } from 'next/navigation'

const inter = Inter({ subsets: ['latin'] })

export default function RootLayoutClient({ children }: { children: React.ReactNode }) {
  return (
    <div className={`${inter.className} bg-[#0f172a] text-white flex min-h-screen`}>
      <Sidebar />
      <main className="ml-64 flex-1 bg-[#0f172a]">{children}</main>
    </div>
  )
}

function Sidebar() {
  const pathname = usePathname()
  const links = [
    { name: 'Dashboard', href: '/' },
    { name: 'All Requests', href: '/runs' },
  ]

  return (
    <aside className="fixed inset-y-0 left-0 w-64 bg-slate-800/70 border-r border-slate-700 backdrop-blur-xl flex flex-col shadow-[0_0_15px_rgba(79,70,229,0.15)]">
      {/* Logo + Header */}
      <div className="p-6 border-b border-slate-700">
        <h1 className="text-2xl font-bold tracking-tight text-indigo-400">LLM Proxy</h1>
        <p className="text-sm text-slate-400 mt-1">Analytics & Insights</p>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-4 py-6 space-y-1">
        {links.map((link) => {
          const isActive = pathname === link.href
          return (
            <Link
              key={link.href}
              href={link.href}
              className={`block px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${
                isActive
                  ? 'bg-gradient-to-r from-indigo-500/20 to-purple-500/20 border border-indigo-500/50 text-white shadow-[0_0_10px_rgba(99,102,241,0.4)]'
                  : 'text-slate-300 hover:text-indigo-300 hover:bg-slate-700/40'
              }`}
            >
              {link.name}
            </Link>
          )
        })}
      </nav>

      {/* Footer */}
      <div className="px-6 py-4 border-t border-slate-700 text-xs text-slate-400">
        <div className="flex items-center justify-between">
          <span>v1.0</span>
          <span className="text-indigo-400 font-medium">LLM Proxy</span>
        </div>
      </div>
    </aside>
  )
}
