import { query } from "./_generated/server";
import { v } from "convex/values";
import { Doc, Id } from "./_generated/dataModel";

export const getSongsForPlaylist = query({
  args: { playlistId: v.id("playlists") },
  handler: async (ctx, args) => {
    if (!args.playlistId) return [];

    const playlistSongEntries = await ctx.db
      .query("playlistSongs")
      .withIndex("by_playlist_order", (q) =>
        q.eq("playlistId", args.playlistId)
      )
      .order("asc") // Assuming 'order' field dictates the sequence
      .collect();

    const songsWithOrder = await Promise.all(
      playlistSongEntries.map(async (entry) => {
        const songDoc = await ctx.db.get(entry.songId);
        if (songDoc) {
          return {
            ...songDoc, // Spread all song properties
            order: entry.order, // Add the order from playlistSongs
            playlistSongId: entry._id, // ID of the join table entry, might be useful
          };
        }
        return null;
      })
    );

    return songsWithOrder.filter((song) => song !== null) as (Doc<"songs"> & { order: number, playlistSongId: Id<"playlistSongs"> })[];
  },
});

// Mutation to remove a song from a playlist (might be needed later)
// export const removeSongFromPlaylist = mutation({
//   args: { playlistSongId: v.id("playlistSongs") },
//   handler: async (ctx, args) => {
//     await ctx.db.delete(args.playlistSongId);
//   },
// });