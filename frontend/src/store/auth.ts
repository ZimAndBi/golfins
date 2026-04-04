import { create } from 'zustand'

interface User {
  id: string
  email: string
  first_name: string
  last_name: string
  phone?: string
  nationality?: string
  gender?: string
  id_passport?: string
  address?: string
  company_name?: string
  role: string
}

interface AuthStore {
  user: User | null
  token: string | null
  isAuthenticated: boolean
  setAuth: (user: any, token: string) => void
  updateUser: (user: any) => void
  logout: () => void
}

const loadUserFromStorage = (): User | null => {
  if (typeof window === 'undefined') return null
  try {
    const raw = localStorage.getItem('user')
    if (!raw) return null
    const parsed = JSON.parse(raw)
    // Normalize properties for safety (handle both snake_case from API and any legacy camelCase)
    return {
      ...parsed,
      first_name: parsed.first_name || parsed.firstName || '',
      last_name: parsed.last_name || parsed.lastName || '',
    }
  } catch {
    return null
  }
}

export const useAuthStore = create<AuthStore>((set) => ({
  user: loadUserFromStorage(),
  token: typeof window !== 'undefined' ? localStorage.getItem('token') : null,
  isAuthenticated: typeof window !== 'undefined' ? !!localStorage.getItem('token') : false,

  setAuth: (user, token) => {
    // Normalize to snake_case for consistency with backend
    const normalizedUser = {
      ...user,
      first_name: user.first_name || user.firstName || '',
      last_name: user.last_name || user.lastName || '',
      phone: user.phone || '',
    }
    localStorage.setItem('token', token)
    localStorage.setItem('user', JSON.stringify(normalizedUser))
    set({ user: normalizedUser, token, isAuthenticated: true })
  },

  updateUser: (user) => {
    const normalizedUser = {
      ...user,
      first_name: user.first_name || user.firstName || '',
      last_name: user.last_name || user.lastName || '',
      phone: user.phone || '',
    }
    localStorage.setItem('user', JSON.stringify(normalizedUser))
    set({ user: normalizedUser })
  },

  logout: () => {
    localStorage.removeItem('token')
    localStorage.removeItem('user')
    set({ user: null, token: null, isAuthenticated: false })
  },
}))
