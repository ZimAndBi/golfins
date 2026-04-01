'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { useRouter, useParams } from 'next/navigation'
import { policyAPI } from '@/lib/api'
import { useAuthStore } from '@/store/auth'

export default function PolicyDetail() {
  const { isAuthenticated } = useAuthStore()
  const router = useRouter()
  const params = useParams()
  const policyId = params.id as string
  const [policy, setPolicy] = useState<any>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!isAuthenticated) {
      router.push('/login')
      return
    }
    policyAPI.getPolicy(policyId)
      .then(res => setPolicy(res.data))
      .catch(() => setPolicy(null))
      .finally(() => setLoading(false))
  }, [isAuthenticated, policyId, router])

  if (loading) return <div className="text-center py-12">Loading...</div>

  if (!policy) {
    return (
      <div className="max-w-2xl mx-auto text-center py-12">
        <p className="text-gray-600 text-lg mb-4">Policy not found.</p>
        <Link href="/policies" className="text-secondary hover:underline">← Back to Policies</Link>
      </div>
    )
  }

  const statusColor =
    policy.status === 'active' ? 'bg-green-100 text-green-700 border-green-300' :
    policy.status === 'expired' ? 'bg-red-100 text-red-700 border-red-300' :
    'bg-yellow-100 text-yellow-700 border-yellow-300'

  return (
    <div className="max-w-3xl mx-auto">
      <div className="flex items-center gap-4 mb-8">
        <Link href="/policies" className="text-secondary hover:underline">← Back</Link>
        <h1 className="text-3xl font-bold">Policy Details</h1>
      </div>

      <div className="bg-white rounded-lg shadow p-8 space-y-6">
        {/* Header */}
        <div className="flex justify-between items-start pb-6 border-b">
          <div>
            <p className="text-gray-500 text-sm mb-1">Policy Number</p>
            <p className="text-2xl font-bold text-primary">{policy.policy_number}</p>
          </div>
          <span className={`px-4 py-2 rounded-full text-sm font-bold border ${statusColor} capitalize`}>
            {policy.status}
          </span>
        </div>

        {/* Details */}
        <div className="grid grid-cols-2 gap-6">
          <div>
            <p className="text-gray-500 text-sm mb-1">Premium Amount</p>
            <p className="text-xl font-bold text-secondary">${policy.premium_amount}</p>
          </div>
          <div>
            <p className="text-gray-500 text-sm mb-1">Product</p>
            <p className="font-semibold">{policy.product_id || 'Golf Insurance'}</p>
          </div>
          <div>
            <p className="text-gray-500 text-sm mb-1">Created</p>
            <p className="font-semibold">
              {policy.created_at ? new Date(policy.created_at).toLocaleDateString() : 'N/A'}
            </p>
          </div>
          <div>
            <p className="text-gray-500 text-sm mb-1">Last Updated</p>
            <p className="font-semibold">
              {policy.updated_at ? new Date(policy.updated_at).toLocaleDateString() : 'N/A'}
            </p>
          </div>
        </div>

        {/* Actions */}
        <div className="pt-6 border-t flex gap-4 flex-wrap">
          <a
            href={`/api/documents/certificate/${policy.id}`}
            target="_blank"
            rel="noopener noreferrer"
            className="bg-primary text-white px-6 py-2 rounded font-bold hover:bg-blue-900 flex items-center gap-2"
          >
            ↓ Download Certificate
          </a>
          <Link
            href={`/claims?new=true&policy_id=${policy.id}`}
            className="bg-secondary text-white px-6 py-2 rounded font-bold hover:bg-emerald-700"
          >
            Submit Claim
          </Link>
          <Link
            href="/policies"
            className="bg-gray-100 text-gray-700 px-6 py-2 rounded font-bold hover:bg-gray-200"
          >
            All Policies
          </Link>
        </div>
      </div>
    </div>
  )
}
