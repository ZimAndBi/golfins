'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { useRouter, useSearchParams } from 'next/navigation'
import { claimsAPI, policyAPI } from '@/lib/api'
import { useAuthStore } from '@/store/auth'

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
        setPolicies(policiesRes.data.policies || [])
      } catch (err) {
        console.error('Failed to fetch data:', err)
      } finally {
        setLoading(false)
      }
    }

    fetchData()
  }, [isAuthenticated, router])

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
      const res = await claimsAPI.getClaims()
      setClaims(res.data.claims || [])
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Failed to submit claim')
    } finally {
      setSubmitting(false)
    }
  }

  if (loading) return <div className="text-center py-12">Loading...</div>

  const showForm = searchParams.get('new') === 'true'

  return (
    <div>
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-4xl font-bold">Insurance Claims</h1>
        {!showForm && (
          <div className="flex gap-3">
            <Link href="/claims/hole-in-one" className="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700 font-medium flex items-center gap-1">
              ⛳ Hole-in-One
            </Link>
            <Link href="/claims?new=true" className="bg-secondary text-white px-6 py-2 rounded hover:bg-emerald-700">
              New Claim
            </Link>
          </div>
        )}
      </div>

      {showForm && (
        <div className="bg-white p-8 rounded-lg shadow mb-8">
          <h2 className="text-2xl font-bold mb-6">Submit a Claim</h2>
          {error && <div className="bg-red-100 text-red-700 p-4 rounded mb-4">{error}</div>}

          <form onSubmit={handleSubmitClaim} className="space-y-4">
            <div>
              <label className="block font-semibold mb-2">Select Policy</label>
              <select
                value={formData.policy_id}
                onChange={(e) => setFormData({ ...formData, policy_id: e.target.value })}
                required
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-secondary"
              >
                <option value="">-- Select a policy --</option>
                {policies.map((p: any) => (
                  <option key={p.id} value={p.id}>
                    {p.number}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block font-semibold mb-2">Incident Date</label>
              <input
                type="date"
                value={formData.incident_date}
                onChange={(e) => setFormData({ ...formData, incident_date: e.target.value })}
                required
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-secondary"
              />
            </div>

            <div>
              <label className="block font-semibold mb-2">Description</label>
              <textarea
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                required
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-secondary"
                rows={4}
                placeholder="Describe what happened..."
              />
            </div>

            <div>
              <label className="block font-semibold mb-2">Claim Amount ($)</label>
              <input
                type="number"
                step="0.01"
                value={formData.amount}
                onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
                required
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-secondary"
              />
            </div>

            <div className="flex gap-4">
              <button
                type="submit"
                disabled={submitting}
                className="flex-1 bg-secondary text-white font-bold py-2 rounded hover:bg-emerald-700 disabled:opacity-50"
              >
                {submitting ? 'Submitting...' : 'Submit Claim'}
              </button>
              <Link
                href="/claims"
                className="flex-1 bg-gray-300 text-black font-bold py-2 rounded text-center hover:bg-gray-400"
              >
                Cancel
              </Link>
            </div>
          </form>
        </div>
      )}

      {/* Claims List */}
      <div>
        <h2 className="text-2xl font-bold mb-4">Your Claims</h2>
        {claims.length > 0 ? (
          <div className="space-y-4">
            {claims.map((claim: any) => (
              <div key={claim.id} className="bg-white p-6 rounded-lg shadow hover:shadow-lg">
                <div className="grid grid-cols-4 items-center gap-4">
                  <div>
                    <p className="text-gray-600 text-sm">Claim Number</p>
                    <p className="font-bold">{claim.claim_number}</p>
                  </div>
                  <div>
                    <p className="text-gray-600 text-sm">Status</p>
                    <p className="font-bold capitalize">{claim.status}</p>
                  </div>
                  <div>
                    <p className="text-gray-600 text-sm">Amount</p>
                    <p className="font-bold">${claim.amount_requested}</p>
                  </div>
                  <Link
                    href={`/claims/${claim.id}`}
                    className="bg-secondary text-white px-4 py-2 rounded text-center hover:bg-emerald-700"
                  >
                    View Details
                  </Link>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="bg-white p-8 rounded-lg shadow text-center">
            <p className="text-gray-600 text-lg mb-4">No claims submitted yet</p>
            <Link href="/claims?new=true" className="bg-secondary text-white px-6 py-2 rounded hover:bg-emerald-700">
              Submit Your First Claim
            </Link>
          </div>
        )}
      </div>
    </div>
  )
}
