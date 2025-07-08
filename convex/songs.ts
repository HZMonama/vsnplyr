import { mutation, query } from "./_generated/server"; // Consolidated imports
import { v } from "convex/values";
import { Doc, Id } from "./_generated/dataModel"; // Added Id and Doc here

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
    // Convex handles _id and _creationTime automatically.
    // If you had a specific 'id' from the old system you wanted to preserve,
    // you might add an 'originalId' field here.
    // 'updatedAt' would be handled by re-inserting or a specific update mutation.
  },
  handler: async (ctx, args) => {
    const songId = await ctx.db.insert("songs", {
      name: args.name,
      artist: args.artist,
      album: args.album,
      duration: args.duration,
      genre: args.genre,
      bpm: args.bpm,
      key: args.key,
      imageUrl: args.imageUrl,
      audioUrl: args.audioUrl,
      isLocal: args.isLocal,
    });
    return songId;
  },
});

// Removed duplicate imports from here

export const getAllSongs = query({
  args: {},
  handler: async (ctx) => {
    // You might want to add ordering, e.g., by creation time or name
    return await ctx.db.query("songs").order("desc").collect(); // Example: order by most recent
  },
});

export const updateSongDetails = mutation({
  args: {
    songId: v.id("songs"),
    field: v.string(), // e.g., "name", "artist", "bpm", etc.
    value: v.union(v.string(), v.number(), v.null()), // Allow string, number, or null for optional fields
  },
  handler: async (ctx, args) => {
    const { songId, field, value } = args;

    // Basic validation for field name if needed, or rely on schema for type safety
    // For simplicity, directly using the field name.
    // Ensure the 'field' matches a valid key in your songs schema.
    // And that 'value' is of the correct type for that field.
    // Convex schema validation will also help here.

    // Special handling for BPM as it's a number
    if (field === "bpm") {
      let finalBpmValue: number | undefined | null = undefined; // Explicitly undefined for clearing
      if (value === "" || value === null) {
        finalBpmValue = undefined; // Clear the optional field
      } else {
        const numericValue = Number(value);
        if (isNaN(numericValue)) {
          throw new Error("BPM must be a valid number or empty.");
        }
        finalBpmValue = numericValue;
      }
      await ctx.db.patch(songId, { bpm: finalBpmValue }); // Use specific field 'bpm' for type safety
    } else if (field === "name" || field === "artist" || field === "album" || field === "genre" || field === "key" || field === "imageUrl" || field === "audioUrl") {
      // Assuming these are string or optional string fields
      // For optional string fields, an empty string might mean "unset" or null.
      // Our schema uses v.optional(v.string()) which means string | undefined.
      // If value is empty string or null, we set to undefined to clear.
      const stringValue = (value === null || (typeof value === 'string' && value.trim() === "")) ? undefined : String(value);
      await ctx.db.patch(songId, { [field]: stringValue });
    } else if (field === "duration" || field === "isLocal") {
      // duration (number), isLocal (boolean) - these are not optional in current schema, but handle robustly
      // This generic update might need more specific handlers if types are mixed like this.
      // For now, assuming 'value' matches the expected type for these non-optional fields.
      if (field === "duration" && typeof value !== 'number') throw new Error("Duration must be a number.");
      if (field === "isLocal" && typeof value !== 'boolean') throw new Error("isLocal must be a boolean.");
      await ctx.db.patch(songId, { [field]: value });
    } else {
      // Fallback for any other fields, or throw error if field is not recognized
      // This part is risky without knowing all possible fields and their types.
      // Consider more specific update functions or a more robust dynamic update strategy.
      console.warn(`Attempting to update unhandled field '${field}' with generic patch.`);
      await ctx.db.patch(songId, { [field]: value });
    }
    // Optionally return the updated song or a success status
  },
});


// You might also want query functions here later, e.g.:
// export const getSongs = query({
//   args: {},
//   handler: async (ctx) => {
//     return await ctx.db.query("songs").collect();
//   },
// });