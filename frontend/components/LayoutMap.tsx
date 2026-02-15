'use client'

interface Zone {
  id: string
  name: string
  type: string
  bounds: { x: number; y: number; width: number; height: number }
  color: string
  plants: string[]
}

interface LayoutData {
  name: string
  dimensions: { width: number; height: number; unit: string }
  zones: Zone[]
  features: { id: string; name: string; type: string; position: { x: number; y: number } }[]
}

interface LayoutMapProps {
  layout: LayoutData
}

export default function LayoutMap({ layout }: LayoutMapProps) {
  const { dimensions, zones, features } = layout
  const scale = 100 / dimensions.width

  return (
    <div>
      <div className="relative w-full rounded-2xl overflow-hidden bg-green-950/50 border border-white/10"
           style={{ aspectRatio: `${dimensions.width}/${dimensions.height}` }}>
        {/* Zones */}
        {zones.map((zone) => (
          <div
            key={zone.id}
            className="absolute flex items-center justify-center text-center transition-all hover:opacity-80 cursor-pointer group"
            style={{
              left: `${zone.bounds.x * scale}%`,
              top: `${zone.bounds.y * scale}%`,
              width: `${zone.bounds.width * scale}%`,
              height: `${zone.bounds.height * scale}%`,
              backgroundColor: zone.color + '40',
              border: `1px solid ${zone.color}60`,
            }}
          >
            <div className="px-1">
              <p className="text-[10px] sm:text-xs font-semibold text-white drop-shadow-lg leading-tight">
                {zone.name}
              </p>
              {zone.plants.length > 0 && (
                <p className="text-[8px] sm:text-[10px] text-white/60 mt-0.5 hidden sm:block">
                  {zone.plants.length} plant{zone.plants.length !== 1 ? 's' : ''}
                </p>
              )}
            </div>
          </div>
        ))}

        {/* Features */}
        {features.map((feature) => (
          <div
            key={feature.id}
            className="absolute w-3 h-3 sm:w-4 sm:h-4 bg-white/30 rounded-full border border-white/50 flex items-center justify-center"
            style={{
              left: `${feature.position.x * scale}%`,
              top: `${feature.position.y * scale}%`,
              transform: 'translate(-50%, -50%)',
            }}
            title={feature.name}
          >
            <span className="text-[8px]">
              {feature.type === 'fountain' ? '💧' : '🪑'}
            </span>
          </div>
        ))}
      </div>

      {/* Legend */}
      <div className="mt-3 flex flex-wrap gap-2">
        {zones.map((zone) => (
          <div key={zone.id} className="flex items-center gap-1.5">
            <div
              className="w-3 h-3 rounded-sm"
              style={{ backgroundColor: zone.color }}
            />
            <span className="text-[10px] text-white/50">{zone.name}</span>
          </div>
        ))}
      </div>
    </div>
  )
}
