'use client'

import { useEffect, useState } from 'react'
import apiClient from '@/lib/api'

const STATUS_COLORS: Record<string, string> = {
  active: 'bg-green-100 text-green-700',
  draft: 'bg-yellow-100 text-yellow-700',
  cancelled: 'bg-red-100 text-red-700',
  expired: 'bg-gray-100 text-gray-600',
}

export default function AdminPolicies() {
  const [policies, setPolicies] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [updating, setUpdating] = useState<string | null>(null)

  const fetchPolicies = async () => {
    try {
      const res = await apiClient.get('/policies')
      setPolicies(res.data.policies || [])
    } catch (err) {
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { fetchPolicies() }, [])

  const updateStatus = async (policyId: string, newStatus: string) => {
    setUpdating(policyId)
    try {
      await apiClient.patch(`/policies/${policyId}/status`, { status: newStatus })
      await fetchPolicies()
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
        <h1 className="text-3xl font-bold">All Policies</h1>
        <span className="text-gray-500 text-sm">{policies.length} total</span>
      </div>

      <div className="bg-white rounded-lg shadow overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 border-b">
            <tr>
              <th className="text-left px-4 py-3 font-semibold text-gray-600">Policy #</th>
              <th className="text-left px-4 py-3 font-semibold text-gray-600">Premium</th>
              <th className="text-left px-4 py-3 font-semibold text-gray-600">Created</th>
              <th className="text-left px-4 py-3 font-semibold text-gray-600">Status</th>
              <th className="text-left px-4 py-3 font-semibold text-gray-600">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y">
            {policies.length === 0 ? (
              <tr><td colSpan={5} className="text-center py-8 text-gray-400">No policies found</td></tr>
            ) : policies.map((policy) => (
              <tr key={policy.id} className="hover:bg-gray-50">
                <td className="px-4 py-3 font-mono font-semibold">{policy.policy_number}</td>
                <td className="px-4 py-3 font-semibold">${policy.premium_amount}</td>
                <td className="px-4 py-3 text-gray-500">
                  {policy.created_at ? new Date(policy.created_at).toLocaleDateString() : 'N/A'}
                </td>
                <td className="px-4 py-3">
                  <span className={`px-2 py-1 rounded-full text-xs font-semibold ${STATUS_COLORS[policy.status] || 'bg-gray-100'}`}>
                    {policy.status}
                  </span>
                </td>
                <td className="px-4 py-3">
                  <div className="flex gap-2">
                    {policy.status !== 'active' && (
                      <button
                        onClick={() => updateStatus(policy.id, 'active')}
                        disabled={updating === policy.id}
                        className="px-3 py-1 bg-green-500 text-white text-xs rounded hover:bg-green-600 disabled:opacity-50"
                      >
                        Activate
                      </button>
                    )}
                    {policy.status !== 'cancelled' && (
                      <button
                        onClick={() => updateStatus(policy.id, 'cancelled')}
                        disabled={updating === policy.id}
                        className="px-3 py-1 bg-red-500 text-white text-xs rounded hover:bg-red-600 disabled:opacity-50"
                      >
                        Cancel
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
