'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { useRouter, useParams } from 'next/navigation'
import { claimsAPI } from '@/lib/api'
import { useAuthStore } from '@/store/auth'

export default function ClaimDetail() {
  const { isAuthenticated } = useAuthStore()
  const router = useRouter()
  const params = useParams()
  const claimId = params.id as string
  const [claim, setClaim] = useState<any>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!isAuthenticated) {
      router.push('/login')
      return
    }
    claimsAPI.getClaim(claimId)
      .then(res => setClaim(res.data))
      .catch(() => setClaim(null))
      .finally(() => setLoading(false))
  }, [isAuthenticated, claimId, router])

  if (loading) return <div className="text-center py-12">Loading...</div>

  if (!claim) {
    return (
      <div className="max-w-2xl mx-auto text-center py-12">
        <p className="text-gray-600 text-lg mb-4">Claim not found.</p>
        <Link href="/claims" className="text-secondary hover:underline">← Back to Claims</Link>
      </div>
    )
  }

  const statusColor =
    claim.status === 'approved' ? 'bg-green-100 text-green-700 border-green-300' :
    claim.status === 'rejected' ? 'bg-red-100 text-red-700 border-red-300' :
    claim.status === 'submitted' ? 'bg-blue-100 text-blue-700 border-blue-300' :
    'bg-yellow-100 text-yellow-700 border-yellow-300'

  const timeline = [
    { step: 'Submitted', done: true },
    { step: 'Under Review', done: ['under_review', 'approved', 'rejected'].includes(claim.status) },
    { step: 'Decision', done: ['approved', 'rejected'].includes(claim.status) },
    { step: 'Settled', done: claim.status === 'approved' },
  ]

  return (
    <div className="max-w-3xl mx-auto">
      <div className="flex items-center gap-4 mb-8">
        <Link href="/claims" className="text-secondary hover:underline">← Back</Link>
        <h1 className="text-3xl font-bold">Claim Details</h1>
      </div>

      <div className="bg-white rounded-lg shadow p-8 space-y-6">
        {/* Header */}
        <div className="flex justify-between items-start pb-6 border-b">
          <div>
            <p className="text-gray-500 text-sm mb-1">Claim Number</p>
            <p className="text-2xl font-bold text-primary">{claim.claim_number}</p>
          </div>
          <span className={`px-4 py-2 rounded-full text-sm font-bold border ${statusColor} capitalize`}>
            {claim.status}
          </span>
        </div>

        {/* Details */}
        <div className="grid grid-cols-2 gap-6">
          <div>
            <p className="text-gray-500 text-sm mb-1">Amount Requested</p>
            <p className="text-xl font-bold text-secondary">${claim.amount_requested}</p>
          </div>
          <div>
            <p className="text-gray-500 text-sm mb-1">Incident Date</p>
            <p className="font-semibold">{claim.incident_date || 'N/A'}</p>
          </div>
          <div>
            <p className="text-gray-500 text-sm mb-1">Policy ID</p>
            <p className="font-semibold text-sm truncate">{claim.policy_id || 'N/A'}</p>
          </div>
          <div>
            <p className="text-gray-500 text-sm mb-1">Submitted</p>
            <p className="font-semibold">
              {claim.created_at ? new Date(claim.created_at).toLocaleDateString() : 'N/A'}
            </p>
          </div>
        </div>

        {/* Description */}
        {claim.description && (
          <div className="bg-gray-50 rounded p-4">
            <p className="text-gray-500 text-sm mb-2">Description</p>
            <p className="text-gray-800">{claim.description}</p>
          </div>
        )}

        {/* Timeline */}
        <div>
          <p className="text-gray-500 text-sm mb-4">Claim Progress</p>
          <div className="flex items-center gap-0">
            {timeline.map((t, i) => (
              <div key={t.step} className="flex items-center flex-1">
                <div className="flex flex-col items-center">
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold ${
                    t.done ? 'bg-secondary text-white' : 'bg-gray-200 text-gray-400'
                  }`}>
                    {t.done ? '✓' : i + 1}
                  </div>
                  <p className={`text-xs mt-1 text-center ${t.done ? 'text-secondary font-semibold' : 'text-gray-400'}`}>
                    {t.step}
                  </p>
                </div>
                {i < timeline.length - 1 && (
                  <div className={`flex-1 h-1 mx-1 mb-4 ${t.done ? 'bg-secondary' : 'bg-gray-200'}`} />
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Actions */}
        <div className="pt-6 border-t">
          <Link href="/claims" className="bg-gray-100 text-gray-700 px-6 py-2 rounded font-bold hover:bg-gray-200">
            All Claims
          </Link>
        </div>
      </div>
    </div>
  )
}
