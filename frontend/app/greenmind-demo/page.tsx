'use client'

import { useState, useEffect } from 'react'
import PhotoUpload from '@/components/PhotoUpload'
import ConceptCard from '@/components/ConceptCard'
import PlantTable from '@/components/PlantTable'
import BomTable from '@/components/BomTable'
import LayoutMap from '@/components/LayoutMap'
import BottomNav from '@/components/BottomNav'

const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'

const concepts = [
  {
    title: 'Modern',
    style: 'modern',
    description: 'Clean lines, structured planting, and architectural features with native grasses and sculptural plants.',
    gradient: 'from-emerald-600/40 to-cyan-600/40',
  },
  {
    title: 'Cottage',
    style: 'cottage',
    description: 'Lush, informal planting with roses, lavender, and perennials. A romantic, lived-in garden feel.',
    gradient: 'from-pink-600/40 to-amber-600/40',
  },
  {
    title: 'Minimalist',
    style: 'minimalist',
    description: 'Less is more. Bold specimen plants, open space, and a calming palette of greens and whites.',
    gradient: 'from-gray-600/40 to-green-600/40',
  },
]

function parseCSV(text: string) {
  const lines = text.trim().split('\n')
  const headers = lines[0].split(',')
  return lines.slice(1).map((line) => {
    const values = line.split(',')
    const obj: Record<string, string | number> = {}
    headers.forEach((header, i) => {
      const val = values[i]?.trim() || ''
      const num = Number(val)
      obj[header.trim()] = !isNaN(num) && val !== '' && !header.includes('id') && !header.includes('name')
        && !header.includes('description') && !header.includes('zone') && !header.includes('sun')
        && !header.includes('water') && !header.includes('bloom') && !header.includes('soil')
        && !header.includes('notes') && !header.includes('supplier') && !header.includes('unit')
        && !header.includes('category') && !header.includes('botanical')
        ? num : val
    })
    return obj
  })
}

export default function GreenmindDemo() {
  const [activeTab, setActiveTab] = useState('design')
  const [photoUploaded, setPhotoUploaded] = useState(false)
  const [selectedConcept, setSelectedConcept] = useState<string | null>(null)
  const [isGenerating, setIsGenerating] = useState(false)
  const [showConcepts, setShowConcepts] = useState(false)
  const [plants, setPlants] = useState<any[]>([])
  const [bom, setBom] = useState<any[]>([])
  const [layout, setLayout] = useState<any>(null)

  // Load data from public directory (works without backend)
  useEffect(() => {
    Promise.all([
      fetch('/plant_schedule.csv').then(r => r.text()).then(parseCSV),
      fetch('/sample_bom.csv').then(r => r.text()).then(parseCSV),
      fetch('/layout.json').then(r => r.json()),
    ]).then(([plantData, bomData, layoutData]) => {
      setPlants(plantData)
      setBom(bomData)
      setLayout(layoutData)
    }).catch(console.error)
  }, [])

  const handlePhotoSelected = (_file: File, _preview: string) => {
    setPhotoUploaded(true)
    setIsGenerating(true)
    setShowConcepts(false)
    setSelectedConcept(null)

    // Simulate AI processing
    setTimeout(() => {
      setIsGenerating(false)
      setShowConcepts(true)
    }, 2000)
  }

  const handleConceptSelect = (style: string) => {
    setSelectedConcept(style)
  }

  return (
    <div className="min-h-screen pb-20">
      {/* Header */}
      <header className="sticky top-0 z-40 bg-green-950/95 backdrop-blur-lg border-b border-white/10 px-5 py-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <a href="/" className="flex items-center gap-2">
              <div className="w-8 h-8 bg-green-500 rounded-lg flex items-center justify-center">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round">
                  <path d="M7 20h10" />
                  <path d="M10 20c5.5-2.5.8-6.4 3-10" />
                  <path d="M9.5 9.4c1.1.8 1.8 2.2 2.3 3.7-2 .4-3.5.4-4.8-.3-1.2-.6-2.3-1.9-3-4.2 2.8-.5 4.4 0 5.5.8z" />
                </svg>
              </div>
              <span className="font-bold text-lg">Greenmind</span>
            </a>
          </div>
          {selectedConcept && (
            <span className="badge bg-green-500/20 text-green-300 border border-green-500/30">
              {selectedConcept} style
            </span>
          )}
        </div>
      </header>

      {/* Content */}
      <div className="px-5 py-5">
        {/* Design Tab */}
        {activeTab === 'design' && (
          <div className="space-y-6 animate-fade-in-up">
            <div>
              <h2 className="section-title">Upload Your Yard</h2>
              <PhotoUpload onPhotoSelected={handlePhotoSelected} />
            </div>

            {/* Generating State */}
            {isGenerating && (
              <div className="card text-center py-8">
                <div className="w-12 h-12 mx-auto mb-4 rounded-full bg-green-500/20 flex items-center justify-center animate-pulse">
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#4ade80" strokeWidth="2">
                    <path d="M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4M4.93 19.07l2.83-2.83M16.24 7.76l2.83-2.83" />
                  </svg>
                </div>
                <p className="font-semibold mb-1">Analyzing your yard...</p>
                <p className="text-white/50 text-sm">AI is generating design concepts</p>
              </div>
            )}

            {/* AI Concepts */}
            {showConcepts && (
              <div>
                <h2 className="section-title">AI Design Concepts</h2>
                <p className="text-white/50 text-sm mb-4">
                  Choose a style that speaks to you
                </p>
                <div className="space-y-3">
                  {concepts.map((concept) => (
                    <ConceptCard
                      key={concept.style}
                      {...concept}
                      icon={concept.style}
                      isSelected={selectedConcept === concept.style}
                      onSelect={() => handleConceptSelect(concept.style)}
                    />
                  ))}
                </div>
              </div>
            )}

            {/* Downloads Section */}
            {selectedConcept && (
              <div className="animate-fade-in-up">
                <h2 className="section-title">Your Build Pack</h2>
                <div className="grid grid-cols-2 gap-3">
                  <a href="/sample_bom.csv" download className="card-interactive text-center py-4">
                    <div className="w-10 h-10 mx-auto mb-2 rounded-xl bg-blue-500/20 flex items-center justify-center">
                      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#60a5fa" strokeWidth="1.5">
                        <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                        <path d="M14 2v6h6" />
                        <path d="M12 18v-6" />
                        <path d="m9 15 3 3 3-3" />
                      </svg>
                    </div>
                    <p className="text-xs font-medium">Bill of Materials</p>
                    <p className="text-[10px] text-white/40">CSV</p>
                  </a>

                  <a href="/plant_schedule.csv" download className="card-interactive text-center py-4">
                    <div className="w-10 h-10 mx-auto mb-2 rounded-xl bg-green-500/20 flex items-center justify-center">
                      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#4ade80" strokeWidth="1.5">
                        <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                        <path d="M14 2v6h6" />
                        <path d="M12 18v-6" />
                        <path d="m9 15 3 3 3-3" />
                      </svg>
                    </div>
                    <p className="text-xs font-medium">Plant Schedule</p>
                    <p className="text-[10px] text-white/40">CSV</p>
                  </a>

                  <a href="/layout.json" download className="card-interactive text-center py-4">
                    <div className="w-10 h-10 mx-auto mb-2 rounded-xl bg-purple-500/20 flex items-center justify-center">
                      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#a78bfa" strokeWidth="1.5">
                        <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                        <path d="M14 2v6h6" />
                      </svg>
                    </div>
                    <p className="text-xs font-medium">Layout Data</p>
                    <p className="text-[10px] text-white/40">JSON</p>
                  </a>

                  <button
                    onClick={() => setActiveTab('layout')}
                    className="card-interactive text-center py-4"
                  >
                    <div className="w-10 h-10 mx-auto mb-2 rounded-xl bg-amber-500/20 flex items-center justify-center">
                      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#fbbf24" strokeWidth="1.5">
                        <rect x="3" y="3" width="18" height="18" rx="2" />
                        <path d="M3 9h18" />
                        <path d="M9 21V9" />
                      </svg>
                    </div>
                    <p className="text-xs font-medium">View Layout</p>
                    <p className="text-[10px] text-white/40">Interactive</p>
                  </button>
                </div>
              </div>
            )}

            {/* Empty State */}
            {!photoUploaded && (
              <div className="card text-center py-6">
                <p className="text-white/40 text-sm">
                  Upload a photo to get started with your garden design
                </p>
              </div>
            )}
          </div>
        )}

        {/* Plants Tab */}
        {activeTab === 'plants' && (
          <div className="animate-fade-in-up">
            <h2 className="section-title">Plant Schedule</h2>
            <p className="text-white/50 text-sm mb-4">
              {plants.length} plant species across all zones
            </p>
            <PlantTable plants={plants as any} />
          </div>
        )}

        {/* Budget Tab */}
        {activeTab === 'budget' && (
          <div className="animate-fade-in-up">
            <h2 className="section-title">Bill of Materials</h2>
            <p className="text-white/50 text-sm mb-4">
              Complete cost breakdown for your garden project
            </p>
            <BomTable items={bom as any} />
          </div>
        )}

        {/* Layout Tab */}
        {activeTab === 'layout' && (
          <div className="animate-fade-in-up">
            <h2 className="section-title">Garden Layout</h2>
            <p className="text-white/50 text-sm mb-4">
              {layout?.dimensions?.width}m x {layout?.dimensions?.height}m garden plan
            </p>
            {layout ? <LayoutMap layout={layout} /> : (
              <div className="card text-center py-8">
                <p className="text-white/40">Loading layout...</p>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Bottom Navigation */}
      <BottomNav activeTab={activeTab} onTabChange={setActiveTab} />
    </div>
  )
}
