'use client'

import { useState, useRef, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAuthStore } from '@/store/auth'
import { authAPI } from '@/lib/api'

export default function Profile() {
  const { user, updateUser, isAuthenticated } = useAuthStore()
  const router = useRouter()

  const [formData, setFormData] = useState({
    firstName: user?.first_name || '',
    lastName: user?.last_name || '',
    email: user?.email || '',
    phone: user?.phone || '',
    nationality: user?.nationality || 'Vietnam',
    gender: user?.gender || 'Male',
    idNumber: user?.id_passport || '',
    address: user?.address || '',
    companyName: user?.company_name || '',
  })

  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  
  // OTP related
  const [showOtpModal, setShowOtpModal] = useState(false)
  const [otpSentTo, setOtpSentTo] = useState('')
  const [otpDigits, setOtpDigits] = useState(['', '', '', '', '', ''])
  const [otpCountdown, setOtpCountdown] = useState(0)
  const otpRefs = useRef<(HTMLInputElement | null)[]>([])

  useEffect(() => {
    if (!isAuthenticated) {
      router.push('/login?redirect=/profile')
    }
  }, [isAuthenticated, router])

  useEffect(() => {
    if (otpCountdown > 0) {
      const timer = setInterval(() => setOtpCountdown(c => c - 1), 1000)
      return () => clearInterval(timer)
    }
  }, [otpCountdown])

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value })
  }

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setSuccess('')

    const emailChanged = formData.email !== user?.email
    const phoneChanged = formData.phone !== user?.phone

    if (emailChanged || phoneChanged) {
      // Trigger OTP
      setLoading(true)
      try {
        const target = emailChanged ? formData.email : user?.email || ''
        await authAPI.sendOTP(target, 'register', formData.firstName)
        setOtpSentTo(target)
        setShowOtpModal(true)
        setOtpCountdown(300)
        setSuccess('Verification code sent to ' + target)
      } catch (err: any) {
        setError(err.response?.data?.detail || 'Failed to send verification code')
      } finally {
        setLoading(false)
      }
    } else {
      // Direct update
      await performUpdate()
    }
  }

  const performUpdate = async (otpCode?: string) => {
    setLoading(true)
    setError('')
    try {
      const response = await authAPI.updateMe({
        first_name: formData.firstName,
        last_name: formData.lastName,
        email: formData.email,
        phone: formData.phone,
        nationality: formData.nationality,
        gender: formData.gender,
        id_passport: formData.idNumber,
        address: formData.address,
        company_name: formData.companyName,
        otp_code: otpCode
      })

        if (response.data) {
        updateUser(response.data)
        setSuccess('Profile updated successfully! Redirecting...')
        setShowOtpModal(false)
        setTimeout(() => {
          router.push('/dashboard')
        }, 1500)
      }
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Failed to update profile')
    } finally {
      setLoading(false)
    }
  }

  const handleOtpVerify = async () => {
    const code = otpDigits.join('')
    if (code.length !== 6) return
    await performUpdate(code)
  }

  const handleOtpChange = (index: number, value: string) => {
    if (!/^\d*$/.test(value)) return
    const nextDigits = [...otpDigits]
    nextDigits[index] = value.slice(-1)
    setOtpDigits(nextDigits)
    if (value && index < 5) otpRefs.current[index + 1]?.focus()
  }

  const handleOtpKeyDown = (index: number, e: React.KeyboardEvent) => {
    if (e.key === 'Backspace' && !otpDigits[index] && index > 0) {
      otpRefs.current[index - 1]?.focus()
    }
  }

  if (!user) return null

  return (
    <div className="max-w-4xl mx-auto py-8 px-4">
      <div className="bg-white rounded-2xl shadow-xl border border-gray-100 overflow-hidden">
        {/* Header */}
        <div className="bg-gradient-to-r from-emerald-600 to-teal-700 px-8 py-10 text-white">
          <div className="flex items-center gap-6">
            <div className="w-24 h-24 rounded-full bg-white/20 backdrop-blur-md flex items-center justify-center text-4xl font-bold border-4 border-white/30">
              {user.first_name?.[0] || user.email?.[0].toUpperCase()}
            </div>
            <div>
              <h1 className="text-3xl font-bold">{user.first_name} {user.last_name}</h1>
              <p className="text-emerald-100 mt-1">{user.email}</p>
              <div className="inline-block mt-3 px-3 py-1 bg-emerald-500/30 rounded-full text-xs font-semibold backdrop-blur-sm border border-emerald-400/20">
                User ID: {user.id.slice(0, 8)}...
              </div>
            </div>
          </div>
        </div>

        {/* Form */}
        <form onSubmit={handleSave} className="p-8">
          <h2 className="text-xl font-bold text-gray-800 mb-6 flex items-center gap-2">
            <svg className="w-5 h-5 text-emerald-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
            </svg>
            Personal Information
          </h2>

          {error && (
            <div className="bg-red-50 border-l-4 border-red-500 text-red-700 p-4 rounded-r-lg mb-6 text-sm flex items-center gap-3">
              <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd"/></svg>
              {error}
            </div>
          )}
          {success && (
            <div className="bg-emerald-50 border-l-4 border-emerald-500 text-emerald-700 p-4 rounded-r-lg mb-6 text-sm flex items-center gap-3">
              <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd"/></svg>
              {success}
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Basic Info */}
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1.5">First Name</label>
                  <input
                    name="firstName"
                    value={formData.firstName}
                    onChange={handleChange}
                    className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-emerald-500 transition-all outline-none"
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1.5">Last Name</label>
                  <input
                    name="lastName"
                    value={formData.lastName}
                    onChange={handleChange}
                    className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-emerald-500 transition-all outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1.5">Email Address</label>
                <div className="relative">
                  <input
                    name="email"
                    type="email"
                    value={formData.email}
                    onChange={handleChange}
                    className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-emerald-500 transition-all outline-none pr-10"
                  />
                  {formData.email !== user.email && (
                    <div className="absolute right-3 top-1/2 -translate-y-1/2 text-amber-500" title="Email change requires verification">
                      <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd"/></svg>
                    </div>
                  )}
                </div>
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1.5">Phone Number</label>
                <div className="relative">
                  <input
                    name="phone"
                    value={formData.phone}
                    onChange={handleChange}
                    className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-emerald-500 transition-all outline-none pr-10"
                  />
                  {formData.phone !== user.phone && (
                    <div className="absolute right-3 top-1/2 -translate-y-1/2 text-amber-500" title="Phone change requires verification">
                      <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd"/></svg>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Extra Info */}
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1.5">Nationality</label>
                  <select
                    name="nationality"
                    value={formData.nationality}
                    onChange={handleChange}
                    className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-emerald-500 transition-all outline-none"
                  >
                    <option value="Vietnam">Vietnam</option>
                    <option value="Other">Other</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1.5">Gender</label>
                  <select
                    name="gender"
                    value={formData.gender}
                    onChange={handleChange}
                    className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-emerald-500 transition-all outline-none"
                  >
                    <option value="Male">Male</option>
                    <option value="Female">Female</option>
                    <option value="Other">Other</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1.5">ID / Passport No.</label>
                <input
                  name="idNumber"
                  value={formData.idNumber}
                  onChange={handleChange}
                  placeholder="e.g. 001090123456"
                  className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-emerald-500 transition-all outline-none"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1.5">Company Name (Optional)</label>
                <input
                  name="companyName"
                  value={formData.companyName}
                  onChange={handleChange}
                  placeholder="e.g. Golfins Corp"
                  className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-emerald-500 transition-all outline-none"
                />
              </div>
            </div>
          </div>

          <div className="mt-6">
            <label className="block text-sm font-semibold text-gray-700 mb-1.5">Address</label>
            <input
              name="address"
              value={formData.address}
              onChange={handleChange}
              placeholder="Full street address, city"
              className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-emerald-500 transition-all outline-none"
            />
          </div>

          <div className="mt-10 border-t pt-8 flex justify-end">
            <button
              type="submit"
              disabled={loading}
              className="px-8 py-3 bg-emerald-600 text-white font-bold rounded-xl hover:bg-emerald-700 shadow-lg shadow-emerald-200 transition-all disabled:opacity-50 flex items-center gap-2"
            >
              {loading ? (
                <>
                  <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>
                  Saving...
                </>
              ) : (
                'Save Profile Changes'
              )}
            </button>
          </div>
        </form>
      </div>

      {/* OTP MODAL */}
      {showOtpModal && (
        <div className="fixed inset-0 bg-gray-900/60 backdrop-blur-sm z-[200] flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl shadow-2xl p-8 w-full max-w-md animate-in fade-in zoom-in duration-300">
            <h3 className="text-2xl font-bold text-gray-800 text-center mb-2">Verify Change</h3>
            <p className="text-gray-500 text-center text-sm mb-6">
              To update your email/phone, please enter the 6-digit code sent to <br/>
              <span className="font-bold text-emerald-600">{otpSentTo}</span>
            </p>

            <div className="flex justify-center gap-2 mb-6">
              {otpDigits.map((digit, i) => (
                <input
                  key={i}
                  ref={el => { otpRefs.current[i] = el }}
                  value={digit}
                  onChange={e => handleOtpChange(i, e.target.value)}
                  onKeyDown={e => handleOtpKeyDown(i, e)}
                  maxLength={1}
                  className="w-12 h-14 text-center text-2xl font-bold bg-gray-50 border-2 border-gray-100 rounded-xl focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500 outline-none transition-all"
                />
              ))}
            </div>

            <button
              onClick={handleOtpVerify}
              disabled={loading || otpDigits.join('').length < 6}
              className="w-full py-4 bg-emerald-600 text-white font-bold rounded-2xl hover:bg-emerald-700 shadow-xl shadow-emerald-200 transition-all disabled:opacity-50"
            >
              {loading ? 'Verifying...' : 'Verify & Update'}
            </button>

            <button
              onClick={() => setShowOtpModal(false)}
              className="w-full mt-4 text-sm text-gray-400 hover:text-gray-600 font-medium"
            >
              Cancel Update
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
