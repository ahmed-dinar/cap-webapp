'use client';

import { create } from 'zustand';
import { VideoSegment } from '@/components/studio/studio.types';

type VideoState = {
  videoUrl?: string;
  durationSeconds: number;
  mouseSegments?: VideoSegment[];
  clickSegments?: VideoSegment[];
};

type Actions = {
  setVideoUrl: (url?: string) => void;
  setDurationSeconds: (durationSeconds: number) => void;
  setMouseSegments: (segments: VideoSegment[]) => void;
  setClickSegments: (segments: VideoSegment[]) => void;
};

const initialState: VideoState = {
  durationSeconds: 0,
};

const useVideoStore = create<VideoState & Actions>((set) => {
  return {
    ...initialState,
    setVideoUrl: (url?: string) => {
      set({ videoUrl: url });
    },
    setDurationSeconds: (durationSeconds: number) => {
      set({ durationSeconds });
    },
    setMouseSegments: (segments: VideoSegment[]) => {
      set({ mouseSegments: segments });
    },
    setClickSegments: (segments: VideoSegment[]) => {
      set({ clickSegments: segments });
    },
  };
});

export default useVideoStore;
