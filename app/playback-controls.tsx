'use client';

import { useEffect, useState, useRef } from 'react';
import { Button } from '@/components/ui/button';
import {
  Heart,
  ListMusic,
  Pause,
  Play,
  Repeat,
  Shuffle,
  SkipBack,
  SkipForward,
  Volume2,
  VolumeX,
} from 'lucide-react';
import { usePlayback } from '@/app/playback-context';

export function TrackInfo() {
  let { currentTrack } = usePlayback();

  return (
    <div className="flex items-center space-x-3 min-w-0 flex-shrink-0">
      {currentTrack && (
        <>
          <div className="relative">
            <img
              src={currentTrack.imageUrl || '/placeholder.svg'}
              alt="Now playing"
              className="w-12 h-12 object-cover rounded-lg shadow-lg backdrop-blur-sm"
            />
            <div className="absolute inset-0 rounded-lg border border-white/20"></div>
          </div>
          <div className="flex-shrink min-w-0">
            <div className="text-sm font-semibold truncate max-w-[140px] text-white font-[family-name:var(--font-darker-grotesque)] drop-shadow-lg">
              {currentTrack.name}
            </div>
            <div className="text-xs text-white/70 truncate max-w-[140px] font-[family-name:var(--font-inter)] drop-shadow-md">
              {currentTrack.artist}
            </div>
          </div>
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8 flex-shrink-0 hover:bg-white/20 transition-colors text-white/80 hover:text-white"
          >
            <Heart className="w-4 h-4" />
          </Button>
        </>
      )}
    </div>
  );
}

export function PlaybackButtons() {
  let {
    isPlaying,
    togglePlayPause,
    playPreviousTrack,
    playNextTrack,
    currentTrack,
  } = usePlayback();

  return (
    <div className="flex items-center justify-between w-full">
      {/* Left auxiliary controls */}
      <div className="flex items-center space-x-2">
        <Button
          variant="ghost"
          size="icon"
          className="h-10 w-10 hover:bg-white/20 transition-all duration-200 text-white/80 hover:text-white backdrop-blur-sm rounded-full"
          disabled={!currentTrack}
        >
          <ListMusic className="w-5 h-5 drop-shadow-md" />
        </Button>
        <Button
          variant="ghost"
          size="icon"
          className="h-10 w-10 hover:bg-white/20 transition-all duration-200 text-white/80 hover:text-white backdrop-blur-sm rounded-full"
          disabled={!currentTrack}
        >
          <Shuffle className="w-5 h-5 drop-shadow-md" />
        </Button>
      </div>
      
      {/* Main playback controls - centered */}
      <div className="flex items-center space-x-3">
        <Button
          variant="ghost"
          size="icon"
          className="h-10 w-10 hover:bg-white/20 transition-all duration-200 text-white/80 hover:text-white backdrop-blur-sm rounded-full"
          onClick={playPreviousTrack}
          disabled={!currentTrack}
        >
          <SkipBack className="w-5 h-5 stroke-[1.5] drop-shadow-md" />
        </Button>
        <Button
          variant="ghost"
          size="icon"
          className="h-12 w-12 hover:bg-white/30 transition-all duration-200 text-white hover:text-white backdrop-blur-sm rounded-full border border-white/20 shadow-lg"
          onClick={togglePlayPause}
          disabled={!currentTrack}
        >
          {isPlaying ? (
            <Pause className="w-6 h-6 stroke-[1.5] drop-shadow-md" />
          ) : (
            <Play className="w-6 h-6 stroke-[1.5] drop-shadow-md ml-0.5" />
          )}
        </Button>
        <Button
          variant="ghost"
          size="icon"
          className="h-10 w-10 hover:bg-white/20 transition-all duration-200 text-white/80 hover:text-white backdrop-blur-sm rounded-full"
          onClick={playNextTrack}
          disabled={!currentTrack}
        >
          <SkipForward className="w-5 h-5 stroke-[1.5] drop-shadow-md" />
        </Button>
      </div>
      
      {/* Right auxiliary controls */}
      <div className="flex items-center space-x-2">
        <Button
          variant="ghost"
          size="icon"
          className="h-10 w-10 hover:bg-white/20 transition-all duration-200 text-white/80 hover:text-white backdrop-blur-sm rounded-full"
          disabled={!currentTrack}
        >
          <Repeat className="w-5 h-5 drop-shadow-md" />
        </Button>
        <Volume />
      </div>
    </div>
  );
}

export function ProgressBar() {
  let { currentTime, duration, audioRef, setCurrentTime } = usePlayback();
  let progressBarRef = useRef<HTMLDivElement>(null);

  let formatTime = (time: number) => {
    let minutes = Math.floor(time / 60);
    let seconds = Math.floor(time % 60);
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  };

  let handleProgressChange = (e: React.MouseEvent<HTMLDivElement>) => {
    if (progressBarRef.current && audioRef.current) {
      let rect = progressBarRef.current.getBoundingClientRect();
      let x = e.clientX - rect.left;
      let percentage = Math.max(0, Math.min(100, (x / rect.width) * 100));
      let newTime = (percentage / 100) * duration;
      audioRef.current.currentTime = newTime;
      setCurrentTime(newTime);
    }
  };

  return (
    <div className="flex items-center w-full">
      <span className="text-xs tabular-nums text-white/70 font-[family-name:var(--font-darker-grotesque)] font-medium drop-shadow-md">
        {formatTime(currentTime)}
      </span>
      <div
        ref={progressBarRef}
        className="flex-grow mx-3 h-1.5 bg-white/20 rounded-full cursor-pointer relative backdrop-blur-sm border border-white/10 shadow-inner"
        onClick={handleProgressChange}
      >
        <div
          className="absolute top-0 left-0 h-full bg-gradient-to-r from-white/90 to-white/70 rounded-full shadow-sm"
          style={{
            width: `${(currentTime / duration) * 100}%`,
          }}
        ></div>
        <div
          className="absolute top-1/2 transform -translate-y-1/2 w-3 h-3 bg-white rounded-full shadow-lg border border-white/30 opacity-0 hover:opacity-100 transition-opacity"
          style={{
            left: `${(currentTime / duration) * 100}%`,
            marginLeft: '-6px'
          }}
        ></div>
      </div>
      <span className="text-xs tabular-nums text-white/70 font-[family-name:var(--font-darker-grotesque)] font-medium drop-shadow-md">
        {formatTime(duration)}
      </span>
    </div>
  );
}

export function Volume() {
  let { audioRef, currentTrack } = usePlayback();
  let [volume, setVolume] = useState(100);
  let [isMuted, setIsMuted] = useState(false);
  let [isVolumeVisible, setIsVolumeVisible] = useState(false);
  let volumeBarRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.volume = isMuted ? 0 : volume / 100;
    }
  }, [volume, isMuted, audioRef]);

  let handleVolumeChange = (e: React.MouseEvent<HTMLDivElement>) => {
    if (volumeBarRef.current) {
      let rect = volumeBarRef.current.getBoundingClientRect();
      let x = e.clientX - rect.left;
      let percentage = Math.max(0, Math.min(100, (x / rect.width) * 100));
      setVolume(percentage);
      if (audioRef.current) {
        audioRef.current.volume = percentage / 100;
      }
      setIsMuted(percentage === 0);
    }
  };

  let toggleMute = () => {
    if (audioRef.current) {
      if (isMuted) {
        audioRef.current.volume = volume / 100;
        setIsMuted(false);
      } else {
        audioRef.current.volume = 0;
        setIsMuted(true);
      }
    }
  };

  let toggleVolumeVisibility = () => {
    setIsVolumeVisible(!isVolumeVisible);
  };

  return (
    <div className="relative">
      <Button
        variant="ghost"
        size="icon"
        className="h-10 w-10 hover:bg-white/20 transition-all duration-200 text-white/80 hover:text-white backdrop-blur-sm rounded-full"
        onClick={() => {
          toggleMute();
          toggleVolumeVisibility();
        }}
        disabled={!currentTrack}
      >
        {isMuted ? (
          <VolumeX className="w-5 h-5 drop-shadow-md" />
        ) : (
          <Volume2 className="w-5 h-5 drop-shadow-md" />
        )}
      </Button>
      {isVolumeVisible && (
        <div className="absolute bottom-full right-0 mb-3 p-3 backdrop-blur-md bg-white/10 rounded-xl shadow-2xl border border-white/20">
          <div
            ref={volumeBarRef}
            className="w-24 h-1.5 bg-white/20 rounded-full cursor-pointer relative backdrop-blur-sm border border-white/10 shadow-inner"
            onClick={handleVolumeChange}
          >
            <div
              className="absolute top-0 left-0 h-full bg-gradient-to-r from-white/90 to-white/70 rounded-full shadow-sm"
              style={{ width: `${volume}%` }}
            ></div>
            <div
              className="absolute top-1/2 transform -translate-y-1/2 w-3 h-3 bg-white rounded-full shadow-lg border border-white/30 opacity-0 hover:opacity-100 transition-opacity"
              style={{
                left: `${volume}%`,
                marginLeft: '-6px'
              }}
            ></div>
          </div>
        </div>
      )}
    </div>
  );
}

export function PlaybackControls() {
  let {
    currentTrack,
    audioRef,
    setCurrentTime,
    setDuration,
    playPreviousTrack,
    playNextTrack,
    togglePlayPause,
  } = usePlayback();

  useEffect(() => {
    let audio = audioRef.current;
    if (audio) {
      let updateTime = () => setCurrentTime(audio.currentTime);
      let updateDuration = () => setDuration(audio.duration);

      audio.addEventListener('timeupdate', updateTime);
      audio.addEventListener('loadedmetadata', updateDuration);

      return () => {
        audio.removeEventListener('timeupdate', updateTime);
        audio.removeEventListener('loadedmetadata', updateDuration);
      };
    }
  }, [audioRef, setCurrentTime, setDuration]);

  useEffect(() => {
    if ('mediaSession' in navigator && currentTrack) {
      navigator.mediaSession.metadata = new MediaMetadata({
        title: currentTrack.name,
        artist: currentTrack.artist,
        album: currentTrack.album || undefined,
        artwork: [
          { src: currentTrack.imageUrl!, sizes: '512x512', type: 'image/jpeg' },
        ],
      });

      navigator.mediaSession.setActionHandler('play', () => {
        audioRef.current?.play();
        togglePlayPause();
      });

      navigator.mediaSession.setActionHandler('pause', () => {
        audioRef.current?.pause();
        togglePlayPause();
      });

      navigator.mediaSession.setActionHandler(
        'previoustrack',
        playPreviousTrack
      );
      navigator.mediaSession.setActionHandler('nexttrack', playNextTrack);

      navigator.mediaSession.setActionHandler('seekto', (details) => {
        if (audioRef.current && details.seekTime !== undefined) {
          audioRef.current.currentTime = details.seekTime;
          setCurrentTime(details.seekTime);
        }
      });

      const updatePositionState = () => {
        if (audioRef.current && !isNaN(audioRef.current.duration)) {
          try {
            navigator.mediaSession.setPositionState({
              duration: audioRef.current.duration,
              playbackRate: audioRef.current.playbackRate,
              position: audioRef.current.currentTime,
            });
          } catch (error) {
            console.error('Error updating position state:', error);
          }
        }
      };

      const handleLoadedMetadata = () => {
        updatePositionState();
      };

      audioRef.current?.addEventListener('timeupdate', updatePositionState);
      audioRef.current?.addEventListener(
        'loadedmetadata',
        handleLoadedMetadata
      );

      return () => {
        audioRef.current?.removeEventListener(
          'timeupdate',
          updatePositionState
        );
        audioRef.current?.removeEventListener(
          'loadedmetadata',
          handleLoadedMetadata
        );
        navigator.mediaSession.setActionHandler('play', null);
        navigator.mediaSession.setActionHandler('pause', null);
        navigator.mediaSession.setActionHandler('previoustrack', null);
        navigator.mediaSession.setActionHandler('nexttrack', null);
        navigator.mediaSession.setActionHandler('seekto', null);
      };
    }
  }, [
    currentTrack,
    playPreviousTrack,
    playNextTrack,
    togglePlayPause,
    audioRef,
    setCurrentTime,
  ]);

  return (
    <>
      <audio ref={audioRef} />
      <div className="fixed bottom-4 left-1/2 transform -translate-x-1/2 w-[50vw] max-w-2xl min-w-[320px] sm:min-w-[600px] px-4 sm:px-0">
        <div className="flex flex-col items-center space-y-3">
          {/* Slider Container with Organic Geometry - Now on Top */}
          <div className="organic-slider-container relative p-3 w-full">
            <ProgressBar />
          </div>
          
          {/* Controls Container with Organic Geometry */}
          <div className="organic-controls-container relative p-4 w-full">
            <div className="flex items-center justify-center gap-2 sm:gap-4">
              <div className="hidden sm:block absolute left-4">
                <TrackInfo />
              </div>
              <div className="flex items-center justify-center w-full">
                <PlaybackButtons />
              </div>
            </div>
            {/* Mobile track info - show below controls */}
            <div className="sm:hidden mt-3 pt-3 border-t border-white/20">
              <TrackInfo />
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
