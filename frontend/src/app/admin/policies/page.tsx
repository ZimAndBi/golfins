'use client'

import { useEffect, useState } from 'react'
import apiClient from '@/lib/api'

const STATUS_COLORS: Record<string, string> = {
  active: 'bg-emerald-100 text-emerald-700 border-emerald-200',
  awaiting_confirmation: 'bg-blue-100 text-blue-700 border-blue-200 animate-pulse',
  pending_payment: 'bg-amber-100 text-amber-700 border-amber-200',
  draft: 'bg-slate-100 text-slate-500 border-slate-200',
  cancelled: 'bg-rose-100 text-rose-700 border-rose-200',
  expired: 'bg-slate-200 text-slate-600 border-slate-300',
}

function formatVND(amount: number): string {
  return new Intl.NumberFormat('vi-VN').format(Math.round(amount)) + ' ₫'
}

export default function AdminPolicies() {
  const [policies, setPolicies] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [updating, setUpdating] = useState<string | null>(null)
  const [filterStatus, setFilterStatus] = useState<string>('all')

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
    const confirmMsg = newStatus === 'active' 
        ? "Confirm payment and ACTIVATE this policy?" 
        : `Change status to ${newStatus}?`;
        
    if (!window.confirm(confirmMsg)) return;

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

  const filteredPolicies = filterStatus === 'all' 
    ? policies 
    : policies.filter(p => p.status === filterStatus);

  if (loading) return <div className="text-center py-20 font-black text-slate-300">Initializing...</div>

  return (
    <div className="space-y-6 max-w-[1280px] mx-auto px-4">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 py-6 border-b border-slate-100">
        <div>
            <h1 className="text-2xl font-black text-slate-900 tracking-tight">Policy Registry</h1>
            <p className="text-[10px] text-slate-400 font-black uppercase tracking-widest mt-1">Global Insurance Monitoring</p>
        </div>
        
        <div className="flex items-center gap-3">
            <select 
                value={filterStatus} 
                onChange={(e) => setFilterStatus(e.target.value)}
                className="bg-white border border-slate-200 rounded-xl px-3 py-2 text-[10px] font-black uppercase tracking-widest outline-none shadow-sm"
            >
                <option value="all">⚡ ALL RECORDS</option>
                <option value="awaiting_confirmation">💎 AWAITING</option>
                <option value="pending_payment">⏳ PENDING</option>
                <option value="active">✅ ACTIVE</option>
                <option value="cancelled">❌ VOID</option>
            </select>
            <div className="bg-slate-100 px-3 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest">
                Count: {policies.length}
            </div>
        </div>
      </div>

      <div className="bg-white rounded-[2rem] shadow-sm border border-slate-100 overflow-hidden">
        <div className="overflow-x-auto">
            <table className="w-full text-left table-fixed min-w-[800px]">
            <thead>
                <tr className="bg-slate-50/50 border-b border-slate-50">
                <th className="w-[180px] px-6 py-4 text-[9px] font-black text-slate-400 uppercase tracking-widest">Certificate #</th>
                <th className="w-[140px] px-6 py-4 text-[9px] font-black text-slate-400 uppercase tracking-widest">Premium</th>
                <th className="w-[120px] px-6 py-4 text-[9px] font-black text-slate-400 uppercase tracking-widest">Enrollment</th>
                <th className="w-[200px] px-6 py-4 text-[9px] font-black text-slate-400 uppercase tracking-widest">Status Tracking</th>
                <th className="px-6 py-4 text-[9px] font-black text-slate-400 uppercase tracking-widest text-right">Verification Actions</th>
                </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
                {filteredPolicies.length === 0 ? (
                <tr><td colSpan={5} className="text-center py-16 text-slate-300 font-bold italic text-sm">No registry entries.</td></tr>
                ) : filteredPolicies.map((policy) => (
                <tr key={policy.id} className="hover:bg-slate-50 transition-colors">
                    <td className="px-6 py-4">
                        <div className="font-black text-slate-900 font-mono text-[13px] tracking-tight truncate">{policy.policy_number}</div>
                        <div className="text-[9px] text-slate-400 font-bold uppercase tracking-tight">UUID-ID: {policy.id.slice(0,6)}</div>
                    </td>
                    <td className="px-6 py-4">
                        <div className="font-black text-slate-900 text-sm">{formatVND(policy.premium_amount)}</div>
                    </td>
                    <td className="px-6 py-4">
                        <div className="text-[11px] font-black text-slate-600 tracking-tight">
                            {policy.created_at ? new Date(policy.created_at).toLocaleDateString('vi-VN') : '–'}
                        </div>
                    </td>
                    <td className="px-6 py-4">
                        <span className={`px-2.5 py-1 rounded-full text-[9px] font-black uppercase tracking-widest border ${STATUS_COLORS[policy.status] || 'bg-slate-100'}`}>
                            {policy.status.replace('_', ' ')}
                        </span>
                    </td>
                    <td className="px-6 py-4 text-right">
                    <div className="flex justify-end gap-2">
                        {(policy.status === 'awaiting_confirmation' || policy.status === 'pending_payment') && (
                        <button
                            onClick={() => updateStatus(policy.id, 'active')}
                            disabled={!!updating}
                            className="px-3 py-1.5 bg-slate-900 text-white text-[9px] font-black uppercase tracking-widest rounded-lg hover:bg-black disabled:opacity-50 transition-all flex items-center gap-2"
                        >
                            {updating === policy.id ? <Spinner /> : '✓ Confirm'}
                        </button>
                        )}
                        {policy.status !== 'cancelled' && policy.status !== 'active' && (
                        <button
                            onClick={() => updateStatus(policy.id, 'cancelled')}
                            disabled={!!updating}
                            className="px-3 py-1.5 bg-white border border-slate-200 text-slate-400 text-[9px] font-black uppercase tracking-widest rounded-lg hover:text-rose-600 hover:border-rose-200 disabled:opacity-50 transition-all"
                        >
                            {updating === policy.id ? <Spinner /> : 'Void'}
                        </button>
                        )}
                        {policy.status === 'active' && (
                            <span className="text-[9px] text-emerald-500 font-black uppercase tracking-widest bg-emerald-50 px-3 py-1.5 rounded-lg border border-emerald-100 ring-1 ring-emerald-200">
                                Verified ✓
                            </span>
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

function Spinner() {
    return <div className="w-2 h-2 border-2 border-white/20 border-t-white rounded-full animate-spin"></div>
}
