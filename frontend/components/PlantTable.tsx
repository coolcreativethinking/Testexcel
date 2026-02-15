'use client'

import { useState } from 'react'

interface Plant {
  plant_id: string
  common_name: string
  botanical_name: string
  zone: string
  quantity: number
  sun_requirement: string
  water_needs: string
  bloom_season: string
  notes: string
}

interface PlantTableProps {
  plants: Plant[]
}

const sunIcons: Record<string, string> = {
  'Full Sun': '☀️',
  'Part Shade': '⛅',
  'Shade': '🌥️',
}

const waterColors: Record<string, string> = {
  'Low': 'text-yellow-400',
  'Moderate': 'text-blue-400',
  'Regular': 'text-blue-500',
}

export default function PlantTable({ plants }: PlantTableProps) {
  const [expandedId, setExpandedId] = useState<string | null>(null)
  const [filterZone, setFilterZone] = useState<string>('All')

  const zones = ['All', ...Array.from(new Set(plants.map(p => p.zone)))]
  const filtered = filterZone === 'All' ? plants : plants.filter(p => p.zone === filterZone)

  return (
    <div>
      {/* Zone Filter Chips */}
      <div className="flex gap-2 overflow-x-auto pb-3 mb-4 -mx-1 px-1 scrollbar-hide">
        {zones.map((zone) => (
          <button
            key={zone}
            onClick={() => setFilterZone(zone)}
            className={`whitespace-nowrap px-3 py-1.5 rounded-full text-xs font-medium transition-all
              ${filterZone === zone
                ? 'bg-green-500 text-white'
                : 'bg-white/10 text-white/60 hover:bg-white/20'
              }`}
          >
            {zone}
          </button>
        ))}
      </div>

      {/* Plant Cards */}
      <div className="space-y-2">
        {filtered.map((plant) => (
          <div
            key={plant.plant_id}
            className="card-interactive"
            onClick={() => setExpandedId(expandedId === plant.plant_id ? null : plant.plant_id)}
          >
            <div className="flex items-center justify-between">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span className="text-sm">{sunIcons[plant.sun_requirement] || '🌿'}</span>
                  <h4 className="font-semibold text-sm truncate">{plant.common_name}</h4>
                  <span className="badge bg-green-500/20 text-green-300 text-[10px]">
                    x{plant.quantity}
                  </span>
                </div>
                <p className="text-white/40 text-xs italic mt-0.5">{plant.botanical_name}</p>
              </div>
              <svg
                width="16" height="16" viewBox="0 0 24 24" fill="none"
                stroke="currentColor" strokeWidth="2"
                className={`transition-transform text-white/30 ${expandedId === plant.plant_id ? 'rotate-180' : ''}`}
              >
                <path d="m6 9 6 6 6-6" />
              </svg>
            </div>

            {expandedId === plant.plant_id && (
              <div className="mt-3 pt-3 border-t border-white/10 grid grid-cols-2 gap-y-2 gap-x-4 text-xs animate-fade-in-up">
                <div>
                  <span className="text-white/40">Zone</span>
                  <p className="text-white/80">{plant.zone}</p>
                </div>
                <div>
                  <span className="text-white/40">Sun</span>
                  <p className="text-white/80">{plant.sun_requirement}</p>
                </div>
                <div>
                  <span className="text-white/40">Water</span>
                  <p className={waterColors[plant.water_needs] || 'text-white/80'}>{plant.water_needs}</p>
                </div>
                <div>
                  <span className="text-white/40">Bloom</span>
                  <p className="text-white/80">{plant.bloom_season}</p>
                </div>
                {plant.notes && (
                  <div className="col-span-2">
                    <span className="text-white/40">Notes</span>
                    <p className="text-white/60">{plant.notes}</p>
                  </div>
                )}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  )
}
