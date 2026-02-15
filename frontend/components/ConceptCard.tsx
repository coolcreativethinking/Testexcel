'use client'

interface ConceptCardProps {
  title: string
  description: string
  style: string
  gradient: string
  icon: string
  isSelected: boolean
  onSelect: () => void
}

const icons: Record<string, JSX.Element> = {
  modern: (
    <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
      <rect x="3" y="3" width="7" height="7" rx="1" />
      <rect x="14" y="3" width="7" height="7" rx="1" />
      <rect x="3" y="14" width="7" height="7" rx="1" />
      <rect x="14" y="14" width="7" height="7" rx="1" />
    </svg>
  ),
  cottage: (
    <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
      <path d="M3 21h18" />
      <path d="M5 21V7l7-4 7 4v14" />
      <path d="M9 21v-6h6v6" />
    </svg>
  ),
  minimalist: (
    <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
      <circle cx="12" cy="12" r="9" />
      <path d="M12 8v4l2 2" />
    </svg>
  ),
}

export default function ConceptCard({
  title,
  description,
  style,
  gradient,
  isSelected,
  onSelect,
}: ConceptCardProps) {
  return (
    <button
      onClick={onSelect}
      className={`w-full text-left rounded-2xl p-5 transition-all duration-200 active:scale-[0.97]
        ${isSelected
          ? `bg-gradient-to-br ${gradient} border-2 border-white/30 shadow-lg`
          : 'bg-white/5 border border-white/10 hover:bg-white/10'
        }`}
    >
      <div className="flex items-start gap-4">
        <div className={`w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0
          ${isSelected ? 'bg-white/20' : 'bg-white/10'}`}>
          {icons[style] || icons.modern}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <h3 className="font-bold text-lg">{title}</h3>
            {isSelected && (
              <span className="badge bg-white/20 text-white text-[10px]">Selected</span>
            )}
          </div>
          <p className="text-white/60 text-sm mt-1 leading-relaxed">{description}</p>
        </div>
      </div>
    </button>
  )
}
