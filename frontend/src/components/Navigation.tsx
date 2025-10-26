'use client'
import Link from 'next/link'
import { usePathname } from 'next/navigation'

export default function Navigation() {
  const pathname = usePathname()
  
  const links = [
    { href: '/', label: 'Dashboard', icon: '📊' },
    { href: '/finops', label: 'FinOps', icon: '💰' },
    { href: '/flags', label: 'Flags', icon: '🚨' },
    { href: '/optimizer', label: 'Optimizer', icon: '🎯' },
    { href: '/runs', label: 'Requests', icon: '📝' },
    { href: '/settings', label: 'Settings', icon: '⚙️' },
  ]
  
  return (
    <nav className="fixed top-0 left-0 right-0 z-50 bg-slate-900/95 backdrop-blur-xl border-b border-slate-700">
      <div className="max-w-7xl mx-auto px-4">
        <div className="flex items-center justify-between h-16">
          <Link href="/" className="flex items-center gap-2 text-xl font-bold text-white">
            <span>🎯</span>
            <span>LLM Observability</span>
          </Link>
          
          <div className="flex items-center gap-1">
            {links.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className={`px-4 py-2 rounded-lg transition-colors ${
                  pathname === link.href
                    ? 'bg-indigo-600 text-white'
                    : 'text-gray-300 hover:bg-slate-800 hover:text-white'
                }`}
              >
                <span className="mr-2">{link.icon}</span>
                {link.label}
              </Link>
            ))}
          </div>
        </div>
      </div>
    </nav>
  )
}
