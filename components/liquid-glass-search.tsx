"use client"

import React, { useEffect, useRef, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Search, X } from 'lucide-react'
import { cn } from '@/lib/utils'

interface LiquidGlassSearchProps {
  value?: string
  className?: string
}

export function LiquidGlassSearch({ value: initialValue, className }: LiquidGlassSearchProps) {
  const router = useRouter()
  const [value, setValue] = useState(initialValue ?? '')
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    const timeoutId = setTimeout(() => {
      router.replace(`/?q=${encodeURIComponent(value)}`)
    }, 300) // Debounce search

    return () => clearTimeout(timeoutId)
  }, [router, value])

  // Focus search with "/" key
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === '/' && !event.ctrlKey && !event.metaKey && !event.altKey) {
        event.preventDefault()
        inputRef.current?.focus()
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [])

  return (
    <div className={cn(
      "relative w-full max-w-lg mx-auto organic-search-container", // Changed max-w-md to max-w-lg
      // Original liquid glass styles are now in organic-search-container or can be removed if redundant
      // "bg-gradient-to-r from-white/[0.08] via-white/[0.05] to-white/[0.08]",
      // "backdrop-blur-xl backdrop-saturate-150",
      // "border border-white/20",
      // "rounded-2xl", // This will be overridden by organic-search-container
      // "shadow-[0_8px_32px_rgba(0,0,0,0.3)]",
      // "before:absolute before:inset-0 before:rounded-2xl before:bg-gradient-to-br before:from-white/[0.12] before:to-transparent before:pointer-events-none",
      // "after:absolute after:inset-0 after:rounded-2xl after:shadow-inner after:shadow-white/[0.08] after:pointer-events-none",
      // "transition-all duration-300 ease-out", // This is in organic-search-container
      // "hover:transform hover:scale-[1.02] hover:shadow-[0_12px_40px_rgba(0,0,0,0.4)]", // This is in organic-search-container
      className
    )}>
      <div className="relative flex items-center px-4 py-2"> {/* Changed p-2 to px-4 py-2 */}
        <Search className="h-3 w-3 text-white/60 mr-2 z-10" />
        <Input
          ref={inputRef}
          type="search"
          className={cn(
            "flex-1 bg-transparent border-0 text-white placeholder:text-white/50",
            "focus-visible:ring-0 focus-visible:ring-offset-0",
            "text-xs font-medium h-6",
            "[&::-webkit-search-cancel-button]:appearance-none",
            "z-10"
          )}
          style={{
            WebkitAppearance: 'none',
            MozAppearance: 'none',
            appearance: 'none',
          }}
          placeholder="Search tracks, artists, albums..."
          value={value}
          onChange={(e) => setValue(e.currentTarget.value)}
        />
        {value ? (
          <Button
            type="button"
            variant="ghost"
            size="icon"
            className="h-5 w-5 text-white/60 hover:text-white hover:bg-white/10 z-10"
            onClick={() => setValue('')}
          >
            <X className="h-2.5 w-2.5" />
            <span className="sr-only">Clear search</span>
          </Button>
        ) : (
          <div className="flex items-center justify-center h-5 w-5 bg-white/10 rounded text-white/60 border border-white/20 z-10">
            <span className="font-mono text-[10px]">/</span>
          </div>
        )}
      </div>
      
      {/* Additional glass distortion effect */}
      <div 
        className="absolute inset-0 rounded-2xl pointer-events-none"
        style={{
          filter: 'url(#glass-distortion)',
          WebkitFilter: 'url(#glass-distortion)',
          opacity: 0.6
        }}
      />
    </div>
  )
}