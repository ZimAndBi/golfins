'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import apiClient from '@/lib/api'
import { useAuthStore } from '@/store/auth'

const CATEGORIES = [
  { value: 'driver', label: 'Driver', icon: '🏌️' },
  { value: 'iron', label: 'Iron Set', icon: '⛳' },
  { value: 'putter', label: 'Putter', icon: '🏌️' },
  { value: 'wedge', label: 'Wedge', icon: '⛳' },
  { value: 'bag', label: 'Golf Bag', icon: '🎒' },
  { value: 'cart', label: 'Golf Cart', icon: '🚗' },
  { value: 'rangefinder', label: 'Rangefinder', icon: '🔭' },
  { value: 'other', label: 'Other', icon: '📦' },
]

const STATUS_COLORS: Record<string, string> = {
  active: 'bg-green-100 text-green-700',
  lost: 'bg-red-100 text-red-700',
  damaged: 'bg-orange-100 text-orange-700',
  claimed: 'bg-gray-100 text-gray-600',
}

const emptyForm = {
  name: '', category: 'driver', brand: '', model_name: '',
  serial_number: '', purchase_date: '', estimated_value: '',
}

export default function EquipmentPage() {
  const router = useRouter()
  const { isAuthenticated, user } = useAuthStore()
  const [equipment, setEquipment] = useState<any[]>([])
  const [totalValue, setTotalValue] = useState(0)
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [form, setForm] = useState(emptyForm)
  const [saving, setSaving] = useState(false)

  const userId = (user as any)?.id

  const fetchEquipment = async () => {
    try {
      const res = await apiClient.get('/equipment', { params: { user_id: userId } })
      setEquipment(res.data.equipment || [])
      setTotalValue(res.data.total_value || 0)
    } catch (err) {
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (!isAuthenticated) { router.push('/login'); return }
    fetchEquipment()
  }, [isAuthenticated, userId, router])

  const set = (field: string, value: string) => setForm(f => ({ ...f, [field]: value }))

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)
    try {
      await apiClient.post('/equipment', {
        ...form,
        user_id: userId,
        estimated_value: parseFloat(form.estimated_value) || 0,
      })
      setForm(emptyForm)
      setShowForm(false)
      await fetchEquipment()
    } catch (err: any) {
      alert(err?.response?.data?.detail || 'Failed to add equipment')
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async (id: string, name: string) => {
    if (!confirm(`Remove "${name}" from your registry?`)) return
    try {
      await apiClient.delete(`/equipment/${id}`)
      await fetchEquipment()
    } catch (err) {
      alert('Failed to remove equipment')
    }
  }

  const handleStatusChange = async (id: string, status: string) => {
    try {
      await apiClient.patch(`/equipment/${id}`, { status })
      await fetchEquipment()
    } catch (err) {
      alert('Failed to update status')
    }
  }

  const getCategoryInfo = (val: string) => CATEGORIES.find(c => c.value === val) || CATEGORIES[7]

  if (loading) return <div className="text-center py-12">Loading...</div>

  return (
    <div className="max-w-4xl mx-auto">
      {/* Header */}
      <div className="flex justify-between items-start mb-8">
        <div>
          <h1 className="text-3xl font-bold">Equipment Registry</h1>
          <p className="text-gray-500 mt-1">Register your golf equipment for insurance coverage</p>
        </div>
        <button
          onClick={() => setShowForm(!showForm)}
          className="bg-secondary text-white px-5 py-2 rounded-lg font-bold hover:bg-emerald-700"
        >
          {showForm ? '✕ Cancel' : '+ Add Equipment'}
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4 mb-8">
        <div className="bg-white p-5 rounded-lg shadow text-center">
          <p className="text-3xl font-bold text-primary">{equipment.length}</p>
          <p className="text-gray-500 text-sm mt-1">Items Registered</p>
        </div>
        <div className="bg-white p-5 rounded-lg shadow text-center">
          <p className="text-3xl font-bold text-secondary">${totalValue.toFixed(0)}</p>
          <p className="text-gray-500 text-sm mt-1">Total Value Covered</p>
        </div>
        <div className="bg-white p-5 rounded-lg shadow text-center">
          <p className="text-3xl font-bold text-green-600">{equipment.filter(e => e.status === 'active').length}</p>
          <p className="text-gray-500 text-sm mt-1">Active Items</p>
        </div>
      </div>

      {/* Add Form */}
      {showForm && (
        <form onSubmit={handleAdd} className="bg-white p-6 rounded-lg shadow mb-8 border-l-4 border-secondary">
          <h2 className="font-bold text-lg mb-5">Register New Equipment</h2>
          <div className="grid grid-cols-2 gap-4">
            <div className="col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-1">Item Name *</label>
              <input
                required type="text" value={form.name}
                onChange={e => set('name', e.target.value)}
                placeholder="e.g. TaylorMade Stealth 2 Driver"
                className="w-full border rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-secondary"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Category *</label>
              <select
                value={form.category} onChange={e => set('category', e.target.value)}
                className="w-full border rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-secondary"
              >
                {CATEGORIES.map(c => (
                  <option key={c.value} value={c.value}>{c.icon} {c.label}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Brand</label>
              <input
                type="text" value={form.brand} onChange={e => set('brand', e.target.value)}
                placeholder="e.g. TaylorMade"
                className="w-full border rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-secondary"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Model</label>
              <input
                type="text" value={form.model_name} onChange={e => set('model_name', e.target.value)}
                placeholder="e.g. Stealth 2"
                className="w-full border rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-secondary"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Serial Number</label>
              <input
                type="text" value={form.serial_number} onChange={e => set('serial_number', e.target.value)}
                placeholder="Optional"
                className="w-full border rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-secondary"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Purchase Date</label>
              <input
                type="date" value={form.purchase_date} onChange={e => set('purchase_date', e.target.value)}
                className="w-full border rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-secondary"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Estimated Value (AUD)</label>
              <input
                type="number" min="0" step="0.01" value={form.estimated_value}
                onChange={e => set('estimated_value', e.target.value)}
                placeholder="0.00"
                className="w-full border rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-secondary"
              />
            </div>
          </div>
          <div className="flex gap-3 mt-5">
            <button
              type="submit" disabled={saving}
              className="bg-secondary text-white px-6 py-2 rounded font-bold hover:bg-emerald-700 disabled:opacity-50"
            >
              {saving ? 'Saving...' : 'Register Equipment'}
            </button>
            <button type="button" onClick={() => setShowForm(false)} className="bg-gray-100 text-gray-700 px-6 py-2 rounded font-bold hover:bg-gray-200">
              Cancel
            </button>
          </div>
        </form>
      )}

      {/* Equipment List */}
      {equipment.length === 0 ? (
        <div className="bg-white rounded-lg shadow p-12 text-center">
          <div className="text-6xl mb-4">🎒</div>
          <h3 className="text-xl font-bold text-gray-700 mb-2">No equipment registered yet</h3>
          <p className="text-gray-500 mb-6">Register your golf equipment to ensure it's covered under your policy</p>
          <button onClick={() => setShowForm(true)} className="bg-secondary text-white px-6 py-2 rounded font-bold hover:bg-emerald-700">
            + Add First Item
          </button>
        </div>
      ) : (
        <div className="grid gap-4">
          {equipment.map(item => {
            const cat = getCategoryInfo(item.category)
            return (
              <div key={item.id} className="bg-white rounded-lg shadow p-5 flex items-center gap-5">
                <div className="text-4xl w-14 text-center shrink-0">{cat.icon}</div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-3 mb-1">
                    <h3 className="font-bold text-lg truncate">{item.name}</h3>
                    <span className={`px-2 py-0.5 rounded-full text-xs font-semibold shrink-0 ${STATUS_COLORS[item.status] || 'bg-gray-100 text-gray-600'}`}>
                      {item.status}
                    </span>
                  </div>
                  <div className="flex gap-4 text-sm text-gray-500 flex-wrap">
                    <span className="bg-gray-100 px-2 py-0.5 rounded">{cat.label}</span>
                    {item.brand && <span>{item.brand}{item.model_name ? ` ${item.model_name}` : ''}</span>}
                    {item.serial_number && <span>S/N: {item.serial_number}</span>}
                    {item.purchase_date && <span>Purchased: {item.purchase_date}</span>}
                  </div>
                </div>
                <div className="text-right shrink-0">
                  <p className="text-xl font-bold text-secondary">${item.estimated_value.toFixed(0)}</p>
                  <p className="text-xs text-gray-400">est. value</p>
                </div>
                <div className="flex flex-col gap-2 shrink-0">
                  {item.status === 'active' && (
                    <>
                      <button
                        onClick={() => handleStatusChange(item.id, 'lost')}
                        className="text-xs px-3 py-1 bg-red-100 text-red-700 rounded hover:bg-red-200"
                      >
                        Report Lost
                      </button>
                      <button
                        onClick={() => handleStatusChange(item.id, 'damaged')}
                        className="text-xs px-3 py-1 bg-orange-100 text-orange-700 rounded hover:bg-orange-200"
                      >
                        Report Damaged
                      </button>
                    </>
                  )}
                  <button
                    onClick={() => handleDelete(item.id, item.name)}
                    className="text-xs px-3 py-1 bg-gray-100 text-gray-600 rounded hover:bg-gray-200"
                  >
                    Remove
                  </button>
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
