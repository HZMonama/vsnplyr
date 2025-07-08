"use client"

import React from 'react'
import { useSearchParams } from 'next/navigation'
import { LiquidGlassSearch } from '@/components/liquid-glass-search'

export function SearchOverlay() {
  const searchParams = useSearchParams()
  const query = searchParams.get('q') || ''

  return (
    <div className="fixed top-4 left-1/2 transform -translate-x-1/2 z-50">
      <div className="w-96">
        <LiquidGlassSearch value={query} />
      </div>
    </div>
  )
}