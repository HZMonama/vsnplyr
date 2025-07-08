'use client'; // Make the page client-side to use hooks

import { ScrollArea, ScrollBar } from '@/components/ui/scroll-area';
import { Suspense, useEffect } from 'react'; // Added useEffect
import { useSearchParams } from 'next/navigation'; // For client-side search param access
import StarBackground from '@/components/ui/rymd/StarBackground';
import { useQuery } from 'convex/react';
import { api } from '../convex/_generated/api'; // Adjusted path
import type { Doc } from '../convex/_generated/dataModel'; // Adjusted path
import { usePlayback } from '@/app/playback-context'; // For playing tracks
import { formatDuration, highlightText } from '@/lib/utils';
import Image from 'next/image';
import type { Song as PlaybackSong } from '@/lib/db/types'; // For mapping
import { SidebarTriggerWithTooltip } from '@/components/sidebar-trigger-with-tooltip';
import { RightSidebarTrigger } from '@/components/now-playing-sidebar';

// Helper function to map Convex song data to the structure expected by PlaybackContext
function mapConvexSongToPlaybackSong(convexSong: Doc<"songs">): PlaybackSong {
  return {
    id: convexSong._id,
    name: convexSong.name,
    artist: convexSong.artist,
    album: convexSong.album || null,
    duration: convexSong.duration,
    genre: convexSong.genre || null,
    bpm: convexSong.bpm || null,
    key: convexSong.key || null,
    imageUrl: convexSong.imageUrl || null,
    audioUrl: convexSong.audioUrl,
    isLocal: convexSong.isLocal,
    createdAt: new Date(convexSong._creationTime),
    updatedAt: new Date(convexSong._creationTime),
  };
}

function AllTracksDisplay() {
  const searchParams = useSearchParams();
  const query = searchParams.get('q') || undefined;

  // TODO: Implement search functionality with Convex. For now, getAllSongs.
  // const songs = useQuery(api.songs.searchAllSongs, query ? { query } : skipToken);
  const allSongs = useQuery(api.songs.getAllSongs);
  const { playTrack, currentTrack, isPlaying, togglePlayPause, setPlaylist } = usePlayback();

  useEffect(() => {
    if (allSongs) {
      const mapped = allSongs.map(mapConvexSongToPlaybackSong);
      setPlaylist(mapped); // Set the main playlist for playback controls
    }
  }, [allSongs, setPlaylist]);

  if (allSongs === undefined) {
    return <div className="p-4 text-center text-gray-400">Loading all tracks...</div>;
  }

  if (!allSongs || allSongs.length === 0) {
    return null; // Don't show any message when no tracks are found
  }

  // Simplified track row for now
  return (
    <table className="w-full text-xs">
      <thead className="sticky top-0 bg-[#0A0A0A] z-10 border-b border-[#282828]">
        <tr className="text-left text-gray-400">
          <th className="py-2 pl-3 pr-2 font-medium w-10">#</th>
          <th className="py-2 px-2 font-medium">Title</th>
          <th className="py-2 px-2 font-medium hidden sm:table-cell">Artist</th>
          <th className="py-2 px-2 font-medium hidden md:table-cell">Album</th>
          <th className="py-2 px-2 font-medium">Duration</th>
        </tr>
      </thead>
      <tbody className="mt-[1px]">
        {allSongs.map((song, index) => {
          const mappedSong = mapConvexSongToPlaybackSong(song);
          const isCurrent = currentTrack?.id === mappedSong.id;
          return (
            <tr
              key={song._id}
              className={`group cursor-pointer hover:bg-[#1A1A1A] select-none ${isCurrent ? 'bg-[#1A1A1A]' : ''}`}
              onClick={() => {
                if (isCurrent) togglePlayPause();
                else playTrack(mappedSong);
              }}
            >
              <td className="py-[2px] pl-3 pr-2 tabular-nums w-10 text-center">
                {isCurrent && isPlaying ? '▶' : index + 1}
              </td>
              <td className="py-[2px] px-2">
                <div className="flex items-center">
                  <div className="relative size-5 mr-2">
                    <Image
                      src={song.imageUrl || '/placeholder.svg'}
                      alt={`${song.album} cover`}
                      fill
                      className="object-cover"
                    />
                  </div>
                  <div className="font-medium truncate max-w-[180px] sm:max-w-[200px] text-[#d1d5db]">
                    {highlightText(song.name, query)}
                  </div>
                </div>
              </td>
              <td className="py-[2px] px-2 hidden sm:table-cell text-[#d1d5db] max-w-40 truncate">
                {highlightText(song.artist, query)}
              </td>
              <td className="py-[2px] px-2 hidden md:table-cell text-[#d1d5db]">
                {highlightText(song.album!, query)}
              </td>
              <td className="py-[2px] px-2 tabular-nums text-[#d1d5db]">
                {formatDuration(song.duration)}
              </td>
            </tr>
          );
        })}
      </tbody>
    </table>
  );
}


export default function Page() { // searchParams are not used directly here anymore
  return (
    <div className="flex-1 flex flex-col overflow-hidden relative"> {/* Added relative for z-indexing context */}
      <StarBackground />
      {/* Main content area - removed z-10 to see if canvas can be top layer for events */}
      <div className="flex-1 flex flex-col overflow-hidden pb-[69px] bg-transparent pt-3 px-3 relative"> {/* Ensure content is above stars */}
        <ScrollArea className="flex-1">
          <div className="min-w-max">
            <Suspense fallback={<div className="p-4 text-center text-gray-400">Loading...</div>}>
              <AllTracksDisplay />
            </Suspense>
          </div>
          <ScrollBar orientation="horizontal" />
        </ScrollArea>
      </div>
    </div>
  );
}
