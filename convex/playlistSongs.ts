import { mutation, query } from "./_generated/server";
import { v } from "convex/values";
import { Doc, Id } from "./_generated/dataModel";

// Types for better type safety
type SongWithPlaylistInfo = Doc<"songs"> & {
  order: number;
  playlistSongId: Id<"playlistSongs">;
};

// Query to get songs for a playlist (existing functionality)
export const getSongsForPlaylist = query({
  args: { playlistId: v.id("playlists") },
  handler: async (ctx, args) => {
    if (!args.playlistId) return [];

    const playlistSongEntries = await ctx.db
      .query("playlistSongs")
      .withIndex("by_playlist_order", (q) =>
        q.eq("playlistId", args.playlistId)
      )
      .order("asc")
      .collect();

    const songsWithOrder = await Promise.all(
      playlistSongEntries.map(async (entry) => {
        const songDoc = await ctx.db.get(entry.songId);
        if (songDoc) {
          return {
            ...songDoc,
            order: entry.order,
            playlistSongId: entry._id,
          };
        }
        return null;
      })
    );

    return songsWithOrder.filter((song) => song !== null) as SongWithPlaylistInfo[];
  },
});

// Query to get all playlists that contain a specific song
export const getPlaylistsContainingSong = query({
  args: { songId: v.id("songs") },
  handler: async (ctx, args) => {
    const playlistSongEntries = await ctx.db
      .query("playlistSongs")
      .withIndex("by_song", (q) => q.eq("songId", args.songId))
      .collect();

    const playlistsWithSong = await Promise.all(
      playlistSongEntries.map(async (entry) => {
        const playlist = await ctx.db.get(entry.playlistId);
        if (playlist) {
          return {
            ...playlist,
            order: entry.order,
            playlistSongId: entry._id,
          };
        }
        return null;
      })
    );

    return playlistsWithSong.filter((playlist) => playlist !== null) as (Doc<"playlists"> & { order: number; playlistSongId: Id<"playlistSongs"> })[];
  },
});

// Mutation to add a song to a playlist with automatic ordering
export const addSongToPlaylistWithAutoOrder = mutation({
  args: {
    playlistId: v.id("playlists"),
    songId: v.id("songs"),
  },
  handler: async (ctx, args) => {
    // Check if song already exists in playlist
    const existingEntry = await ctx.db
      .query("playlistSongs")
      .withIndex("by_playlist_song", (q) =>
        q.eq("playlistId", args.playlistId).eq("songId", args.songId)
      )
      .unique();

    if (existingEntry) {
      throw new Error("Song already exists in playlist");
    }

    // Get the highest order number in the playlist
    const lastSong = await ctx.db
      .query("playlistSongs")
      .withIndex("by_playlist_order", (q) => q.eq("playlistId", args.playlistId))
      .order("desc")
      .first();

    const nextOrder = lastSong ? lastSong.order + 1 : 1;

    const playlistSongId = await ctx.db.insert("playlistSongs", {
      playlistId: args.playlistId,
      songId: args.songId,
      order: nextOrder,
    });

    return playlistSongId;
  },
});

// Mutation to remove a song from a playlist
export const removeSongFromPlaylist = mutation({
  args: { playlistSongId: v.id("playlistSongs") },
  handler: async (ctx, args) => {
    const playlistSong = await ctx.db.get(args.playlistSongId);
    if (!playlistSong) {
      throw new Error("Playlist song entry not found");
    }

    await ctx.db.delete(args.playlistSongId);

    // Reorder remaining songs to fill the gap
    const remainingSongs = await ctx.db
      .query("playlistSongs")
      .withIndex("by_playlist_order", (q) => q.eq("playlistId", playlistSong.playlistId))
      .filter((q) => q.gt(q.field("order"), playlistSong.order))
      .order("asc")
      .collect();

    // Update orders to fill the gap
    for (const song of remainingSongs) {
      await ctx.db.patch(song._id, { order: song.order - 1 });
    }

    return args.playlistSongId;
  },
});

// Mutation to move a song to a different position in the playlist
export const moveSongInPlaylist = mutation({
  args: {
    playlistSongId: v.id("playlistSongs"),
    newOrder: v.number(),
  },
  handler: async (ctx, args) => {
    const playlistSong = await ctx.db.get(args.playlistSongId);
    if (!playlistSong) {
      throw new Error("Playlist song entry not found");
    }

    const oldOrder = playlistSong.order;
    const newOrder = args.newOrder;

    if (oldOrder === newOrder) {
      return; // No change needed
    }

    // Get all songs in the playlist
    const allSongs = await ctx.db
      .query("playlistSongs")
      .withIndex("by_playlist_order", (q) => q.eq("playlistId", playlistSong.playlistId))
      .order("asc")
      .collect();

    // Update the moved song's order
    await ctx.db.patch(args.playlistSongId, { order: newOrder });

    // Reorder other songs
    if (oldOrder < newOrder) {
      // Moving down: shift songs between oldOrder and newOrder up
      for (const song of allSongs) {
        if (song._id !== args.playlistSongId && song.order > oldOrder && song.order <= newOrder) {
          await ctx.db.patch(song._id, { order: song.order - 1 });
        }
      }
    } else {
      // Moving up: shift songs between newOrder and oldOrder down
      for (const song of allSongs) {
        if (song._id !== args.playlistSongId && song.order >= newOrder && song.order < oldOrder) {
          await ctx.db.patch(song._id, { order: song.order + 1 });
        }
      }
    }
  },
});

// Query to get playlist song count
export const getPlaylistSongCount = query({
  args: { playlistId: v.id("playlists") },
  handler: async (ctx, args) => {
    const count = await ctx.db
      .query("playlistSongs")
      .withIndex("by_playlist_song", (q) => q.eq("playlistId", args.playlistId))
      .collect();
    
    return count.length;
  },
});

// Query to get total duration of songs in a playlist
export const getPlaylistDuration = query({
  args: { playlistId: v.id("playlists") },
  handler: async (ctx, args) => {
    const playlistSongs = await ctx.db
      .query("playlistSongs")
      .withIndex("by_playlist_song", (q) => q.eq("playlistId", args.playlistId))
      .collect();

    let totalDuration = 0;
    for (const playlistSong of playlistSongs) {
      const song = await ctx.db.get(playlistSong.songId);
      if (song) {
        totalDuration += song.duration;
      }
    }

    return totalDuration;
  },
});

// Mutation to duplicate a playlist (copy all songs to a new playlist)
export const duplicatePlaylistSongs = mutation({
  args: {
    sourcePlaylistId: v.id("playlists"),
    targetPlaylistId: v.id("playlists"),
  },
  handler: async (ctx, args) => {
    // Validate both playlists exist
    const sourcePlaylist = await ctx.db.get(args.sourcePlaylistId);
    const targetPlaylist = await ctx.db.get(args.targetPlaylistId);
    
    if (!sourcePlaylist || !targetPlaylist) {
      throw new Error("One or both playlists not found");
    }

    // Get all songs from source playlist
    const sourceSongs = await ctx.db
      .query("playlistSongs")
      .withIndex("by_playlist_order", (q) => q.eq("playlistId", args.sourcePlaylistId))
      .order("asc")
      .collect();

    // Copy songs to target playlist
    const results = [];
    for (const song of sourceSongs) {
      const newPlaylistSongId = await ctx.db.insert("playlistSongs", {
        playlistId: args.targetPlaylistId,
        songId: song.songId,
        order: song.order,
      });
      results.push(newPlaylistSongId);
    }

    return results;
  },
});

// Mutation to clear all songs from a playlist
export const clearPlaylist = mutation({
  args: { playlistId: v.id("playlists") },
  handler: async (ctx, args) => {
    const playlistSongs = await ctx.db
      .query("playlistSongs")
      .withIndex("by_playlist_song", (q) => q.eq("playlistId", args.playlistId))
      .collect();

    const deletedIds = [];
    for (const playlistSong of playlistSongs) {
      await ctx.db.delete(playlistSong._id);
      deletedIds.push(playlistSong._id);
    }

    return deletedIds;
  },
});

// Query to check if a song exists in a playlist
export const isSongInPlaylist = query({
  args: {
    playlistId: v.id("playlists"),
    songId: v.id("songs"),
  },
  handler: async (ctx, args) => {
    const entry = await ctx.db
      .query("playlistSongs")
      .withIndex("by_playlist_song", (q) =>
        q.eq("playlistId", args.playlistId).eq("songId", args.songId)
      )
      .unique();

    return !!entry;
  },
});

// Query to get next/previous song in a playlist
export const getAdjacentSong = query({
  args: {
    playlistId: v.id("playlists"),
    currentOrder: v.number(),
    direction: v.union(v.literal("next"), v.literal("prev")),
  },
  handler: async (ctx, args) => {
    let adjacentPlaylistSong;

    if (args.direction === "next") {
      adjacentPlaylistSong = await ctx.db
        .query("playlistSongs")
        .withIndex("by_playlist_order", (q) => q.eq("playlistId", args.playlistId))
        .filter((q) => q.gt(q.field("order"), args.currentOrder))
        .order("asc")
        .first();
    } else {
      adjacentPlaylistSong = await ctx.db
        .query("playlistSongs")
        .withIndex("by_playlist_order", (q) => q.eq("playlistId", args.playlistId))
        .filter((q) => q.lt(q.field("order"), args.currentOrder))
        .order("desc")
        .first();
    }
    
    if (!adjacentPlaylistSong) {
      return null;
    }

    const song = await ctx.db.get(adjacentPlaylistSong.songId);
    if (!song) {
      return null;
    }

    return {
      ...song,
      order: adjacentPlaylistSong.order,
      playlistSongId: adjacentPlaylistSong._id,
    };
  },
});