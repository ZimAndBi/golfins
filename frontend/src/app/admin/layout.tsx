'use client'

import { useEffect } from 'react'
import Link from 'next/link'
import { useRouter, usePathname } from 'next/navigation'
import { useAuthStore } from '@/store/auth'

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, user } = useAuthStore()
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
    { href: '/admin', label: 'Dashboard' },
    { href: '/admin/claims', label: 'Claims' },
    { href: '/admin/policies', label: 'Policies' },
    { href: '/admin/users', label: 'Users' },
  ]

  return (
    <div className="flex gap-6">
      {/* Sidebar */}
      <aside className="w-56 shrink-0">
        <div className="bg-primary text-white rounded-lg p-4 sticky top-4">
          <p className="text-xs uppercase tracking-widest text-gray-400 mb-4">Admin Panel</p>
          <nav className="space-y-1">
            {navItems.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className={`block px-4 py-2 rounded font-medium text-sm transition ${
                  pathname === item.href
                    ? 'bg-secondary text-white'
                    : 'text-gray-300 hover:bg-gray-700'
                }`}
              >
                {item.label}
              </Link>
            ))}
          </nav>
          <div className="mt-6 pt-4 border-t border-gray-600">
            <Link href="/dashboard" className="text-xs text-gray-400 hover:text-white">
              ← Back to App
            </Link>
          </div>
        </div>
      </aside>

      {/* Main content */}
      <main className="flex-1 min-w-0">{children}</main>
    </div>
  )
}
