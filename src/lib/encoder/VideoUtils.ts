// Types
interface VideoSize {
  width: number;
  height: number;
}

interface FitMode {
  type: 'fit' | 'zoom';
  position?: { x: number; y: number }; // For zoom mode center point
}

interface AspectRatioChange {
  from: number;
  to: number;
  mode: FitMode;
}

// Utility functions for video sizing
export const VideoUtils = {
  calculateAspectRatio: (width: number, height: number) => width / height,

  calculateFitDimensions: (
    containerWidth: number,
    containerHeight: number,
    videoWidth: number,
    videoHeight: number,
    mode: FitMode,
  ): { width: number; height: number; scale: number; x: number; y: number } => {
    const containerAspect = containerWidth / containerHeight;
    const videoAspect = videoWidth / videoHeight;
    let scale: number;
    let width: number;
    let height: number;
    let x: number;
    let y: number;

    if (mode.type === 'fit') {
      if (containerAspect > videoAspect) {
        // Container is wider - fit to height
        height = containerHeight;
        width = containerHeight * videoAspect;
        scale = containerHeight / videoHeight;
      } else {
        // Container is taller - fit to width
        width = containerWidth;
        height = containerWidth / videoAspect;
        scale = containerWidth / videoWidth;
      }
      // Center position
      x = (containerWidth - width) / 2;
      y = (containerHeight - height) / 2;
    } else {
      // Zoom mode
      if (containerAspect > videoAspect) {
        // Fill width
        width = containerWidth;
        height = containerWidth / videoAspect;
        scale = containerWidth / videoWidth;
      } else {
        // Fill height
        height = containerHeight;
        width = containerHeight * videoAspect;
        scale = containerHeight / videoHeight;
      }
      // Use provided position or center
      x = mode.position ? mode.position.x : (containerWidth - width) / 2;
      y = mode.position ? mode.position.y : (containerHeight - height) / 2;
    }

    return { width, height, scale, x, y };
  },

  calculateExportDimensions: (
    targetResolution: { width: number; height: number },
    currentAspectRatio: number,
  ): { width: number; height: number } => {
    const targetAspect = targetResolution.width / targetResolution.height;

    if (currentAspectRatio > targetAspect) {
      // Current is wider - fit to width
      return {
        width: targetResolution.width,
        height: Math.round(targetResolution.width / currentAspectRatio),
      };
    } else {
      // Current is taller - fit to height
      return {
        width: Math.round(targetResolution.height * currentAspectRatio),
        height: targetResolution.height,
      };
    }
  },
};
