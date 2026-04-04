'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import apiClient from '@/lib/api';
import { useRouter } from 'next/navigation';

export default function AdminProductDetailPage({ params }: { params: { id: string } }) {
  const { id } = params;
  const router = useRouter();
  
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [activeTab, setActiveTab] = useState('details');
  const [message, setMessage] = useState({ type: '', text: '' });

  useEffect(() => {
    fetchProduct();
  }, [id]);

  const fetchProduct = async () => {
    try {
      const res = await apiClient.get(`/products/${id}`);
      setData(res.data);
    } catch (error) {
      console.error('Failed to fetch product details', error);
      setMessage({ type: 'error', text: 'Failed to load product data.' });
    } finally {
      setLoading(false);
    }
  };

  const handleProductChange = (field: string, value: any) => {
    setData({
      ...data,
      product: { ...data.product, [field]: value }
    });
  };

  const handlePlanChange = (planId: string, field: string, value: any) => {
    const updatedPlans = data.plans.map((p: any) => 
      p.id === planId ? { ...p, [field]: value } : p
    );
    setData({ ...data, plans: updatedPlans });
  };

  const handleSave = async () => {
    setSaving(true);
    setMessage({ type: '', text: '' });
    try {
      // 1. Prepare Product Data (Explicitly pick only editable fields)
      const sanitizedProduct = {
        name: data.product.name,
        description: data.product.description || '',
        insurance_period_days: parseInt(String(data.product.insurance_period_days || 365)),
        vat_rate: parseFloat(String(data.product.vat_rate || 0.1)),
        is_active: data.product.is_active !== undefined ? data.product.is_active : true
      };

      // Update Product Meta
      await apiClient.put(`/admin/products/${id}`, sanitizedProduct);

      // 2. Update Plans (Explicitly pick only editable fields)
      for (const plan of data.plans) {
        const sanitizedPlan = {
            name: plan.name,
            net_premium: parseFloat(String(plan.net_premium || 0)),
            total_premium: parseFloat(String(plan.total_premium || 0)),
            is_active: plan.is_active
        };
        await apiClient.put(`/admin/plans/${plan.id}`, sanitizedPlan);
      }

      setMessage({ type: 'success', text: '🏆 All changes saved successfully!' });
      setTimeout(() => setMessage({ type: '', text: '' }), 5000);
    } catch (error: any) {
      console.error('Save failed', error);
      const errorMsg = error.response?.data?.detail || error.message || 'Failed to save changes.';
      setMessage({ type: 'error', text: `❌ ERROR: ${errorMsg}` });
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <div className="p-8 text-center animate-pulse text-foreground">Loading product configuration...</div>;
  if (!data) return <div className="p-8 text-center text-red-500 font-bold mt-20">Product not found.</div>;

  const { product, plans, coverages } = data;

  return (
    <div className="space-y-6">
      <div className="flex items-center space-x-2 text-sm text-muted-foreground mb-4">
        <Link href="/admin/premium/products" className="hover:text-primary transition-colors">Insurance Dashboard</Link>
        <span>/</span>
        <span className="text-foreground font-bold">{product.name}</span>
      </div>

      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight text-foreground">{product.name}</h1>
          <p className="text-muted-foreground mt-1">Manage pricing, plans, and legal coverages for this policy.</p>
        </div>
        <div className="flex items-center space-x-4">
            {message.text && (
                <div className={`px-4 py-2.5 rounded-lg text-sm font-bold border-2 animate-in fade-in slide-in-from-top-2 ${
                    message.type === 'success' 
                        ? 'bg-emerald-50 border-emerald-200 text-emerald-700' 
                        : 'bg-rose-50 border-rose-200 text-rose-600'
                }`}>
                    {message.text}
                </div>
            )}
            <button 
                onClick={() => router.push('/admin/premium/products')}
                className="border-2 px-6 py-2 rounded-lg bg-card hover:bg-muted font-bold transition-all text-foreground"
            >
                Back
            </button>
            <button 
                onClick={handleSave}
                disabled={saving}
                className="bg-blue-600 text-white px-8 py-2 rounded-lg font-bold hover:bg-blue-700 shadow-xl shadow-blue-500/30 active:scale-95 transition-all disabled:opacity-50 flex items-center gap-2"
            >
                {saving ? (
                    <span className="h-4 w-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></span>
                ) : '💾'} {saving ? 'Saving...' : 'Save Configuration'}
            </button>
        </div>
      </div>

      {/* Tabs Navigation */}
      <div className="border-b flex space-x-8">
        {['details', 'plans', 'coverages', 'rules'].map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`pb-4 text-sm font-black capitalize border-b-4 transition-all ${
              activeTab === tab ? 'border-blue-600 text-blue-600' : 'border-transparent text-muted-foreground hover:text-foreground'
            }`}
          >
            {tab}
          </button>
        ))}
      </div>

      {/* Tab Content */}
      <div className="bg-card border-2 rounded-2xl p-8 shadow-md min-h-[450px]">
        {activeTab === 'details' && (
          <div className="max-w-3xl space-y-6">
            <div className="grid grid-cols-2 gap-8">
              <div className="space-y-2">
                <label className="text-xs font-black uppercase text-muted-foreground">Product Name</label>
                <input 
                    value={product.name} 
                    onChange={(e) => handleProductChange('name', e.target.value)}
                    className="w-full border-2 rounded-xl p-3 bg-transparent text-foreground font-medium focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 outline-none transition-all" 
                />
              </div>
              <div className="space-y-2">
                <label className="text-xs font-black uppercase text-muted-foreground">Internal Code</label>
                <input value={product.code} className="w-full border-2 rounded-xl p-3 bg-muted text-muted-foreground cursor-not-allowed font-mono text-sm" disabled />
              </div>
              <div className="space-y-2">
                <label className="text-xs font-black uppercase text-muted-foreground">Coverage Period (Days)</label>
                <input 
                    type="number" 
                    value={product.insurance_period_days} 
                    onChange={(e) => handleProductChange('insurance_period_days', e.target.value)}
                    className="w-full border-2 rounded-xl p-3 bg-transparent text-foreground font-medium focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 outline-none transition-all" 
                />
              </div>
              <div className="space-y-2">
                <label className="text-xs font-black uppercase text-muted-foreground">VAT Rate (0.1 = 10%)</label>
                <input 
                    type="number" 
                    step="0.01" 
                    value={product.vat_rate} 
                    onChange={(e) => handleProductChange('vat_rate', e.target.value)}
                    className="w-full border-2 rounded-xl p-3 bg-transparent text-foreground font-medium focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 outline-none transition-all" 
                />
              </div>
            </div>
            <div className="space-y-2">
              <label className="text-xs font-black uppercase text-muted-foreground">Public Description</label>
              <textarea 
                value={product.description || ''} 
                onChange={(e) => handleProductChange('description', e.target.value)}
                className="w-full border-2 rounded-xl p-4 bg-transparent text-foreground min-h-[140px] font-medium focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 outline-none transition-all" 
              />
            </div>
          </div>
        )}

        {activeTab === 'plans' && (
          <div className="space-y-6">
            <div className="flex justify-between items-center text-foreground">
                <h3 className="text-xl font-black">Pricing Tiers</h3>
                <p className="text-sm text-blue-600 font-bold bg-blue-50 px-3 py-1 rounded-full">✓ Live in production</p>
            </div>
            <div className="border-2 rounded-2xl overflow-hidden shadow-sm">
                <table className="w-full text-left">
                    <thead className="bg-muted/50 border-b-2 text-[10px] uppercase text-muted-foreground font-black tracking-widest">
                        <tr>
                            <th className="px-6 py-5">Tier / Plan Name</th>
                            <th className="px-6 py-5">Code</th>
                            <th className="px-6 py-5 text-right">Net Premium (VND)</th>
                            <th className="px-6 py-5 text-right">Gross Premium (VND)</th>
                            <th className="px-6 py-5 text-center">Status</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y text-sm bg-card">
                        {plans.map((pl: any) => (
                            <tr key={pl.id} className="hover:bg-blue-50/50 transition-colors">
                                <td className="px-6 py-5">
                                    <input 
                                        value={pl.name} 
                                        onChange={(e) => handlePlanChange(pl.id, 'name', e.target.value)}
                                        className="bg-transparent border-b-2 border-transparent focus:border-blue-500 focus:bg-white outline-none font-black text-foreground w-full p-2 rounded-lg transition-all"
                                    />
                                </td>
                                <td className="px-6 py-5 cursor-default">
                                    <span className="text-[10px] font-mono font-black bg-blue-100/50 text-blue-700 px-3 py-1 rounded-md">{pl.code}</span>
                                </td>
                                <td className="px-6 py-5 text-right">
                                    <input 
                                        type="number"
                                        value={pl.net_premium} 
                                        onChange={(e) => handlePlanChange(pl.id, 'net_premium', e.target.value)}
                                        className="bg-transparent text-right border-b-2 border-transparent focus:border-blue-500 focus:bg-white outline-none font-bold text-foreground w-40 p-2 rounded-lg transition-all"
                                    />
                                </td>
                                <td className="px-6 py-5 text-right">
                                    <input 
                                        type="number"
                                        value={pl.total_premium} 
                                        onChange={(e) => handlePlanChange(pl.id, 'total_premium', e.target.value)}
                                        className="bg-transparent text-right border-b-2 border-transparent focus:border-blue-500 focus:bg-white outline-none font-black text-blue-600 dark:text-blue-400 w-40 p-2 rounded-lg transition-all text-base"
                                    />
                                </td>
                                <td className="px-6 py-5 text-center">
                                    <label className="relative inline-flex items-center cursor-pointer">
                                        <input 
                                            type="checkbox" 
                                            className="sr-only peer"
                                            checked={pl.is_active} 
                                            onChange={(e) => handlePlanChange(pl.id, 'is_active', e.target.checked)}
                                        />
                                        <div className="w-11 h-6 bg-muted peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                                    </label>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
          </div>
        )}

        {activeTab === 'coverages' && (
          <div className="space-y-6 text-foreground">
            <div className="flex justify-between items-center">
                <h3 className="text-xl font-black">Legal Coverages</h3>
                <button className="text-sm bg-blue-600 text-white px-5 py-2.5 rounded-xl hover:bg-blue-700 font-black shadow-lg shadow-blue-500/20 active:scale-95 transition-all flex items-center gap-2">
                    <span className="text-lg">+</span> Add New Coverage
                </button>
            </div>
            <p className="text-sm text-muted-foreground font-medium">Define wording limits and sub-limits for each plan included in this product.</p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {coverages.map((c: any) => (
                    <div key={c.id} className="border-2 p-6 rounded-2xl bg-muted/5 relative group border-transparent hover:border-blue-100 hover:bg-white hover:shadow-xl hover:shadow-blue-500/5 transition-all">
                        <div className="flex justify-between items-start">
                            <div>
                                <span className="text-[10px] font-mono bg-blue-100 text-blue-700 px-3 py-1 rounded-full font-black tracking-tighter">{c.code}</span>
                                <h4 className="font-black mt-3 text-lg leading-tight">{c.name}</h4>
                            </div>
                            <button className="h-8 w-8 flex items-center justify-center text-muted-foreground hover:text-rose-500 hover:bg-rose-50 rounded-full opacity-0 group-hover:opacity-100 transition-all border border-transparent hover:border-rose-100">
                                ✕
                            </button>
                        </div>
                        <p className="text-xs text-muted-foreground mt-4 italic leading-relaxed border-l-4 border-muted/50 pl-3">{c.territorial_limit || 'No territorial restrictions set'}</p>
                    </div>
                ))}
            </div>
          </div>
        )}

        {activeTab === 'rules' && (
          <div className="space-y-4 text-foreground text-center py-24">
            <div className="text-7xl mb-8 animate-bounce">⚙️</div>
            <h3 className="text-2xl font-black">Dynamic Rule Engine</h3>
            <p className="text-muted-foreground max-w-sm mx-auto font-medium leading-relaxed">Defining smart pricing logic based on age, handicap, and player seniority. (Interface coming in next release).</p>
          </div>
        )}
      </div>
    </div>
  );
}
