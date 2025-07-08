import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

export default defineSchema({
  songs: defineTable({
    name: v.string(),
    artist: v.string(),
    album: v.optional(v.string()),
    duration: v.number(), // Duration in seconds
    genre: v.optional(v.string()),
    bpm: v.optional(v.number()),
    key: v.optional(v.string()),
    imageUrl: v.optional(v.string()),
    audioUrl: v.string(),
    isLocal: v.boolean(),
    // updatedAt will be handled manually in mutations if needed
  })
    // Primary indexes for efficient queries
    .index("by_name", ["name"])
    .index("by_artist", ["artist"])
    .index("by_album", ["album"])
    .index("by_genre", ["genre"])
    .index("by_bpm", ["bpm"])
    .index("by_key", ["key"])
    .index("by_creation_time", ["_creationTime"])
    // Search indexes - Convex doesn't support full-text search like PostgreSQL trigrams
    // but we can create compound indexes for better search performance
    .searchIndex("search_name", {
      searchField: "name",
      filterFields: ["artist", "album", "genre"]
    })
    .searchIndex("search_artist", {
      searchField: "artist",
      filterFields: ["name", "album", "genre"]
    })
    .searchIndex("search_album", {
      searchField: "album",
      filterFields: ["name", "artist", "genre"]
    }),

  playlists: defineTable({
    name: v.string(),
    coverUrl: v.optional(v.string()),
    // updatedAt will be handled manually in mutations if needed
  })
    .index("by_name", ["name"])
    .index("by_creation_time", ["_creationTime"])
    .searchIndex("search_name", {
      searchField: "name"
    }),

  playlistSongs: defineTable({
    playlistId: v.id("playlists"),
    songId: v.id("songs"),
    order: v.number(),
  })
    // Compound index for unique playlist-song pairs (equivalent to unique constraint)
    .index("by_playlist_song", ["playlistId", "songId"])
    // Index for efficient playlist queries ordered by position
    .index("by_playlist_order", ["playlistId", "order"])
    // Index for finding all playlists containing a specific song
    .index("by_song", ["songId"])
    // Index for efficient ordering operations
    .index("by_order", ["order"]),
});