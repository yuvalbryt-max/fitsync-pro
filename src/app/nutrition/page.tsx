'use client'

import { useState, useEffect, useRef } from 'react'

type NutritionEntry = {
  id: string
  food_name: string
  kcal: number
  grams: number | null
  protein_g: number | null
  carbs_g: number | null
  fat_g: number | null
  entry_method: string
  logged_at: string
}

type Tab = 'log' | 'text' | 'manual'

export default function NutritionPage() {
  const [activeTab, setActiveTab] = useState<Tab>('log')
  const [entries, setEntries] = useState<NutritionEntry[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)

  // Text entry state
  const [textInput, setTextInput] = useState('')
  const [textLoading, setTextLoading] = useState(false)

  // Manual entry state
  const [manualForm, setManualForm] = useState({
    food_name: '',
    kcal: '',
    grams: '',
    protein_g: '',
    carbs_g: '',
    fat_g: '',
  })
  const [manualLoading, setManualLoading] = useState(false)

  // Photo entry state
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [photoGrams, setPhotoGrams] = useState('100')
  const [photoLoading, setPhotoLoading] = useState(false)

  async function fetchEntries() {
    setLoading(true)
    setError(null)
    try {
      const res = await fetch('/api/nutrition/manual')
      if (!res.ok) throw new Error('Failed to fetch entries')
      const data = await res.json()
      setEntries(data)
    } catch (err) {
      setError(String(err))
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchEntries()
  }, [])

  const totalKcal = entries.reduce((sum, e) => sum + (e.kcal || 0), 0)
  const totalProtein = entries.reduce((sum, e) => sum + (e.protein_g || 0), 0)
  const totalCarbs = entries.reduce((sum, e) => sum + (e.carbs_g || 0), 0)
  const totalFat = entries.reduce((sum, e) => sum + (e.fat_g || 0), 0)

  function showSuccess(msg: string) {
    setSuccess(msg)
    setTimeout(() => setSuccess(null), 3000)
  }

  async function handleTextSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!textInput.trim()) return
    setTextLoading(true)
    setError(null)
    try {
      const res = await fetch('/api/nutrition/text', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text: textInput }),
      })
      if (!res.ok) {
        const d = await res.json()
        throw new Error(d.error || 'Failed to parse text')
      }
      const data = await res.json()
      setTextInput('')
      showSuccess(`Added ${data.entries?.length || 0} item(s) — ${data.total_kcal} kcal`)
      setActiveTab('log')
      fetchEntries()
    } catch (err) {
      setError(String(err))
    } finally {
      setTextLoading(false)
    }
  }

  async function handleManualSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!manualForm.food_name || !manualForm.kcal) return
    setManualLoading(true)
    setError(null)
    try {
      const res = await fetch('/api/nutrition/manual', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          food_name: manualForm.food_name,
          kcal: manualForm.kcal,
          grams: manualForm.grams || null,
          protein_g: manualForm.protein_g || null,
          carbs_g: manualForm.carbs_g || null,
          fat_g: manualForm.fat_g || null,
        }),
      })
      if (!res.ok) {
        const d = await res.json()
        throw new Error(d.error || 'Failed to add entry')
      }
      setManualForm({ food_name: '', kcal: '', grams: '', protein_g: '', carbs_g: '', fat_g: '' })
      showSuccess('Entry added successfully')
      setActiveTab('log')
      fetchEntries()
    } catch (err) {
      setError(String(err))
    } finally {
      setManualLoading(false)
    }
  }

  async function handlePhotoUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    setPhotoLoading(true)
    setError(null)
    try {
      const reader = new FileReader()
      reader.onload = async (ev) => {
        const base64 = (ev.target?.result as string).split(',')[1]
        const res = await fetch('/api/nutrition/photo', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ imageBase64: base64, grams: photoGrams }),
        })
        if (!res.ok) {
          const d = await res.json()
          throw new Error(d.error || 'Failed to analyze photo')
        }
        const data = await res.json()
        showSuccess(`Added ${data.entry?.food_name} — ${data.entry?.kcal} kcal`)
        setActiveTab('log')
        fetchEntries()
        setPhotoLoading(false)
      }
      reader.readAsDataURL(file)
    } catch (err) {
      setError(String(err))
      setPhotoLoading(false)
    }
    // Reset file input
    if (fileInputRef.current) fileInputRef.current.value = ''
  }

  return (
    <div className="min-h-screen bg-gray-950 text-white p-4 max-w-2xl mx-auto">
      <h1 className="text-2xl font-bold mb-2">Nutrition Tracker</h1>
      <p className="text-gray-400 text-sm mb-6">
        {new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}
      </p>

      {/* Daily summary */}
      <div className="grid grid-cols-4 gap-3 mb-6">
        {[
          { label: 'Calories', value: Math.round(totalKcal), unit: 'kcal', color: 'text-orange-400' },
          { label: 'Protein', value: totalProtein.toFixed(1), unit: 'g', color: 'text-blue-400' },
          { label: 'Carbs', value: totalCarbs.toFixed(1), unit: 'g', color: 'text-yellow-400' },
          { label: 'Fat', value: totalFat.toFixed(1), unit: 'g', color: 'text-red-400' },
        ].map((stat) => (
          <div key={stat.label} className="bg-gray-900 rounded-xl p-3 text-center">
            <div className={`text-xl font-bold ${stat.color}`}>{stat.value}</div>
            <div className="text-xs text-gray-500">{stat.unit}</div>
            <div className="text-xs text-gray-400 mt-1">{stat.label}</div>
          </div>
        ))}
      </div>

      {/* Tabs */}
      <div className="flex gap-1 mb-6 bg-gray-900 rounded-xl p-1">
        {([
          { key: 'log', label: 'Today\'s Log' },
          { key: 'text', label: 'Text / Photo' },
          { key: 'manual', label: 'Manual' },
        ] as { key: Tab; label: string }[]).map((tab) => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key)}
            className={`flex-1 py-2 px-3 rounded-lg text-sm font-medium transition-colors ${
              activeTab === tab.key
                ? 'bg-orange-500 text-white'
                : 'text-gray-400 hover:text-white'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Messages */}
      {error && (
        <div className="bg-red-900/50 border border-red-700 text-red-300 rounded-lg p-3 mb-4 text-sm">
          {error}
        </div>
      )}
      {success && (
        <div className="bg-green-900/50 border border-green-700 text-green-300 rounded-lg p-3 mb-4 text-sm">
          {success}
        </div>
      )}

      {/* Log Tab */}
      {activeTab === 'log' && (
        <div>
          {loading ? (
            <div className="text-center text-gray-500 py-8">Loading entries...</div>
          ) : entries.length === 0 ? (
            <div className="text-center text-gray-500 py-8">
              <p className="text-lg mb-2">No entries yet today</p>
              <p className="text-sm">Use Text/Photo or Manual tab to add food</p>
            </div>
          ) : (
            <div className="space-y-2">
              {entries.map((entry) => (
                <div key={entry.id} className="bg-gray-900 rounded-xl p-4">
                  <div className="flex justify-between items-start">
                    <div>
                      <p className="font-medium">{entry.food_name}</p>
                      <p className="text-xs text-gray-500 mt-0.5">
                        {entry.grams ? `${entry.grams}g · ` : ''}
                        {entry.entry_method} ·{' '}
                        {new Date(entry.logged_at).toLocaleTimeString('en-US', {
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="font-bold text-orange-400">{entry.kcal} kcal</p>
                      {(entry.protein_g || entry.carbs_g || entry.fat_g) && (
                        <p className="text-xs text-gray-500 mt-0.5">
                          P:{entry.protein_g?.toFixed(0) ?? 0}g C:{entry.carbs_g?.toFixed(0) ?? 0}g F:{entry.fat_g?.toFixed(0) ?? 0}g
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Text / Photo Tab */}
      {activeTab === 'text' && (
        <div className="space-y-6">
          {/* Text entry */}
          <div className="bg-gray-900 rounded-xl p-4">
            <h2 className="font-semibold mb-3">Describe Your Meal</h2>
            <form onSubmit={handleTextSubmit} className="space-y-3">
              <textarea
                value={textInput}
                onChange={(e) => setTextInput(e.target.value)}
                placeholder="e.g. 2 eggs, 1 toast with butter and a cup of coffee with milk"
                className="w-full bg-gray-800 rounded-lg p-3 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-orange-500"
                rows={4}
              />
              <button
                type="submit"
                disabled={textLoading || !textInput.trim()}
                className="w-full bg-orange-500 hover:bg-orange-600 disabled:opacity-50 disabled:cursor-not-allowed text-white py-2.5 rounded-lg font-medium transition-colors"
              >
                {textLoading ? 'Analyzing with AI...' : 'Parse with AI'}
              </button>
            </form>
          </div>

          {/* Photo entry */}
          <div className="bg-gray-900 rounded-xl p-4">
            <h2 className="font-semibold mb-3">Scan Nutrition Label</h2>
            <div className="space-y-3">
              <div className="flex items-center gap-3">
                <label className="text-sm text-gray-400 whitespace-nowrap">Serving (g):</label>
                <input
                  type="number"
                  value={photoGrams}
                  onChange={(e) => setPhotoGrams(e.target.value)}
                  className="w-24 bg-gray-800 rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500"
                  min="1"
                />
              </div>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                capture="environment"
                className="hidden"
                onChange={handlePhotoUpload}
              />
              <button
                onClick={() => fileInputRef.current?.click()}
                disabled={photoLoading}
                className="w-full bg-blue-600 hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed text-white py-2.5 rounded-lg font-medium transition-colors"
              >
                {photoLoading ? 'Analyzing photo...' : 'Take Photo / Upload'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Manual Tab */}
      {activeTab === 'manual' && (
        <div className="bg-gray-900 rounded-xl p-4">
          <h2 className="font-semibold mb-4">Add Entry Manually</h2>
          <form onSubmit={handleManualSubmit} className="space-y-3">
            <div>
              <label className="text-xs text-gray-400 mb-1 block">Food Name *</label>
              <input
                type="text"
                value={manualForm.food_name}
                onChange={(e) => setManualForm((f) => ({ ...f, food_name: e.target.value }))}
                placeholder="e.g. Chicken Breast"
                className="w-full bg-gray-800 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500"
                required
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs text-gray-400 mb-1 block">Calories (kcal) *</label>
                <input
                  type="number"
                  value={manualForm.kcal}
                  onChange={(e) => setManualForm((f) => ({ ...f, kcal: e.target.value }))}
                  placeholder="250"
                  className="w-full bg-gray-800 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500"
                  required
                  min="0"
                />
              </div>
              <div>
                <label className="text-xs text-gray-400 mb-1 block">Weight (g)</label>
                <input
                  type="number"
                  value={manualForm.grams}
                  onChange={(e) => setManualForm((f) => ({ ...f, grams: e.target.value }))}
                  placeholder="150"
                  className="w-full bg-gray-800 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500"
                  min="0"
                />
              </div>
            </div>
            <div className="grid grid-cols-3 gap-3">
              <div>
                <label className="text-xs text-gray-400 mb-1 block">Protein (g)</label>
                <input
                  type="number"
                  value={manualForm.protein_g}
                  onChange={(e) => setManualForm((f) => ({ ...f, protein_g: e.target.value }))}
                  placeholder="30"
                  className="w-full bg-gray-800 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500"
                  min="0"
                  step="0.1"
                />
              </div>
              <div>
                <label className="text-xs text-gray-400 mb-1 block">Carbs (g)</label>
                <input
                  type="number"
                  value={manualForm.carbs_g}
                  onChange={(e) => setManualForm((f) => ({ ...f, carbs_g: e.target.value }))}
                  placeholder="0"
                  className="w-full bg-gray-800 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500"
                  min="0"
                  step="0.1"
                />
              </div>
              <div>
                <label className="text-xs text-gray-400 mb-1 block">Fat (g)</label>
                <input
                  type="number"
                  value={manualForm.fat_g}
                  onChange={(e) => setManualForm((f) => ({ ...f, fat_g: e.target.value }))}
                  placeholder="8"
                  className="w-full bg-gray-800 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500"
                  min="0"
                  step="0.1"
                />
              </div>
            </div>
            <button
              type="submit"
              disabled={manualLoading || !manualForm.food_name || !manualForm.kcal}
              className="w-full bg-orange-500 hover:bg-orange-600 disabled:opacity-50 disabled:cursor-not-allowed text-white py-2.5 rounded-lg font-medium transition-colors mt-2"
            >
              {manualLoading ? 'Adding...' : 'Add Entry'}
            </button>
          </form>
        </div>
      )}
    </div>
  )
}
