'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAuthStore } from '@/store/auth'
import apiClient from '@/lib/api'

interface Coverage {
  coverage_option_id: string
  coverage_limit: number
  sub_limit: number | null
}

interface Plan {
  id: string
  product_id: string
  name: string
  code: string
  net_premium: number
  total_premium: number
  sort_order: number
  coverages?: Coverage[]
}

interface CoverageInfo {
  id: string
  name: string
  code: string
  territorial_limit: string
  sub_limit_label: string | null
  sort_order: number
}

interface Product {
  id: string
  name: string
  code: string
  product_type: string
  currency: string
  insurance_period_days?: number
  plans: Plan[]
}

function formatVND(amount: number): string {
  return new Intl.NumberFormat('vi-VN').format(Math.round(amount)) + ' ₫'
}

function formatSI(amount: number): string {
  if (amount >= 1_000_000_000) return `${(amount / 1_000_000_000).toFixed(0)} Tỷ`
  if (amount >= 1_000_000) return `${(amount / 1_000_000).toFixed(0)}M`
  return new Intl.NumberFormat('vi-VN').format(amount)
}

export default function QuotePage() {
  const [products, setProducts] = useState<Product[]>([])
  const [allPlans, setAllPlans] = useState<{ plan: Plan; product: Product }[]>([])
  const [selectedPlanId, setSelectedPlanId] = useState<string | null>(null)
  const [coverages, setCoverages] = useState<CoverageInfo[]>([])
  const [planCoverages, setPlanCoverages] = useState<Coverage[]>([])
  const [loadingProducts, setLoadingProducts] = useState(true)
  const [loadingDetail, setLoadingDetail] = useState(false)
  const router = useRouter()
  const { isAuthenticated } = useAuthStore()

  // Load products on mount
  useEffect(() => {
    const fetchProducts = async () => {
      try {
        const res = await apiClient.get('/products')
        const prods: Product[] = res.data.products || []
        setProducts(prods)

        // Flatten all plans across all products
        const flat: { plan: Plan; product: Product }[] = []
        for (const p of prods) {
          for (const plan of p.plans || []) {
            flat.push({ plan, product: p })
          }
        }
        setAllPlans(flat)
      } catch (err) {
        console.error('Failed to load products:', err)
      } finally {
        setLoadingProducts(false)
      }
    }
    fetchProducts()
  }, [])

  const selectedEntry = allPlans.find(e => e.plan.id === selectedPlanId)

  // Load coverage details when a plan is selected
  const handleSelectPlan = async (planId: string, productId: string) => {
    setSelectedPlanId(planId)
    setLoadingDetail(true)
    try {
      const res = await apiClient.get(`/products/${productId}`)
      const data = res.data
      setCoverages(data.coverages || [])
      const matchedPlan = (data.plans || []).find((p: any) => p.id === planId)
      setPlanCoverages(matchedPlan?.coverages || [])
    } catch (err) {
      console.error('Failed to load product detail:', err)
    } finally {
      setLoadingDetail(false)
    }
  }

  const handlePurchase = () => {
    if (!selectedEntry) return
    if (!isAuthenticated) {
      router.push('/register')
      return
    }
    router.push(
      `/purchase?product_id=${selectedEntry.product.id}&premium=${selectedEntry.plan.total_premium}&plan_name=${encodeURIComponent(selectedEntry.product.name + ' — ' + selectedEntry.plan.name)}`
    )
  }

  const getPlanLabel = (product: Product, plan: Plan): string => {
    if (product.product_type === 'annual') return `Annual ${plan.code}`
    if (product.product_type === 'spot_1day') return 'Spot 1-Day'
    if (product.product_type === 'spot_2day') return 'Spot 2-Day'
    return plan.name
  }

  const getPlanPeriod = (product: Product): string => {
    if (product.product_type === 'annual') return '1 Year'
    if (product.product_type === 'spot_1day') return '1 Day'
    if (product.product_type === 'spot_2day') return '2 Days'
    return `${product.insurance_period_days || '–'} days`
  }

  const getPlanIcon = (product: Product, plan: Plan): string => {
    if (product.product_type === 'spot_1day') return '⛳'
    if (product.product_type === 'spot_2day') return '🏌️'
    if (plan.code === 'A') return '🥉'
    if (plan.code === 'B') return '🥈'
    if (plan.code === 'C') return '🥇'
    return '📋'
  }

  if (loadingProducts) {
    return <div className="text-center py-20 text-gray-500">Loading insurance plans...</div>
  }

  return (
    <div className="max-w-5xl mx-auto">
      <div className="text-center mb-10">
        <h1 className="text-4xl font-bold mb-3">Choose Your Insurance Plan</h1>
        <p className="text-gray-500 text-lg">Select one of our plans to view details and purchase.</p>
      </div>

      {/* ── Plan Cards ──────────────────────────────────────────────────── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4 mb-10">
        {allPlans.map(({ plan, product }) => {
          const isSelected = selectedPlanId === plan.id
          const isPopular = product.product_type === 'annual' && plan.code === 'B'
          return (
            <button
              key={plan.id}
              onClick={() => handleSelectPlan(plan.id, product.id)}
              className={`relative p-5 rounded-xl border-2 text-left transition-all duration-200 hover:shadow-lg ${
                isSelected
                  ? 'border-emerald-500 bg-emerald-50 shadow-lg ring-2 ring-emerald-200'
                  : 'border-gray-200 bg-white hover:border-emerald-300'
              }`}
            >
              {isPopular && (
                <span className="absolute -top-2.5 left-1/2 -translate-x-1/2 bg-emerald-600 text-white text-[10px] font-bold px-2.5 py-0.5 rounded-full uppercase tracking-wider">
                  Popular
                </span>
              )}
              <div className="text-3xl mb-2">{getPlanIcon(product, plan)}</div>
              <h3 className="font-bold text-base mb-1">{getPlanLabel(product, plan)}</h3>
              <p className="text-xs text-gray-400 mb-3">{getPlanPeriod(product)}</p>
              <p className="text-lg font-bold text-emerald-700">{formatVND(plan.total_premium)}</p>
              <p className="text-[11px] text-gray-400">(incl. VAT)</p>

              {isSelected && (
                <div className="absolute top-3 right-3">
                  <div className="w-6 h-6 bg-emerald-500 rounded-full flex items-center justify-center">
                    <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                    </svg>
                  </div>
                </div>
              )}
            </button>
          )
        })}
      </div>

      {/* ── Selected Plan Detail ─────────────────────────────────────── */}
      {selectedEntry && (
        <div className="bg-white rounded-2xl shadow-lg border border-gray-100 overflow-hidden">
          {/* Header */}
          <div className="bg-gradient-to-r from-emerald-600 to-emerald-700 text-white p-6">
            <div className="flex justify-between items-start">
              <div>
                <h2 className="text-2xl font-bold">
                  {selectedEntry.product.name} — {selectedEntry.plan.name}
                </h2>
                <p className="text-emerald-100 mt-1">
                  Period: {getPlanPeriod(selectedEntry.product)} · Currency: VND
                </p>
              </div>
              <div className="text-right">
                <p className="text-sm text-emerald-200">Total Premium</p>
                <p className="text-3xl font-bold">{formatVND(selectedEntry.plan.total_premium)}</p>
              </div>
            </div>
          </div>

          <div className="p-6">
            {/* Premium breakdown */}
            <div className="grid grid-cols-2 gap-4 mb-6">
              <div className="bg-gray-50 rounded-xl p-4 text-center">
                <p className="text-sm text-gray-500 mb-1">Net Premium (no VAT)</p>
                <p className="text-2xl font-bold text-gray-800">{formatVND(selectedEntry.plan.net_premium)}</p>
              </div>
              <div className="bg-emerald-50 rounded-xl p-4 text-center border-2 border-emerald-200">
                <p className="text-sm text-emerald-600 mb-1">Total Premium (incl. 10% VAT)</p>
                <p className="text-2xl font-bold text-emerald-700">{formatVND(selectedEntry.plan.total_premium)}</p>
              </div>
            </div>

            {/* Coverage table */}
            {loadingDetail ? (
              <div className="text-center py-8 text-gray-400">Loading coverage details...</div>
            ) : coverages.length > 0 ? (
              <div className="mb-6">
                <h3 className="font-semibold text-gray-700 mb-3">Coverage Details</h3>
                <div className="rounded-xl overflow-hidden border border-gray-200">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="bg-gray-50">
                        <th className="text-left p-3 font-semibold text-gray-600">Coverage</th>
                        <th className="text-right p-3 font-semibold text-gray-600">Sum Insured (VND)</th>
                        <th className="text-left p-3 font-semibold text-gray-600">Territorial Limit</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                      {coverages.map(cov => {
                        const pc = planCoverages.find(c => c.coverage_option_id === cov.id)
                        if (!pc) return null
                        return (
                          <tr key={cov.id} className="hover:bg-gray-50 transition-colors">
                            <td className="p-3">
                              <p className="font-medium text-gray-800">{cov.name}</p>
                              {cov.sub_limit_label && pc.sub_limit && pc.sub_limit > 0 && (
                                <p className="text-xs text-gray-400 mt-0.5">
                                  {cov.sub_limit_label}: {formatVND(pc.sub_limit)}
                                </p>
                              )}
                            </td>
                            <td className="p-3 text-right">
                              <span className="font-bold text-emerald-700 text-base">
                                {formatSI(pc.coverage_limit)} ₫
                              </span>
                            </td>
                            <td className="p-3 text-xs text-gray-500">{cov.territorial_limit}</td>
                          </tr>
                        )
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            ) : null}

            {/* Purchase button */}
            <button
              onClick={handlePurchase}
              className="w-full bg-amber-500 hover:bg-amber-600 text-black font-bold py-4 rounded-xl text-lg transition-all shadow-md hover:shadow-lg"
            >
              Purchase This Plan →
            </button>

            {!isAuthenticated && (
              <p className="text-center text-xs text-gray-400 mt-2">
                You will be asked to create an account before purchasing.
              </p>
            )}
          </div>
        </div>
      )}

      {/* Empty state */}
      {!selectedPlanId && (
        <div className="text-center py-12 text-gray-400">
          <p className="text-5xl mb-4">👆</p>
          <p className="text-lg">Select a plan above to see coverage details and pricing.</p>
        </div>
      )}
    </div>
  )
}
