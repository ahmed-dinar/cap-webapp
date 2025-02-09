import * as PIXI from 'pixi.js';

import { Dimension, TimeRange } from '@/lib/studio/studio.types';
import Clip from '@/lib/studio/Clip';
import {scaleDimension} from "@/lib/studio/studio.utils";
import {pick} from "@/lib/utils";

class VideoClip2 extends Clip<PIXI.Sprite> {
  public readonly videoElement: HTMLVideoElement = document.createElement('video');
  private texture: PIXI.Texture;
  private signal = new AbortController();
  private playing: boolean = false;
  private baseDimension: Dimension;

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

    this.baseDimension = { width: this.element.width, height: this.element.height };

    this.init();
  }

  async seek(timeMillis: number): Promise<void> {
    console.log('videoclip seek ', timeMillis);
    return new Promise((resolve, reject) => {
      if (!this.videoElement) {
        return resolve();
      }
      if (timeMillis <= this.time.startTime || timeMillis >= this.time.endTime) {
        timeMillis = this.time.startTime;
      }
      this.videoElement.onerror = () => reject(this.videoElement?.error);
      this.videoElement.pause();
      this.videoElement.currentTime = timeMillis / 1000;
      this.videoElement.onseeked = () => {
        console.log('done onseeked ', timeMillis);
        this.texture.update();
        resolve();
      };
    });
  }

  update(timeMillis: number) {
    const isStudioPlaying = this.studio.isPlaying;
    if (isStudioPlaying && !this.playing) {
      this.videoElement.play();
    } else if (!isStudioPlaying && this.playing) {
      this.videoElement.pause();
    }

    super.update(timeMillis);

    const videoTime = (timeMillis - this.time.startTime) / 1000;
    const drift = Math.abs(this.videoElement.currentTime - videoTime);

    // console.log('currentTime ', this.videoElement.currentTime, ' videoTime ', videoTime);

    // Only sync if drift is very large (e.g., > 0.5 seconds)
    if (drift > 0.5) {
      console.log(`Large drift detected (${drift} ms), resyncing video`);
      console.log('currentTime ', this.videoElement.currentTime, ' videoTime ', videoTime);
      this.videoElement.currentTime = videoTime;
      this.texture.update();
    }
  }

  private init() {
    this.videoElement.addEventListener(
      'loadedmetadata',
      async () => {
        console.log('video ready');
        this.videoElement.pause();
        this.videoElement.currentTime = 0;
        await this.seek(0);
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

    this.videoElement.addEventListener(
      'play',
      () => {
        this.playing = true;
      },
      { signal: this.signal.signal },
    );

    this.videoElement.addEventListener(
      'pause',
      () => {
        this.playing = false;
      },
      { signal: this.signal.signal },
    );
  }

  public pause() {
    super.pause();
    this.videoElement.pause();
  }

  public destroy() {
    this.signal.abort();
    this.videoElement.pause();
    this.texture.destroy(true);
    this.videoElement.remove();
  }

  resize() {
    const { width, height } = scaleDimension(
      pick(this.studio.settings, ['width', 'height']),
      pick(this.baseDimension, ['width', 'height']),
    );
    console.log('viideo clip resiiize ', width, ' ', height, ' this.studio.settings ', this.studio.settings, ' ', this.baseDimension);
    this.element.width = width;
    this.element.height = height;
  }
}

export default VideoClip2;
