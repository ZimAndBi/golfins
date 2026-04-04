'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import apiClient from '@/lib/api'

export default function AdminDashboard() {
  const [stats, setStats] = useState<any>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const [userStats, policyStats, claimStats, premiumStats] = await Promise.all([
          apiClient.get('/api/admin'), // Fixed to full path if needed, but proxy handles it
          apiClient.get('/admin/policies/stats'),
          apiClient.get('/admin/claims/stats'),
          apiClient.get('/admin/premium/stats'),
        ])
        setStats({
          users: userStats.data,
          policies: policyStats.data,
          claims: claimStats.data,
          premium: premiumStats.data,
        })
      } catch (err) {
        console.error('Failed to load stats:', err)
      } finally {
        setLoading(false)
      }
    }
    fetchStats()
  }, [])

  if (loading) return <div className="text-center py-20 text-foreground animate-pulse font-bold">Initializing Admin Dashboard...</div>

  return (
    <div className="space-y-10">
      <div className="flex items-center justify-between">
        <h1 className="text-4xl font-black text-foreground tracking-tight">Admin Dashboard</h1>
        <div className="bg-blue-600 text-white px-4 py-1.5 rounded-full text-xs font-black uppercase tracking-widest shadow-lg shadow-blue-500/20">
          Global Control v1.0
        </div>
      </div>

      {/* Primary Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard label="Total Users" value={stats?.users?.total_users ?? 0} color="text-blue-600" bgColor="bg-blue-50/50" />
        <StatCard label="Live Policies" value={stats?.policies?.active_policies ?? 0} color="text-indigo-600" bgColor="bg-indigo-50/50" />
        <StatCard label="Pending Claims" value={(stats?.claims?.submitted ?? 0) + (stats?.claims?.under_review ?? 0)} color="text-amber-500" bgColor="bg-amber-50/50" />
        <StatCard label="Insurance Products" value={stats?.premium?.total_products ?? 0} color="text-emerald-600" bgColor="bg-emerald-50/50" />
      </div>

      <div>
        <h2 className="text-xl font-black mb-6 text-foreground/80 uppercase tracking-tight flex items-center gap-2">
            <span className="w-8 h-1 bg-blue-600 rounded-full"></span> Quick Management
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {/* The New Card */}
            <Link href="/admin/premium/products" className="group bg-card p-6 rounded-2xl shadow-sm border-2 border-transparent hover:border-blue-600 hover:shadow-xl hover:shadow-blue-500/5 transition-all relative overflow-hidden">
                <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:opacity-10 transition-opacity">
                    <span className="text-6xl font-black">💰</span>
                </div>
                <h3 className="font-black text-xl mb-2 text-foreground">Insurance Matrix</h3>
                <p className="text-muted-foreground text-sm leading-relaxed mb-4">Configure insurance products, pricing plans, coverages & rules.</p>
                <span className="text-blue-600 font-black text-xs uppercase tracking-widest flex items-center gap-2 border-t pt-4">
                    Modify Pricing →
                </span>
            </Link>

            <Link href="/admin/claims" className="group bg-card p-6 rounded-2xl shadow-sm border-2 border-transparent hover:border-amber-500 hover:shadow-xl hover:shadow-amber-500/5 transition-all relative overflow-hidden">
                <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:opacity-10 transition-opacity text-amber-500">
                    <span className="text-6xl font-black">📋</span>
                </div>
                <h3 className="font-black text-xl mb-2 text-foreground">Manage Claims</h3>
                <p className="text-muted-foreground text-sm leading-relaxed mb-4">Review, approve, or reject active insurance claim requests.</p>
                <span className="text-amber-500 font-black text-xs uppercase tracking-widest flex items-center gap-2 border-t pt-4">
                    Open Claims Registry →
                </span>
            </Link>

            <Link href="/admin/policies" className="group bg-card p-6 rounded-2xl shadow-sm border-2 border-transparent hover:border-indigo-500 hover:shadow-xl hover:shadow-indigo-500/5 transition-all relative overflow-hidden">
                <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:opacity-10 transition-opacity text-indigo-500">
                    <span className="text-6xl font-black">📄</span>
                </div>
                <h3 className="font-black text-xl mb-2 text-foreground">Manage Policies</h3>
                <p className="text-muted-foreground text-sm leading-relaxed mb-4">Monitor all issued policies and their current active status.</p>
                <span className="text-indigo-500 font-black text-xs uppercase tracking-widest flex items-center gap-2 border-t pt-4">
                    View Policy List →
                </span>
            </Link>

            <Link href="/admin/users" className="group bg-card p-6 rounded-2xl shadow-sm border-2 border-transparent hover:border-emerald-500 hover:shadow-xl hover:shadow-emerald-500/5 transition-all relative overflow-hidden">
                <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:opacity-10 transition-opacity text-emerald-500">
                    <span className="text-6xl font-black">👥</span>
                </div>
                <h3 className="font-black text-xl mb-2 text-foreground">Manage Users</h3>
                <p className="text-muted-foreground text-sm leading-relaxed mb-4">Control user accounts, roles, and status levels across system.</p>
                <span className="text-emerald-500 font-black text-xs uppercase tracking-widest flex items-center gap-2 border-t pt-4">
                    Open User Directory →
                </span>
            </Link>
        </div>
      </div>
    </div>
  )
}

function StatCard({ label, value, color, bgColor }: { label: string; value: number | string; color: string; bgColor: string }) {
  return (
    <div className={`p-6 rounded-2xl shadow-sm border-2 border-transparent bg-card transition-all hover:bg-white hover:shadow-lg`}>
      <p className={`text-4xl font-black mb-1 ${color}`}>{value}</p>
      <p className="text-muted-foreground text-[10px] font-black uppercase tracking-widest">{label}</p>
    </div>
  )
}
