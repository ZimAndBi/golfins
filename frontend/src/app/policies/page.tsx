'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { policyAPI } from '@/lib/api'
import { useAuthStore } from '@/store/auth'

function formatVND(amount: number): string {
  return new Intl.NumberFormat('vi-VN').format(Math.round(amount)) + ' ₫'
}

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
  }, [isAuthenticated, router, user?.id])

  if (loading) return <div className="text-center py-20 font-bold text-slate-400">Loading your policies...</div>

  return (
    <div className="max-w-5xl mx-auto py-8 px-4">
      <div className="flex justify-between items-center mb-10">
        <h1 className="text-4xl font-black text-slate-900 tracking-tight">My Policies</h1>
        <Link href="/quote" className="bg-blue-600 text-white px-8 py-3 rounded-2xl font-black shadow-lg shadow-blue-500/20 hover:bg-blue-700 transition-all">
          + New Policy
        </Link>
      </div>

      {policies.length > 0 ? (
        <div className="grid grid-cols-1 gap-6">
          {policies.map((policy: any) => (
            <div key={policy.id} className="bg-white p-8 rounded-[2rem] shadow-sm border border-slate-100 hover:shadow-xl hover:shadow-slate-200/50 transition-all group">
              <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
                
                <div className="flex-1">
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Policy ID</p>
                  <p className="font-black text-xl text-slate-900 font-mono">{policy.policy_number}</p>
                </div>

                <div className="flex-1">
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Status</p>
                  <StatusBadge status={policy.status} />
                </div>

                <div className="flex-1">
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Total Premium</p>
                  <p className="font-black text-xl text-slate-900">{formatVND(policy.premium_amount)}</p>
                </div>

                <div className="flex items-center gap-3">
                  {policy.status === 'pending_payment' && (
                    <Link
                      href={`/checkout/${policy.id}`}
                      className="bg-amber-500 text-black px-6 py-3 rounded-2xl font-black text-sm hover:bg-amber-600 shadow-lg shadow-amber-500/20 transition-all border-2 border-amber-400"
                    >
                      💳 PAY NOW
                    </Link>
                  )}
                  <Link
                    href={`/policies/${policy.id}`}
                    className="bg-slate-50 text-slate-900 px-6 py-3 rounded-2xl font-black text-sm hover:bg-slate-100 border border-slate-200 transition-all"
                  >
                    VIEW DETAILS
                  </Link>
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="bg-white p-16 rounded-[2.5rem] shadow-sm border border-dashed border-slate-200 text-center">
          <div className="text-6xl mb-6 grayscale opacity-20">🛡️</div>
          <p className="text-slate-400 text-lg font-bold mb-8">You don't have any insurance policies yet</p>
          <Link href="/quote" className="bg-slate-900 text-white px-10 py-4 rounded-full font-black hover:bg-black transition-all">
            Get Protected Now →
          </Link>
        </div>
      )}
    </div>
  )
}

function StatusBadge({ status }: { status: string }) {
    const config: any = {
        active: 'bg-emerald-100 text-emerald-700',
        expired: 'bg-rose-100 text-rose-700',
        pending_payment: 'bg-amber-100 text-amber-700 animate-pulse',
        awaiting_confirmation: 'bg-blue-100 text-blue-700',
        cancelled: 'bg-slate-100 text-slate-500',
        draft: 'bg-slate-50 text-slate-400'
    }
    return (
        <span className={`inline-block px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest ${config[status] || config.draft}`}>
            {status.replace('_', ' ')}
        </span>
    )
}
