'use client'

import { useState } from 'react'
import Link from 'next/link'

export default function LandingPage() {
  const [isPressed, setIsPressed] = useState(false)

  return (
    <div className="flex flex-col min-h-screen px-6 py-8 safe-bottom">
      {/* Header */}
      <div className="flex items-center gap-3 mb-2">
        <div className="w-10 h-10 bg-green-500 rounded-xl flex items-center justify-center">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M7 20h10" />
            <path d="M10 20c5.5-2.5.8-6.4 3-10" />
            <path d="M9.5 9.4c1.1.8 1.8 2.2 2.3 3.7-2 .4-3.5.4-4.8-.3-1.2-.6-2.3-1.9-3-4.2 2.8-.5 4.4 0 5.5.8z" />
            <path d="M14.1 6a7 7 0 0 0-1.1 4c1.9-.1 3.3-.6 4.3-1.4 1-1 1.6-2.3 1.7-4.6-2.7.1-4 1-4.9 2z" />
          </svg>
        </div>
        <h1 className="text-2xl font-bold">Greenmind</h1>
      </div>

      {/* Hero Section */}
      <div className="flex-1 flex flex-col justify-center -mt-12">
        <p className="text-green-400 font-medium text-sm uppercase tracking-wider mb-3">
          AI-Powered Garden Design
        </p>
        <h2 className="text-4xl font-bold leading-tight mb-4">
          Design your
          <br />
          <span className="text-green-400">dream garden</span>
          <br />
          in minutes
        </h2>
        <p className="text-white/60 text-lg leading-relaxed mb-8 max-w-sm">
          Upload a photo of your yard. Our AI generates stunning landscape designs with full plant schedules and build packs.
        </p>

        {/* Feature Pills */}
        <div className="flex flex-wrap gap-2 mb-10">
          {['AI Design', 'Plant Schedule', 'Build Pack', '3D Preview'].map((feature) => (
            <span
              key={feature}
              className="badge bg-green-500/20 text-green-300 border border-green-500/30 px-3 py-1.5"
            >
              {feature}
            </span>
          ))}
        </div>

        {/* CTA */}
        <Link href="/greenmind-demo">
          <button
            className={`btn-primary w-full text-lg py-4 ${isPressed ? 'scale-95' : ''} animate-pulse-glow`}
            onTouchStart={() => setIsPressed(true)}
            onTouchEnd={() => setIsPressed(false)}
            onMouseDown={() => setIsPressed(true)}
            onMouseUp={() => setIsPressed(false)}
          >
            Start with a Photo
          </button>
        </Link>
        <p className="text-white/40 text-sm text-center mt-4">
          No account needed for demo
        </p>
      </div>

      {/* Bottom Info */}
      <div className="grid grid-cols-3 gap-4 pt-8 border-t border-white/10">
        <div className="text-center">
          <p className="text-2xl font-bold text-green-400">3</p>
          <p className="text-xs text-white/50">AI Concepts</p>
        </div>
        <div className="text-center">
          <p className="text-2xl font-bold text-green-400">14</p>
          <p className="text-xs text-white/50">Plant Species</p>
        </div>
        <div className="text-center">
          <p className="text-2xl font-bold text-green-400">7</p>
          <p className="text-xs text-white/50">Garden Zones</p>
        </div>
      </div>
    </div>
  )
}
