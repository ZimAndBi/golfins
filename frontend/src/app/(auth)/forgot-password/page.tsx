'use client'

import { useState, useRef, useEffect } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { authAPI } from '@/lib/api'

type Step = 'email' | 'reset' | 'complete'

export default function ForgotPassword() {
  const [step, setStep] = useState<Step>('email')
  const [email, setEmail] = useState('')
  const [otpDigits, setOtpDigits] = useState(['', '', '', '', '', ''])
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [countdown, setCountdown] = useState(0)
  const router = useRouter()
  const otpRefs = useRef<(HTMLInputElement | null)[]>([])

  useEffect(() => {
    if (countdown <= 0) return
    const timer = setInterval(() => setCountdown((c) => c - 1), 1000)
    return () => clearInterval(timer)
  }, [countdown])

  const formatTime = (s: number) => {
    const m = Math.floor(s / 60)
    const sec = s % 60
    return `${m}:${sec.toString().padStart(2, '0')}`
  }

  // Step 1 — Request OTP
  const handleRequestOTP = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setSuccess('')
    setLoading(true)

    try {
      const res = await authAPI.forgotPassword(email)
      setStep('reset')
      setCountdown(res.data.expires_in || 300)
      setSuccess('If an account exists, a reset code has been sent to your email.')
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Failed to send reset code')
    } finally {
      setLoading(false)
    }
  }

  // OTP input handlers
  const handleOtpChange = (index: number, value: string) => {
    if (!/^\d*$/.test(value)) return
    const newDigits = [...otpDigits]
    newDigits[index] = value.slice(-1)
    setOtpDigits(newDigits)
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

  // Step 2 → Enter OTP + new password → reset
  const handleResetWithOTP = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setSuccess('')

    const otpCode = otpDigits.join('')
    if (otpCode.length !== 6) {
      setError('Please enter the complete 6-digit code')
      return
    }
    if (newPassword.length < 8) {
      setError('Password must be at least 8 characters')
      return
    }
    if (newPassword !== confirmPassword) {
      setError('Passwords do not match')
      return
    }

    setLoading(true)
    try {
      await authAPI.resetPassword(email, otpCode, newPassword)
      setStep('complete')
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Failed to reset password')
    } finally {
      setLoading(false)
    }
  }

  const handleResendOTP = async () => {
    if (countdown > 0 && countdown < 240) return
    setError('')
    setLoading(true)
    try {
      const res = await authAPI.forgotPassword(email)
      setCountdown(res.data.expires_in || 300)
      setOtpDigits(['', '', '', '', '', ''])
      setSuccess('A new reset code has been sent.')
      otpRefs.current[0]?.focus()
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Failed to resend')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-50 to-gray-100 py-8">
      <div className="bg-white p-8 rounded-2xl shadow-xl w-full max-w-md border border-gray-100">

        {/* ── Step 1: Enter email ───────────────────────────────────────── */}
        {step === 'email' && (
          <>
            <div className="text-center mb-6">
              <div className="w-16 h-16 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-3xl">🔑</span>
              </div>
              <h1 className="text-2xl font-bold text-gray-800">Forgot Password?</h1>
              <p className="text-gray-500 text-sm mt-2">
                Enter your email and we'll send you a code to reset your password.
              </p>
            </div>

            {error && <div className="bg-red-50 border border-red-200 text-red-700 p-3 rounded-lg mb-4 text-sm">{error}</div>}

            <form onSubmit={handleRequestOTP} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Email Address</label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  placeholder="you@example.com"
                  className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition-all"
                  autoFocus
                />
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full bg-purple-600 text-white font-bold py-3 rounded-lg hover:bg-purple-700 disabled:opacity-50 transition-all shadow-md hover:shadow-lg"
              >
                {loading ? (
                  <span className="flex items-center justify-center gap-2">
                    <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" /><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 100 8v4a8 8 0 01-8-8z" /></svg>
                    Sending...
                  </span>
                ) : 'Send Reset Code'}
              </button>
            </form>

            <p className="text-center text-gray-500 mt-5 text-sm">
              Remember your password?{' '}
              <Link href="/login" className="text-purple-600 font-semibold hover:underline">
                Back to Login
              </Link>
            </p>
          </>
        )}

        {/* ── Step 2: Enter OTP + New Password ─────────────────────────── */}
        {step === 'reset' && (
          <>
            <div className="text-center mb-6">
              <div className="text-5xl mb-3">📧</div>
              <h1 className="text-2xl font-bold text-gray-800 mb-2">Reset Your Password</h1>
              <p className="text-gray-500 text-sm">
                Enter the code sent to <span className="font-semibold text-gray-700">{email}</span>
                <br />and choose your new password.
              </p>
            </div>

            {error && <div className="bg-red-50 border border-red-200 text-red-700 p-3 rounded-lg mb-4 text-sm">{error}</div>}
            {success && <div className="bg-purple-50 border border-purple-200 text-purple-700 p-3 rounded-lg mb-4 text-sm">{success}</div>}

            <form onSubmit={handleResetWithOTP} className="space-y-4">
              {/* OTP input */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2 text-center">Verification Code</label>
                <div className="flex justify-center gap-2" onPaste={handleOtpPaste}>
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
                      className="w-12 h-14 text-center text-2xl font-bold border-2 border-gray-300 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition-all bg-gray-50"
                      autoFocus={i === 0}
                    />
                  ))}
                </div>
              </div>

              {countdown > 0 && (
                <p className="text-center text-sm text-gray-500">
                  Code expires in <span className="font-mono font-bold text-purple-600">{formatTime(countdown)}</span>
                </p>
              )}

              {/* New password fields */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">New Password</label>
                <input
                  type="password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  required
                  placeholder="Min 8 characters"
                  className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition-all"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Confirm New Password</label>
                <input
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  required
                  placeholder="Re-enter new password"
                  className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition-all"
                />
              </div>

              <button
                type="submit"
                disabled={loading || otpDigits.join('').length !== 6}
                className="w-full bg-purple-600 text-white font-bold py-3 rounded-lg hover:bg-purple-700 disabled:opacity-50 transition-all shadow-md hover:shadow-lg"
              >
                {loading ? (
                  <span className="flex items-center justify-center gap-2">
                    <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" /><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 100 8v4a8 8 0 01-8-8z" /></svg>
                    Resetting...
                  </span>
                ) : 'Reset Password'}
              </button>

              <div className="flex items-center justify-between">
                <button
                  type="button"
                  onClick={() => { setStep('email'); setOtpDigits(['', '', '', '', '', '']); setError(''); setSuccess('') }}
                  className="text-sm text-gray-500 hover:text-gray-700 transition-colors"
                >
                  ← Back
                </button>
                <button
                  type="button"
                  onClick={handleResendOTP}
                  disabled={countdown > 0 && countdown < 240}
                  className="text-sm text-purple-600 hover:text-purple-700 font-medium disabled:text-gray-400 transition-colors"
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
            <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <span className="text-4xl">✅</span>
            </div>
            <h1 className="text-2xl font-bold text-gray-800 mb-2">Password Reset!</h1>
            <p className="text-gray-500 mb-6">Your password has been updated successfully.</p>
            <Link
              href="/login"
              className="inline-block bg-emerald-600 text-white font-bold px-8 py-3 rounded-lg hover:bg-emerald-700 transition-all shadow-md"
            >
              Go to Login →
            </Link>
          </div>
        )}
      </div>
    </div>
  )
}
