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
                    <button
                      onClick={handleLogout}
                      className="bg-accent text-black px-4 py-2 rounded hover:bg-amber-600"
                    >
                      Logout
                    </button>
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
          <p>&copy; 2026 Golfins. All rights reserved.</p>
        </footer>
      </body>
    </html>
  )
}
