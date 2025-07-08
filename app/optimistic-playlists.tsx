'use client';

import { ScrollArea } from '@/components/ui/scroll-area';
import { Plus, MoreVertical, Trash } from 'lucide-react';
import { useRef, useEffect } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { usePlayback } from '@/app/playback-context';
// import { createPlaylistAction, deletePlaylistAction } from './actions'; // Old server actions, to be removed
import { usePlaylist } from '@/app/hooks/use-playlist';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import type { Playlist } from '@/app/hooks/use-playlist'; // Use Playlist type from the hook
// import { v4 as uuidv4 } from 'uuid'; // No longer needed for ID generation
import { SearchInput } from './search';

let isProduction = process.env.NEXT_PUBLIC_VERCEL_ENV === 'production';

function PlaylistRow({ playlist }: { playlist: Playlist }) {
  let pathname = usePathname();
  let router = useRouter();
  let { deletePlaylist } = usePlaylist(); // This now calls the Convex mutation

  async function handleDeletePlaylist(id: string) {
    await deletePlaylist(id); // Call the hook's deletePlaylist

    if (pathname === `/p/${id}`) {
      router.prefetch('/');
      router.push('/');
    }
    // deletePlaylistAction(id); // Removed old server action
    router.refresh(); // router.refresh() might still be useful to ensure UI consistency after delete
  }

  return (
    <li className="group relative">
      <Link
        prefetch={true}
        href={`/p/${playlist.id}`}
        className={`block py-1 px-4 cursor-pointer hover:bg-[#1A1A1A] text-[#d1d5db] focus:outline-none focus:ring-[0.5px] focus:ring-gray-400 ${
          pathname === `/p/${playlist.id}` ? 'bg-[#1A1A1A]' : ''
        }`}
        tabIndex={0}
      >
        {playlist.name}
      </Link>
      <div className="absolute right-2 top-1/2 transform -translate-y-1/2 opacity-0 group-hover:opacity-100">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="ghost"
              size="icon"
              className="h-6 w-6 text-gray-400 hover:text-white focus:text-white"
            >
              <MoreVertical className="h-4 w-4" />
              <span className="sr-only">Playlist options</span>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-36">
            <DropdownMenuItem
              disabled={isProduction}
              onClick={() => handleDeletePlaylist(playlist.id)}
              className="text-xs"
            >
              <Trash className="mr-2 size-3" />
              Delete Playlist
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </li>
  );
}

export function OptimisticPlaylists() {
  // updatePlaylist is not directly used here for adding, addPlaylist from the hook will be used.
  let { playlists, addPlaylist: addPlaylistFromHook } = usePlaylist();
  let playlistsContainerRef = useRef<HTMLUListElement>(null);
  let pathname = usePathname();
  let router = useRouter();
  let { registerPanelRef, handleKeyNavigation, setActivePanel } = usePlayback();

  useEffect(() => {
    registerPanelRef('sidebar', playlistsContainerRef);
  }, [registerPanelRef]);

  async function handleAddPlaylist() { // Renamed from addPlaylistAction to avoid confusion
    const newPlaylistData = {
      name: 'New Playlist',
      coverUrl: '', // Or null if your schema/type expects null for empty
    };

    // addPlaylistFromHook handles optimistic update and calls Convex mutation
    const newConvexPlaylistId = await addPlaylistFromHook(newPlaylistData);

    if (newConvexPlaylistId) {
      // Navigate to the new playlist page using the ID returned by Convex
      // (or the temporary ID if you prefer immediate navigation before Convex confirms)
      // For now, we'll assume immediate navigation is fine, but the ID might be temporary.
      // The hook's optimistic update uses a tempId.
      // A more robust solution might involve waiting for the real ID or updating the route once it's available.
      router.prefetch(`/p/${newConvexPlaylistId}`); // Prefetch with the actual or temp ID
      router.push(`/p/${newConvexPlaylistId}`); // Navigate
    } else {
      // Handle error, e.g., show a notification
      console.error("Failed to create playlist");
    }
    // createPlaylistAction(newPlaylistId, 'New Playlist'); // Removed old server action
    router.refresh(); // May still be useful
  }

  return (
    <div
      className="hidden md:block w-56 bg-[#121212] h-[100dvh] overflow-auto"
      onClick={() => setActivePanel('sidebar')}
    >
      <div className="m-4">
        <SearchInput />
        <div className="mb-6">
          <Link
            href="/"
            className={`block py-1 px-4 -mx-4 text-xs text-[#d1d5db] hover:bg-[#1A1A1A] transition-colors focus:outline-none focus:ring-[0.5px] focus:ring-gray-400 ${
              pathname === '/' ? 'bg-[#1A1A1A]' : ''
            }`}
          >
            All Tracks
          </Link>
        </div>
        <div className="flex justify-between items-center mb-4">
          <Link
            href="/"
            className="text-xs font-semibold text-gray-400 hover:text-white transition-colors"
          >
            Playlists
          </Link>
          {/* Changed from form action to onClick handler */}
          <Button
              onClick={handleAddPlaylist}
              disabled={isProduction}
              variant="ghost"
              size="icon"
              className="h-5 w-5"
              // type="submit" // Removed type="submit"
            >
              <Plus className="w-3 h-3 text-gray-400" />
              <span className="sr-only">Add new playlist</span>
            </Button>
          {/* </form> // Removed closing form tag */}
        </div>
      </div>
      <ScrollArea className="h-[calc(100dvh-180px)]">
        <ul
          ref={playlistsContainerRef}
          className="space-y-0.5 text-xs mt-[1px]"
          onKeyDown={(e) => handleKeyNavigation(e, 'sidebar')}
        >
          {playlists.map((playlist) => (
            <PlaylistRow key={playlist.id} playlist={playlist} />
          ))}
        </ul>
      </ScrollArea>
    </div>
  );
}
