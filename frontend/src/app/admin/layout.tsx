'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { useRouter, usePathname } from 'next/navigation'
import { useAuthStore } from '@/store/auth'

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, user } = useAuthStore()
  const [isSidebarOpen, setIsSidebarOpen] = useState(false)
  const router = useRouter()
  const pathname = usePathname()

  useEffect(() => {
    if (!isAuthenticated) {
      router.push('/login')
      return
    }
    const role = (user as any)?.role?.toLowerCase()
    if (role !== 'admin') {
      router.push('/dashboard')
    }
  }, [isAuthenticated, user, router])

  const navItems = [
    { href: '/admin', label: 'Dashboard', icon: '📊' },
    { href: '/admin/claims', label: 'Claims', icon: '📋' },
    { href: '/admin/policies', label: 'Policies', icon: '📄' },
    { href: '/admin/users', label: 'Users', icon: '👥' },
  ]

  // Close sidebar on navigation (mobile)
  useEffect(() => {
    setIsSidebarOpen(false)
  }, [pathname])

  return (
    <div className="flex flex-col lg:flex-row gap-8">
      {/* Mobile Toggle Bar */}
      <div className="lg:hidden flex items-center justify-between bg-primary text-white p-4 rounded-xl shadow-md mb-2">
        <span className="font-black tracking-tighter text-lg">ADMIN AREA</span>
        <button 
          onClick={() => setIsSidebarOpen(!isSidebarOpen)}
          className="p-2 hover:bg-white/10 rounded-lg transition-colors"
        >
          {isSidebarOpen ? (
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" /></svg>
          ) : (
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 12h16m-7 6h7" /></svg>
          )}
        </button>
      </div>

      {/* Sidebar Overlay (Mobile) */}
      {isSidebarOpen && (
        <div 
          className="lg:hidden fixed inset-0 bg-black/60 backdrop-blur-sm z-[110]"
          onClick={() => setIsSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside className={`
        fixed lg:static inset-y-0 left-0 z-[120]
        w-64 lg:w-60 shrink-0
        transform ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
        transition-transform duration-300 ease-in-out
        bg-primary lg:bg-transparent
      `}>
        <div className="bg-primary text-white lg:rounded-2xl p-6 h-full lg:h-auto lg:sticky lg:top-4 shadow-2xl lg:shadow-none">
          <div className="flex items-center justify-between mb-8">
            <div>
                <p className="text-[10px] uppercase font-black tracking-[0.2em] text-gray-500 mb-1">Navigation</p>
                <h2 className="text-xl font-black tracking-tighter">Control Center</h2>
            </div>
          </div>
          
          <nav className="space-y-2">
            {navItems.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className={`flex items-center gap-3 px-4 py-3 rounded-xl font-bold text-sm transition-all ${
                  pathname === item.href
                    ? 'bg-secondary text-white shadow-lg shadow-secondary/20'
                    : 'text-gray-400 hover:bg-white/5 hover:text-white'
                }`}
              >
                <span className="text-lg">{item.icon}</span>
                {item.label}
              </Link>
            ))}
          </nav>

          <div className="mt-12 pt-6 border-t border-white/5">
            <Link 
              href="/dashboard" 
              className="flex items-center gap-2 text-xs font-bold text-gray-500 hover:text-white transition-colors group"
            >
              <span className="group-hover:-translate-x-1 transition-transform">←</span>
              Terminal Dashboard
            </Link>
          </div>
        </div>
      </aside>

      {/* Main content */}
      <main className="flex-1 min-w-0 pb-12">
        <div className="bg-white/40 backdrop-blur-md rounded-3xl p-4 lg:p-0">
          {children}
        </div>
      </main>
    </div>
  )
}
