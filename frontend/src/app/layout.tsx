'use client'

import '@/styles/globals.css'
import Link from 'next/link'
import { useAuthStore } from '@/store/auth'
import { useRouter, usePathname } from 'next/navigation'
import { useState, useEffect } from 'react'

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const { isAuthenticated, logout, user } = useAuthStore()
  const isAdmin = (user as any)?.role?.toLowerCase() === 'admin'
  const router = useRouter()
  const pathname = usePathname()
  const [isMenuOpen, setIsMenuOpen] = useState(false)

  const handleLogout = () => {
    logout()
    router.push('/')
  }

  // Close menu on path change
  useEffect(() => {
    setIsMenuOpen(false)
  }, [pathname])

  const navLinks = [
    { href: '/dashboard', label: 'Dashboard' },
    { href: '/policies', label: 'Policies' },
    { href: '/claims', label: 'Claims' },
    { href: '/equipment', label: 'Equipment' },
  ]

  return (
    <html lang="en">
      <body className="bg-gray-50 min-h-screen flex flex-col">
        {/* Navigation */}
        <nav className="bg-primary text-white shadow-xl sticky top-0 z-[200]">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex justify-between h-20">
              <div className="flex items-center">
                <Link href="/" className="text-3xl font-black tracking-tighter flex items-center gap-2 hover:opacity-90 transition-opacity">
                  <span className="text-4xl">🏌️</span>
                  <span className="bg-clip-text text-transparent bg-gradient-to-r from-white to-gray-400">GOLFINS</span>
                </Link>
              </div>

              {/* Desktop Menu */}
              <div className="hidden lg:flex items-center gap-8">
                {isAuthenticated ? (
                  <>
                    {navLinks.map(link => (
                      <Link 
                        key={link.href} 
                        href={link.href} 
                        className={`text-sm font-bold tracking-tight transition-colors ${pathname === link.href ? 'text-secondary font-black' : 'text-gray-300 hover:text-white'}`}
                      >
                        {link.label}
                      </Link>
                    ))}
                    {isAdmin && (
                      <Link href="/admin" className="bg-purple-600 text-white px-4 py-2 rounded-xl hover:bg-purple-700 text-xs font-black uppercase tracking-widest shadow-lg shadow-purple-500/20 transition-all hover:-translate-y-0.5">
                        Admin Portal
                      </Link>
                    )}
                    
                    <div className="w-px h-6 bg-white/10 mx-2" />

                    <div className="relative group">
                      <button className="flex items-center gap-3 bg-white/5 hover:bg-white/10 px-4 py-2 rounded-2xl transition-all border border-white/10">
                        <div className="w-8 h-8 rounded-full bg-secondary flex items-center justify-center text-white font-black text-sm shadow-inner">
                          {user?.first_name?.[0] || user?.email?.[0]?.toUpperCase() || 'U'}
                        </div>
                        <span className="font-bold text-sm">
                          {user?.first_name}
                        </span>
                        <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
                        </svg>
                      </button>

                      {/* Dropdown Menu */}
                      <div className="absolute right-0 top-full pt-2 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 z-[100]">
                        <div className="bg-white rounded-2xl shadow-[0_20px_50px_rgba(0,0,0,0.2)] border border-gray-100 py-3 w-56 overflow-hidden">
                          <p className="px-5 py-2 text-[10px] font-black text-gray-400 uppercase tracking-widest">Account Details</p>
                          <Link href="/profile" className="flex items-center gap-3 px-5 py-3 text-sm font-bold text-gray-700 hover:bg-gray-50 hover:text-secondary transition-colors">
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" /></svg>
                            View Profile
                          </Link>
                          <div className="h-px bg-gray-100 mx-4 my-2" />
                          <button onClick={handleLogout} className="w-full flex items-center gap-3 px-5 py-3 text-sm font-bold text-red-500 hover:bg-red-50 transition-colors text-left">
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" /></svg>
                            End Session
                          </button>
                        </div>
                      </div>
                    </div>
                  </>
                ) : (
                  <div className="flex items-center gap-4">
                    <Link href="/login" className="text-sm font-bold hover:text-secondary transition-colors">Login</Link>
                    <Link href="/register" className="bg-secondary text-white px-6 py-2.5 rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-emerald-700 shadow-lg shadow-emerald-500/20 transition-all hover:-translate-y-0.5">
                      Join Guild
                    </Link>
                  </div>
                )}
              </div>

              {/* Mobile Right Section */}
              <div className="lg:hidden flex items-center gap-3">
                {isAuthenticated && (
                  <div className="w-10 h-10 rounded-full bg-secondary flex items-center justify-center text-white font-black shadow-lg">
                    {user?.first_name?.[0] || 'U'}
                  </div>
                )}
                <button 
                  onClick={() => setIsMenuOpen(!isMenuOpen)}
                  className="p-2 bg-white/10 rounded-xl hover:bg-white/20 transition-colors"
                >
                  {isMenuOpen ? (
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" /></svg>
                  ) : (
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 12h16m-7 6h7" /></svg>
                  )}
                </button>
              </div>
            </div>
          </div>

          {/* Mobile Side Menu */}
          <div className={`lg:hidden fixed inset-0 z-[190] transform transition-transform duration-300 ${isMenuOpen ? 'translate-x-0' : 'translate-x-full'}`}>
            <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setIsMenuOpen(false)} />
            <div className="absolute right-0 top-0 bottom-0 w-72 bg-primary shadow-2xl p-6 flex flex-col">
              <div className="mb-10 text-center">
                 <div className="w-20 h-20 rounded-3xl bg-secondary mx-auto flex items-center justify-center text-3xl mb-4 shadow-xl shadow-secondary/20 font-black">
                     {user?.first_name?.[0] || 'G'}
                 </div>
                 {isAuthenticated ? (
                    <>
                      <h3 className="text-xl font-black tracking-tight">{user?.first_name} {user?.last_name}</h3>
                      <p className="text-xs text-gray-500 font-bold uppercase tracking-widest mt-1">{user?.role || 'Guest'}</p>
                    </>
                 ) : (
                    <h3 className="text-xl font-black tracking-tight italic text-gray-400">Not Signed In</h3>
                 )}
              </div>

              <div className="flex-1 space-y-2">
                {isAuthenticated ? (
                  <>
                    <p className="text-[10px] font-black text-gray-600 uppercase tracking-[0.2em] mb-4">Operations</p>
                    {navLinks.map(link => (
                      <Link key={link.href} href={link.href} className={`flex items-center gap-4 px-4 py-4 rounded-2xl font-bold transition-all ${pathname === link.href ? 'bg-secondary text-white shadow-lg' : 'text-gray-400 hover:bg-white/5 hover:text-white'}`}>
                        {link.label}
                      </Link>
                    ))}
                    {isAdmin && (
                      <Link href="/admin" className="flex items-center gap-4 px-4 py-4 rounded-2xl font-black text-purple-400 hover:bg-purple-500/10 transition-all border border-purple-500/20">
                        ⚡ Admin Portal
                      </Link>
                    )}
                    <div className="h-px bg-white/5 my-6" />
                    <p className="text-[10px] font-black text-gray-600 uppercase tracking-[0.2em] mb-4">Account</p>
                    <Link href="/profile" className="flex items-center gap-4 px-4 py-4 rounded-2xl font-bold text-gray-400 hover:bg-white/5 hover:text-white">Profile Settings</Link>
                    <button onClick={handleLogout} className="w-full text-left flex items-center gap-4 px-4 py-4 rounded-2xl font-bold text-red-400 hover:bg-red-500/10">Terminate Session</button>
                  </>
                ) : (
                  <div className="space-y-4 pt-10">
                    <Link href="/login" className="block text-center py-4 rounded-2xl font-black bg-white/5 text-white">Login</Link>
                    <Link href="/register" className="block text-center py-4 rounded-2xl font-black bg-secondary text-white shadow-lg shadow-secondary/20">Register</Link>
                  </div>
                )}
              </div>
            </div>
          </div>
        </nav>

        {/* Main content */}
        <main className="flex-1 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 w-full">
          {children}
        </main>

        {/* Footer */}
        <footer className="bg-primary text-gray-500 py-12 border-t border-white/5 mt-auto">
          <div className="max-w-7xl mx-auto px-8 flex flex-col md:flex-row justify-between items-center gap-6">
            <div className="text-xl font-black tracking-tighter text-gray-300">GOLFINS</div>
            <p className="text-[10px] font-black uppercase tracking-[0.3em]">&copy; 2026 UIC Systems. All Rights Reserved.</p>
            <div className="flex gap-4">
               <div className="w-8 h-8 rounded-full bg-white/5 border border-white/10 flex items-center justify-center">?</div>
               <div className="w-8 h-8 rounded-full bg-white/5 border border-white/10 flex items-center justify-center">🌐</div>
            </div>
          </div>
        </footer>
      </body>
    </html>
  )
}
