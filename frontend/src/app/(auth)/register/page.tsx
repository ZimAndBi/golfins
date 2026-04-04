'use client'

import { useState, useRef, useEffect } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { authAPI } from '@/lib/api'
import { useAuthStore } from '@/store/auth'

type Step = 'form' | 'otp' | 'complete'

export default function Register() {
  const [step, setStep] = useState<Step>('form')
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    password: '',
    confirmPassword: '',
  })
  const [otpDigits, setOtpDigits] = useState(['', '', '', '', '', ''])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [countdown, setCountdown] = useState(0)
  const router = useRouter()
  const { setAuth } = useAuthStore()
  const otpRefs = useRef<(HTMLInputElement | null)[]>([])

  // Countdown timer for resend
  useEffect(() => {
    if (countdown <= 0) return
    const timer = setInterval(() => setCountdown((c) => c - 1), 1000)
    return () => clearInterval(timer)
  }, [countdown])

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value })
  }

  // Step 1 → Send OTP
  const handleSendOTP = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setSuccess('')

    if (formData.password !== formData.confirmPassword) {
      setError('Passwords do not match')
      return
    }
    if (formData.password.length < 8) {
      setError('Password must be at least 8 characters')
      return
    }

    setLoading(true)
    try {
      const res = await authAPI.sendOTP(formData.email, 'register', formData.firstName)
      if (res.data.status === 'cooldown') {
        setError(res.data.message)
        setCountdown(res.data.retry_after || 60)
      } else {
        setStep('otp')
        setCountdown(res.data.expires_in || 300)
        setSuccess('A 6-digit verification code has been sent to your email.')
      }
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Failed to send verification code')
    } finally {
      setLoading(false)
    }
  }

  // Handle individual OTP digit input
  const handleOtpChange = (index: number, value: string) => {
    if (!/^\d*$/.test(value)) return
    const newDigits = [...otpDigits]
    newDigits[index] = value.slice(-1)
    setOtpDigits(newDigits)

    // Auto-focus next
    if (value && index < 5) {
      otpRefs.current[index + 1]?.focus()
    }
  }

  const handleOtpKeyDown = (index: number, e: React.KeyboardEvent) => {
    if (e.key === 'Backspace' && !otpDigits[index] && index > 0) {
      otpRefs.current[index - 1]?.focus()
    }
  }

  const handleOtpPaste = (e: React.ClipboardEvent) => {
    e.preventDefault()
    const pasted = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, 6)
    const newDigits = [...otpDigits]
    for (let i = 0; i < 6; i++) {
      newDigits[i] = pasted[i] || ''
    }
    setOtpDigits(newDigits)
    if (pasted.length > 0) {
      otpRefs.current[Math.min(pasted.length, 5)]?.focus()
    }
  }

  // Step 2 → Verify OTP & Register
  const handleVerifyAndRegister = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setSuccess('')

    const otpCode = otpDigits.join('')
    if (otpCode.length !== 6) {
      setError('Please enter the complete 6-digit code')
      return
    }

    setLoading(true)
    try {
      // Verify OTP first
      await authAPI.verifyOTP(formData.email, 'register', otpCode)

      // Then register
      const response = await authAPI.register(
        formData.email,
        formData.password,
        formData.firstName,
        formData.lastName,
        formData.phone,
        otpCode
      )
      const { access_token, user } = response.data
      setAuth(user, access_token)
      setStep('complete')

      // Redirect after brief delay
      setTimeout(() => router.push('/dashboard'), 1500)
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Verification failed')
      // If OTP was wrong, don't clear all digits
    } finally {
      setLoading(false)
    }
  }

  const handleResendOTP = async () => {
    if (countdown > 0) return
    setError('')
    setSuccess('')
    setLoading(true)
    try {
      const res = await authAPI.sendOTP(formData.email, 'register', formData.firstName)
      if (res.data.status === 'cooldown') {
        setCountdown(res.data.retry_after || 60)
        setError(res.data.message)
      } else {
        setCountdown(res.data.expires_in || 300)
        setOtpDigits(['', '', '', '', '', ''])
        setSuccess('A new verification code has been sent to your email.')
        otpRefs.current[0]?.focus()
      }
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Failed to resend code')
    } finally {
      setLoading(false)
    }
  }

  const formatTime = (s: number) => {
    const m = Math.floor(s / 60)
    const sec = s % 60
    return `${m}:${sec.toString().padStart(2, '0')}`
  }

  // ── Render ─────────────────────────────────────────────────────────────────

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-50 to-gray-100 py-8">
      <div className="bg-white p-8 rounded-2xl shadow-xl w-full max-w-md border border-gray-100">

        {/* ── Step indicator ────────────────────────────────────────────── */}
        <div className="flex items-center justify-center gap-3 mb-6">
          {['Info', 'Verify', 'Done'].map((label, i) => {
            const stepIndex = i
            const currentIndex = step === 'form' ? 0 : step === 'otp' ? 1 : 2
            const isActive = stepIndex <= currentIndex
            return (
              <div key={label} className="flex items-center gap-2">
                <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold transition-all duration-300 ${
                  isActive
                    ? 'bg-emerald-500 text-white shadow-md shadow-emerald-200'
                    : 'bg-gray-200 text-gray-500'
                }`}>
                  {stepIndex < currentIndex ? '✓' : stepIndex + 1}
                </div>
                <span className={`text-xs font-medium ${isActive ? 'text-emerald-600' : 'text-gray-400'}`}>
                  {label}
                </span>
                {i < 2 && (
                  <div className={`w-8 h-0.5 ${isActive && stepIndex < currentIndex ? 'bg-emerald-400' : 'bg-gray-200'}`} />
                )}
              </div>
            )
          })}
        </div>

        {/* ── Step 1: Registration Form ────────────────────────────────── */}
        {step === 'form' && (
          <>
            <h1 className="text-3xl font-bold text-center mb-2 text-gray-800">Create Account</h1>
            <p className="text-center text-gray-500 mb-6 text-sm">Enter your details to get started</p>

            {error && <div className="bg-red-50 border border-red-200 text-red-700 p-3 rounded-lg mb-4 text-sm">{error}</div>}

            <form onSubmit={handleSendOTP} className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">First Name *</label>
                  <input
                    type="text"
                    name="firstName"
                    value={formData.firstName}
                    onChange={handleChange}
                    required
                    placeholder="John"
                    className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition-all"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Last Name *</label>
                  <input
                    type="text"
                    name="lastName"
                    value={formData.lastName}
                    onChange={handleChange}
                    required
                    placeholder="Doe"
                    className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition-all"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Email *</label>
                <input
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  required
                  placeholder="you@example.com"
                  className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition-all"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Mobile Phone
                  <span className="text-gray-400 font-normal ml-1">(optional)</span>
                </label>
                <input
                  type="tel"
                  name="phone"
                  value={formData.phone}
                  onChange={handleChange}
                  placeholder="+84 901 234 567"
                  className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition-all"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Password *</label>
                <input
                  type="password"
                  name="password"
                  value={formData.password}
                  onChange={handleChange}
                  required
                  placeholder="Min 8 characters"
                  className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition-all"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Confirm Password *</label>
                <input
                  type="password"
                  name="confirmPassword"
                  value={formData.confirmPassword}
                  onChange={handleChange}
                  required
                  placeholder="Re-enter password"
                  className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition-all"
                />
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full bg-emerald-600 text-white font-bold py-3 rounded-lg hover:bg-emerald-700 disabled:opacity-50 transition-all shadow-md hover:shadow-lg"
              >
                {loading ? (
                  <span className="flex items-center justify-center gap-2">
                    <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" /><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 100 8v4a8 8 0 01-8-8z" /></svg>
                    Sending Code...
                  </span>
                ) : 'Continue — Verify Email →'}
              </button>
            </form>
          </>
        )}

        {/* ── Step 2: OTP Verification ─────────────────────────────────── */}
        {step === 'otp' && (
          <>
            <div className="text-center mb-6">
              <div className="text-5xl mb-3">📧</div>
              <h1 className="text-2xl font-bold text-gray-800 mb-2">Verify Your Email</h1>
              <p className="text-gray-500 text-sm">
                We sent a 6-digit code to<br />
                <span className="font-semibold text-gray-700">{formData.email}</span>
              </p>
            </div>

            {error && <div className="bg-red-50 border border-red-200 text-red-700 p-3 rounded-lg mb-4 text-sm">{error}</div>}
            {success && <div className="bg-emerald-50 border border-emerald-200 text-emerald-700 p-3 rounded-lg mb-4 text-sm">{success}</div>}

            <form onSubmit={handleVerifyAndRegister}>
              {/* OTP input boxes */}
              <div className="flex justify-center gap-2 mb-6" onPaste={handleOtpPaste}>
                {otpDigits.map((digit, i) => (
                  <input
                    key={i}
                    ref={(el) => { otpRefs.current[i] = el }}
                    type="text"
                    inputMode="numeric"
                    maxLength={1}
                    value={digit}
                    onChange={(e) => handleOtpChange(i, e.target.value)}
                    onKeyDown={(e) => handleOtpKeyDown(i, e)}
                    className="w-12 h-14 text-center text-2xl font-bold border-2 border-gray-300 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition-all bg-gray-50"
                    autoFocus={i === 0}
                  />
                ))}
              </div>

              {/* Timer */}
              {countdown > 0 && (
                <p className="text-center text-sm text-gray-500 mb-4">
                  Code expires in <span className="font-mono font-bold text-emerald-600">{formatTime(countdown)}</span>
                </p>
              )}

              <button
                type="submit"
                disabled={loading || otpDigits.join('').length !== 6}
                className="w-full bg-emerald-600 text-white font-bold py-3 rounded-lg hover:bg-emerald-700 disabled:opacity-50 transition-all shadow-md hover:shadow-lg mb-3"
              >
                {loading ? (
                  <span className="flex items-center justify-center gap-2">
                    <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" /><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 100 8v4a8 8 0 01-8-8z" /></svg>
                    Verifying...
                  </span>
                ) : 'Verify & Create Account'}
              </button>

              <div className="flex items-center justify-between">
                <button
                  type="button"
                  onClick={() => { setStep('form'); setOtpDigits(['', '', '', '', '', '']); setError(''); setSuccess('') }}
                  className="text-sm text-gray-500 hover:text-gray-700 transition-colors"
                >
                  ← Back
                </button>
                <button
                  type="button"
                  onClick={handleResendOTP}
                  disabled={countdown > 0 && countdown < 240}
                  className="text-sm text-emerald-600 hover:text-emerald-700 font-medium disabled:text-gray-400 transition-colors"
                >
                  Resend Code
                </button>
              </div>
            </form>
          </>
        )}

        {/* ── Step 3: Complete ─────────────────────────────────────────── */}
        {step === 'complete' && (
          <div className="text-center py-8">
            <div className="w-20 h-20 bg-emerald-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <span className="text-4xl">✅</span>
            </div>
            <h1 className="text-2xl font-bold text-gray-800 mb-2">Account Created!</h1>
            <p className="text-gray-500 mb-4">Your email has been verified and your account is ready.</p>
            <p className="text-sm text-gray-400">Redirecting to dashboard...</p>
          </div>
        )}

        {/* ── Footer link ──────────────────────────────────────────────── */}
        {step !== 'complete' && (
          <p className="text-center text-gray-500 mt-5 text-sm">
            Already have an account?{' '}
            <Link href="/login" className="text-emerald-600 font-semibold hover:underline">
              Login here
            </Link>
          </p>
        )}
      </div>
    </div>
  )
}
