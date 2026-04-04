'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import apiClient from '@/lib/api';

export default function AdminProductsPage() {
  const [products, setProducts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState<any>(null);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [pRes, sRes] = await Promise.all([
        apiClient.get('/products'),
        apiClient.get('/admin/premium/stats')
      ]);
      setProducts(pRes.data.products || []);
      setStats(sRes.data);
    } catch (error) {
      console.error('Failed to fetch admin data', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <div className="text-center py-20 font-black text-slate-300 animate-pulse">Scanning Product Matrices...</div>

  return (
    <div className="space-y-8">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <h1 className="text-3xl font-black text-slate-900 tracking-tight">Product Matrices</h1>
          <p className="text-[10px] text-slate-400 font-black uppercase tracking-[0.2em] mt-1">Global Insurance Configuration</p>
        </div>
        <button className="bg-primary text-white px-6 py-2.5 rounded-2xl font-black text-[10px] uppercase tracking-widest hover:bg-black transition-all shadow-lg shadow-primary/20 flex items-center gap-2 self-start md:self-auto">
          <span className="text-lg leading-none">+</span> NEW PRODUCT ENTRY
        </button>
      </div>

      {/* Stats Cards */}
      {stats && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-6">
          <StatMiniCard label="Total Nodes" value={stats.total_products} color="text-blue-600" />
          <StatMiniCard label="Active Plans" value={stats.total_plans} color="text-emerald-600" />
          <StatMiniCard label="Coverages" value={stats.total_coverages} color="text-amber-500" />
          <StatMiniCard label="Policy Rules" value={stats.total_rules} color="text-indigo-600" />
        </div>
      )}

      {/* Products Table */}
      <div className="bg-white rounded-[2.5rem] shadow-xl shadow-slate-200/60 border border-slate-100 overflow-hidden">
        <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse min-w-[800px]">
                <thead>
                    <tr className="bg-slate-50/50 border-b border-slate-100">
                    <th className="px-6 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest">Digital Label</th>
                    <th className="px-6 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest">Index Code</th>
                    <th className="px-6 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest">Class Type</th>
                    <th className="px-6 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest">Registry Status</th>
                    <th className="px-6 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest text-right">Configuration</th>
                    </tr>
                </thead>
                <tbody className="divide-y divide-slate-50">
                    {products.length === 0 ? (
                    <tr>
                        <td colSpan={5} className="px-6 py-24 text-center text-slate-300 font-bold italic">
                        No product nodes detected. Initialize first entry.
                        </td>
                    </tr>
                    ) : (
                    products.map((p) => (
                        <tr key={p.id} className="group hover:bg-slate-50/80 transition-all duration-200">
                        <td className="px-6 py-5 font-black text-slate-900 group-hover:text-primary transition-colors">
                            <div className="text-sm tracking-tight">{p.name}</div>
                            <div className="text-[9px] text-slate-400 font-bold uppercase tracking-tighter">HEX: {p.id.slice(0,10)}</div>
                        </td>
                        <td className="px-6 py-5">
                            <span className="font-mono bg-slate-100 px-2 py-1 rounded-lg text-[10px] font-bold text-slate-600">{p.code}</span>
                        </td>
                        <td className="px-6 py-5">
                            <span className="capitalize text-[11px] font-black text-slate-600 tracking-tight">{p.product_type.replace('_', ' ')}</span>
                        </td>
                        <td className="px-6 py-5">
                            <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-[9px] font-black uppercase tracking-widest ring-1 ring-inset ${
                            p.status === 'active' ? 'bg-emerald-50 text-emerald-600 ring-emerald-100' : 'bg-slate-100 text-slate-500 ring-slate-200'
                            }`}>
                            {p.status}
                            </span>
                        </td>
                        <td className="px-6 py-5 text-right">
                            <Link 
                            href={`/admin/premium/products/${p.id}`}
                            className="bg-white border border-slate-200 text-slate-400 text-[9px] font-black uppercase tracking-widest px-4 py-2 rounded-xl hover:text-blue-600 hover:border-blue-200 hover:bg-blue-50 transition-all inline-flex items-center gap-2"
                            >
                            Configure Matrix
                            <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M9 5l7 7-7 7" />
                            </svg>
                            </Link>
                        </td>
                        </tr>
                    ))
                    )}
                </tbody>
            </table>
        </div>
      </div>
    </div>
  );
}

function StatMiniCard({ label, value, color }: { label: string; value: number | string; color: string }) {
    return (
        <div className="bg-white border border-slate-100 rounded-2xl p-5 shadow-sm hover:shadow-lg transition-all group">
            <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1 group-hover:text-primary transition-colors">{label}</p>
            <p className={`text-2xl font-black ${color} tracking-tight`}>{value}</p>
        </div>
    )
}
