'use client';

import { Button } from '@/components/ui/button';
import { ScrollArea, ScrollBar } from '@/components/ui/scroll-area';
import { Shuffle } from 'lucide-react';
import { TrackTable } from '@/app/p/[id]/track-table'; // Adjusted path
import { notFound } from 'next/navigation';
import { CoverImage } from '@/app/p/[id]/cover-image'; // Adjusted path
import { EditableTitle } from '@/app/p/[id]/editable-title'; // Adjusted path
import { useQuery } from 'convex/react';
import { api } from '../convex/_generated/api'; // Adjusted path
import type { Id } from '../convex/_generated/dataModel'; // Adjusted path
import ErrorBoundary from '@/app/error-boundary';

interface PlaylistOverlayProps {
  playlistId: Id<"playlists"> | null;
  onClose: () => void; // Function to close the overlay
}

export function PlaylistOverlay({ playlistId, onClose }: PlaylistOverlayProps) {
  if (!playlistId) {
    return null;
  }

  const playlist = useQuery(api.playlists.getPlaylistById, playlistId ? { id: playlistId } : 'skip');

  if (playlist === undefined) {
    return (
      // This box will be centered by the parent page component
      <div className="bg-neutral-900 p-8 rounded-lg shadow-xl text-white max-w-sm w-full text-center">
        Loading playlist...
      </div>
    );
  }

  if (playlist === null) {
    return (
      // This box will be centered by the parent page component
      <div className="bg-neutral-900 p-8 rounded-lg shadow-xl text-white max-w-sm w-full text-center">
        <p>Playlist not found.</p>
        <Button onClick={onClose} variant="ghost" className="mt-4">Close</Button>
      </div>
    );
  }

  // The root element is now the playlist content box itself
  return (
    <div
      className="bg-neutral-950/80 border border-neutral-800 rounded-xl shadow-2xl w-full max-w-4xl max-h-[700px] flex flex-col overflow-hidden text-white" // Removed h-full
    >
      <ErrorBoundary fallback={<div className="p-4 text-center text-red-400">Could not load playlist details.</div>}>
        {/* Playlist header section */}
        <div className="border-b border-white/10 p-6">
          <div className="flex items-center space-x-4">
            <CoverImage url={playlist.coverUrl || null} playlistId={playlist._id} />
            <div className="flex-1">
              <EditableTitle playlistId={playlist._id} initialName={playlist.name} />
              <p className="text-sm text-gray-400 mt-1">
                Playlist
              </p>
              <div className="flex items-center space-x-3 mt-4">
                <Button
                  variant="secondary"
                  className="glass-button h-9 text-sm bg-white/10 hover:bg-white/20 text-white border-white/20"
                >
                  Play All
                </Button>
                <Button variant="ghost" size="icon" className="h-9 w-9 glass-button">
                  <Shuffle className="w-5 h-5" />
                </Button>
              </div>
            </div>
          </div>
        </div>

        {/* Track list */}
        <ScrollArea className="flex-1 pb-[70px]"> {/* Ensure padding for PlaybackControls */}
          <div className="p-6 min-w-max">
            <TrackTable playlistId={playlistId} />
          </div>
          <ScrollBar orientation="horizontal" />
          <ScrollBar orientation="vertical" />
        </ScrollArea>
        
        <div className="p-4 flex justify-end border-t border-white/10">
          <Button onClick={onClose} variant="ghost">Close</Button>
        </div>
      </ErrorBoundary>
    </div>
  );
}