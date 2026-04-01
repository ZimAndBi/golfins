'use client'

import { useEffect, useState } from 'react'
import apiClient from '@/lib/api'

const STATUS_COLORS: Record<string, string> = {
  submitted: 'bg-blue-100 text-blue-700',
  under_review: 'bg-yellow-100 text-yellow-700',
  approved: 'bg-green-100 text-green-700',
  rejected: 'bg-red-100 text-red-700',
}

export default function AdminClaims() {
  const [claims, setClaims] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [updating, setUpdating] = useState<string | null>(null)

  const fetchClaims = async () => {
    try {
      const res = await apiClient.get('/claims')
      setClaims(res.data.claims || [])
    } catch (err) {
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { fetchClaims() }, [])

  const updateStatus = async (claimId: string, newStatus: string) => {
    setUpdating(claimId)
    try {
      await apiClient.patch(`/claims/${claimId}/status`, { status: newStatus })
      await fetchClaims()
    } catch (err) {
      console.error('Failed to update status:', err)
    } finally {
      setUpdating(null)
    }
  }

  if (loading) return <div className="text-center py-12">Loading...</div>

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">All Claims</h1>
        <span className="text-gray-500 text-sm">{claims.length} total</span>
      </div>

      <div className="bg-white rounded-lg shadow overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 border-b">
            <tr>
              <th className="text-left px-4 py-3 font-semibold text-gray-600">Claim #</th>
              <th className="text-left px-4 py-3 font-semibold text-gray-600">Amount</th>
              <th className="text-left px-4 py-3 font-semibold text-gray-600">Date</th>
              <th className="text-left px-4 py-3 font-semibold text-gray-600">Description</th>
              <th className="text-left px-4 py-3 font-semibold text-gray-600">Status</th>
              <th className="text-left px-4 py-3 font-semibold text-gray-600">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y">
            {claims.length === 0 ? (
              <tr><td colSpan={6} className="text-center py-8 text-gray-400">No claims found</td></tr>
            ) : claims.map((claim) => (
              <tr key={claim.id} className="hover:bg-gray-50">
                <td className="px-4 py-3 font-mono font-semibold">{claim.claim_number}</td>
                <td className="px-4 py-3 font-semibold">${claim.amount_requested}</td>
                <td className="px-4 py-3 text-gray-500">{claim.incident_date || 'N/A'}</td>
                <td className="px-4 py-3 text-gray-600 max-w-xs truncate">{claim.description || '-'}</td>
                <td className="px-4 py-3">
                  <span className={`px-2 py-1 rounded-full text-xs font-semibold ${STATUS_COLORS[claim.status] || 'bg-gray-100 text-gray-600'}`}>
                    {claim.status}
                  </span>
                </td>
                <td className="px-4 py-3">
                  <div className="flex gap-2">
                    {claim.status !== 'approved' && (
                      <button
                        onClick={() => updateStatus(claim.id, 'approved')}
                        disabled={updating === claim.id}
                        className="px-3 py-1 bg-green-500 text-white text-xs rounded hover:bg-green-600 disabled:opacity-50"
                      >
                        Approve
                      </button>
                    )}
                    {claim.status !== 'under_review' && claim.status !== 'approved' && (
                      <button
                        onClick={() => updateStatus(claim.id, 'under_review')}
                        disabled={updating === claim.id}
                        className="px-3 py-1 bg-yellow-500 text-white text-xs rounded hover:bg-yellow-600 disabled:opacity-50"
                      >
                        Review
                      </button>
                    )}
                    {claim.status !== 'rejected' && (
                      <button
                        onClick={() => updateStatus(claim.id, 'rejected')}
                        disabled={updating === claim.id}
                        className="px-3 py-1 bg-red-500 text-white text-xs rounded hover:bg-red-600 disabled:opacity-50"
                      >
                        Reject
                      </button>
                    )}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
