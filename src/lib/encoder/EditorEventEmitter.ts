import { PointXY } from '@/components/studio/studio.types';

export type EditorEventMap = {
  timeUpdated: number;
  duration: number;
  playing: boolean;
  pause: boolean;
  zoomPointUpdated: PointXY;
};

class EditorEventEmitter<T extends Record<string, unknown>> {
  private listeners: { [K in keyof T]?: Array<(data: T[K]) => void> } = {};

  on<K extends keyof T>(event: K, listener: (data: T[K]) => void) {
    if (!this.listeners[event]) {
      this.listeners[event] = [];
    }
    this.listeners[event]!.push(listener);
  }

  async emit<K extends keyof T>(event: K, data: T[K]) {
    this.listeners[event]?.forEach((listener) => listener(data));
  }

  off<K extends keyof T>(event: K, listener: (data: T[K]) => void) {
    if (this.listeners[event]) {
      this.listeners[event] = this.listeners[event]!.filter((l) => l !== listener);
    }
  }
}

export default EditorEventEmitter;
