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
        const [userStats, policyStats, claimStats] = await Promise.all([
          apiClient.get('/admin/stats'),
          apiClient.get('/admin/policies/stats'),
          apiClient.get('/admin/claims/stats'),
        ])
        setStats({
          users: userStats.data,
          policies: policyStats.data,
          claims: claimStats.data,
        })
      } catch (err) {
        console.error('Failed to load stats:', err)
      } finally {
        setLoading(false)
      }
    }
    fetchStats()
  }, [])

  if (loading) return <div className="text-center py-12">Loading...</div>

  return (
    <div>
      <h1 className="text-3xl font-bold mb-8">Admin Dashboard</h1>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-10">
        <StatCard label="Total Users" value={stats?.users?.total_users ?? 0} color="text-primary" />
        <StatCard label="Active Users" value={stats?.users?.active_users ?? 0} color="text-green-600" />
        <StatCard label="Total Policies" value={stats?.policies?.total_policies ?? 0} color="text-secondary" />
        <StatCard label="Active Policies" value={stats?.policies?.active_policies ?? 0} color="text-green-600" />
        <StatCard label="Total Claims" value={stats?.claims?.total ?? 0} color="text-primary" />
        <StatCard label="Pending Claims" value={(stats?.claims?.submitted ?? 0) + (stats?.claims?.under_review ?? 0)} color="text-amber-500" />
        <StatCard label="Approved" value={stats?.claims?.approved ?? 0} color="text-green-600" />
        <StatCard label="Rejected" value={stats?.claims?.rejected ?? 0} color="text-red-500" />
      </div>

      {/* Quick links */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Link href="/admin/claims" className="bg-white p-6 rounded-lg shadow hover:shadow-lg border-l-4 border-amber-400">
          <h3 className="font-bold text-lg mb-1">Manage Claims</h3>
          <p className="text-gray-500 text-sm">Review and approve/reject insurance claims</p>
        </Link>
        <Link href="/admin/policies" className="bg-white p-6 rounded-lg shadow hover:shadow-lg border-l-4 border-secondary">
          <h3 className="font-bold text-lg mb-1">Manage Policies</h3>
          <p className="text-gray-500 text-sm">View and update policy statuses</p>
        </Link>
        <Link href="/admin/users" className="bg-white p-6 rounded-lg shadow hover:shadow-lg border-l-4 border-primary">
          <h3 className="font-bold text-lg mb-1">Manage Users</h3>
          <p className="text-gray-500 text-sm">View all registered users</p>
        </Link>
      </div>
    </div>
  )
}

function StatCard({ label, value, color }: { label: string; value: number; color: string }) {
  return (
    <div className="bg-white p-5 rounded-lg shadow text-center">
      <p className={`text-3xl font-bold ${color}`}>{value}</p>
      <p className="text-gray-500 text-sm mt-1">{label}</p>
    </div>
  )
}
