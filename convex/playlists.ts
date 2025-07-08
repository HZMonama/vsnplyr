import { mutation } from "./_generated/server";
import { v } from "convex/values";
import { Id } from "./_generated/dataModel";

export const addPlaylist = mutation({
  args: {
    name: v.string(),
    coverUrl: v.optional(v.string()),
    // Convex handles _id and _creationTime automatically.
  },
  handler: async (ctx, args) => {
    const playlistId = await ctx.db.insert("playlists", {
      name: args.name,
      coverUrl: args.coverUrl,
    });
    return playlistId;
  },
});

export const addSongToPlaylist = mutation({
  args: {
    playlistId: v.id("playlists"),
    songId: v.id("songs"),
    order: v.number(),
  },
  handler: async (ctx, args) => {
    // Check if the song already exists in the playlist to prevent duplicates,
    // similar to the unique index in your Drizzle schema.
    const existingEntry = await ctx.db
      .query("playlistSongs")
      .withIndex("by_playlist_song", (q) =>
        q.eq("playlistId", args.playlistId).eq("songId", args.songId)
      )
      .unique();

    if (existingEntry) {
      // Optionally, you could update the order or throw an error
      console.warn(
        `Song ${args.songId} already exists in playlist ${args.playlistId}.`
      );
      return existingEntry._id; // Or handle as an error
    }

    const playlistSongId = await ctx.db.insert("playlistSongs", {
      playlistId: args.playlistId,
      songId: args.songId,
      order: args.order,
    });
    return playlistSongId;
  },
});

import { query } from "./_generated/server";

export const getPlaylists = query({
  args: {},
  handler: async (ctx) => {
    return await ctx.db.query("playlists").collect();
  },
});

export const updatePlaylistDetails = mutation({
  args: {
    id: v.id("playlists"),
    name: v.optional(v.string()),
    coverUrl: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const { id, ...updates } = args;
    await ctx.db.patch(id, updates);
    // Consider returning the updated playlist or a success status
  },
});

export const deletePlaylistById = mutation({
  args: { id: v.id("playlists") },
  handler: async (ctx, args) => {
    // Before deleting a playlist, you might want to delete its associated songs
    // from the playlistSongs table to maintain data integrity.
    const songsInPlaylist = await ctx.db
      .query("playlistSongs")
      .withIndex("by_playlist_song", (q) => q.eq("playlistId", args.id)) // Assuming by_playlist_song is suitable, or use by_playlist_id if defined
      .collect();

    for (const ps of songsInPlaylist) {
      await ctx.db.delete(ps._id);
    }

    await ctx.db.delete(args.id);
    // Consider returning a success status
  },
});

export const getPlaylistById = query({
  args: { id: v.id("playlists") },
  handler: async (ctx, args) => {
    if (!args.id) return null;
    return await ctx.db.get(args.id);
  },
});

// Example query to get songs for a playlist
// export const getPlaylistWithSongs = query({
//   args: { playlistId: v.id("playlists") },
//   handler: async (ctx, args) => {
//     const playlist = await ctx.db.get(args.playlistId);
//     if (!playlist) {
//       return null;
//     }
//     const songsInPlaylist = await ctx.db
//       .query("playlistSongs")
//       .withIndex("by_playlist_order", (q) => q.eq("playlistId", args.playlistId))
//       .order("asc") // Assuming 'order' field dictates the sequence
//       .collect();

//     const songDetails = await Promise.all(
//       songsInPlaylist.map(ps => ctx.db.get(ps.songId))
//     );

//     return {
//       ...playlist,
//       songs: songDetails.filter(s => s !== null), // Filter out any nulls if a song was deleted
//     };
//   },
// });