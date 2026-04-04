'use client'

import { useEffect, useState } from 'react'
import apiClient from '@/lib/api'

const STATUS_COLORS: Record<string, string> = {
  submitted: 'bg-blue-50 text-blue-600 ring-blue-100',
  under_review: 'bg-amber-50 text-amber-600 ring-amber-100',
  approved: 'bg-emerald-50 text-emerald-600 ring-emerald-100',
  rejected: 'bg-rose-50 text-rose-600 ring-rose-100',
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

  if (loading) return <div className="text-center py-20 font-black text-slate-300 animate-pulse">Scanning Claim Registry...</div>

  return (
    <div className="space-y-8">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-black text-slate-900 tracking-tight">Active Claims</h1>
          <p className="text-[10px] text-slate-400 font-black uppercase tracking-[0.2em] mt-1">Registry Monitoring</p>
        </div>
        <div className="bg-primary text-white px-4 py-2 rounded-2xl text-[10px] font-black uppercase tracking-widest shadow-lg shadow-primary/10 self-start md:self-auto uppercase tracking-widest">
            Total Entry: {claims.length}
        </div>
      </div>

      <div className="bg-white rounded-[2rem] shadow-xl shadow-slate-200/50 border border-slate-100 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left border-collapse min-w-[800px]">
            <thead className="bg-slate-50/50 border-b border-slate-100">
              <tr>
                <th className="px-6 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest">Incident #</th>
                <th className="px-6 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest">Valuation</th>
                <th className="px-6 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest">Event Date</th>
                <th className="px-6 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest">Evidence Summary</th>
                <th className="px-6 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest">State</th>
                <th className="px-6 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest text-right">Protocol Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {claims.length === 0 ? (
                <tr><td colSpan={6} className="text-center py-20 text-slate-300 font-bold italic">No claim requests detected in registry.</td></tr>
              ) : claims.map((claim) => (
                <tr key={claim.id} className="group hover:bg-slate-50 transition-colors">
                  <td className="px-6 py-4">
                    <div className="font-black text-slate-900 font-mono text-[12px] tracking-tight">{claim.claim_number}</div>
                    <div className="text-[9px] text-slate-400 font-bold uppercase tracking-tighter">ID-LINK: {claim.id.slice(0,8)}</div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="font-black text-slate-900 text-sm">${Number(claim.amount_requested).toLocaleString()}</div>
                  </td>
                  <td className="px-6 py-4 text-slate-500 font-medium text-[11px]">
                    {claim.incident_date || 'N/A'}
                  </td>
                  <td className="px-6 py-4">
                    <div className="text-slate-400 text-[11px] leading-relaxed max-w-[150px] truncate group-hover:whitespace-normal group-hover:overflow-visible transition-all">
                        {claim.description || '-'}
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <span className={`px-2.5 py-1 rounded-full text-[9px] font-black uppercase tracking-widest ring-1 ring-inset ${STATUS_COLORS[claim.status] || 'bg-slate-100 text-slate-600 ring-slate-200'}`}>
                      {claim.status.replace('_', ' ')}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-right">
                    <div className="flex justify-end gap-2">
                      {claim.status !== 'approved' && (
                        <button
                          onClick={() => updateStatus(claim.id, 'approved')}
                          disabled={updating === claim.id}
                          className="px-3 py-1.5 bg-emerald-500 text-white text-[9px] font-black uppercase tracking-widest rounded-lg hover:bg-emerald-600 disabled:opacity-50 transition-all shadow-sm shadow-emerald-500/20"
                        >
                          Approve
                        </button>
                      )}
                      {claim.status !== 'under_review' && claim.status !== 'approved' && (
                        <button
                          onClick={() => updateStatus(claim.id, 'under_review')}
                          disabled={updating === claim.id}
                          className="px-3 py-1.5 bg-amber-500 text-white text-[9px] font-black uppercase tracking-widest rounded-lg hover:bg-amber-600 disabled:opacity-50 transition-all shadow-sm shadow-amber-500/20"
                        >
                          Review
                        </button>
                      )}
                      {claim.status !== 'rejected' && (
                        <button
                          onClick={() => updateStatus(claim.id, 'rejected')}
                          disabled={updating === claim.id}
                          className="px-3 py-1.5 bg-white border border-rose-200 text-rose-500 text-[9px] font-black uppercase tracking-widest rounded-lg hover:bg-rose-50 disabled:opacity-50 transition-all"
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
    </div>
  )
}
