'use client';

import { useState, useRef, useEffect, useActionState } from 'react'; // Re-added useActionState for imageFormAction
import { PencilIcon, Loader2, CheckIcon } from 'lucide-react';
import { updateTrackImageAction } from './actions'; // updateTrackAction will be removed
import { usePlayback } from './playback-context';
// import { songs } from '@/lib/db/schema'; // No longer needed for $inferInsert type here
import { useMutation } from 'convex/react'; // Added for Convex
import { api } from '../convex/_generated/api'; // Corrected path
import type { Id } from '../convex/_generated/dataModel'; // Corrected path
import { cn } from '@/lib/utils';

export function NowPlaying() {
  const { currentTrack } = usePlayback();
  const [imageState, imageFormAction, imagePending] = useActionState(
    updateTrackImageAction,
    {
      success: false,
      imageUrl: '',
    }
  );
  const [showPencil, setShowPencil] = useState(false);

  useEffect(() => {
    let timer: NodeJS.Timeout;

    // Delay showing the edit icon
    // When transitioning from pending back to finished
    if (!imagePending) {
      timer = setTimeout(() => {
        setShowPencil(true);
      }, 300);
    } else {
      setShowPencil(false);
    }
    return () => clearTimeout(timer);
  }, [imagePending]);

  // Removed early return:
  // if (!currentTrack) {
  //   return null;
  // }

  const currentImageUrl = currentTrack && imageState?.success
    ? imageState.imageUrl
    : currentTrack?.imageUrl;

  return (
    <div className="hidden md:flex flex-col w-56 p-4 bg-[#121212] overflow-auto h-full"> {/* Ensure it takes full height if desired */}
      <h2 className="mb-3 text-sm font-semibold text-gray-200">Now</h2>
      {currentTrack ? (
        <>
          <div className="relative w-full aspect-square mb-3 group">
            <img
              src={currentImageUrl || '/placeholder.svg'}
              alt={currentTrack.name}
              className="w-full h-full object-cover"
            />
            <form action={imageFormAction} className="absolute inset-0">
              <input type="hidden" name="trackId" value={currentTrack.id} />
              <label
                htmlFor="imageUpload"
                className="absolute inset-0 cursor-pointer flex items-center justify-center"
              >
                <input
                  id="imageUpload"
                  type="file"
                  name="file"
                  className="hidden"
                  accept="image/*"
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) {
                      if (file.size <= 5 * 1024 * 1024) {
                        e.target.form?.requestSubmit();
                      } else {
                        alert('File size exceeds 5MB limit');
                        e.target.value = '';
                      }
                    }
                  }}
                />
                <div
                  className={cn(
                    'group-hover:bg-black group-hover:bg-opacity-50 rounded-full p-2',
                    imagePending && 'bg-opacity-50'
                  )}
                >
                  {imagePending ? (
                    <Loader2 className="w-6 h-6 text-white animate-spin" />
                  ) : (
                    showPencil && (
                      <PencilIcon className="w-6 h-6 text-white opacity-0 group-hover:opacity-100 transition-opacity" />
                    )
                  )}
                </div>
              </label>
            </form>
          </div>
          <div className="w-full space-y-1">
            <EditableInput
              initialValue={currentTrack.name}
              trackId={currentTrack.id}
              field="name"
              label="Title"
            />
            <EditableInput
              initialValue={currentTrack.artist}
              trackId={currentTrack.id}
              field="artist"
              label="Artist"
            />
            <EditableInput
              initialValue={currentTrack.genre || ''}
              trackId={currentTrack.id}
              field="genre"
              label="Genre"
            />
            <EditableInput
              initialValue={currentTrack.album || ''}
              trackId={currentTrack.id}
              field="album"
              label="Album"
            />
            <EditableInput
              initialValue={currentTrack.bpm?.toString() || ''}
              trackId={currentTrack.id}
              field="bpm"
              label="BPM"
            />
            <EditableInput
              initialValue={currentTrack.key || ''}
              trackId={currentTrack.id}
              field="key"
              label="Key"
            />
          </div>
        </>
      ) : (
        <div className="flex-1 flex flex-col items-center justify-center text-center text-gray-500">
          <svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-music-2 mb-3"><circle cx="8" cy="18" r="4"/><path d="M12 18V2"/></svg>
          <p className="text-sm">No track playing</p>
          <p className="text-xs">Select a song to start listening.</p>
        </div>
      )}
    </div>
  );
}

interface EditableInputProps {
  initialValue: string;
  trackId: string; // This will be Id<"songs"> from Convex
  field: string; // Field name as a string, e.g., "name", "artist", "bpm"
  label: string;
}

export function EditableInput({
  initialValue,
  trackId,
  field,
  label,
}: EditableInputProps) {
  let [isEditing, setIsEditing] = useState(false);
  let [value, setValue] = useState(initialValue);
  let [showCheck, setShowCheck] = useState(false);
  let inputRef = useRef<HTMLInputElement>(null);
  // formRef is not strictly needed if we call mutation directly, but can be kept if other form actions remain
  // let formRef = useRef<HTMLFormElement>(null);
  
  // Replace useActionState with useMutation
  const updateSongDetailsMutation = useMutation(api.songs.updateSongDetails);
  const [pending, setPending] = useState(false); // Manual pending state
  const [errorState, setErrorState] = useState<string | null>(null); // Manual error state

  useEffect(() => {
    if (isEditing) {
      inputRef.current?.focus();
    }
  }, [isEditing]);

  useEffect(() => {
    setValue(initialValue);
    setIsEditing(false);
    setShowCheck(false);
  }, [initialValue, trackId]);

  useEffect(() => {
    // This effect was for the old useActionState, adapt or remove if not needed for direct mutation
    // For now, let's assume success is handled by the mutation call itself.
    // If mutation is successful, show check.
    // if (state.success) { // Old state
    //   setShowCheck(true);
    //   const timer = setTimeout(() => {
    //     setShowCheck(false);
    //   }, 2000);
    //   return () => clearTimeout(timer);
    // }
  }, []); // Removed state.success dependency

  async function handleSubmit() {
    if (value === initialValue && field !== "bpm") { // For BPM, even same value might be a "submit" if it was invalid before
      setIsEditing(false);
      return;
    }
    // For optional fields, submitting an empty string means unsetting it.
    // The Convex mutation handles empty string for BPM as unsetting.
    // For other string fields, it also handles empty string as unsetting (to undefined).

    setPending(true);
    setErrorState(null);
    try {
      await updateSongDetailsMutation({
        songId: trackId as Id<"songs">, // Cast to Convex Id
        field: field,
        value: value, // The mutation will handle type conversion for BPM or unsetting
      });
      setShowCheck(true); // Show check on success
      const timer = setTimeout(() => setShowCheck(false), 2000);
      // initialValue = value; // Update initialValue on successful save so it doesn't revert if edited again
      // This line above is tricky with how useState/props work. Better to rely on Convex query to update parent.
      // Or, if this component needs to manage its own "saved" state, it's more complex.
      // For now, we assume parent (NowPlaying) will re-render with new data from Convex if currentTrack updates.
    } catch (e: any) {
      console.error(`Failed to update ${field}:`, e);
      setErrorState(e.message || `Failed to update ${field}`);
    } finally {
      setPending(false);
      setIsEditing(false);
    }
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleSubmit();
    } else if (e.key === 'Escape') {
      setIsEditing(false);
      setValue(initialValue);
    }
  }

  return (
    <div className="space-y-1 group">
      <label
        htmlFor={`${field}-input`}
        className="text-xs text-muted-foreground"
      >
        {label}
      </label>
      <div className="flex items-center justify-between w-full text-xs h-3 border-b border-transparent focus-within:border-white transition-colors">
        {isEditing ? (
          // No need for a form element if we're calling the mutation directly
          // <form ref={formRef} action={formAction} className="w-full">
          <input
            ref={inputRef}
            id={`${field}-input`}
            type={field === "bpm" ? "number" : "text"} // Use number type for BPM
            name={field} // Name can be kept for semantics but not used for form submission
            value={value}
            onChange={(e) => setValue(e.target.value)}
            onKeyDown={handleKeyDown}
            onBlur={handleSubmit} // Call handleSubmit onBlur
            className={cn(
              'bg-transparent w-full focus:outline-none p-0',
              errorState && 'text-red-500' // Use new errorState
            )}
            aria-invalid={errorState ? 'true' : 'false'}
            aria-describedby={errorState ? `${field}-error` : undefined}
          />
          // </form>
        ) : (
          <div
            className="w-full cursor-pointer truncate block"
            onClick={() => setIsEditing(true)}
            role="button"
            tabIndex={0}
            onKeyDown={(e) => {
              if (e.key === 'Enter' || e.key === ' ') {
                setIsEditing(true);
              }
            }}
            aria-label={`Edit ${label}`}
          >
            <span className={cn(value ? '' : 'text-muted-foreground')}>
              {value || '-'}
            </span>
          </div>
        )}
        <div className="flex items-center">
          {pending ? (
            <Loader2 className="size-3 animate-spin" />
          ) : showCheck ? (
            <CheckIcon className="size-3 text-green-500" />
          ) : (
            !isEditing && (
              <PencilIcon className="size-3 opacity-0 group-hover:opacity-100 transition-opacity" />
            )
          )}
        </div>
      </div>
      {errorState && ( // Use new errorState
        <p id={`${field}-error`} className="text-xs text-red-500">
          {errorState}
        </p>
      )}
    </div>
  );
}
