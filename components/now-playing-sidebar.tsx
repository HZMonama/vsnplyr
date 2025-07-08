"use client"

import React from 'react'
import Image from 'next/image'
import { Pause, Play, SkipBack, SkipForward, Volume2 } from 'lucide-react'
import { ViewVerticalIcon } from "@radix-ui/react-icons"
import {
  Sidebar,
  SidebarContent,
  SidebarHeader,
  SidebarFooter,
  useRightSidebar,
} from '@/components/ui/sidebar'
import { Button } from '@/components/ui/button'
import { usePlayback } from '@/app/playback-context'
import { cn } from '@/lib/utils'

interface RightSidebarTriggerProps {
  className?: string
}

export function RightSidebarTrigger({ className }: RightSidebarTriggerProps) {
  const { toggleSidebar } = useRightSidebar()

  return (
    <div className="sidebar-toggle-tooltip" data-shortcut-text="Alt+R">
      <Button
        className={cn(
          "sidebar-toggle-round",
          "text-white/70 hover:text-white",
          "transition-all duration-200",
          className
        )}
        onClick={toggleSidebar}
      >
        <ViewVerticalIcon className="w-5 h-5" />
        <span className="sr-only">Toggle Now (Alt+R)</span>
      </Button>
    </div>
  )
}

export function NowSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
  const { currentTrack, isPlaying, togglePlayPause } = usePlayback()

  return (
    <Sidebar
      side="right"
      collapsible="offcanvas"
      variant="floating"
      useRightContext={true}
      className={cn(
        "transition-all duration-300 ease-in-out",
        "sidebar-floating sidebar-frosted-glass",
      )}
      {...props}
    >
      <SidebarHeader className="border-b border-white/10 bg-white/[0.02]">
        <div className="flex items-center justify-center p-2">
          <h3 className="text-lg font-semibold text-white/90">Now</h3>
        </div>
      </SidebarHeader>

      <SidebarContent className="px-4 py-6">
        {currentTrack ? (
          <div className="space-y-6">
            {/* Cover Image - Top Half */}
            <div className="aspect-square w-full relative rounded-lg overflow-hidden bg-black/20">
              <Image
                src={currentTrack.imageUrl || '/placeholder.svg'}
                alt={`${currentTrack.album} cover`}
                fill
                className="object-cover"
                priority
              />
            </div>

            {/* Track Info - Bottom Half */}
            <div className="space-y-4">
              <div className="text-center space-y-2">
                <h4 className="text-lg font-semibold text-white truncate">
                  {currentTrack.name}
                </h4>
                <p className="text-sm text-white/70 truncate">
                  {currentTrack.artist}
                </p>
                {currentTrack.album && (
                  <p className="text-xs text-white/50 truncate">
                    {currentTrack.album}
                  </p>
                )}
              </div>

              {/* Metadata */}
              <div className="grid grid-cols-2 gap-2 text-xs text-white/60">
                {currentTrack.genre && (
                  <div>
                    <span className="text-white/40">Genre:</span>
                    <br />
                    <span>{currentTrack.genre}</span>
                  </div>
                )}
                {currentTrack.bpm && (
                  <div>
                    <span className="text-white/40">BPM:</span>
                    <br />
                    <span>{currentTrack.bpm}</span>
                  </div>
                )}
                {currentTrack.key && (
                  <div>
                    <span className="text-white/40">Key:</span>
                    <br />
                    <span>{currentTrack.key}</span>
                  </div>
                )}
                <div>
                  <span className="text-white/40">Duration:</span>
                  <br />
                  <span>{Math.floor(currentTrack.duration / 60)}:{String(currentTrack.duration % 60).padStart(2, '0')}</span>
                </div>
              </div>
            </div>
          </div>
        ) : (
          <div className="flex items-center justify-center h-full text-white/50">
            <div className="text-center space-y-2">
              <div className="w-16 h-16 bg-white/10 rounded-lg mx-auto flex items-center justify-center">
                <Volume2 className="w-8 h-8" />
              </div>
              <p className="text-sm">No track playing</p>
            </div>
          </div>
        )}
      </SidebarContent>

      <SidebarFooter className="m-2 p-4 rounded-xl border !border-white/20 !bg-white/[0.08] backdrop-blur-lg hover:!bg-white/[0.15] transition-colors duration-200">
        {currentTrack && (
          <div className="flex items-center justify-center space-x-4">
            <Button
              variant="glass"
              size="icon"
              className="h-8 w-8"
              disabled
            >
              <SkipBack className="w-4 h-4" />
            </Button>
            <Button
              variant="glass"
              size="icon"
              className="h-10 w-10"
              onClick={togglePlayPause}
            >
              {isPlaying ? (
                <Pause className="w-5 h-5" />
              ) : (
                <Play className="w-5 h-5" />
              )}
            </Button>
            <Button
              variant="glass"
              size="icon"
              className="h-8 w-8"
              disabled
            >
              <SkipForward className="w-4 h-4" />
            </Button>
          </div>
        )}
      </SidebarFooter>
    </Sidebar>
  )
}