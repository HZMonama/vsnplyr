import { Doc, Id } from "./_generated/dataModel";

// Extended types for better application-level type safety
export type Song = Doc<"songs">;
export type Playlist = Doc<"playlists">;
export type PlaylistSong = Doc<"playlistSongs">;

// Composite types for common use cases
export type SongWithPlaylistInfo = Song & {
  order: number;
  playlistSongId: Id<"playlistSongs">;
};

export type PlaylistWithSongs = Playlist & {
  songs: SongWithPlaylistInfo[];
  trackCount: number;
  duration: number;
};

export type PlaylistWithInfo = Playlist & {
  order: number;
  playlistSongId: Id<"playlistSongs">;
};

// Input types for mutations
export type SongInput = {
  name: string;
  artist: string;
  album?: string;
  duration: number;
  genre?: string;
  bpm?: number;
  key?: string;
  imageUrl?: string;
  audioUrl: string;
  isLocal: boolean;
};

export type SongUpdateInput = Partial<Omit<SongInput, 'duration' | 'isLocal'>> & {
  duration?: number;
  isLocal?: boolean;
};

export type PlaylistInput = {
  name: string;
  coverUrl?: string;
};

export type PlaylistUpdateInput = Partial<PlaylistInput>;

// Search and filter types
export type SongOrderBy = "name" | "artist" | "createdAt";
export type PlaylistOrderBy = "name" | "createdAt";
export type SortOrder = "asc" | "desc";

export type SearchFilters = {
  genre?: string;
  artist?: string;
  album?: string;
  limit?: number;
};

// Result types for better error handling
export type Result<T, E = Error> = 
  | { success: true; data: T }
  | { success: false; error: E };

// Navigation types for playlist control
export type PlaybackDirection = "next" | "prev";

// Utility types
export type SongOrder = {
  songId: Id<"songs">;
  order: number;
};

// Statistics types
export type PlaylistStats = {
  trackCount: number;
  totalDuration: number;
  averageDuration: number;
  genres: string[];
  artists: string[];
};