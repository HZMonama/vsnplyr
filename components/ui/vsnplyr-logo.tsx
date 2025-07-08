"use client"

import React from 'react'
import { cn } from '@/lib/utils'

interface VsnplyrLogoProps {
  className?: string
  size?: 'sm' | 'md' | 'lg'
}

export function VsnplyrLogo({ className, size = 'md' }: VsnplyrLogoProps) {
  const sizeClasses = {
    sm: 'text-lg',
    md: 'text-xl',
    lg: 'text-2xl'
  }

  return (
    <div className={cn(
      'font-bold tracking-tight select-none',
      'bg-gradient-to-r from-white via-gray-200 to-gray-300 bg-clip-text text-transparent',
      'font-darker-grotesque',
      sizeClasses[size],
      className
    )}>
      vsnplyr
    </div>
  )
}