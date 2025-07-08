"use client"

import React from 'react'
import { SidebarTrigger } from '@/components/ui/sidebar'
import { cn } from '@/lib/utils'

interface SidebarTriggerWithTooltipProps {
  className?: string
}

export function SidebarTriggerWithTooltip({ className }: SidebarTriggerWithTooltipProps) {
  return (
    <div className="sidebar-toggle-tooltip" data-shortcut-text="Alt+L">
      <SidebarTrigger
        className={cn(
          "sidebar-toggle-round",
          "text-white/70 hover:text-white",
          "transition-all duration-200",
          className
        )}
      />
    </div>
  )
}