'use client'

import { useState, useEffect } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { policyAPI, authAPI } from '@/lib/api'
import { useAuthStore } from '@/store/auth'

function formatVND(amount: number): string {
  return new Intl.NumberFormat('vi-VN').format(Math.round(amount)) + ' ₫'
}

export default function Purchase() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const { isAuthenticated, user } = useAuthStore()

  const premium = parseFloat(searchParams.get('premium') || '0')
  const planNameFull = searchParams.get('plan_name') || 'Annual Program — Plan B'
  
  // Split "Program — Plan"
  const [program, plan] = planNameFull.includes(' — ') 
    ? planNameFull.split(' — ') 
    : ['Golf Insurance', planNameFull]

  const [processing, setProcessing] = useState(false)
  const [completed, setCompleted] = useState(false)
  const [policyNumber, setPolicyNumber] = useState('')
  const [policyId, setPolicyId] = useState('')
  
  // Form State
  const [formData, setFormData] = useState({
    nationality: 'Vietnam',
    gender: 'Male',
    idNumber: '',
    address: '',
    companyName: '',
  })
  const [acceptedTerms, setAcceptedTerms] = useState(false)

  useEffect(() => {
    if (!isAuthenticated && !completed) {
      router.push('/login?redirect=/purchase')
    }
    // Populate form data from user if available
    if (user) {
      setFormData({
        nationality: user.nationality || 'Vietnam',
        gender: user.gender || 'Male',
        idNumber: user.id_passport || '',
        address: user.address || '',
        companyName: user.company_name || '',
      })
    }
  }, [isAuthenticated, router, completed, user])

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value })
  }

  const handlePurchase = async () => {
    if (!isAuthenticated) return
    if (!acceptedTerms) return

    setProcessing(true)
    try {
      // 1. Update user profile with the new info ( nationality, gender, etc.)
      const userResponse = await authAPI.updateMe({
        nationality: formData.nationality,
        gender: formData.gender,
        id_passport: formData.idNumber,
        address: formData.address,
        company_name: formData.companyName,
      })
      // Sync store
      if (userResponse.data) {
        useAuthStore.getState().updateUser(userResponse.data)
      }

      // 2. Create the policy
      const policyResponse = await policyAPI.createPolicy({
        user_id: user?.id,
        product_id: searchParams.get('product_id') || 'default-product',
        premium: premium,
        email: user?.email,
        name: `${user?.first_name} ${user?.last_name}`,
        metadata: {
          ...formData,
          program,
          plan
        }
      })

      setPolicyNumber(policyResponse.data.policy_number)
      const newPolicyId = policyResponse.data.id || policyResponse.data.policy_id
      
      // Redirect to the professional Checkout page
      router.push(`/checkout/${newPolicyId}`)
    } catch (err) {
      console.error('Purchase failed:', err)
      alert('Purchase failed. Please try again.')
    } finally {
      setProcessing(false)
    }
  }

  return (
    <div className="max-w-4xl mx-auto py-8 px-4">
      <div className="flex items-center gap-4 mb-8">
        <Link href="/quote" className="text-gray-400 hover:text-emerald-600 transition-colors">
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 19l-7-7m0 0l7-7m-7 7h18" /></svg>
        </Link>
        <h1 className="text-3xl font-black text-gray-900">Confirm Your Purchase</h1>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Left Column: Form Info */}
        <div className="space-y-6">
          <section className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
            <h2 className="text-lg font-bold text-gray-800 mb-4 flex items-center gap-2">
              <span className="w-2 h-6 bg-emerald-500 rounded-full"></span>
              The Insured Information
            </h2>
            
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-gray-400 uppercase mb-1">Full Name</label>
                <div className="p-3 bg-gray-50 rounded-lg border border-gray-100 text-gray-700 font-medium">
                  {user?.first_name} {user?.last_name}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-gray-400 uppercase mb-1">Phone Number</label>
                  <div className="p-3 bg-gray-50 rounded-lg border border-gray-100 text-gray-700 font-medium overflow-hidden text-ellipsis">
                    {user?.phone || '–'}
                  </div>
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-400 uppercase mb-1">Email</label>
                  <div className="p-3 bg-gray-50 rounded-lg border border-gray-100 text-gray-700 font-medium overflow-hidden text-ellipsis">
                    {user?.email}
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-gray-700 uppercase mb-1">Nationality *</label>
                  <select 
                    name="nationality" 
                    value={formData.nationality} 
                    onChange={handleInputChange}
                    className="w-full p-3 bg-white rounded-lg border border-gray-200 focus:ring-2 focus:ring-emerald-500 outline-none"
                  >
                    <option value="Vietnam">Vietnam</option>
                    <option value="Korea">Korea</option>
                    <option value="Japan">Japan</option>
                    <option value="USA">USA</option>
                    <option value="Other">Other</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-700 uppercase mb-1">Gender *</label>
                  <select 
                    name="gender" 
                    value={formData.gender} 
                    onChange={handleInputChange}
                    className="w-full p-3 bg-white rounded-lg border border-gray-200 focus:ring-2 focus:ring-emerald-500 outline-none"
                  >
                    <option value="Male">Male</option>
                    <option value="Female">Female</option>
                    <option value="Other">Other</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 uppercase mb-1">ID/Passport No.</label>
                <input 
                  type="text" 
                  name="idNumber"
                  value={formData.idNumber}
                  onChange={handleInputChange}
                  placeholder="Enter ID or Passport number"
                  className="w-full p-3 bg-white rounded-lg border border-gray-200 focus:ring-2 focus:ring-emerald-500 outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 uppercase mb-1">Address</label>
                <input 
                  type="text" 
                  name="address"
                  value={formData.address}
                  onChange={handleInputChange}
                  placeholder="Your current address"
                  className="w-full p-3 bg-white rounded-lg border border-gray-200 focus:ring-2 focus:ring-emerald-500 outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 uppercase mb-1">Company Name</label>
                <input 
                  type="text" 
                  name="companyName"
                  value={formData.companyName}
                  onChange={handleInputChange}
                  placeholder="Optional"
                  className="w-full p-3 bg-white rounded-lg border border-gray-200 focus:ring-2 focus:ring-emerald-500 outline-none"
                />
              </div>
            </div>
          </section>
        </div>

        {/* Right Column: Order Summary */}
        <div className="space-y-6">
          <section className="bg-white p-6 rounded-2xl shadow-xl border-t-4 border-emerald-500">
            <h2 className="text-xl font-bold text-gray-900 mb-6">Order Summary</h2>
            
            <div className="space-y-4 pb-6 border-b border-dashed">
              <div className="flex justify-between items-center">
                <span className="text-gray-500">Program</span>
                <span className="font-bold text-gray-800">{program}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-gray-500">Plan Selection</span>
                <span className="px-3 py-1 bg-emerald-100 text-emerald-700 rounded-full text-sm font-black">
                  {plan}
                </span>
              </div>
              <div className="flex justify-between items-start pt-2">
                <span className="text-gray-500">
                  Golf Insurance Premium<br />
                  <span className="text-xs text-gray-400 font-normal">(incl. 10% VAT)</span>
                </span>
                <span className="font-bold text-lg text-gray-900">{formatVND(premium)}</span>
              </div>
            </div>

            <div className="py-6 flex justify-between items-center">
              <span className="text-xl font-bold text-gray-900">Total Amount</span>
              <span className="text-3xl font-black text-emerald-600 tracking-tighter">{formatVND(premium)}</span>
            </div>

            <div className="bg-gray-50 p-4 rounded-xl mb-6 flex gap-3">
              <div className="text-emerald-500 text-xl font-bold">🛡️</div>
              <p className="text-xs text-gray-500 leading-relaxed font-medium">
                Your coverage will begin immediately upon payment confirmation. 
                A digital certificate will be generated and stored in your dashboard.
              </p>
            </div>

            {/* Terms Checkbox */}
            <div className="mb-6">
              <label className="flex items-start gap-3 cursor-pointer group">
                <input 
                  type="checkbox" 
                  checked={acceptedTerms}
                  onChange={(e) => setAcceptedTerms(e.target.checked)}
                  className="mt-1 w-5 h-5 rounded border-gray-300 text-emerald-600 focus:ring-emerald-500 accent-emerald-600"
                />
                <span className="text-sm text-gray-600 select-none group-hover:text-gray-900 transition-colors">
                  I have read and agree to the{' '}
                  <a 
                    href="/wording.pdf" 
                    target="_blank" 
                    className="text-emerald-600 font-bold underline hover:text-emerald-700"
                  >
                    Terms and Conditions
                  </a>
                  {' '}and premium mentioned above.
                </span>
              </label>
            </div>

            <button
              onClick={handlePurchase}
              disabled={processing || !acceptedTerms}
              className={`w-full py-4 rounded-2xl font-black text-lg transition-all shadow-lg ${
                acceptedTerms 
                  ? 'bg-amber-500 text-black hover:bg-amber-600 hover:-translate-y-0.5 active:translate-y-0' 
                  : 'bg-gray-200 text-gray-400 cursor-not-allowed shadow-none'
              }`}
            >
              {processing ? (
                <span className="flex items-center justify-center gap-2">
                  <svg className="animate-spin h-5 w-5 mr-3" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Processing...
                </span>
              ) : 'COMPLETE PURCHASE →'}
            </button>
          </section>

          <Link href="/quote" className="block text-center text-sm font-bold text-gray-400 hover:text-emerald-600 transition-colors">
            CANCEL AND CHOOSE ANOTHER PLAN
          </Link>
        </div>
      </div>
    </div>
  )
}
