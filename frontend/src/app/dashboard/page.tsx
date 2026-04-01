'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { policyAPI, claimsAPI } from '@/lib/api'
import { useAuthStore } from '@/store/auth'

export default function Dashboard() {
  const { isAuthenticated, user } = useAuthStore()
  const router = useRouter()
  const [policies, setPolicies] = useState<any[]>([])
  const [claims, setClaims] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!isAuthenticated) {
      router.push('/login')
      return
    }

    const fetchData = async () => {
      try {
        const [policiesRes, claimsRes] = await Promise.all([
          policyAPI.getPolicies(user?.id),
          claimsAPI.getClaims(user?.id),
        ])
        setPolicies(policiesRes.data.policies || [])
        setClaims(claimsRes.data.claims || [])
      } catch (err) {
        console.error('Failed to fetch data:', err)
      } finally {
        setLoading(false)
      }
    }

    fetchData()
  }, [isAuthenticated, router, user?.id])

  if (loading) return <div className="text-center py-12">Loading...</div>

  const activePolicies = policies.filter((p: any) => p.status === 'active')
  const pendingClaims = claims.filter((c: any) => c.status === 'submitted' || c.status === 'under_review')
  const displayName = (user as any)?.first_name || (user as any)?.firstName || user?.email?.split('@')[0] || 'there'

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-4xl font-bold mb-2">Welcome, {displayName}!</h1>
        <p className="text-gray-600">Manage your golf insurance policies and claims</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        <div className="bg-white p-5 rounded-lg shadow text-center">
          <p className="text-3xl font-bold text-secondary">{policies.length}</p>
          <p className="text-gray-500 text-sm mt-1">Total Policies</p>
        </div>
        <div className="bg-white p-5 rounded-lg shadow text-center">
          <p className="text-3xl font-bold text-green-600">{activePolicies.length}</p>
          <p className="text-gray-500 text-sm mt-1">Active Policies</p>
        </div>
        <div className="bg-white p-5 rounded-lg shadow text-center">
          <p className="text-3xl font-bold text-primary">{claims.length}</p>
          <p className="text-gray-500 text-sm mt-1">Total Claims</p>
        </div>
        <div className="bg-white p-5 rounded-lg shadow text-center">
          <p className="text-3xl font-bold text-accent">{pendingClaims.length}</p>
          <p className="text-gray-500 text-sm mt-1">Pending Claims</p>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
        <Link href="/quote" className="bg-secondary text-white p-6 rounded-lg hover:bg-emerald-700 transition">
          <div className="text-3xl mb-2">📊</div>
          <h2 className="font-bold">New Quote</h2>
          <p className="text-sm opacity-80">Get an insurance quote</p>
        </Link>
        <Link href="/policies" className="bg-primary text-white p-6 rounded-lg hover:bg-gray-800 transition">
          <div className="text-3xl mb-2">📄</div>
          <h2 className="font-bold">My Policies</h2>
          <p className="text-sm opacity-80">{activePolicies.length} active of {policies.length} total</p>
        </Link>
        <Link href="/claims" className="bg-accent text-black p-6 rounded-lg hover:bg-amber-600 transition">
          <div className="text-3xl mb-2">🚨</div>
          <h2 className="font-bold">My Claims</h2>
          <p className="text-sm">{pendingClaims.length} pending of {claims.length} total</p>
        </Link>
      </div>

      {/* Recent Policies */}
      <div className="bg-white p-6 rounded-lg shadow mb-6">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-bold">Recent Policies</h2>
          <Link href="/policies" className="text-secondary text-sm hover:underline">View all →</Link>
        </div>
        {policies.length > 0 ? (
          <div className="divide-y">
            {policies.slice(0, 5).map((policy: any) => (
              <div key={policy.id} className="flex justify-between items-center py-3 hover:bg-gray-50 px-2 rounded">
                <div>
                  <p className="font-semibold">{policy.policy_number}</p>
                  <p className="text-sm text-gray-500">${policy.premium_amount} premium</p>
                </div>
                <div className="flex items-center gap-3">
                  <span className={`text-xs px-2 py-1 rounded-full font-semibold ${
                    policy.status === 'active' ? 'bg-green-100 text-green-700' :
                    policy.status === 'expired' ? 'bg-red-100 text-red-700' :
                    'bg-yellow-100 text-yellow-700'
                  }`}>{policy.status}</span>
                  <Link href={`/policies/${policy.id}`} className="text-secondary hover:underline text-sm">View</Link>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-gray-500">No policies yet. <Link href="/quote" className="text-secondary hover:underline">Get a quote →</Link></p>
        )}
      </div>

      {/* Recent Claims */}
      <div className="bg-white p-6 rounded-lg shadow">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-bold">Recent Claims</h2>
          <Link href="/claims" className="text-secondary text-sm hover:underline">View all →</Link>
        </div>
        {claims.length > 0 ? (
          <div className="divide-y">
            {claims.slice(0, 5).map((claim: any) => (
              <div key={claim.id} className="flex justify-between items-center py-3 hover:bg-gray-50 px-2 rounded">
                <div>
                  <p className="font-semibold">{claim.claim_number}</p>
                  <p className="text-sm text-gray-500">${claim.amount_requested} • {claim.incident_date || 'N/A'}</p>
                </div>
                <div className="flex items-center gap-3">
                  <span className={`text-xs px-2 py-1 rounded-full font-semibold ${
                    claim.status === 'approved' ? 'bg-green-100 text-green-700' :
                    claim.status === 'rejected' ? 'bg-red-100 text-red-700' :
                    'bg-blue-100 text-blue-700'
                  }`}>{claim.status}</span>
                  <Link href={`/claims/${claim.id}`} className="text-secondary hover:underline text-sm">View</Link>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-gray-500">No claims yet. <Link href="/claims?new=true" className="text-secondary hover:underline">Submit a claim →</Link></p>
        )}
      </div>
    </div>
  )
}
