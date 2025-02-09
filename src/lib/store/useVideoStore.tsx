'use client';

import { create } from 'zustand';
import { Dimension, VideoSegment } from '@/components/studio/studio.types';

type VideoStateData = {
  videoUrl?: string;
  durationSeconds: number;
  mouseSegments?: VideoSegment[];
  clickSegments?: VideoSegment[];
  screenDimension?: Dimension;
};

type VideoState = {
  data: VideoStateData;
};

type Actions = {
  setVideoSourceData: (data: VideoStateData) => void;
};

const initialState: VideoState = {
  data: {
    durationSeconds: 0,
  },
};

const useVideoStore = create<VideoState & Actions>((set) => {
  return {
    ...initialState,
    setVideoSourceData: (data: VideoStateData) => {
      set({ data });
    },
  };
});

export default useVideoStore;
