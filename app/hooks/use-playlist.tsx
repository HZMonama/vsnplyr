'use client';

import React, {
  createContext,
  useContext,
  useMemo,
  useOptimistic,
  // use, // 'use' is no longer needed for playlistsPromise
} from 'react';
import { useQuery, useMutation } from 'convex/react'; // Added useMutation
import { api } from '../../convex/_generated/api'; // Corrected path
import type { Doc, Id } from '../../convex/_generated/dataModel'; // Corrected path for Doc type, added Id

// This local Playlist type should align with what the UI expects.
// We will map Convex's Doc<"playlists"> to this type.
export type Playlist = {
  id: string; // Corresponds to Convex _id
  name: string;
  coverUrl: string | null;
  createdAt: Date;
  updatedAt: Date; // Will be derived from _creationTime for now
};

type PlaylistContextType = {
  playlists: Playlist[]; // This will now be derived from Convex data
  addPlaylist: (newPlaylistData: Omit<Playlist, 'id' | 'createdAt' | 'updatedAt'>) => Promise<Id<"playlists"> | null>;
  updatePlaylist: (id: string, updates: Partial<Playlist>) => Promise<void>;
  deletePlaylist: (id: string) => Promise<void>;
};

const PlaylistContext = createContext<PlaylistContextType | undefined>(
  undefined
);

// Removed duplicate OptimisticAction definition from here

export function PlaylistProvider({
  children,
}: {
  children: React.ReactNode;
  // playlistsPromise is removed, data will come from useQuery
}) {
  const convexPlaylists = useQuery(api.playlists.getPlaylists);

  const mappedPlaylists = useMemo(() => {
    if (!convexPlaylists) {
      return []; // Return empty array or a loading state indicator
    }
    return convexPlaylists.map((p: Doc<'playlists'>): Playlist => ({
      id: p._id,
      name: p.name,
      coverUrl: p.coverUrl || null,
      createdAt: new Date(p._creationTime),
      updatedAt: new Date(p._creationTime), // Using _creationTime for updatedAt for now
    }));
  }, [convexPlaylists]);

  const [playlists, setOptimisticPlaylists] = useOptimistic(
    mappedPlaylists,
    // This reducer will now correctly use the single OptimisticAction type defined at the end of the file
    (state: Playlist[], action: OptimisticAction) => {
      switch (action.type) {
        case 'add': // Added case for 'add'
          return [...state, action.playlist];
        case 'update':
          return state.map((playlist) =>
            playlist.id === action.id
              ? { ...playlist, ...action.updates }
              : playlist
          );
        case 'delete':
          return state.filter((playlist) => playlist.id !== action.id);
        default:
          // Ensure all cases are handled or throw an error for unhandled action types
          const exhaustiveCheck: never = action;
          return state;
      }
    }
  );

  const convexUpdatePlaylist = useMutation(api.playlists.updatePlaylistDetails);
  const convexDeletePlaylist = useMutation(api.playlists.deletePlaylistById);
  const convexAddPlaylist = useMutation(api.playlists.addPlaylist);

  const addPlaylist = async (newPlaylistData: Omit<Playlist, 'id' | 'createdAt' | 'updatedAt'>): Promise<Id<"playlists"> | null> => {
    // Optimistic update: Generate a temporary ID for UI purposes
    // Note: This temporary ID won't match the final Convex _id.
    // The UI might need to refresh or handle the ID change post-creation.
    const tempId = `temp-${Date.now()}`;
    const optimisticPlaylist: Playlist = {
      ...newPlaylistData,
      id: tempId,
      createdAt: new Date(),
      updatedAt: new Date(),
      coverUrl: newPlaylistData.coverUrl || null,
    };

    setOptimisticPlaylists({
      type: 'add', // Need to add 'add' to OptimisticAction
      playlist: optimisticPlaylist,
    } as any); // Cast as any to bypass strict type checking for new action type temporarily

    try {
      const newPlaylistId = await convexAddPlaylist({
        name: newPlaylistData.name,
        coverUrl: newPlaylistData.coverUrl || undefined,
      });
      // After successful creation, Convex query will update the list with the real ID.
      // Optionally, you could manually replace the tempId item if needed, but useQuery should handle it.
      return newPlaylistId;
    } catch (error) {
      console.error("Failed to add playlist:", error);
      // Revert optimistic update
      setOptimisticPlaylists({ type: 'delete', id: tempId } as any);
      return null;
    }
  };

  const updatePlaylist = async (id: string, updates: Partial<Playlist>) => {
    setOptimisticPlaylists({ type: 'update', id, updates });
    try {
      await convexUpdatePlaylist({
        id: id as Id<"playlists">, // Cast to Convex Id type
        name: updates.name,
        coverUrl: updates.coverUrl === null ? undefined : updates.coverUrl, // Handle null for optional string
      });
    } catch (error) {
      console.error("Failed to update playlist:", error);
      // Optionally revert optimistic update here
    }
  };

  const deletePlaylist = async (id: string) => {
    setOptimisticPlaylists({ type: 'delete', id });
    try {
      await convexDeletePlaylist({ id: id as Id<"playlists"> });
    } catch (error) {
      console.error("Failed to delete playlist:", error);
      // Optionally revert optimistic update here
    }
  };

  const value = useMemo(
    () => ({
      playlists, // This is now the optimistically updated, Convex-derived list
      addPlaylist,
      updatePlaylist,
      deletePlaylist,
    }),
    [playlists, convexAddPlaylist, convexUpdatePlaylist, convexDeletePlaylist] // Added mutations to dependency array
  );

  // Show loading state or children
  if (convexPlaylists === undefined) {
    // You might want a more sophisticated loading UI
    return <div>Loading playlists...</div>;
  }

  return (
    <PlaylistContext.Provider value={value}>
      {children}
    </PlaylistContext.Provider>
  );
}

// Update OptimisticAction type
type OptimisticAction =
  | { type: 'add'; playlist: Playlist }
  | { type: 'update'; id: string; updates: Partial<Playlist> }
  | { type: 'delete'; id: string };

export function usePlaylist() {
  const context = useContext(PlaylistContext);
  if (context === undefined) {
    throw new Error('usePlaylist must be used within a PlaylistProvider');
  }
  return context;
}
