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
    isLocal: v.boolean(), // Defaulting to true can be handled in mutations
    // createdAt will be covered by _creationTime
    // updatedAt needs manual handling in mutations if specific logic is needed
  })
    .index("by_name", ["name"])
    .index("by_artist", ["artist"])
    .index("by_album", ["album"])
    .index("by_genre", ["genre"]),

  playlists: defineTable({
    name: v.string(),
    coverUrl: v.optional(v.string()),
    // createdAt will be covered by _creationTime
    // updatedAt needs manual handling in mutations if specific logic is needed
  })
    .index("by_name", ["name"]),

  playlistSongs: defineTable({
    playlistId: v.id("playlists"),
    songId: v.id("songs"),
    order: v.number(),
  })
    .index("by_playlist_song", ["playlistId", "songId"])
    .index("by_playlist_order", ["playlistId", "order"])
    .index("by_song", ["songId"]),
});