'use client'

import { useEffect, useState } from 'react'
import apiClient from '@/lib/api'

const STATUS_COLORS: Record<string, string> = {
  active: 'bg-emerald-50 text-emerald-700 ring-emerald-100',
  awaiting_confirmation: 'bg-blue-50 text-blue-700 ring-blue-100 animate-pulse',
  pending_payment: 'bg-amber-50 text-amber-700 ring-amber-100',
  draft: 'bg-slate-50 text-slate-500 ring-slate-100',
  cancelled: 'bg-rose-50 text-rose-700 ring-rose-100',
  expired: 'bg-slate-100 text-slate-600 ring-slate-200',
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

  if (loading) return <div className="text-center py-20 font-black text-slate-300 animate-pulse">Accessing Encrypted Records...</div>

  return (
    <div className="space-y-8">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
            <h1 className="text-3xl font-black text-slate-900 tracking-tight">Policy Registry</h1>
            <p className="text-[10px] text-slate-400 font-black uppercase tracking-[0.2em] mt-1">Global Insurance Monitoring</p>
        </div>
        
        <div className="flex flex-wrap items-center gap-3">
            <select 
                value={filterStatus} 
                onChange={(e) => setFilterStatus(e.target.value)}
                className="bg-white border border-slate-200 rounded-xl px-4 py-2.5 text-[10px] font-black uppercase tracking-widest outline-none shadow-sm focus:ring-2 focus:ring-primary/5 transition-all cursor-pointer"
            >
                <option value="all">⚡ ALL RECORDS</option>
                <option value="awaiting_confirmation">💎 AWAITING</option>
                <option value="pending_payment">⏳ PENDING</option>
                <option value="active">✅ ACTIVE</option>
                <option value="cancelled">❌ VOID</option>
            </select>
            <div className="bg-primary text-white px-4 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest shadow-lg shadow-primary/10">
                Count: {policies.length}
            </div>
        </div>
      </div>

      <div className="bg-white rounded-[2.5rem] shadow-xl shadow-slate-200/60 border border-slate-100 overflow-hidden">
        <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse min-w-[900px]">
            <thead>
                <tr className="bg-slate-50/50 border-b border-slate-100">
                <th className="px-6 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest">Certificate Hash</th>
                <th className="px-6 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest">Premium Valuation</th>
                <th className="px-6 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest">Enrollment</th>
                <th className="px-6 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest">Status Tracking</th>
                <th className="px-6 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest text-right">Verification Protocol</th>
                </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
                {filteredPolicies.length === 0 ? (
                <tr><td colSpan={5} className="text-center py-24 text-slate-300 font-bold italic text-sm">No registry entries found in this sector.</td></tr>
                ) : filteredPolicies.map((policy) => (
                <tr key={policy.id} className="group hover:bg-slate-50/80 transition-all duration-200">
                    <td className="px-6 py-5">
                        <div className="font-black text-slate-900 font-mono text-[13px] tracking-tight group-hover:text-primary transition-colors">{policy.policy_number}</div>
                        <div className="text-[9px] text-slate-400 font-bold uppercase tracking-tighter">CID: {policy.id.slice(0,8)}</div>
                    </td>
                    <td className="px-6 py-5">
                        <div className="font-black text-slate-900 text-sm tracking-tight">{formatVND(policy.premium_amount)}</div>
                    </td>
                    <td className="px-6 py-5">
                        <div className="text-[11px] font-black text-slate-500 tracking-tight">
                            {policy.created_at ? new Date(policy.created_at).toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric' }) : '–'}
                        </div>
                    </td>
                    <td className="px-6 py-5">
                        <span className={`px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-widest ring-1 ring-inset ${STATUS_COLORS[policy.status] || 'bg-slate-100 ring-slate-200'}`}>
                            {policy.status.replace('_', ' ')}
                        </span>
                    </td>
                    <td className="px-6 py-5 text-right">
                    <div className="flex justify-end gap-2">
                        {(policy.status === 'awaiting_confirmation' || policy.status === 'pending_payment') && (
                        <button
                            onClick={() => updateStatus(policy.id, 'active')}
                            disabled={!!updating}
                            className="px-4 py-2 bg-primary text-white text-[9px] font-black uppercase tracking-widest rounded-xl hover:bg-black disabled:opacity-50 transition-all flex items-center gap-2 shadow-lg shadow-primary/20"
                        >
                            {updating === policy.id ? <Spinner /> : '✓ Validate'}
                        </button>
                        )}
                        {policy.status !== 'cancelled' && policy.status !== 'active' && (
                        <button
                            onClick={() => updateStatus(policy.id, 'cancelled')}
                            disabled={!!updating}
                            className="px-4 py-2 bg-white border border-slate-200 text-slate-400 text-[9px] font-black uppercase tracking-widest rounded-xl hover:text-rose-600 hover:border-rose-200 disabled:opacity-50 transition-all"
                        >
                            {updating === policy.id ? <Spinner /> : 'Void Item'}
                        </button>
                        )}
                        {policy.status === 'active' && (
                            <span className="text-[9px] text-emerald-600 font-black uppercase tracking-widest bg-emerald-50 px-4 py-2 rounded-xl ring-1 ring-emerald-100 flex items-center gap-2">
                                <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse"></span>
                                VERIFIED PROTOCOL
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
    return <div className="w-2.5 h-2.5 border-2 border-white/20 border-t-white rounded-full animate-spin"></div>
}
