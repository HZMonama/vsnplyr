'use server';

import { revalidatePath } from 'next/cache';
import { put } from '@vercel/blob';
import { ConvexHttpClient } from "convex/browser";
import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";

// Initialize Convex client for server actions
const convex = new ConvexHttpClient(process.env.NEXT_PUBLIC_CONVEX_URL!);

export async function createPlaylistAction(id: string, name: string) {
  // Let's only handle this on local for now
  if (process.env.VERCEL_ENV === 'production') {
    return;
  }

  try {
    await convex.mutation(api.playlists.createPlaylist, {
      name,
    });
    
    revalidatePath('/', 'layout');
  } catch (error) {
    console.error('Error creating playlist:', error);
    throw new Error('Failed to create playlist');
  }
}

export async function uploadPlaylistCoverAction(_: any, formData: FormData) {
  // Let's only handle this on local for now
  if (process.env.VERCEL_ENV === 'production') {
    return;
  }

  const playlistId = formData.get('playlistId') as string;
  const file = formData.get('file') as File;

  if (!file) {
    throw new Error('No file provided');
  }

  if (!playlistId) {
    throw new Error('No playlist ID provided');
  }

  try {
    const blob = await put(`playlist-covers/${playlistId}-${file.name}`, file, {
      access: 'public',
    });

    await convex.mutation(api.playlists.updatePlaylist, {
      id: playlistId as Id<"playlists">,
      coverUrl: blob.url,
    });

    revalidatePath(`/p/${playlistId}`);

    return { success: true, coverUrl: blob.url };
  } catch (error) {
    console.error('Error uploading file:', error);
    throw new Error('Failed to upload file');
  }
}

export async function updatePlaylistNameAction(
  playlistId: string,
  name: string
) {
  // Let's only handle this on local for now
  if (process.env.VERCEL_ENV === 'production') {
    return;
  }

  try {
    await convex.mutation(api.playlists.updatePlaylist, {
      id: playlistId as Id<"playlists">,
      name,
    });

    revalidatePath('/', 'layout');
  } catch (error) {
    console.error('Error updating playlist name:', error);
    throw new Error('Failed to update playlist name');
  }
}

export async function deletePlaylistAction(id: string) {
  // Let's only handle this on local for now
  if (process.env.VERCEL_ENV === 'production') {
    return;
  }

  try {
    await convex.mutation(api.playlists.deletePlaylist, {
      id: id as Id<"playlists">,
    });

    revalidatePath('/', 'layout');
  } catch (error) {
    console.error('Error deleting playlist:', error);
    throw new Error('Failed to delete playlist');
  }
}

export async function addToPlaylistAction(playlistId: string, songId: string) {
  try {
    // Check if the song is already in the playlist
    const isInPlaylist = await convex.query(api.playlistSongs.isSongInPlaylist, {
      playlistId: playlistId as Id<"playlists">,
      songId: songId as Id<"songs">,
    });

    if (isInPlaylist) {
      return { success: false, message: 'Song is already in the playlist' };
    }

    // Add song to playlist with auto-ordering
    await convex.mutation(api.playlistSongs.addSongToPlaylistWithAutoOrder, {
      playlistId: playlistId as Id<"playlists">,
      songId: songId as Id<"songs">,
    });

    revalidatePath('/', 'layout');

    return { success: true, message: 'Song added to playlist successfully' };
  } catch (error) {
    console.error('Error adding song to playlist:', error);
    return { success: false, message: 'Failed to add song to playlist' };
  }
}

export async function updateTrackAction(_: any, formData: FormData) {
  const trackId = formData.get('trackId') as string;
  const field = formData.get('field') as string;
  let value = formData.get(field) as string;

  if (!trackId || !field) {
    return { success: false, error: 'Missing trackId or field' };
  }

  try {
    // Handle BPM field specifically
    if (field === 'bpm') {
      const numericValue = parseInt(value);
      if (isNaN(numericValue)) {
        return { success: false, error: 'BPM should be a valid number' };
      }
      
      await convex.mutation(api.songs.updateSongDetails, {
        songId: trackId as Id<"songs">,
        field: field,
        value: numericValue,
      });
    } else {
      // Handle other string fields
      await convex.mutation(api.songs.updateSongDetails, {
        songId: trackId as Id<"songs">,
        field: field,
        value: value,
      });
    }

    revalidatePath('/', 'layout');

    return { success: true, error: '' };
  } catch (error) {
    console.error('Error updating track:', error);
    return { success: false, error: 'Failed to update track' };
  }
}

export async function updateTrackImageAction(_: any, formData: FormData) {
  const trackId = formData.get('trackId') as string;
  const file = formData.get('file') as File;

  if (!trackId || !file) {
    throw new Error('Missing trackId or file');
  }

  try {
    const blob = await put(`track-images/${trackId}-${file.name}`, file, {
      access: 'public',
    });

    await convex.mutation(api.songs.updateSongDetails, {
      songId: trackId as Id<"songs">,
      field: 'imageUrl',
      value: blob.url,
    });

    revalidatePath('/', 'layout');

    return { success: true, imageUrl: blob.url };
  } catch (error) {
    console.error('Error uploading file:', error);
    throw new Error('Failed to upload file');
  }
}

// New action to remove song from playlist
export async function removeSongFromPlaylistAction(playlistId: string, songId: string) {
  try {
    await convex.mutation(api.playlists.removeSongFromPlaylist, {
      playlistId: playlistId as Id<"playlists">,
      songId: songId as Id<"songs">,
    });

    revalidatePath('/', 'layout');

    return { success: true, message: 'Song removed from playlist successfully' };
  } catch (error) {
    console.error('Error removing song from playlist:', error);
    return { success: false, message: 'Failed to remove song from playlist' };
  }
}

// New action to reorder songs in playlist
export async function reorderPlaylistSongsAction(
  playlistId: string,
  songOrders: Array<{ songId: string; order: number }>
) {
  try {
    await convex.mutation(api.playlists.reorderSongsInPlaylist, {
      playlistId: playlistId as Id<"playlists">,
      songOrders: songOrders.map(item => ({
        songId: item.songId as Id<"songs">,
        order: item.order,
      })),
    });

    revalidatePath('/', 'layout');

    return { success: true, message: 'Songs reordered successfully' };
  } catch (error) {
    console.error('Error reordering songs:', error);
    return { success: false, message: 'Failed to reorder songs' };
  }
}
