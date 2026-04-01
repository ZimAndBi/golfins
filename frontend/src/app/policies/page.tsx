'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { policyAPI } from '@/lib/api'
import { useAuthStore } from '@/store/auth'

export default function Policies() {
  const { isAuthenticated, user } = useAuthStore()
  const router = useRouter()
  const [policies, setPolicies] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!isAuthenticated) {
      router.push('/login')
      return
    }

    const fetchPolicies = async () => {
      try {
        const res = await policyAPI.getPolicies(user?.id)
        setPolicies(res.data.policies || [])
      } catch (err) {
        console.error('Failed to fetch policies:', err)
      } finally {
        setLoading(false)
      }
    }

    fetchPolicies()
  }, [isAuthenticated, router])

  if (loading) return <div className="text-center py-12">Loading...</div>

  return (
    <div>
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-4xl font-bold">My Policies</h1>
        <Link href="/quote" className="bg-secondary text-white px-6 py-2 rounded hover:bg-emerald-700">
          New Policy
        </Link>
      </div>

      {policies.length > 0 ? (
        <div className="space-y-4">
          {policies.map((policy: any) => (
            <div key={policy.id} className="bg-white p-6 rounded-lg shadow hover:shadow-lg">
              <div className="grid grid-cols-4 items-center gap-4">
                <div>
                  <p className="text-gray-600 text-sm">Policy Number</p>
                  <p className="font-bold text-lg">{policy.policy_number}</p>
                </div>
                <div>
                  <p className="text-gray-600 text-sm">Status</p>
                  <span className={`inline-block px-3 py-1 rounded-full text-sm font-bold ${
                    policy.status === 'active' ? 'bg-green-100 text-green-700' :
                    policy.status === 'expired' ? 'bg-red-100 text-red-700' :
                    'bg-yellow-100 text-yellow-700'
                  }`}>{policy.status}</span>
                </div>
                <div>
                  <p className="text-gray-600 text-sm">Premium</p>
                  <p className="font-bold">${policy.premium_amount || 'N/A'}</p>
                </div>
                <Link
                  href={`/policies/${policy.id}`}
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
          <p className="text-gray-600 text-lg mb-4">You don't have any policies yet</p>
          <Link href="/quote" className="bg-secondary text-white px-6 py-2 rounded hover:bg-emerald-700">
            Get Your First Quote
          </Link>
        </div>
      )}
    </div>
  )
}
