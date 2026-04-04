'use client'

import { useEffect, useState } from 'react'
import apiClient from '@/lib/api'

export default function AdminUsers() {
  const [users, setUsers] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    apiClient.get('/admin/users')
      .then(res => setUsers(res.data.users || []))
      .catch(err => console.error(err))
      .finally(() => setLoading(false))
  }, [])

  if (loading) return <div className="text-center py-20 font-black text-slate-300 animate-pulse">Initializing User Matrix...</div>

  return (
    <div className="space-y-8">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-black text-slate-900 tracking-tight">Active Directories</h1>
          <p className="text-[10px] text-slate-400 font-black uppercase tracking-[0.2em] mt-1">Global User Management</p>
        </div>
        <div className="bg-primary text-white px-4 py-2 rounded-2xl text-[10px] font-black uppercase tracking-widest shadow-lg shadow-primary/10 self-start md:self-auto">
          Total Nodes: {users.length}
        </div>
      </div>

      <div className="bg-white rounded-[2rem] shadow-xl shadow-slate-200/50 border border-slate-100 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left border-collapse min-w-[700px]">
            <thead className="bg-slate-50/50 border-b border-slate-100">
              <tr>
                <th className="px-6 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest">Full Identity</th>
                <th className="px-6 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest">Digital Address</th>
                <th className="px-6 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest">Access Role</th>
                <th className="px-6 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest">Operational Status</th>
                <th className="px-6 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest text-right">System Join</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {users.length === 0 ? (
                <tr><td colSpan={5} className="text-center py-20 text-slate-300 font-bold italic">No active nodes detected in directory.</td></tr>
              ) : users.map((user) => (
                <tr key={user.id} className="group hover:bg-slate-50/80 transition-all duration-200">
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center text-[10px] font-black text-slate-400 group-hover:bg-primary group-hover:text-white transition-colors">
                            {user.first_name?.[0]}{user.last_name?.[0]}
                        </div>
                        <div>
                            <div className="font-black text-slate-900 tracking-tight">{user.first_name} {user.last_name}</div>
                            <div className="text-[9px] text-slate-400 font-bold uppercase tracking-tighter">ID: {user.id.slice(0,8)}</div>
                        </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-slate-500 font-medium">{user.email}</td>
                  <td className="px-6 py-4">
                    <span className={`px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-widest ring-1 ring-inset ${
                      user.role === 'admin' 
                        ? 'bg-purple-50 text-purple-600 ring-purple-100' 
                        : 'bg-blue-50 text-blue-600 ring-blue-100'
                    }`}>
                      {user.role}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-2">
                        <span className={`w-1.5 h-1.5 rounded-full ${user.status === 'active' ? 'bg-emerald-500 animate-pulse' : 'bg-rose-500'}`}></span>
                        <span className={`text-[9px] font-black uppercase tracking-widest ${user.status === 'active' ? 'text-emerald-600' : 'text-rose-600'}`}>
                        {user.status}
                        </span>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-right">
                    <div className="text-[11px] font-black text-slate-400 tracking-tight">
                        {user.created_at ? new Date(user.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : 'N/A'}
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
