import { mutation, query } from "./_generated/server";
import { v } from "convex/values";
import { Doc, Id } from "./_generated/dataModel";

// Types for better type safety
type PlaylistInput = {
  name: string;
  coverUrl?: string;
};

type PlaylistUpdateInput = {
  name?: string;
  coverUrl?: string;
};

type PlaylistWithSongs = Doc<"playlists"> & {
  songs: (Doc<"songs"> & { order: number; playlistSongId: Id<"playlistSongs"> })[];
  trackCount: number;
  duration: number;
};

// Mutation to create a new playlist (equivalent to createPlaylist from Drizzle)
export const createPlaylist = mutation({
  args: {
    name: v.string(),
    coverUrl: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    // Input validation
    if (!args.name.trim()) {
      throw new Error("Playlist name is required");
    }

    const playlistId = await ctx.db.insert("playlists", {
      name: args.name.trim(),
      coverUrl: args.coverUrl?.trim(),
    });
    
    return playlistId;
  },
});

// Legacy addPlaylist function (keeping for backwards compatibility)
export const addPlaylist = mutation({
  args: {
    name: v.string(),
    coverUrl: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    return await ctx.db.insert("playlists", {
      name: args.name.trim(),
      coverUrl: args.coverUrl?.trim(),
    });
  },
});

// Query to get all playlists (equivalent to getAllPlaylists from Drizzle)
export const getAllPlaylists = query({
  args: {
    limit: v.optional(v.number()),
    orderBy: v.optional(v.union(v.literal("name"), v.literal("createdAt"))),
    order: v.optional(v.union(v.literal("asc"), v.literal("desc"))),
  },
  handler: async (ctx, args) => {
    const { limit, orderBy = "createdAt", order = "desc" } = args;
    
    let query;
    
    if (orderBy === "name") {
      query = ctx.db.query("playlists").withIndex("by_name").order(order);
    } else {
      query = ctx.db.query("playlists").withIndex("by_creation_time").order(order);
    }
    
    if (limit) {
      return await query.take(limit);
    }
    
    return await query.collect();
  },
});

// Legacy getPlaylists function (keeping for backwards compatibility)
export const getPlaylists = query({
  args: {},
  handler: async (ctx) => {
    return await ctx.db.query("playlists").collect();
  },
});

// Query to get a playlist by ID
export const getPlaylistById = query({
  args: { id: v.id("playlists") },
  handler: async (ctx, args) => {
    return await ctx.db.get(args.id);
  },
});

// Query to get playlist with songs (equivalent to getPlaylistWithSongs from Drizzle)
export const getPlaylistWithSongs = query({
  args: { id: v.id("playlists") },
  handler: async (ctx, args) => {
    const playlist = await ctx.db.get(args.id);
    
    if (!playlist) {
      return null;
    }
    
    // Get all songs in the playlist ordered by their position
    const playlistSongEntries = await ctx.db
      .query("playlistSongs")
      .withIndex("by_playlist_order", (q) => q.eq("playlistId", args.id))
      .order("asc")
      .collect();
    
    // Fetch song details for each playlist song
    const songsWithOrder = await Promise.all(
      playlistSongEntries.map(async (entry) => {
        const song = await ctx.db.get(entry.songId);
        if (song) {
          return {
            ...song,
            order: entry.order,
            playlistSongId: entry._id,
          };
        }
        return null;
      })
    );
    
    const songs = songsWithOrder.filter((song) => song !== null) as (Doc<"songs"> & { order: number; playlistSongId: Id<"playlistSongs"> })[];
    
    // Calculate playlist statistics
    const trackCount = songs.length;
    const duration = songs.reduce((total, song) => total + song.duration, 0);
    
    return {
      ...playlist,
      songs,
      trackCount,
      duration,
    } as PlaylistWithSongs;
  },
});

// Mutation to add a song to a playlist (equivalent to addSongToPlaylist from Drizzle)
export const addSongToPlaylist = mutation({
  args: {
    playlistId: v.id("playlists"),
    songId: v.id("songs"),
    order: v.number(),
  },
  handler: async (ctx, args) => {
    // Validate that the playlist exists
    const playlist = await ctx.db.get(args.playlistId);
    if (!playlist) {
      throw new Error("Playlist not found");
    }
    
    // Validate that the song exists
    const song = await ctx.db.get(args.songId);
    if (!song) {
      throw new Error("Song not found");
    }
    
    // Check if the song already exists in the playlist to prevent duplicates
    const existingEntry = await ctx.db
      .query("playlistSongs")
      .withIndex("by_playlist_song", (q) =>
        q.eq("playlistId", args.playlistId).eq("songId", args.songId)
      )
      .unique();

    if (existingEntry) {
      throw new Error("Song already exists in playlist");
    }

    const playlistSongId = await ctx.db.insert("playlistSongs", {
      playlistId: args.playlistId,
      songId: args.songId,
      order: args.order,
    });
    
    return playlistSongId;
  },
});

// Mutation to remove a song from a playlist (equivalent to removeSongFromPlaylist from Drizzle)
export const removeSongFromPlaylist = mutation({
  args: {
    playlistId: v.id("playlists"),
    songId: v.id("songs"),
  },
  handler: async (ctx, args) => {
    const playlistSongEntry = await ctx.db
      .query("playlistSongs")
      .withIndex("by_playlist_song", (q) =>
        q.eq("playlistId", args.playlistId).eq("songId", args.songId)
      )
      .unique();

    if (!playlistSongEntry) {
      throw new Error("Song not found in playlist");
    }

    await ctx.db.delete(playlistSongEntry._id);
    return playlistSongEntry._id;
  },
});

// Alternative remove function using playlistSongId directly
export const removeSongFromPlaylistById = mutation({
  args: { playlistSongId: v.id("playlistSongs") },
  handler: async (ctx, args) => {
    await ctx.db.delete(args.playlistSongId);
  },
});

// Mutation to update playlist details (equivalent to updatePlaylist from Drizzle)
export const updatePlaylist = mutation({
  args: {
    id: v.id("playlists"),
    name: v.optional(v.string()),
    coverUrl: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const { id, ...updates } = args;
    
    // Validate playlist exists
    const playlist = await ctx.db.get(id);
    if (!playlist) {
      throw new Error("Playlist not found");
    }
    
    // Clean and validate updates
    const cleanUpdates: any = {};
    if (updates.name !== undefined) {
      const trimmedName = updates.name.trim();
      if (!trimmedName) {
        throw new Error("Playlist name cannot be empty");
      }
      cleanUpdates.name = trimmedName;
    }
    
    if (updates.coverUrl !== undefined) {
      cleanUpdates.coverUrl = updates.coverUrl?.trim();
    }
    
    await ctx.db.patch(id, cleanUpdates);
    return await ctx.db.get(id);
  },
});

// Legacy updatePlaylistDetails function (keeping for backwards compatibility)
export const updatePlaylistDetails = mutation({
  args: {
    id: v.id("playlists"),
    name: v.optional(v.string()),
    coverUrl: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const { id, ...updates } = args;
    await ctx.db.patch(id, updates);
  },
});

// Mutation to delete a playlist (equivalent to deletePlaylist from Drizzle)
export const deletePlaylist = mutation({
  args: { id: v.id("playlists") },
  handler: async (ctx, args) => {
    // Validate playlist exists
    const playlist = await ctx.db.get(args.id);
    if (!playlist) {
      throw new Error("Playlist not found");
    }
    
    // First, delete all songs from the playlist
    const songsInPlaylist = await ctx.db
      .query("playlistSongs")
      .withIndex("by_playlist_song", (q) => q.eq("playlistId", args.id))
      .collect();

    for (const playlistSong of songsInPlaylist) {
      await ctx.db.delete(playlistSong._id);
    }

    // Then delete the playlist itself
    await ctx.db.delete(args.id);
    
    return args.id;
  },
});

// Legacy deletePlaylistById function (keeping for backwards compatibility)
export const deletePlaylistById = mutation({
  args: { id: v.id("playlists") },
  handler: async (ctx, args) => {
    const songsInPlaylist = await ctx.db
      .query("playlistSongs")
      .withIndex("by_playlist_song", (q) => q.eq("playlistId", args.id))
      .collect();

    for (const ps of songsInPlaylist) {
      await ctx.db.delete(ps._id);
    }

    await ctx.db.delete(args.id);
  },
});

// Query to search playlists by name
export const searchPlaylists = query({
  args: { 
    searchTerm: v.string(),
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const { searchTerm, limit = 50 } = args;
    
    if (!searchTerm.trim()) {
      return [];
    }
    
    return await ctx.db
      .query("playlists")
      .withSearchIndex("search_name", (q) => q.search("name", searchTerm))
      .take(limit);
  },
});

// Mutation to reorder songs in a playlist
export const reorderSongsInPlaylist = mutation({
  args: {
    playlistId: v.id("playlists"),
    songOrders: v.array(v.object({
      songId: v.id("songs"),
      order: v.number(),
    })),
  },
  handler: async (ctx, args) => {
    // Validate playlist exists
    const playlist = await ctx.db.get(args.playlistId);
    if (!playlist) {
      throw new Error("Playlist not found");
    }
    
    // Update each song's order
    for (const { songId, order } of args.songOrders) {
      const playlistSongEntry = await ctx.db
        .query("playlistSongs")
        .withIndex("by_playlist_song", (q) =>
          q.eq("playlistId", args.playlistId).eq("songId", songId)
        )
        .unique();
      
      if (playlistSongEntry) {
        await ctx.db.patch(playlistSongEntry._id, { order });
      }
    }
  },
});