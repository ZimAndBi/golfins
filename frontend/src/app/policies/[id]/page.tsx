'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { useRouter, useParams } from 'next/navigation'
import { policyAPI } from '@/lib/api'
import { useAuthStore } from '@/store/auth'

function formatVND(amount: number): string {
  return new Intl.NumberFormat('vi-VN').format(Math.round(amount)) + ' ₫'
}

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
      .catch((err) => {
          console.error(err)
          setPolicy(null)
      })
      .finally(() => setLoading(false))
  }, [isAuthenticated, policyId, router])

  if (loading) return <div className="min-h-screen flex items-center justify-center font-black text-slate-400">Loading details...</div>

  if (!policy) {
    return (
      <div className="max-w-2xl mx-auto text-center py-20 px-4">
        <div className="text-4xl mb-6 grayscale opacity-20">🔎</div>
        <h2 className="text-2xl font-black text-slate-900 mb-2">Policy Record Not Found</h2>
        <p className="text-slate-400 mb-8">The request policy with ID: {policyId} does not exist in our registry.</p>
        <Link href="/policies" className="bg-slate-900 text-white px-8 py-3 rounded-full font-black text-xs uppercase tracking-widest hover:bg-black transition-all shadow-xl shadow-slate-200">← Back to List</Link>
      </div>
    )
  }

  return (
    <div className="max-w-4xl mx-auto py-12 px-4 space-y-8">
      
      {/* Alert for Payment */}
      {policy.status === 'pending_payment' && (
        <div className="bg-amber-500 rounded-3xl p-6 shadow-xl shadow-amber-500/20 border-2 border-amber-400 flex flex-col md:flex-row items-center justify-between gap-6">
            <div className="flex items-center gap-4 text-white">
                <span className="text-4xl">⚠️</span>
                <div>
                    <h3 className="text-xl font-black leading-tight">Payment Required</h3>
                    <p className="text-sm font-bold opacity-80 mt-1">This policy is drafted but not active. Proceed to payment to get protection.</p>
                </div>
            </div>
            <Link 
                href={`/checkout/${policy.id}`}
                className="bg-slate-900 text-white px-8 py-3 rounded-2xl font-black text-sm hover:bg-black transition-all shadow-lg active:scale-95"
            >
                COMPLETE PAYMENT NOW →
            </Link>
        </div>
      )}

      {/* Main Info Card */}
      <div className="bg-white rounded-[2.5rem] shadow-sm border border-slate-100 overflow-hidden">
        
        {/* Header - Slate Theme */}
        <div className="bg-slate-900 p-10 text-white flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div>
            <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-2">Insurance Certificate Number</p>
            <h1 className="text-3xl font-black tracking-tight">{policy.policy_number}</h1>
          </div>
          <div className="flex flex-col items-end">
            <span className={`px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest border ${
                policy.status === 'active' ? 'bg-emerald-500 text-white border-emerald-400' :
                policy.status === 'pending_payment' ? 'bg-amber-500 text-black border-amber-400' :
                'bg-slate-700 text-slate-300 border-slate-600'
            }`}>
              {policy.status.replace('_', ' ')}
            </span>
            <p className="text-[10px] font-bold text-slate-500 mt-2 italic uppercase">System Verified ✓</p>
          </div>
        </div>

        <div className="p-10 space-y-10">
            {/* Grid Stats */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
                <div>
                    <SummaryItem label="Total Premium" value={formatVND(policy.premium_amount)} color="text-blue-600" />
                </div>
                <div>
                    <SummaryItem label="Insurance Program" value="GOLF PRO ANNUAL" color="text-slate-900" />
                </div>
                <div>
                    <SummaryItem label="Issued Date" value={policy.created_at ? new Date(policy.created_at).toLocaleDateString() : 'N/A'} color="text-slate-900" />
                </div>
                <div>
                    <SummaryItem label="Currency" value="VND (₫)" color="text-slate-900" />
                </div>
            </div>

            {/* Content Logic Layer */}
            <div className="pt-10 border-t border-slate-50">
                <h3 className="text-xs font-black uppercase tracking-widest text-slate-400 mb-6">Service Operations</h3>
                <div className="flex flex-wrap gap-4">
                  
                  {policy.status === 'active' && (
                    <a
                        href={`/api/documents/certificate/${policy.id}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="bg-slate-900 text-white px-8 py-3 rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-black transition-all flex items-center gap-3 shadow-lg shadow-slate-200"
                    >
                        📄 Download E-Certificate
                    </a>
                  )}

                  {policy.status === 'active' ? (
                    <Link
                        href={`/claims?new=true&policy_id=${policy.id}`}
                        className="bg-white border-2 border-slate-100 text-slate-900 px-8 py-3 rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-emerald-50 hover:border-emerald-200 transition-all shadow-sm"
                    >
                        🚩 Submit Claim
                    </Link>
                  ) : (
                    <button
                        disabled
                        title="You can only submit claims for ACTIVE policies."
                        className="bg-slate-50 border-2 border-slate-100 text-slate-300 px-8 py-3 rounded-2xl font-black text-xs uppercase tracking-widest cursor-not-allowed opacity-50"
                    >
                        🚩 Submit Claim
                    </button>
                  )}

                  <Link
                    href="/policies"
                    className="text-[10px] font-black text-slate-400 uppercase tracking-widest hover:text-slate-900 flex items-center"
                  >
                    ← BACK TO LIST
                  </Link>
                </div>
            </div>
        </div>
      </div>

    </div>
  )
}

function SummaryItem({ label, value, color }: { label: string; value: string; color: string }) {
    return (
        <div className="space-y-1.5">
            <h4 className="text-[10px] font-black uppercase tracking-widest text-slate-400">{label}</h4>
            <p className={`text-lg font-black tracking-tight ${color}`}>{value}</p>
        </div>
    )
}
