import { Dimension } from '@/lib/studio/studio.types';

export function frameToTimeMillis(frame: number, fps: number): number {
  return Math.round((frame / fps) * 1000);
}

export function calculateScale(containerDimension: Dimension, elementDimension: Dimension): number {
  if (containerDimension.width === elementDimension.width && containerDimension.height === elementDimension.height) {
    return 1;
  }

  const ratio = containerDimension.width / containerDimension.height;
  const contentAspectRatio = elementDimension.width / elementDimension.height;

  let scale;
  if (ratio >= contentAspectRatio) {
    // Going to wider aspect ratio - always FIT
    scale = containerDimension.height / elementDimension.height;
  } else {
    scale = containerDimension.width / elementDimension.width; // Scale down to fit width
  }

  return scale;
}

export function scaleDimension(containerDimension: Dimension, elementDimension: Dimension): Dimension {
  const scale = calculateScale(containerDimension, elementDimension);
  return {
    width: elementDimension.width * scale,
    height: elementDimension.height * scale,
  };
}
