'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { useRouter, useSearchParams } from 'next/navigation'
import { claimsAPI, policyAPI } from '@/lib/api'
import { useAuthStore } from '@/store/auth'

function formatVND(amount: number): string {
  return new Intl.NumberFormat('vi-VN').format(Math.round(amount)) + ' ₫'
}

export default function Claims() {
  const { isAuthenticated, user } = useAuthStore()
  const router = useRouter()
  const searchParams = useSearchParams()
  const [claims, setClaims] = useState([])
  const [policies, setPolicies] = useState([])
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [formData, setFormData] = useState({
    policy_id: '',
    incident_date: '',
    description: '',
    amount: '',
  })
  const [error, setError] = useState('')

  useEffect(() => {
    if (!isAuthenticated) {
      router.push('/login')
      return
    }

    const fetchData = async () => {
      try {
        const claimsRes = await claimsAPI.getClaims(user?.id)
        const policiesRes = await policyAPI.getPolicies(user?.id)
        setClaims(claimsRes.data.claims || [])
        // FILTER: Only show ACTIVE policies for claims submission
        const activeOnly = (policiesRes.data.policies || []).filter((p: any) => p.status === 'active')
        setPolicies(activeOnly)
      } catch (err) {
        console.error('Failed to fetch data:', err)
      } finally {
        setLoading(false)
      }
    }

    fetchData()
  }, [isAuthenticated, router, user?.id])

  const handleSubmitClaim = async (e: React.FormEvent) => {
    e.preventDefault()
    setSubmitting(true)
    setError('')

    try {
      await claimsAPI.createClaim({
        policy_id: formData.policy_id,
        user_id: user?.id,
        incident_date: formData.incident_date,
        description: formData.description,
        amount: parseFloat(formData.amount),
        email: (user as any)?.email,
        name: (user as any)?.first_name || (user as any)?.firstName || '',
      })

      setFormData({ policy_id: '', incident_date: '', description: '', amount: '' })
      router.push('/claims')
      const claimsRes = await claimsAPI.getClaims(user?.id)
      setClaims(claimsRes.data.claims || [])
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Failed to submit claim')
    } finally {
      setSubmitting(false)
    }
  }

  if (loading) return <div className="text-center py-20 font-bold text-slate-400">Loading Claims History...</div>

  const showForm = searchParams.get('new') === 'true'

  return (
    <div className="max-w-5xl mx-auto py-8 px-4">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-12">
        <div>
            <h1 className="text-4xl font-black text-slate-900 tracking-tight">Insurance Claims</h1>
            <p className="text-slate-400 font-bold text-sm mt-1 uppercase tracking-widest">Self-Service Claim Center</p>
        </div>
        {!showForm && (
          <div className="flex gap-3">
            <Link href="/claims/hole-in-one" className="bg-emerald-600 text-white px-6 py-3 rounded-2xl font-black shadow-lg shadow-emerald-500/20 hover:bg-emerald-700 transition-all flex items-center gap-2">
              ⛳ HOLE-IN-ONE
            </Link>
            <Link href="/claims?new=true" className="bg-slate-900 text-white px-8 py-3 rounded-2xl font-black shadow-xl shadow-slate-200 hover:bg-black transition-all">
              + NEW CLAIM
            </Link>
          </div>
        )}
      </div>

      {showForm && (
        <div className="bg-white p-10 rounded-[2.5rem] shadow-sm border border-slate-100 mb-12">
          <h2 className="text-2xl font-black text-slate-900 mb-8 tracking-tight">Report Incident</h2>
          {error && <div className="bg-rose-50 border border-rose-100 text-rose-700 p-4 rounded-2xl mb-8 font-bold text-sm tracking-tight">⚠️ {error}</div>}

          <form onSubmit={handleSubmitClaim} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-[10px] font-black uppercase tracking-widest text-slate-400 mb-2">Select Active Policy</label>
                  <select
                    value={formData.policy_id}
                    onChange={(e) => setFormData({ ...formData, policy_id: e.target.value })}
                    required
                    className="w-full px-5 py-3 bg-slate-50 border-2 border-slate-50 rounded-2xl focus:border-blue-500 focus:bg-white transition-all outline-none font-bold text-slate-900 shadow-sm"
                  >
                    <option value="">-- Choose one --</option>
                    {policies.map((p: any) => (
                      <option key={p.id} value={p.id}>
                        {p.policy_number} (Active)
                      </option>
                    ))}
                  </select>
                  {policies.length === 0 && (
                      <p className="text-[10px] text-rose-500 font-bold mt-2 italic">No active policies found. You can only claim on ACTIVE policies.</p>
                  )}
                </div>

                <div>
                  <label className="block text-[10px] font-black uppercase tracking-widest text-slate-400 mb-2">Incident Date</label>
                  <input
                    type="date"
                    value={formData.incident_date}
                    onChange={(e) => setFormData({ ...formData, incident_date: e.target.value })}
                    required
                    className="w-full px-5 py-3 bg-slate-50 border-2 border-slate-50 rounded-2xl focus:border-blue-500 focus:bg-white transition-all outline-none font-bold text-slate-900 shadow-sm"
                  />
                </div>
            </div>

            <div>
              <label className="block text-[10px] font-black uppercase tracking-widest text-slate-400 mb-2">Incident Description</label>
              <textarea
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                required
                className="w-full px-5 py-3 bg-slate-50 border-2 border-slate-50 rounded-2xl focus:border-blue-500 focus:bg-white transition-all outline-none font-bold text-slate-900 shadow-sm"
                rows={4}
                placeholder="Briefly describe what happened on the course..."
              />
            </div>

            <div className="max-w-[300px]">
              <label className="block text-[10px] font-black uppercase tracking-widest text-slate-400 mb-2">Estimated Claim Amount</label>
              <div className="relative">
                <input
                    type="number"
                    value={formData.amount}
                    onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
                    required
                    className="w-full px-5 py-3 bg-slate-50 border-2 border-slate-50 rounded-2xl focus:border-blue-500 focus:bg-white transition-all outline-none font-bold text-slate-900 shadow-sm pr-10"
                    placeholder="2.500.000"
                />
                <span className="absolute right-5 top-1/2 -translate-y-1/2 font-black text-slate-300">₫</span>
              </div>
            </div>

            <div className="flex gap-4 pt-4">
              <button
                type="submit"
                disabled={submitting || policies.length === 0}
                className="flex-1 bg-blue-600 text-white font-black py-4 rounded-2xl hover:bg-blue-700 disabled:opacity-20 shadow-xl shadow-blue-500/20 active:scale-95 transition-all text-xs uppercase tracking-widest"
              >
                {submitting ? 'PROCESSING...' : 'SUBMIT CLAIM REQUEST'}
              </button>
              <button
                type="button"
                onClick={() => router.push('/claims')}
                className="px-10 bg-slate-100 text-slate-400 font-black py-4 rounded-2xl hover:bg-slate-200 transition-all text-xs uppercase tracking-widest"
              >
                CANCEL
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Claims List */}
      <div className="space-y-6">
        <h2 className="text-xs font-black uppercase tracking-widest text-slate-400 mb-2">Claim History</h2>
        {claims.length > 0 ? (
          <div className="grid grid-cols-1 gap-4">
            {claims.map((claim: any) => (
              <div key={claim.id} className="bg-white p-6 rounded-[2rem] shadow-sm border border-slate-100 flex flex-col md:flex-row md:items-center justify-between gap-6 hover:shadow-xl hover:shadow-slate-200/50 transition-all group">
                <div className="flex-1">
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Claim Ref</p>
                    <p className="font-black text-slate-900 font-mono text-lg">{claim.claim_number}</p>
                </div>
                <div className="flex-1">
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Status</p>
                    <span className={`inline-block px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest border ${
                        claim.status === 'approved' ? 'bg-emerald-100 text-emerald-700 border-emerald-200' :
                        claim.status === 'rejected' ? 'bg-rose-100 text-rose-700 border-rose-200' :
                        'bg-blue-100 text-blue-700 border-blue-200'
                    }`}>{claim.status}</span>
                </div>
                <div className="flex-1">
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Requested Amount</p>
                    <p className="font-black text-slate-900 text-lg">{formatVND(claim.amount_requested || 0)}</p>
                </div>
                <Link
                    href={`/claims/${claim.id}`}
                    className="bg-slate-50 text-slate-900 px-6 py-2 rounded-xl font-black text-[10px] uppercase tracking-widest hover:bg-slate-100 border border-slate-200 transition-all"
                >
                    VIEW LOG
                </Link>
              </div>
            ))}
          </div>
        ) : (
          <div className="bg-white p-16 rounded-[2.5rem] shadow-sm border border-dashed border-slate-200 text-center">
            <div className="text-6xl mb-6 grayscale opacity-20">📂</div>
            <p className="text-slate-400 text-lg font-bold mb-4">No insurance claims found in your record</p>
            <p className="text-slate-300 text-sm mb-8">Claims can only be filed against active insurance policies.</p>
          </div>
        )}
      </div>
    </div>
  )
}
