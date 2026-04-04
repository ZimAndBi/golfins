'use client'

import '@/styles/globals.css'
import Link from 'next/link'
import { useAuthStore } from '@/store/auth'
import { useRouter } from 'next/navigation'

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const { isAuthenticated, logout, user } = useAuthStore()
  const isAdmin = (user as any)?.role?.toLowerCase() === 'admin'
  const router = useRouter()

  const handleLogout = () => {
    logout()
    router.push('/')
  }

  return (
    <html lang="en">
      <body className="bg-gray-50">
        {/* Navigation */}
        <nav className="bg-primary text-white shadow-lg">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex justify-between h-16">
              <div className="flex items-center">
                <Link href="/" className="text-2xl font-bold">
                  🏌️ Golfins
                </Link>
              </div>
              <div className="flex items-center gap-4">
                {isAuthenticated ? (
                  <>
                    <Link href="/dashboard" className="hover:text-secondary">
                      Dashboard
                    </Link>
                    <Link href="/policies" className="hover:text-secondary">
                      Policies
                    </Link>
                    <Link href="/claims" className="hover:text-secondary">
                      Claims
                    </Link>
                    <Link href="/equipment" className="hover:text-secondary">
                      Equipment
                    </Link>
                    {isAdmin && (
                      <Link href="/admin" className="bg-purple-600 text-white px-3 py-1 rounded hover:bg-purple-700 text-sm">
                        Admin
                      </Link>
                    )}
                    <div className="relative group py-4">
                      <button className="flex items-center gap-2 bg-emerald-700/50 hover:bg-emerald-700 px-3 py-1.5 rounded-full transition-all border border-emerald-400/30">
                        <div className="w-8 h-8 rounded-full bg-emerald-400 flex items-center justify-center text-emerald-900 font-bold text-sm">
                          {user?.first_name?.[0] || user?.email?.[0]?.toUpperCase() || 'U'}
                        </div>
                        <span className="font-medium text-sm hidden md:block">
                          {user?.first_name} {user?.last_name}
                        </span>
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
                        </svg>
                      </button>

                      {/* Dropdown Menu */}
                      <div className="absolute right-0 top-full pt-2 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 z-[100]">
                        <div className="bg-white rounded-xl shadow-2xl border border-gray-100 py-2 w-48 overflow-hidden">
                          <Link
                            href="/profile"
                            className="flex items-center gap-3 px-4 py-3 text-sm text-gray-700 hover:bg-gray-50 hover:text-emerald-600 transition-colors"
                          >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                            </svg>
                            View Profile
                          </Link>
                          <Link
                            href="/dashboard"
                            className="flex items-center gap-3 px-4 py-3 text-sm text-gray-700 hover:bg-gray-50 hover:text-emerald-600 transition-colors md:hidden"
                          >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
                            </svg>
                            Dashboard
                          </Link>
                          <div className="h-px bg-gray-100 mx-2 my-1" />
                          <button
                            onClick={handleLogout}
                            className="w-full flex items-center gap-3 px-4 py-3 text-sm text-red-600 hover:bg-red-50 hover:text-red-700 transition-colors text-left"
                          >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                            </svg>
                            Logout
                          </button>
                        </div>
                      </div>
                    </div>
                  </>
                ) : (
                  <>
                    <Link href="/login" className="hover:text-secondary">
                      Login
                    </Link>
                    <Link
                      href="/register"
                      className="bg-secondary text-white px-4 py-2 rounded hover:bg-emerald-700"
                    >
                      Register
                    </Link>
                  </>
                )}
              </div>
            </div>
          </div>
        </nav>

        {/* Main content */}
        <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {children}
        </main>

        {/* Footer */}
        <footer className="bg-gray-900 text-white text-center py-4 mt-12">
          <p>&copy; 2026 UIC. All rights reserved.</p>
        </footer>
      </body>
    </html>
  )
}
