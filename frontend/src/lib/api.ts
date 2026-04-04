import axios, { AxiosInstance } from 'axios'

// Use relative URL so it works from any device on the network (phone, tablet, etc.)
const API_URL = '/api'

const apiClient: AxiosInstance = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
})

// Request interceptor - add auth token
apiClient.interceptors.request.use((config) => {
  if (typeof window !== 'undefined') {
    const token = localStorage.getItem('token')
    if (token) {
      config.headers.Authorization = `Bearer ${token}`
    }
  }
  return config
})

// Response interceptor - handle 401
apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      // Clear token and redirect to login
      if (typeof window !== 'undefined') {
        localStorage.removeItem('token')
        localStorage.removeItem('user')
        window.location.href = '/login'
      }
    }
    return Promise.reject(error)
  }
)

export const authAPI = {
  // OTP endpoints
  sendOTP: (email: string, purpose: 'register' | 'reset_password', name?: string) =>
    apiClient.post('/auth/otp/send', { email, purpose, name }),
  verifyOTP: (email: string, purpose: 'register' | 'reset_password', otp_code: string) =>
    apiClient.post('/auth/otp/verify', { email, purpose, otp_code }),

  // Auth endpoints
  register: (email: string, password: string, firstName: string, lastName: string, phone: string, otpCode: string) =>
    apiClient.post('/auth/register', {
      email,
      password,
      first_name: firstName,
      last_name: lastName,
      phone: phone || null,
      otp_code: otpCode,
    }),
  login: (email: string, password: string) =>
    apiClient.post('/auth/login', { email, password }),
  getMe: () => apiClient.get('/auth/me'),
  updateMe: (data: any) => apiClient.patch('/auth/me', data),

  // Password reset
  forgotPassword: (email: string) =>
    apiClient.post('/auth/forgot-password', { email }),
  resetPassword: (email: string, otpCode: string, newPassword: string) =>
    apiClient.post('/auth/reset-password', { email, otp_code: otpCode, new_password: newPassword }),
}

export const policyAPI = {
  getProducts: () => apiClient.get('/products'),
  getProductCoverages: (productId: string) => apiClient.get(`/products/${productId}/coverages`),
  getPolicies: (userId?: string) => apiClient.get('/policies', { params: userId ? { user_id: userId } : {} }),
  getPolicy: (policyId: string) => apiClient.get(`/policies/${policyId}`),
  createPolicy: (data: any) => apiClient.post('/policies', data),
}

export const premiumAPI = {
  calculate: (data: any) => apiClient.post('/quotes/calculate', data),
}

export const claimsAPI = {
  getClaims: (userId?: string) => apiClient.get('/claims', { params: userId ? { user_id: userId } : {} }),
  getClaim: (claimId: string) => apiClient.get(`/claims/${claimId}`),
  createClaim: (data: any) => apiClient.post('/claims', data),
  updateClaimStatus: (claimId: string, status: string) => apiClient.patch(`/claims/${claimId}/status`, { status }),
  uploadDocument: (claimId: string, file: File) => {
    const formData = new FormData()
    formData.append('file', file)
    return apiClient.post(`/claims/${claimId}/documents`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    })
  },
}

export default apiClient
