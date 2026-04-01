'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { premiumAPI, policyAPI } from '@/lib/api'
import { useAuthStore } from '@/store/auth'

export default function QuotePage() {
  const [formData, setFormData] = useState({
    age: 35,
    handicap: 12,
    frequency: 20,
    product_id: '',
  })
  const [quote, setQuote] = useState<any>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const router = useRouter()
  const { isAuthenticated, user } = useAuthStore()

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.name === 'product_id' ? e.target.value : parseInt(e.target.value),
    })
  }

  const calculateQuote = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    try {
      const response = await premiumAPI.calculate({
        age: formData.age,
        handicap: formData.handicap,
        frequency: formData.frequency,
      })
      setQuote(response.data)
    } catch (err: any) {
      setError('Failed to calculate quote')
    } finally {
      setLoading(false)
    }
  }

  const handlePurchase = () => {
    if (!isAuthenticated) {
      router.push('/register')
      return
    }
    router.push(`/purchase?product_id=${formData.product_id}&premium=${quote.final_premium}`)
  }

  return (
    <div className="max-w-2xl mx-auto">
      <h1 className="text-4xl font-bold mb-8">Get Your Golf Insurance Quote</h1>

      {error && <div className="bg-red-100 text-red-700 p-4 rounded mb-6">{error}</div>}

      <div className="bg-white p-8 rounded-lg shadow">
        <form onSubmit={calculateQuote} className="space-y-6">
          <div>
            <label className="block text-lg font-semibold mb-2">Your Age</label>
            <input
              type="number"
              name="age"
              value={formData.age}
              onChange={handleInputChange}
              min="18"
              max="120"
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-secondary"
            />
            <p className="text-sm text-gray-600 mt-1">The younger you are, the lower your premium</p>
          </div>

          <div>
            <label className="block text-lg font-semibold mb-2">Golf Handicap</label>
            <input
              type="number"
              name="handicap"
              value={formData.handicap}
              onChange={handleInputChange}
              min="0"
              max="36"
              step="0.1"
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-secondary"
            />
            <p className="text-sm text-gray-600 mt-1">Lower handicap = More frequent player = Higher premium</p>
          </div>

          <div>
            <label className="block text-lg font-semibold mb-2">Rounds Per Year</label>
            <input
              type="number"
              name="frequency"
              value={formData.frequency}
              onChange={handleInputChange}
              min="1"
              max="365"
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-secondary"
            />
            <p className="text-sm text-gray-600 mt-1">Frequent players get adjusted rates</p>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-secondary text-white font-bold py-3 rounded-lg hover:bg-emerald-700 disabled:opacity-50 text-lg"
          >
            {loading ? 'Calculating...' : 'Calculate Quote'}
          </button>
        </form>

        {quote && (
          <div className="mt-8 p-6 bg-green-50 border-2 border-green-300 rounded-lg">
            <h2 className="text-2xl font-bold mb-4">Your Quote</h2>
            <div className="space-y-2 mb-6">
              <div className="flex justify-between">
                <span>Base Premium:</span>
                <span className="font-semibold">${quote.base_premium.toFixed(2)}</span>
              </div>
              {quote.adjustments.length > 0 && (
                <div className="border-t pt-2">
                  <p className="font-semibold mb-2">Adjustments:</p>
                  {quote.adjustments.map((adj: any, i: number) => (
                    <div key={i} className="flex justify-between text-sm text-gray-700">
                      <span>{adj.type}:</span>
                      <span>{adj.value > 0 ? '+' : ''}{adj.value}%</span>
                    </div>
                  ))}
                </div>
              )}
              <div className="border-t pt-2 flex justify-between text-xl font-bold text-green-700">
                <span>Final Premium:</span>
                <span>${quote.final_premium.toFixed(2)}</span>
              </div>
            </div>

            <button
              onClick={handlePurchase}
              className="w-full bg-accent text-black font-bold py-3 rounded-lg hover:bg-amber-600"
            >
              Continue to Purchase
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
