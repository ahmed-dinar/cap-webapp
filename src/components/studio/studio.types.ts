export type SegmentType = 'Zoom' | 'Click';

export interface PointXY {
  x: number;
  y: number;
}

export interface VideoSegment extends PointXY {
  time: number;
}

export interface TimelineSegment {
  id: string;
  active: boolean;
  startTime: number;
  endTime: number;
  duration: number;
  row: number;
  type: SegmentType;
  data: ZOOM_SCALES;
  xy?: PointXY;
}

export interface Dimension {
  width: number;
  height: number;
}

export type MenuType = 'Design' | 'Motion';

export interface AspectRationSize extends Dimension {
  desc: string;
  codecs: string[];
}

export type BackgroundSize = 'None' | 'ExtraSmall' | 'Small' | 'Subtle' | 'Moderate' | 'Maximum';
export const backgroundSizes: { [K in BackgroundSize]: number } = {
  None: 1,
  ExtraSmall: 0.95,
  Small: 0.9,
  Subtle: 0.8,
  Moderate: 0.7,
  Maximum: 0.6,
};

export type BackgroundBlur = 'None' | 'Weak' | 'Low' | 'Subtle' | 'Moderate' | 'Strong';
export const backgroundBlurs: { [K in BackgroundBlur]: number } = {
  None: 1,
  Low: 2,
  Weak: 3,
  Subtle: 4,
  Moderate: 5,
  Strong: 6,
};

export const backgroundTypes = ['Pattern', 'Color', 'Image'] as const;
export type BackgroundType = (typeof backgroundTypes)[number];

export interface BackgroundConfig {
  backgroundType: BackgroundType;
  background?: string;
  backgroundSize: BackgroundSize;
  backgroundBlur: BackgroundBlur;
  applyBorder: boolean;
  applyShadow: boolean;
}

export interface AspectRatioType {
  label: string;
  name: string;
  value: number;
  desc: string;
  sizes: AspectRationSize[];
}

export type ZOOM_SCALES = 1.2 | 1.5 | 2 | 2.5 | 3 | 3.5 | 4;

export type ZoomConfig = {
  [K in ZOOM_SCALES]: {
    name: string;
    scaleDuration: number;
    pivotDuration: number;
    positionDuration: number;
    minDistance: number;
  };
};

export const zoomConfigData: ZoomConfig = {
  1.2: {
    name: 'Subtle',
    scaleDuration: 1.5,
    pivotDuration: 2.5,
    positionDuration: 2,
    minDistance: 250,
  },
  1.5: {
    name: 'Moderate',
    scaleDuration: 1.5,
    pivotDuration: 2,
    positionDuration: 2,
    minDistance: 200,
  },
  2: {
    name: 'Standard',
    scaleDuration: 1.5,
    pivotDuration: 1,
    positionDuration: 2.5,
    minDistance: 100,
  },
  2.5: {
    name: 'Strong',
    scaleDuration: 1.5,
    pivotDuration: 1,
    positionDuration: 2,
    minDistance: 50,
  },
  3: {
    name: 'Max',
    scaleDuration: 1.5,
    pivotDuration: 1,
    positionDuration: 3,
    minDistance: 20,
  },
  3.5: {
    name: 'Max2',
    scaleDuration: 1.5,
    pivotDuration: 1,
    positionDuration: 3,
    minDistance: 20,
  },
  4: {
    name: 'Max3',
    scaleDuration: 1.5,
    pivotDuration: 1,
    positionDuration: 3,
    minDistance: 20,
  },
};

export type ResizingSide = 'left' | 'right';

export interface ResolutionItem {
  name: string;
  width: number;
  height: number;
  desc: string;
  codecs: string[];
}

export type BitRates = 3 | 5 | 10 | 25 | 32;
export type FrameRates = 25 | 30 | 60;
export type ResolutionKey = 'hd_720' | 'fhd_1080' | 'uhd_4k';

export interface ExportConfig {
  resolution: ResolutionKey;
  frameRate: FrameRates;
  bitRates: BitRates;
}

export interface ExportProgress {
  progress: number;
  currentFrame: number;
  totalFrames: number;
}

export interface WorkerMessage {
  type: 'frame' | 'error' | 'complete';
  frameData?: ImageData;
  error?: string;
  progress?: number;
}
