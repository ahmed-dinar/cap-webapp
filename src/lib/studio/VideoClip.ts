import * as PIXI from 'pixi.js';

import { TimeRange } from '@/lib/studio/studio.types';
import Clip from '@/lib/studio/Clip';

class VideoClip extends Clip<PIXI.Sprite> {
  public readonly videoElement: HTMLVideoElement = document.createElement('video');
  private texture: PIXI.Texture;
  private signal = new AbortController();

  constructor(video: HTMLVideoElement, time: TimeRange) {
    super(time, 'Video');

    // Create video texture
    this.videoElement = video;
    this.videoElement.controls = false;
    this.videoElement.playsInline = true;
    // this.videoElement.style.display = 'hidden';
    this.videoElement.crossOrigin = 'anonymous';

    this.texture = PIXI.Texture.from(this.videoElement);
    this.element = new PIXI.Sprite(this.texture);
    // this.texture.baseTexture.scaleMode = PIXI.SCALE_MODES.NEAREST;

    this.init();
  }

  update(timeMillis: number) {
    super.update(timeMillis);

    // Update video time
    const videoTime = (timeMillis - this.time.startTime) / 1000;
    if (Math.abs(this.videoElement.currentTime - videoTime) > 0.1) {
      this.videoElement.currentTime = videoTime;
    }
    // this.videoElement.currentTime = videoTime;

    // Update texture
    this.texture.update();
  }

  private init() {
    this.videoElement.addEventListener(
      'loadedmetadata',
      () => {
        console.log('video ready');
        this.videoElement.pause();
        this.videoElement.currentTime = 0;
      },
      { signal: this.signal.signal },
    );

    this.videoElement.addEventListener(
      'error',
      (e) => {
        console.error('Video error:', e);
      },
      { signal: this.signal.signal },
    );
  }

  protected destroy() {
    this.signal.abort();
    this.videoElement.pause();
    this.texture.destroy(true);
    this.videoElement.remove();
  }
}

export default VideoClip;
