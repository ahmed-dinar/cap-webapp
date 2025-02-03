export function formatDuration(seconds: number) {
  const minutes = Math.floor(seconds / 60);
  const sec = seconds % 60; // Includes decimal part
  return `${String(minutes).padStart(2, '0')}:${sec.toFixed(2).padStart(5, '0')}`;
}

export function validDuration(sec: number) {
  return sec !== Number.POSITIVE_INFINITY && sec > -1 && sec < 82800;
}

export const roundToEven = (value: number) => Math.round(value / 2) * 2;

// function getInterpolatedPosition(time: number, mouseSegments?: VideoSegment[]) {
//   if (!mouseSegments) return null;
//
//   for (let i = 0; i < mouseSegments.length - 1; i++) {
//     if (time >= mouseSegments[i].time && time <= mouseSegments[i + 1].time) {
//       const t = (time - mouseSegments[i].time) / (mouseSegments[i + 1].time - mouseSegments[i].time);
//       const x = mouseSegments[i].x + (mouseSegments[i + 1].x - mouseSegments[i].x) * t;
//       const y = mouseSegments[i].y + (mouseSegments[i + 1].y - mouseSegments[i].y) * t;
//       return { x, y };
//     }
//   }
//
//   return null; // Default position if no match found
// }