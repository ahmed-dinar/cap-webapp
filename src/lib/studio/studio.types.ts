export interface Dimension {
  width: number;
  height: number;
}

export interface StudioSettings {
  fps: number;
  /**
   * Main renderer width
   */
  width: number;
  /**
   * Main renderer height
   */
  height: number;
  /**
   * Main content width respect aspect ratio
   */
  contentWidth: number;
  /**
   * Main content height respect aspect ratio
   */
  contentHeight: number;
}

export interface TimeRange {
  startTime: number;
  endTime: number;
}

export interface Animation extends TimeRange {
  update: (progress: number) => void;
  duration?: number;
}

export interface BaseConfig {
  scale: number;
  fps: number;
  /**
   * Main renderer width loaded with initial video
   */
  width: number;
  /**
   * Main renderer height loaded with initial video
   */
  height: number;
}

export type ClipType = 'Video' | 'Audio' | 'Image';

export const defaultBgColor = 0xffffff;

export const shadowBorderConfig = {
  radius: {
    name: 'borderRadius3232',
    size: 20,
  },
  name: 'videoBorder1232',
  border: {
    enabled: true,
    thickness: 10,
    color: 0x000000,
    alpha: 0.3,
    alignment: 1,
    native: true,
  },
  shadow: {
    enabled: true,
    color: 0x000000,
    alpha: 0.3,
    blur: 8,
    offsetX: 3,
    offsetY: 3,
  },
};
