'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import apiClient, { policyAPI } from '@/lib/api'
import { useAuthStore } from '@/store/auth'

export default function HoleInOneClaim() {
  const router = useRouter()
  const { isAuthenticated, user } = useAuthStore()
  const [policies, setPolicies] = useState<any[]>([])
  const [submitting, setSubmitting] = useState(false)
  const [result, setResult] = useState<any>(null)
  const [form, setForm] = useState({
    policy_id: '',
    course_name: '',
    hole_number: '',
    incident_date: '',
    handicap_index: '',
    celebration_amount: '',
    witness1_name: '',
    witness1_contact: '',
    witness2_name: '',
    witness2_contact: '',
  })

  useEffect(() => {
    if (!isAuthenticated) { router.push('/login'); return }
    policyAPI.getPolicies((user as any)?.id)
      .then(res => setPolicies((res.data.policies || []).filter((p: any) => p.status === 'active')))
      .catch(console.error)
  }, [isAuthenticated, user, router])

  const set = (field: string, value: string) => setForm(f => ({ ...f, [field]: value }))

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSubmitting(true)
    try {
      const witnesses: { name: string; contact: string }[] = []
      if (form.witness1_name) witnesses.push({ name: form.witness1_name, contact: form.witness1_contact })
      if (form.witness2_name) witnesses.push({ name: form.witness2_name, contact: form.witness2_contact })

      const res = await apiClient.post('/claims/hole-in-one', {
        policy_id: form.policy_id,
        user_id: (user as any)?.id,
        email: (user as any)?.email,
        name: (user as any)?.first_name || (user as any)?.firstName || '',
        course_name: form.course_name,
        hole_number: parseInt(form.hole_number),
        incident_date: form.incident_date,
        handicap_index: parseFloat(form.handicap_index),
        celebration_amount: parseFloat(form.celebration_amount) || 0,
        witnesses,
      })
      setResult(res.data)
    } catch (err: any) {
      alert(err?.response?.data?.detail || 'Submission failed. Please try again.')
    } finally {
      setSubmitting(false)
    }
  }

  if (result) {
    const approved = result.auto_approved
    return (
      <div className="max-w-2xl mx-auto">
        <div className={`p-8 rounded-lg text-center border-2 ${approved ? 'bg-green-50 border-green-500' : 'bg-yellow-50 border-yellow-400'}`}>
          <div className="text-7xl mb-4">{approved ? '⛳' : '🔍'}</div>
          <h1 className="text-3xl font-bold mb-2">
            {approved ? 'Hole-in-One Confirmed!' : 'Claim Under Review'}
          </h1>
          <p className="text-gray-600 mb-6">
            {approved
              ? 'Your claim has been automatically approved. Reimbursement within 2–3 business days.'
              : 'We need to verify the details. Our team will contact you within 3–5 business days.'}
          </p>
          <div className={`p-5 rounded-lg mb-6 text-left ${approved ? 'bg-white' : 'bg-white'}`}>
            <p className="text-sm text-gray-500 mb-1">Claim Number</p>
            <p className="text-2xl font-bold font-mono text-green-700">{result.claim_number}</p>
            <div className="mt-3 flex gap-4 text-sm text-gray-600">
              <span>Status: <strong className={approved ? 'text-green-600' : 'text-yellow-600'}>{result.status}</strong></span>
              <span>Amount: <strong>${result.amount_requested}</strong></span>
            </div>
          </div>
          {approved && <p className="text-sm text-gray-500 mb-6">A confirmation email has been sent to your inbox 🎉</p>}
          <div className="flex gap-3 justify-center">
            <Link href="/claims" className="bg-secondary text-white px-6 py-2 rounded font-bold hover:bg-emerald-700">
              View All Claims
            </Link>
            <Link href="/dashboard" className="bg-gray-100 text-gray-700 px-6 py-2 rounded font-bold hover:bg-gray-200">
              Dashboard
            </Link>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="max-w-2xl mx-auto">
      {/* Header */}
      <div className="flex items-center gap-4 mb-8">
        <Link href="/claims" className="text-secondary hover:underline">← Back</Link>
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-2">⛳ Hole-in-One Claim</h1>
          <p className="text-gray-500 text-sm mt-1">Auto-approved with at least 1 witness — reimbursement within 2–3 days</p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Policy */}
        <div className="bg-white p-6 rounded-lg shadow">
          <h2 className="font-bold text-lg mb-4">Policy</h2>
          <select
            required
            value={form.policy_id}
            onChange={e => set('policy_id', e.target.value)}
            className="w-full border rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-secondary"
          >
            <option value="">Select active policy...</option>
            {policies.map(p => (
              <option key={p.id} value={p.id}>{p.policy_number} — ${p.premium_amount}/yr</option>
            ))}
          </select>
          {policies.length === 0 && (
            <p className="text-sm text-amber-600 mt-2">No active policies found. <Link href="/purchase" className="underline">Purchase a policy first.</Link></p>
          )}
        </div>

        {/* Shot details */}
        <div className="bg-white p-6 rounded-lg shadow">
          <h2 className="font-bold text-lg mb-4">Shot Details</h2>
          <div className="grid grid-cols-2 gap-4">
            <div className="col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-1">Golf Course Name *</label>
              <input
                required type="text" value={form.course_name}
                onChange={e => set('course_name', e.target.value)}
                placeholder="e.g. Royal Melbourne Golf Club"
                className="w-full border rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-secondary"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Hole Number *</label>
              <select
                required value={form.hole_number}
                onChange={e => set('hole_number', e.target.value)}
                className="w-full border rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-secondary"
              >
                <option value="">Select hole...</option>
                {Array.from({length: 18}, (_, i) => (
                  <option key={i+1} value={i+1}>Hole {i+1}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Date of Achievement *</label>
              <input
                required type="date" value={form.incident_date}
                onChange={e => set('incident_date', e.target.value)}
                max={new Date().toISOString().split('T')[0]}
                className="w-full border rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-secondary"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Your Handicap Index *</label>
              <input
                required type="number" min="0" max="54" step="0.1"
                value={form.handicap_index}
                onChange={e => set('handicap_index', e.target.value)}
                placeholder="e.g. 18.4"
                className="w-full border rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-secondary"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Celebration Amount (AUD)</label>
              <input
                type="number" min="0" step="0.01"
                value={form.celebration_amount}
                onChange={e => set('celebration_amount', e.target.value)}
                placeholder="0.00"
                className="w-full border rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-secondary"
              />
              <p className="text-xs text-gray-400 mt-1">Drinks & celebrations at the 19th hole</p>
            </div>
          </div>
        </div>

        {/* Witnesses */}
        <div className="bg-white p-6 rounded-lg shadow">
          <h2 className="font-bold text-lg mb-1">Witnesses</h2>
          <p className="text-sm text-gray-500 mb-4">At least 1 witness required for auto-approval</p>
          <div className="space-y-4">
            {[
              { nameField: 'witness1_name', contactField: 'witness1_contact', label: 'Witness 1 (required for auto-approval)' },
              { nameField: 'witness2_name', contactField: 'witness2_contact', label: 'Witness 2 (optional)' },
            ].map(w => (
              <div key={w.nameField} className="grid grid-cols-2 gap-3">
                <div className="col-span-2 text-sm font-medium text-gray-600">{w.label}</div>
                <input
                  type="text" placeholder="Full name"
                  value={(form as any)[w.nameField]}
                  onChange={e => set(w.nameField, e.target.value)}
                  className="border rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-secondary"
                />
                <input
                  type="text" placeholder="Phone or email"
                  value={(form as any)[w.contactField]}
                  onChange={e => set(w.contactField, e.target.value)}
                  className="border rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-secondary"
                />
              </div>
            ))}
          </div>
        </div>

        <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 text-sm text-amber-800">
          <strong>Auto-approval criteria:</strong> Valid handicap (0–54) + at least 1 witness contact provided. False claims may result in policy cancellation.
        </div>

        <button
          type="submit"
          disabled={submitting || !form.policy_id}
          className="w-full bg-green-600 text-white py-3 rounded-lg font-bold text-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {submitting ? 'Submitting...' : '⛳ Submit Hole-in-One Claim'}
        </button>
      </form>
    </div>
  )
}
