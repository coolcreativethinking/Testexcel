'use client'

import { useState } from 'react'

interface BomItem {
  item_id: string
  category: string
  item_name: string
  description: string
  quantity: number
  unit: string
  unit_price: number
  total_price: number
  supplier: string
}

interface BomTableProps {
  items: BomItem[]
}

const categoryColors: Record<string, string> = {
  'Plants': 'bg-green-500/20 text-green-300',
  'Hardscape': 'bg-gray-500/20 text-gray-300',
  'Soil & Mulch': 'bg-amber-500/20 text-amber-300',
  'Irrigation': 'bg-blue-500/20 text-blue-300',
  'Features': 'bg-purple-500/20 text-purple-300',
  'Fertilizer': 'bg-orange-500/20 text-orange-300',
}

export default function BomTable({ items }: BomTableProps) {
  const [filterCategory, setFilterCategory] = useState<string>('All')

  const categories = ['All', ...Array.from(new Set(items.map(i => i.category)))]
  const filtered = filterCategory === 'All' ? items : items.filter(i => i.category === filterCategory)

  const total = filtered.reduce((sum, item) => sum + item.total_price, 0)

  return (
    <div>
      {/* Category Filter */}
      <div className="flex gap-2 overflow-x-auto pb-3 mb-4 -mx-1 px-1">
        {categories.map((cat) => (
          <button
            key={cat}
            onClick={() => setFilterCategory(cat)}
            className={`whitespace-nowrap px-3 py-1.5 rounded-full text-xs font-medium transition-all
              ${filterCategory === cat
                ? 'bg-green-500 text-white'
                : 'bg-white/10 text-white/60 hover:bg-white/20'
              }`}
          >
            {cat}
          </button>
        ))}
      </div>

      {/* Items */}
      <div className="space-y-2">
        {filtered.map((item) => (
          <div key={item.item_id} className="card flex items-center gap-3">
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-1">
                <h4 className="font-medium text-sm truncate">{item.item_name}</h4>
                <span className={`badge text-[10px] ${categoryColors[item.category] || 'bg-white/10 text-white/60'}`}>
                  {item.category}
                </span>
              </div>
              <p className="text-white/40 text-xs truncate">{item.description}</p>
              <p className="text-white/30 text-xs mt-0.5">
                {item.quantity} {item.unit} @ ${item.unit_price.toFixed(2)}
              </p>
            </div>
            <div className="text-right flex-shrink-0">
              <p className="font-bold text-green-400">${item.total_price.toFixed(2)}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Total */}
      <div className="mt-4 pt-4 border-t border-white/10 flex items-center justify-between">
        <span className="text-white/60 font-medium">Total ({filtered.length} items)</span>
        <span className="text-xl font-bold text-green-400">${total.toFixed(2)}</span>
      </div>
    </div>
  )
}
