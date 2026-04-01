'use client'

import { useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { policyAPI } from '@/lib/api'
import { useAuthStore } from '@/store/auth'

export default function Purchase() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const { isAuthenticated, user } = useAuthStore()
  const premium = searchParams.get('premium') || '0'
  const [processing, setProcessing] = useState(false)
  const [completed, setCompleted] = useState(false)
  const [policyNumber, setPolicyNumber] = useState('')
  const [policyId, setPolicyId] = useState('')

  const handlePurchase = async () => {
    if (!isAuthenticated) {
      router.push('/login')
      return
    }

    setProcessing(true)

    try {
      const response = await policyAPI.createPolicy({
        user_id: user?.id,
        product_id: searchParams.get('product_id') || 'default-product',
        premium: parseFloat(premium),
        coverage_ids: [],
        email: (user as any)?.email,
        name: (user as any)?.first_name || (user as any)?.firstName || '',
      })

      setPolicyNumber(response.data.policy_number)
      setPolicyId(response.data.id || '')
      setCompleted(true)
    } catch (err) {
      console.error('Purchase failed:', err)
      alert('Purchase failed. Please try again.')
    } finally {
      setProcessing(false)
    }
  }

  if (completed) {
    return (
      <div className="max-w-2xl mx-auto">
        <div className="bg-green-50 border-2 border-green-500 p-8 rounded-lg text-center">
          <div className="text-6xl mb-4">🎉</div>
          <h1 className="text-3xl font-bold mb-4">Policy Purchased!</h1>
          <p className="text-lg mb-4">Your policy has been successfully created.</p>
          <div className="bg-white p-6 rounded mb-6">
            <p className="text-gray-600 text-sm mb-1">Policy Number</p>
            <p className="text-2xl font-bold text-secondary">{policyNumber}</p>
          </div>
          <p className="text-gray-600 mb-6">A confirmation email has been sent to your inbox with your policy details and certificate.</p>
          <div className="flex gap-4 justify-center flex-wrap">
            {policyId && (
              <a
                href={`/api/documents/certificate/${policyId}`}
                target="_blank"
                rel="noopener noreferrer"
                className="bg-green-600 text-white px-8 py-3 rounded font-bold hover:bg-green-700"
              >
                ↓ Download Certificate
              </a>
            )}
            <Link
              href="/dashboard"
              className="bg-secondary text-white px-8 py-3 rounded font-bold hover:bg-emerald-700"
            >
              Go to Dashboard
            </Link>
            <Link
              href="/policies"
              className="bg-primary text-white px-8 py-3 rounded font-bold hover:bg-gray-800"
            >
              View Policies
            </Link>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="max-w-2xl mx-auto">
      <h1 className="text-3xl font-bold mb-8">Confirm Your Purchase</h1>

      <div className="bg-white p-8 rounded-lg shadow mb-6">
        <h2 className="text-2xl font-bold mb-6">Order Summary</h2>

        <div className="space-y-4 mb-8">
          <div className="flex justify-between pb-4 border-b">
            <span>Golf Insurance Premium</span>
            <span>${parseFloat(premium).toFixed(2)}</span>
          </div>
          <div className="flex justify-between text-xl font-bold text-secondary">
            <span>Total</span>
            <span>${parseFloat(premium).toFixed(2)}</span>
          </div>
        </div>

        <div className="bg-blue-50 p-4 rounded mb-8">
          <p className="text-sm text-gray-700">
            💳 In this MVP, payment is simulated locally. Click "Complete Purchase" to proceed.
          </p>
        </div>

        <button
          onClick={handlePurchase}
          disabled={processing}
          className="w-full bg-accent text-black font-bold py-3 rounded-lg hover:bg-amber-600 disabled:opacity-50 text-lg mb-4"
        >
          {processing ? 'Processing...' : 'Complete Purchase'}
        </button>

        <Link href="/quote" className="block text-center text-secondary hover:underline">
          ← Back to Quote
        </Link>
      </div>
    </div>
  )
}
