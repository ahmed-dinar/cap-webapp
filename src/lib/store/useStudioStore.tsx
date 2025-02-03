'use client';

import { create } from 'zustand';
import { AspectRatioType, BackgroundConfig, MenuType, TimelineSegment } from '@/components/studio/studio.types';
import { defaultBackgroundConfig } from '@/components/studio/studio.data';

type StudioState = {
  activeMenu: MenuType;
  segments: TimelineSegment[];
  aspectRatio?: AspectRatioType;
  applyZoom: boolean;
  activeSegmentId?: string;
  isPlaying: boolean;
  isMute: boolean;
  currentTime: number;
  fitOnResize: boolean;
  backgroundConfig: BackgroundConfig;
};

type Actions = {
  setActiveMenu: (menu: MenuType) => void;
  addSegment: (segment: TimelineSegment) => void;
  updateSegment: (id: string, segment: Partial<TimelineSegment>) => void;
  deleteSegment: (id: string) => void;
  setSegments: (segments: TimelineSegment[]) => void;
  setAspectRatio: (ratio?: AspectRatioType) => void;
  setApplyZoom: (zoom: boolean) => void;
  setIsPlaying: (playing: boolean) => void;
  setIsMute: (mute: boolean) => void;
  setActiveSegmentId: (id?: string) => void;
  setCurrentTime: (time: number) => void;
  setFitOnResize: (fitOnResize: boolean) => void;
  updateBackgroundConfig: (backgroundConfig: Partial<BackgroundConfig>) => void;
};

const initialState: Omit<StudioState, 'activeSegment'> = {
  activeMenu: 'Design',
  segments: [],
  applyZoom: true,
  isPlaying: false,
  currentTime: 0,
  isMute: false,
  fitOnResize: true,
  backgroundConfig: defaultBackgroundConfig,
};

const useStudioStore = create<StudioState & Actions>((set, get) => {
  return {
    ...initialState,
    setActiveMenu: (menu: MenuType) => {
      set({ activeMenu: menu });
    },
    addSegment: (segment: TimelineSegment) => {
      set((state) => ({ segments: [...state.segments, segment] }));
    },
    setSegments: (segments: TimelineSegment[]) => {
      set({ segments });
    },
    setAspectRatio: (ratio?: AspectRatioType) => {
      set({ aspectRatio: ratio });
    },
    setApplyZoom: (zoom: boolean) => {
      set({ applyZoom: zoom });
    },
    setActiveSegmentId: (id?: string) => {
      set({ activeSegmentId: id });
    },
    updateSegment: (id: string, update: Partial<TimelineSegment>) => {
      set({ segments: get().segments.map((segment) => (segment.id === id ? { ...segment, ...update } : segment)) });
    },
    deleteSegment: (id: string) => {
      set({
        activeSegmentId: get().activeSegmentId === id ? undefined : get().activeSegmentId,
        segments: get().segments.filter((segment) => segment.id !== id),
      });
    },
    setIsPlaying: (playing: boolean) => {
      set({ isPlaying: playing });
    },
    setIsMute: (mute: boolean) => {
      set({ isMute: mute });
    },
    setCurrentTime: (time: number) => {
      set({ currentTime: time });
    },
    setFitOnResize: (fitOnResize: boolean) => {
      set({ fitOnResize });
    },
    updateBackgroundConfig: (backgroundConfig: Partial<BackgroundConfig>) => {
      set({ backgroundConfig: { ...get().backgroundConfig, ...backgroundConfig } });
    },
  };
});

export default useStudioStore;
