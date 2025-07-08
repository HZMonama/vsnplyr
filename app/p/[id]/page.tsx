'use client'; // Make it a client component

import { useParams, useRouter, notFound } from 'next/navigation'; // Added useRouter
import type { Id } from '../../../convex/_generated/dataModel'; // Adjusted path
import { PlaylistOverlay } from '@/components/playlist-overlay'; // Import the new overlay component
import { useEffect, useState } from 'react';

export default function PlaylistPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const [playlistId, setPlaylistId] = useState<Id<"playlists"> | null>(null);

  useEffect(() => {
    if (params.id) {
      setPlaylistId(params.id as Id<"playlists">);
    } else {
      // If no ID, redirect or show error, for now redirect to home
      // This case might not be hit if Next.js routing handles missing [id] already
      router.push('/');
    }
  }, [params.id, router]);

  const handleCloseOverlay = () => {
    router.push('/'); // Navigate to home page when overlay is closed
  };

  // The PlaylistOverlay component now handles its own data fetching and loading/error states.
  // This page component is now primarily responsible for routing and triggering the overlay.
  
  // We need to ensure the page doesn't show anything else or try to render before playlistId is set,
  // or if the overlay is meant to be the *only* content for this route.
  // If playlistId is not yet available (e.g. initial render before useEffect),
  // we can return null or a minimal loader, but the overlay itself has a loader.
  // Let's ensure we pass a valid or null playlistId to the overlay.

  if (!params.id) {
    // Fallback if no ID is present, though useEffect should redirect.
    // Returning null or a minimal loader is fine here as PlaylistOverlay handles its own states.
    return null;
  }

  // This div will take up the full available space within SidebarInset
  // (which has pb-[69px]) and center the PlaylistOverlay or its loading/error states.
  return (
    <div className="w-full h-full flex items-center justify-center"> {/* Re-added items-center, p-4 remains removed */}
      <PlaylistOverlay playlistId={playlistId} onClose={handleCloseOverlay} />
    </div>
  );
}
