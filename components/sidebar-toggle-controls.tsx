"use client"

import React from 'react'
import { SidebarTriggerWithTooltip } from '@/components/sidebar-trigger-with-tooltip'
import { RightSidebarTrigger } from '@/components/now-playing-sidebar'
import { useSidebar, useRightSidebar } from '@/components/ui/sidebar'
import { cn } from '@/lib/utils'

export function SidebarToggleControls() {
  const { state: leftState } = useSidebar()
  const { state: rightState } = useRightSidebar()

  return (
    <>
      {/* Left Sidebar Toggle with responsive positioning */}
      <div 
        className={cn(
          "fixed top-4 z-50 transition-all duration-300 ease-in-out flex items-center gap-2",
          leftState === "collapsed" 
            ? "left-4" 
            : "left-[calc(20vw+32px)]"
        )}
      >
        <SidebarTriggerWithTooltip />
        <div className="text-xs text-white/60 font-mono px-2 py-1 rounded backdrop-blur-sm keyboard-shortcut-tooltip">
          Alt+L
        </div>
      </div>

      {/* Right Sidebar Toggle with responsive positioning */}
      <div
        className={cn(
          "fixed top-4 z-50 transition-all duration-300 ease-in-out flex items-center gap-2",
          rightState === "collapsed"
            ? "right-4"
            : "right-[calc(20vw+32px)]"
        )}
      >
        <div className="text-xs text-white/60 font-mono px-2 py-1 rounded backdrop-blur-sm keyboard-shortcut-tooltip">
          Alt+R
        </div>
        <RightSidebarTrigger />
      </div>
    </>
  )
}