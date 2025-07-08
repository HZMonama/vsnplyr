'use client';

import { usePlayback } from '@/app/playback-context';
// import { PlaylistWithSongs, Song } from '@/lib/db/types'; // Old types
import { formatDuration, highlightText } from '@/lib/utils';
import { useRef, useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { MoreHorizontal, Play, Pause, Plus } from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { usePlaylist } from '@/app/hooks/use-playlist';
// import { addToPlaylistAction } from '@/app/actions'; // Old action
import Image from 'next/image';
import { useQuery, useMutation } from 'convex/react'; // Added for Convex
import { api } from '../../../convex/_generated/api'; // Adjusted path
import type { Doc, Id } from '../../../convex/_generated/dataModel'; // Adjusted path
import type { Song as PlaybackSong } from '@/lib/db/types'; // Alias old Song type for clarity

// Define a type for the songs returned by our Convex query
type ConvexSongWithOrder = Doc<"songs"> & { order: number; playlistSongId: Id<"playlistSongs"> };

// Helper function to map Convex song data to the structure expected by PlaybackContext
function mapConvexSongToPlaybackSong(convexSong: ConvexSongWithOrder): PlaybackSong {
  return {
    id: convexSong._id, // Use Convex _id as id
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
    createdAt: new Date(convexSong._creationTime), // Derive from _creationTime
    updatedAt: new Date(convexSong._creationTime), // Derive from _creationTime for now
  };
}


function TrackRow({
  track, // track will now be of type ConvexSongWithOrder
  index,
  query,
  isSelected,
  onSelect,
  playlistId, // Pass playlistId for adding to other playlists
}: {
  track: ConvexSongWithOrder;
  index: number;
  query?: string;
  isSelected: boolean;
  onSelect: () => void;
  playlistId: Id<"playlists">; // ID of the current playlist
}) {
  let {
    currentTrack,
    playTrack,
    togglePlayPause,
    isPlaying,
    setActivePanel,
    handleKeyNavigation,
  } = usePlayback();
  let { playlists } = usePlaylist(); // For listing other playlists to add to
  const convexAddSongToPlaylist = useMutation(api.playlists.addSongToPlaylist);

  let [isFocused, setIsFocused] = useState(false);
  let isProduction = process.env.NEXT_PUBLIC_VERCEL_ENV === 'production';

  const mappedTrackForPlayback = mapConvexSongToPlaybackSong(track);
  let isCurrentTrack = currentTrack?.id === mappedTrackForPlayback.id;

  function onClickTrackRow(e: React.MouseEvent) {
    e.preventDefault();
    setActivePanel('tracklist');
    onSelect();
    if (isCurrentTrack) {
      togglePlayPause();
    } else {
      playTrack(mappedTrackForPlayback);
    }
  }

  function onKeyDownTrackRow(e: React.KeyboardEvent<HTMLTableRowElement>) {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      onSelect();
      if (isCurrentTrack) {
        togglePlayPause();
      } else {
        playTrack(mappedTrackForPlayback);
      }
    } else {
      handleKeyNavigation(e, 'tracklist');
    }
  }

  return (
    <tr
      className={`group cursor-pointer hover:bg-[#1A1A1A] select-none relative ${
        isCurrentTrack ? 'bg-[#1A1A1A]' : ''
      }`}
      tabIndex={0}
      onClick={onClickTrackRow}
      onKeyDown={onKeyDownTrackRow}
      onFocus={() => setIsFocused(true)}
      onBlur={() => setIsFocused(false)}
    >
      <td className="py-[2px] pl-3 pr-2 tabular-nums w-10 text-center">
        {isCurrentTrack && isPlaying ? (
          <div className="flex items-end justify-center space-x-[2px] size-[0.65rem] mx-auto">
            <div className="w-1 bg-neutral-600 animate-now-playing-1"></div>
            <div className="w-1 bg-neutral-600 animate-now-playing-2 [animation-delay:0.2s]"></div>
            <div className="w-1 bg-neutral-600 animate-now-playing-3 [animation-delay:0.4s]"></div>
          </div>
        ) : (
          <span className="text-gray-400">{index + 1}</span>
        )}
      </td>
      <td className="py-[2px] px-2">
        <div className="flex items-center">
          <div className="relative size-5 mr-2">
            <Image
              src={track.imageUrl || '/placeholder.svg'}
              alt={`${track.album} cover`}
              fill
              className="object-cover"
            />
          </div>
          <div className="font-medium truncate max-w-[180px] sm:max-w-[200px] text-[#d1d5db]">
            {highlightText(track.name, query)}
            <span className="sm:hidden text-gray-400 ml-1">
              • {highlightText(track.artist, query)}
            </span>
          </div>
        </div>
      </td>
      <td className="py-[2px] px-2 hidden sm:table-cell text-[#d1d5db] max-w-40 truncate">
        {highlightText(track.artist, query)}
      </td>
      <td className="py-[2px] px-2 hidden md:table-cell text-[#d1d5db]">
        {highlightText(track.album!, query)}
      </td>
      <td className="py-[2px] px-2 tabular-nums text-[#d1d5db]">
        {formatDuration(track.duration)}
      </td>
      <td className="py-[2px] px-2">
        <div className="opacity-0 group-hover:opacity-100 transition-opacity">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                disabled={isProduction}
                variant="ghost"
                size="icon"
                className="h-5 w-5 text-gray-400 hover:text-white focus:text-white"
              >
                <MoreHorizontal className="size-4" />
                <span className="sr-only">Track options</span>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-48">
              <DropdownMenuItem
                className="text-xs"
                onClick={(e) => {
                  e.stopPropagation();
                  if (isCurrentTrack) {
                    togglePlayPause();
                  } else {
                    playTrack(mappedTrackForPlayback); // Corrected this instance
                  }
                }}
              >
                {isCurrentTrack && isPlaying ? (
                  <>
                    <Pause className="mr-2 size-3 stroke-[1.5]" />
                    Pause
                  </>
                ) : (
                  <>
                    <Play className="mr-2 size-3 stroke-[1.5]" />
                    Play
                  </>
                )}
              </DropdownMenuItem>
              <DropdownMenuSub>
                <DropdownMenuSubTrigger className="text-xs">
                  <Plus className="mr-2 size-3" />
                  Add to Playlist
                </DropdownMenuSubTrigger>
                <DropdownMenuSubContent className="w-48">
                  {playlists.map((playlist) => (
                    <DropdownMenuItem
                      className="text-xs"
                      key={playlist.id} // playlist here is from usePlaylist() context
                      onClick={async (e) => {
                        e.stopPropagation();
                        try {
                          // We need the order for the new playlist.
                          // For simplicity, let's assume adding to the end.
                          // A more robust solution would fetch the max order for that playlist.
                          await convexAddSongToPlaylist({
                            playlistId: playlist.id as Id<"playlists">, // Target playlist ID
                            songId: track._id, // Current song's ID
                            order: Date.now(), // Simplistic order, consider a better strategy
                          });
                          // Optionally, show a success notification
                        } catch (error) {
                          console.error("Failed to add song to playlist:", error);
                          // Optionally, show an error notification
                        }
                      }}
                    >
                      {playlist.name}
                    </DropdownMenuItem>
                  ))}
                </DropdownMenuSubContent>
              </DropdownMenuSub>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </td>
      {(isSelected || isFocused) && (
        <div className="absolute inset-0 border border-[#1e3a8a] pointer-events-none" />
      )}
    </tr>
  );
}

export function TrackTable({
  playlistId, // Changed from 'playlist' object to just 'playlistId'
  query,
}: {
  playlistId: Id<"playlists">;
  query?: string;
}) {
  let tableRef = useRef<HTMLTableElement>(null);
  let { registerPanelRef, setActivePanel, setPlaylist } = usePlayback();
  const [selectedTrackId, setSelectedTrackId] = useState<string | null>(null);

  // Fetch songs for the current playlist using Convex query
  const songsForPlaylist = useQuery(api.playlistSongs.getSongsForPlaylist, { playlistId });

  useEffect(() => {
    registerPanelRef('tracklist', tableRef);
  }, [registerPanelRef]);

  useEffect(() => {
    if (songsForPlaylist) {
      const mappedSongs = songsForPlaylist.map(mapConvexSongToPlaybackSong);
      setPlaylist(mappedSongs);
    } else {
      setPlaylist([]); // Clear playlist if no songs are fetched
    }
  }, [songsForPlaylist, setPlaylist]);

  if (songsForPlaylist === undefined) {
    return <div>Loading tracks...</div>; // Or some other loading indicator
  }

  if (!songsForPlaylist || songsForPlaylist.length === 0) {
    return <div className="p-4 text-center text-gray-400">No tracks in this playlist.</div>;
  }

  return (
    <table
      ref={tableRef}
      className="w-full text-xs"
      onClick={() => setActivePanel('tracklist')}
    >
      <thead className="sticky top-0 bg-[#0A0A0A] z-10 border-b border-[#282828]">
        <tr className="text-left text-gray-400">
          <th className="py-2 pl-3 pr-2 font-medium w-10">#</th>
          <th className="py-2 px-2 font-medium">Title</th>
          <th className="py-2 px-2 font-medium hidden sm:table-cell">Artist</th>
          <th className="py-2 px-2 font-medium hidden md:table-cell">Album</th>
          <th className="py-2 px-2 font-medium">Duration</th>
          <th className="py-2 px-2 font-medium w-8"></th>
        </tr>
      </thead>
      <tbody className="mt-[1px]">
        {songsForPlaylist.map((track: ConvexSongWithOrder, index: number) => (
          <TrackRow
            key={track._id} // Use Convex _id as key
            track={track}
            index={index} // This index is based on the fetched order
            query={query}
            isSelected={selectedTrackId === track._id}
            onSelect={() => setSelectedTrackId(track._id)}
            playlistId={playlistId} // Pass current playlistId
          />
        ))}
      </tbody>
    </table>
  );
}
