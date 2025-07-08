"use client"

import React from 'react'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { Plus, MoreVertical, Trash, User, Settings } from 'lucide-react'
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarMenuAction,
  SidebarProvider,
  SidebarTrigger,
  useSidebar
} from '@/components/ui/sidebar'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Button } from '@/components/ui/button'
import { ScrollArea } from '@/components/ui/scroll-area'
import { VsnplyrLogo } from '@/components/ui/vsnplyr-logo'
import { usePlaylist } from '@/app/hooks/use-playlist'
import { usePlayback } from '@/app/playback-context'
import type { Playlist } from '@/app/hooks/use-playlist'
import { cn } from '@/lib/utils'

let isProduction = process.env.NEXT_PUBLIC_VERCEL_ENV === 'production'

function PlaylistItem({ playlist }: { playlist: Playlist }) {
  const pathname = usePathname()
  const router = useRouter()
  const { deletePlaylist } = usePlaylist()

  async function handleDeletePlaylist(id: string) {
    await deletePlaylist(id)

    if (pathname === `/p/${id}`) {
      router.prefetch('/')
      router.push('/')
    }
    router.refresh()
  }

  return (
    <SidebarMenuItem>
      <SidebarMenuButton
        asChild
        isActive={pathname === `/p/${playlist.id}`}
        className="text-sidebar-foreground/70 hover:text-sidebar-foreground"
      >
        <Link href={`/p/${playlist.id}`} className="flex items-center">
          <span className="truncate">{playlist.name}</span>
        </Link>
      </SidebarMenuButton>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <SidebarMenuAction
            showOnHover
            className="text-sidebar-foreground/50 hover:text-sidebar-foreground"
          >
            <MoreVertical className="h-4 w-4" />
            <span className="sr-only">Playlist options</span>
          </SidebarMenuAction>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-36">
          <DropdownMenuItem
            disabled={isProduction}
            onClick={() => handleDeletePlaylist(playlist.id)}
            className="text-xs text-destructive focus:text-destructive"
          >
            <Trash className="mr-2 size-3" />
            Delete Playlist
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </SidebarMenuItem>
  )
}

function UserProfile() {
  return (
    <SidebarMenuItem>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <SidebarMenuButton
            size="lg"
            className="data-[state=open]:bg-sidebar-accent data-[state=open]:text-sidebar-accent-foreground"
          >
            <div className="flex aspect-square size-8 items-center justify-center rounded-lg bg-sidebar-primary text-sidebar-primary-foreground">
              <User className="size-4" />
            </div>
            <div className="grid flex-1 text-left text-sm leading-tight">
              <span className="truncate font-semibold">User</span>
              <span className="truncate text-xs">user@example.com</span>
            </div>
            <Settings className="ml-auto size-4" />
          </SidebarMenuButton>
        </DropdownMenuTrigger>
        <DropdownMenuContent
          className="w-[--radix-dropdown-menu-trigger-width] min-w-56 rounded-lg"
          side="bottom"
          align="end"
          sideOffset={4}
        >
          <DropdownMenuItem>
            <Settings className="mr-2 size-4" />
            Settings
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </SidebarMenuItem>
  )
}

export function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
  const { playlists, addPlaylist } = usePlaylist()
  const { registerPanelRef, setActivePanel } = usePlayback()
  const pathname = usePathname()
  const router = useRouter()
  const { state } = useSidebar()

  const playlistsRef = React.useRef<HTMLDivElement>(null)

  React.useEffect(() => {
    registerPanelRef('sidebar', playlistsRef)
  }, [registerPanelRef])

  async function handleAddPlaylist() {
    const newPlaylistData = {
      name: 'New Playlist',
      coverUrl: '',
    }

    const newConvexPlaylistId = await addPlaylist(newPlaylistData)

    if (newConvexPlaylistId) {
      router.prefetch(`/p/${newConvexPlaylistId}`)
      router.push(`/p/${newConvexPlaylistId}`)
    } else {
      console.error("Failed to create playlist")
    }
    router.refresh()
  }

  return (
    <Sidebar
      collapsible="offcanvas"
      variant="floating"
      className={cn(
        "transition-all duration-300 ease-in-out",
        "sidebar-floating sidebar-frosted-glass",
      )}
      onClick={() => setActivePanel('sidebar')}
      {...props}
    >
      <SidebarHeader className="border-b border-white/10 bg-white/[0.02]">
        <div className="flex items-center justify-center p-2">
          <VsnplyrLogo size={state === "collapsed" ? "sm" : "md"} />
        </div>
      </SidebarHeader>

      <SidebarContent className="px-2">
        <SidebarGroup>
          <SidebarGroupContent>
            <SidebarMenu>
              <SidebarMenuItem>
                <SidebarMenuButton
                  asChild
                  isActive={pathname === '/'}
                  tooltip="All Tracks"
                  className="text-sidebar-foreground/70 hover:text-sidebar-foreground"
                >
                  <Link href="/">
                    <span>All Tracks</span>
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        <SidebarGroup>
          <SidebarGroupLabel className="flex items-center justify-between text-sidebar-foreground/60">
            <span>Playlists</span>
            <Button
              onClick={handleAddPlaylist}
              disabled={isProduction}
              variant="glass"
              size="icon"
              className="h-5 w-5 group-data-[collapsible=icon]:hidden"
            >
              <Plus className="w-3 h-3" />
              <span className="sr-only">Add new playlist</span>
            </Button>
          </SidebarGroupLabel>
          <SidebarGroupContent ref={playlistsRef}>
            <ScrollArea className="h-[calc(100vh-300px)]">
              <SidebarMenu>
                {playlists.map((playlist) => (
                  <PlaylistItem key={playlist.id} playlist={playlist} />
                ))}
              </SidebarMenu>
            </ScrollArea>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter className="">
        <SidebarMenu>
          <UserProfile />
        </SidebarMenu>
      </SidebarFooter>
    </Sidebar>
  )
}