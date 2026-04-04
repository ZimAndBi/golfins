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

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Insurance Configuration</h1>
          <p className="text-muted-foreground mt-1">Manage products, pricing plans, and coverage rules.</p>
        </div>
        <button className="bg-primary text-primary-foreground px-4 py-2 rounded-lg font-medium hover:opacity-90 transition-opacity">
          + Create Product
        </button>
      </div>

      {/* Stats Cards */}
      {stats && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="bg-card border rounded-xl p-4 shadow-sm">
            <p className="text-sm font-medium text-muted-foreground">Total Products</p>
            <p className="text-2xl font-bold">{stats.total_products}</p>
          </div>
          <div className="bg-card border rounded-xl p-4 shadow-sm">
            <p className="text-sm font-medium text-muted-foreground">Active Plans</p>
            <p className="text-2xl font-bold">{stats.total_plans}</p>
          </div>
          <div className="bg-card border rounded-xl p-4 shadow-sm">
            <p className="text-sm font-medium text-muted-foreground">Coverage Items</p>
            <p className="text-2xl font-bold">{stats.total_coverages}</p>
          </div>
          <div className="bg-card border rounded-xl p-4 shadow-sm">
            <p className="text-sm font-medium text-muted-foreground">Pricing Rules</p>
            <p className="text-2xl font-bold">{stats.total_rules}</p>
          </div>
        </div>
      )}

      {/* Products Table */}
      <div className="bg-card border rounded-xl shadow-sm overflow-hidden text-black dark:text-white">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-muted/50 border-b">
              <th className="px-6 py-4 font-semibold">Product Name</th>
              <th className="px-6 py-4 font-semibold">Code</th>
              <th className="px-6 py-4 font-semibold">Type</th>
              <th className="px-6 py-4 font-semibold">Status</th>
              <th className="px-6 py-4 font-semibold text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y">
            {loading ? (
              <tr>
                <td colSpan={5} className="px-6 py-12 text-center text-muted-foreground italic">
                  Loading configuration data...
                </td>
              </tr>
            ) : products.length === 0 ? (
              <tr>
                <td colSpan={5} className="px-6 py-12 text-center text-muted-foreground italic">
                  No products found. Start by creating one.
                </td>
              </tr>
            ) : (
              products.map((p) => (
                <tr key={p.id} className="hover:bg-muted/30 transition-colors">
                  <td className="px-6 py-4">
                    <div className="font-medium text-blue-600 dark:text-blue-400">{p.name}</div>
                    <div className="text-xs text-muted-foreground">{p.id}</div>
                  </td>
                  <td className="px-6 py-4">
                    <span className="font-mono bg-muted px-2 py-0.5 rounded text-xs">{p.code}</span>
                  </td>
                  <td className="px-6 py-4">
                    <span className="capitalize">{p.product_type.replace('_', ' ')}</span>
                  </td>
                  <td className="px-6 py-4">
                    <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${
                      p.status === 'active' ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
                    }`}>
                      {p.status}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-right">
                    <Link 
                      href={`/admin/premium/products/${p.id}`}
                      className="text-primary hover:underline font-medium inline-flex items-center"
                    >
                      Configure
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 ml-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
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
  );
}
