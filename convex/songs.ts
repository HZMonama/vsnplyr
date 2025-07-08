import { mutation, query } from "./_generated/server";
import { v } from "convex/values";
import { Doc, Id } from "./_generated/dataModel";

// Types for better type safety
type SongInput = {
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

type SongUpdateInput = {
  name?: string;
  artist?: string;
  album?: string;
  duration?: number;
  genre?: string;
  bpm?: number;
  key?: string;
  imageUrl?: string;
  audioUrl?: string;
  isLocal?: boolean;
};

// Mutation to add a new song
export const addSong = mutation({
  args: {
    name: v.string(),
    artist: v.string(),
    album: v.optional(v.string()),
    duration: v.number(),
    genre: v.optional(v.string()),
    bpm: v.optional(v.number()),
    key: v.optional(v.string()),
    imageUrl: v.optional(v.string()),
    audioUrl: v.string(),
    isLocal: v.boolean(),
  },
  handler: async (ctx, args) => {
    // Input validation
    if (args.duration <= 0) {
      throw new Error("Duration must be positive");
    }
    if (args.bpm !== undefined && args.bpm <= 0) {
      throw new Error("BPM must be positive");
    }

    const songId = await ctx.db.insert("songs", {
      name: args.name.trim(),
      artist: args.artist.trim(),
      album: args.album?.trim(),
      duration: args.duration,
      genre: args.genre?.trim(),
      bpm: args.bpm,
      key: args.key?.trim(),
      imageUrl: args.imageUrl?.trim(),
      audioUrl: args.audioUrl.trim(),
      isLocal: args.isLocal,
    });
    return songId;
  },
});

// Query to get all songs (equivalent to getAllSongs from Drizzle)
export const getAllSongs = query({
  args: {
    limit: v.optional(v.number()),
    orderBy: v.optional(v.union(v.literal("name"), v.literal("artist"), v.literal("createdAt"))),
    order: v.optional(v.union(v.literal("asc"), v.literal("desc"))),
  },
  handler: async (ctx, args) => {
    const { limit = 100, orderBy = "name", order = "asc" } = args;
    
    let query;
    
    // Apply ordering with proper index usage
    if (orderBy === "name") {
      query = ctx.db.query("songs").withIndex("by_name").order(order);
    } else if (orderBy === "artist") {
      query = ctx.db.query("songs").withIndex("by_artist").order(order);
    } else if (orderBy === "createdAt") {
      query = ctx.db.query("songs").withIndex("by_creation_time").order(order);
    } else {
      query = ctx.db.query("songs").order(order);
    }
    
    if (limit) {
      return await query.take(limit);
    }
    
    return await query.collect();
  },
});

// Query to get a song by ID (equivalent to getSongById from Drizzle)
export const getSongById = query({
  args: { id: v.id("songs") },
  handler: async (ctx, args) => {
    return await ctx.db.get(args.id);
  },
});

// Query to get recently added songs (equivalent to getRecentlyAddedSongs from Drizzle)
export const getRecentlyAddedSongs = query({
  args: { limit: v.optional(v.number()) },
  handler: async (ctx, args) => {
    const limit = args.limit || 10;
    return await ctx.db
      .query("songs")
      .withIndex("by_creation_time")
      .order("desc")
      .take(limit);
  },
});

// Search songs using Convex's search functionality
export const searchSongs = query({
  args: { 
    searchTerm: v.string(),
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const { searchTerm, limit = 50 } = args;
    
    if (!searchTerm.trim()) {
      return [];
    }
    
    // Search across name, artist, and album fields
    const nameResults = await ctx.db
      .query("songs")
      .withSearchIndex("search_name", (q) => q.search("name", searchTerm))
      .take(limit);
    
    const artistResults = await ctx.db
      .query("songs")
      .withSearchIndex("search_artist", (q) => q.search("artist", searchTerm))
      .take(limit);
    
    const albumResults = await ctx.db
      .query("songs")
      .withSearchIndex("search_album", (q) => q.search("album", searchTerm))
      .take(limit);
    
    // Combine and deduplicate results
    const allResults = [...nameResults, ...artistResults, ...albumResults];
    const uniqueResults = Array.from(
      new Map(allResults.map(song => [song._id, song])).values()
    );
    
    return uniqueResults.slice(0, limit);
  },
});

// Query to get songs by genre
export const getSongsByGenre = query({
  args: { 
    genre: v.string(),
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const { genre, limit = 50 } = args;
    
    const query = ctx.db
      .query("songs")
      .withIndex("by_genre", (q) => q.eq("genre", genre))
      .order("asc");
    
    if (limit) {
      return await query.take(limit);
    }
    
    return await query.collect();
  },
});

// Query to get songs by artist
export const getSongsByArtist = query({
  args: { 
    artist: v.string(),
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const { artist, limit = 50 } = args;
    
    const query = ctx.db
      .query("songs")
      .withIndex("by_artist", (q) => q.eq("artist", artist))
      .order("asc");
    
    if (limit) {
      return await query.take(limit);
    }
    
    return await query.collect();
  },
});

// Mutation to update a song
export const updateSong = mutation({
  args: {
    id: v.id("songs"),
    name: v.optional(v.string()),
    artist: v.optional(v.string()),
    album: v.optional(v.string()),
    duration: v.optional(v.number()),
    genre: v.optional(v.string()),
    bpm: v.optional(v.number()),
    key: v.optional(v.string()),
    imageUrl: v.optional(v.string()),
    audioUrl: v.optional(v.string()),
    isLocal: v.optional(v.boolean()),
  },
  handler: async (ctx, args) => {
    const { id, ...updates } = args;
    
    // Validate updates
    if (updates.duration !== undefined && updates.duration <= 0) {
      throw new Error("Duration must be positive");
    }
    if (updates.bpm !== undefined && updates.bpm <= 0) {
      throw new Error("BPM must be positive");
    }
    
    // Clean string fields and prepare updates
    const cleanUpdates: any = {};
    Object.entries(updates).forEach(([key, value]) => {
      if (value !== undefined) {
        if (typeof value === 'string') {
          cleanUpdates[key] = value.trim() || undefined;
        } else {
          cleanUpdates[key] = value;
        }
      }
    });
    
    await ctx.db.patch(id, cleanUpdates);
    return await ctx.db.get(id);
  },
});

// Enhanced update function for individual fields (keeping for backwards compatibility)
export const updateSongDetails = mutation({
  args: {
    songId: v.id("songs"),
    field: v.string(),
    value: v.union(v.string(), v.number(), v.boolean(), v.null()),
  },
  handler: async (ctx, args) => {
    const { songId, field, value } = args;

    // Validate field and value type
    const validStringFields = ["name", "artist", "album", "genre", "key", "imageUrl", "audioUrl"];
    const validNumberFields = ["duration", "bpm"];
    const validBooleanFields = ["isLocal"];

    if (validStringFields.includes(field)) {
      const stringValue = value === null || value === "" ? undefined : String(value).trim();
      await ctx.db.patch(songId, { [field]: stringValue });
    } else if (validNumberFields.includes(field)) {
      if (value === null || value === "") {
        await ctx.db.patch(songId, { [field]: undefined });
      } else {
        const numericValue = Number(value);
        if (isNaN(numericValue) || numericValue <= 0) {
          throw new Error(`${field} must be a positive number`);
        }
        await ctx.db.patch(songId, { [field]: numericValue });
      }
    } else if (validBooleanFields.includes(field)) {
      if (typeof value !== 'boolean') {
        throw new Error(`${field} must be a boolean`);
      }
      await ctx.db.patch(songId, { [field]: value });
    } else {
      throw new Error(`Invalid field: ${field}`);
    }
    
    return await ctx.db.get(songId);
  },
});

// Mutation to delete a song
export const deleteSong = mutation({
  args: { id: v.id("songs") },
  handler: async (ctx, args) => {
    // First, remove the song from all playlists
    const playlistSongs = await ctx.db
      .query("playlistSongs")
      .withIndex("by_song", (q) => q.eq("songId", args.id))
      .collect();
    
    for (const playlistSong of playlistSongs) {
      await ctx.db.delete(playlistSong._id);
    }
    
    // Then delete the song
    await ctx.db.delete(args.id);
  },
});