'use client';

import { useState, useRef, useEffect } from 'react';
import { Input } from '@/components/ui/input';
// import { updatePlaylistNameAction } from '@/app/actions'; // Removed old server action
import { usePlaylist } from '@/app/hooks/use-playlist';

export function EditableTitle({
  playlistId,
  initialName,
}: {
  playlistId: string;
  initialName: string;
}) {
  const [isEditing, setIsEditing] = useState(false);
  const [name, setName] = useState(initialName);
  const inputRef = useRef<HTMLInputElement>(null);
  const { updatePlaylist } = usePlaylist();

  useEffect(() => {
    if (isEditing) {
      inputRef.current?.focus();
    }
  }, [isEditing]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsEditing(false);
    if (name.trim() !== '' && name !== initialName) {
      // updatePlaylist from the hook now handles the Convex mutation
      await updatePlaylist(playlistId, { name });
      // await updatePlaylistNameAction(playlistId, name); // Removed call to old server action
    } else {
      setName(initialName); // Reset to initial name if empty or unchanged
    }
  };

  if (isEditing) {
    return (
      <form onSubmit={handleSubmit}>
        <Input
          ref={inputRef}
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          onBlur={() => setIsEditing(false)}
          className="text-xl sm:text-2xl font-bold bg-transparent border-none focus:ring-0"
        />
      </form>
    );
  }

  return (
    <h1
      className="text-xl sm:text-2xl font-bold cursor-pointer"
      onClick={() => setIsEditing(true)}
      onKeyDown={(e) => {
        if (e.key === 'Enter') {
          e.preventDefault();
          setIsEditing(true);
        }
      }}
      tabIndex={0}
    >
      {name}
    </h1>
  );
}
