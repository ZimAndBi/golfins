'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import apiClient from '@/lib/api';
import { useRouter } from 'next/navigation';

export default function CheckoutPage({ params }: { params: { id: string } }) {
  const { id } = params;
  const router = useRouter();
  
  const [policy, setPolicy] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [method, setMethod] = useState<'qr' | 'card'>('qr');
  const [submitting, setSubmitting] = useState(false);
  const [debugError, setDebugError] = useState<string>('');

  useEffect(() => {
    fetchPolicy();
  }, [id]);

  const fetchPolicy = async () => {
    try {
      const res = await apiClient.get(`/policies/${id}`);
      setPolicy(res.data);
    } catch (error: any) {
      console.error('Failed to load policy', error);
      setDebugError(`Load Error: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  const handleConfirmPaid = async () => {
    setSubmitting(true);
    setDebugError('');
    try {
      await apiClient.patch(`/policies/${id}/status`, { status: 'awaiting_confirmation' });
      router.push('/dashboard?payment_success=true');
    } catch (error: any) {
      console.error('Failed to update status', error);
      setDebugError(`Status Update Failed: ${error.message}`);
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) return <div className="min-h-screen flex items-center justify-center font-bold text-blue-600 bg-white">Loading checkout...</div>;
  
  if (debugError && !policy) return (
    <div className="min-h-screen flex flex-col items-center justify-center p-8 bg-slate-50">
        <div className="bg-white p-8 rounded-2xl shadow-xl border border-rose-100 text-center max-w-md">
            <h2 className="text-rose-600 font-black text-xl mb-2">Error</h2>
            <p className="text-slate-500 text-sm mb-6">{debugError}</p>
            <button onClick={() => window.location.reload()} className="bg-slate-900 text-white px-8 py-2 rounded-full font-bold text-sm">Retry Connection</button>
        </div>
    </div>
  );

  if (!policy) return null;

  // VietQR Config (Mock)
  const bankId = 'vietinbank';
  const accountNo = '1234567890';
  const qrUrl = `https://img.vietqr.io/image/${bankId}-${accountNo}-compact2.png?amount=${policy.premium_amount}&addInfo=GOLF%20${policy.policy_number}`;

  return (
    <div className="min-h-screen bg-[#FDFDFD] py-16 px-4 text-slate-800 antialiased">
      <div className="max-w-[1000px] mx-auto">
        
        {/* Header - More Slender */}
        <div className="mb-12 flex items-center justify-between border-b pb-8">
            <div className="flex items-center gap-3">
                <div className="w-8 h-8 bg-slate-900 rounded-lg flex items-center justify-center text-white text-xs font-black">G</div>
                <h1 className="text-xl font-black uppercase tracking-tight">Checkout Portal</h1>
            </div>
            <div className="flex items-center gap-2">
                <span className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse"></span>
                <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest leading-none mt-0.5">Secure Transaction</span>
            </div>
        </div>

        <div className="flex flex-col md:flex-row gap-12">
          
          {/* Payment Method - Slender Box */}
          <div className="flex-1 space-y-8">
            <div className="bg-white p-8 rounded-3xl border border-slate-100 shadow-[0_4px_30px_rgba(0,0,0,0.02)]">
              
              <div className="flex gap-4 mb-10">
                <TabButton active={method === 'qr'} onClick={() => setMethod('qr')} label="Bank Transfer" />
                <TabButton active={method === 'card'} onClick={() => setMethod('card')} label="Credit Card" />
              </div>

              {debugError && (
                <div className="mb-6 p-4 bg-rose-50 rounded-xl text-rose-600 text-xs font-bold border border-rose-100">
                    ⚠️ {debugError}
                </div>
              )}

              {method === 'qr' ? (
                <div className="flex flex-col items-center animate-in fade-in duration-700">
                  <div className="bg-white p-2 rounded-2xl border shadow-sm mb-8">
                      <img src={qrUrl} alt="VietQR" className="w-56 h-56 rounded-lg opacity-90 hover:opacity-100 transition-opacity" />
                  </div>

                  <div className="w-full space-y-4 mb-8">
                    <Row label="Account" value="1234 5678 90" />
                    <Row label="Bank" value="Vietinbank" />
                    <Row label="Ref" value={`GOLF ${policy.policy_number}`} isCopy />
                  </div>

                  <button 
                    onClick={handleConfirmPaid}
                    disabled={submitting}
                    className="w-full bg-slate-900 text-white py-4 rounded-full font-black text-xs uppercase tracking-widest hover:bg-black transition-all disabled:opacity-50 flex items-center justify-center gap-2"
                  >
                    {submitting && <span className="w-3 h-3 border-2 border-white/20 border-t-white rounded-full animate-spin"></span>}
                    {submitting ? 'Authenticating...' : "I Have Transferred"}
                  </button>
                </div>
              ) : (
                <div className="py-12 text-center space-y-2 opacity-40">
                    <p className="text-3xl">🔒</p>
                    <p className="text-xs font-black uppercase tracking-tight">Encrypted Gate</p>
                    <p className="text-xs font-medium text-slate-400">Available in Version 2.0</p>
                </div>
              )}
            </div>
          </div>

          {/* Right Summary - Slim Column */}
          <div className="w-full md:w-[320px] space-y-10">
            <div className="space-y-6">
                <div>
                    <label className="text-[10px] uppercase font-black tracking-widest text-slate-400 mb-2 block">Premium Total</label>
                    <div className="flex items-baseline gap-1.5">
                        <span className="text-4xl font-black text-slate-900 leading-none">
                            {new Intl.NumberFormat('vi-VN').format(policy.premium_amount)}
                        </span>
                        <span className="text-xs font-bold text-slate-400 leading-none uppercase">VND</span>
                    </div>
                </div>

                <div className="pt-6 space-y-4 border-t border-slate-100">
                    <SummaryItem label="Policy ID" value={policy.policy_number} />
                    <SummaryItem label="Plan" value="Annual Protection" />
                    <SummaryItem label="Holders" value={policy.user_id.slice(0,8).toUpperCase()} />
                </div>
            </div>

            <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100 flex items-center justify-between">
                <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Status</span>
                <span className="text-[10px] font-black text-blue-600 bg-blue-50 px-2 py-0.5 rounded-full uppercase tracking-widest">{policy.status.replace('_', ' ')}</span>
            </div>

            <div className="pt-10 flex flex-col gap-3">
                <Link href="/dashboard" className="text-[10px] font-black text-slate-400 uppercase tracking-widest hover:text-slate-900 transition-colors text-center">← Cancel & Return</Link>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}

function TabButton({ active, label, onClick }: { active: boolean; label: string; onClick: () => void }) {
    return (
        <button 
            onClick={onClick}
            className={`flex-1 pb-4 text-[10px] font-black uppercase tracking-widest border-b-2 transition-all ${
                active ? 'text-slate-900 border-slate-900' : 'text-slate-300 border-transparent hover:text-slate-400'
            }`}
        >
            {label}
        </button>
    );
}

function SummaryItem({ label, value }: { label: string; value: string }) {
    return (
        <div className="flex justify-between items-center text-[10px] font-medium leading-none">
            <span className="text-slate-400 font-bold uppercase tracking-widest">{label}</span>
            <span className="text-slate-900 font-black">{value}</span>
        </div>
    );
}

function Row({ label, value, isCopy = false }: { label: string; value: string; isCopy?: boolean }) {
    return (
        <div className="flex justify-between items-center py-2 border-b border-slate-50">
            <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">{label}</span>
            <span className={`text-xs font-black ${isCopy ? 'text-blue-600 bg-blue-50 px-2 py-1 rounded' : 'text-slate-800'}`}>{value}</span>
        </div>
    );
}
