'use client';

import { FileSystemWritableFileStreamTarget, Muxer as Mp4Muxer } from 'mp4-muxer';
import * as PIXI from 'pixi.js';
import { ExportConfig, ExportProgress, ResolutionItem } from '@/components/studio/studio.types';
import { Resolutions } from '@/components/studio/studio.data';
import { videoSupportedCodec } from '@/lib/encoder/encoder.utils';
import { roundToEven } from '@/components/studio/studio.utils';
import VideoExporterWorker from '@/lib/encoder/VideoExporterWorker';

interface ResolutionCalculation {
  width: number;
  height: number;
  maintainedAspectRatio: number;
  scale: number;
}

class VideoExporter extends VideoExporterWorker {
  private video: HTMLVideoElement;
  private sprite: PIXI.Sprite;
  private stage: PIXI.Container;
  private pixiRenderer: PIXI.IRenderer;
  private config: ExportConfig;
  private isFit: boolean;

  constructor(
    video: HTMLVideoElement,
    sprite: PIXI.Sprite,
    stage: PIXI.Container,
    pixiRenderer: PIXI.IRenderer,
    config: ExportConfig,
    isFit: boolean,
  ) {
    super();

    this.video = video;
    this.sprite = sprite;
    this.stage = stage;
    this.pixiRenderer = pixiRenderer;
    this.config = config;
    this.isFit = isFit;
  }

  public async encode(onProgress: (percent: ExportProgress) => void) {
    let originalState;

    try {
      // Calculate current aspect ratio from the container
      const currentAspectRatio = this.pixiRenderer.width / this.pixiRenderer.height;

      // Calculate output dimensions based on selected resolution
      const targetResolution = Resolutions[this.config.resolution];
      const outputDimensions = this.calculateResolutionWithAspectRatio(
        targetResolution,
        currentAspectRatio,
        this.sprite.texture.baseTexture.width,
        this.sprite.texture.baseTexture.height,
        this.isFit,
      );

      console.log('outputDimensions --->> ', outputDimensions);

      const videoConfig = await this.initializeEncoder(outputDimensions);
      const writableStream = await this.setupExportStream();

      const muxer = new Mp4Muxer({
        target: new FileSystemWritableFileStreamTarget(writableStream),
        video: {
          ...videoConfig,
          codec: 'avc',
        },
        audio: undefined,
        fastStart: false,
        firstTimestampBehavior: 'offset',
      });

      const encoder = new VideoEncoder({
        output: (chunk, meta) => muxer.addVideoChunk(chunk, meta),
        error: (e) => console.error(e),
      });

      encoder.configure(videoConfig);

      // Store and update state
      originalState = this.storeOriginalState();
      this.updateSpriteForExport(outputDimensions);

      // Process frames
      const totalFrames = Math.ceil(this.video.duration * videoConfig.framerate!);
      const frameDuration = 1000 / videoConfig.framerate!;
      let frameCount = 0;

      // Reset video to start
      this.video.currentTime = 0;
      await new Promise((resolve) => {
        this.video.addEventListener('seeked', resolve, { once: true });
      });

      while (frameCount < totalFrames) {
        this.video.currentTime = frameCount / videoConfig.framerate!;
        await new Promise((resolve) => {
          this.video.addEventListener('seeked', resolve, { once: true });
        });

        this.pixiRenderer.render(this.stage);

        const frame = new VideoFrame(this.pixiRenderer.view as unknown as HTMLCanvasElement, {
          timestamp: frameCount * frameDuration * 1000,
          duration: frameDuration * 1000,
        });

        await encoder.encode(frame);
        frame.close();

        onProgress({
          progress: (frameCount / totalFrames) * 100,
          currentFrame: frameCount,
          totalFrames: totalFrames,
        });
        frameCount++;
      }

      // Cleanup
      await encoder.flush();
      muxer.finalize();
      await writableStream.close();
    } catch (error) {
      console.error('Export failed:', error);
      throw error;
    } finally {
      // Restore original state
      this.restoreOriginalState(originalState);
    }
  }

  private calculateResolutionWithAspectRatio(
    targetResolution: ResolutionItem,
    currentAspectRatio: number,
    videoWidth: number,
    videoHeight: number,
    isFit = true,
  ): ResolutionCalculation {
    const targetAspectRatio = targetResolution.width / targetResolution.height;
    const videoAspectRatio = videoWidth / videoHeight;
    let finalWidth: number;
    let finalHeight: number;
    let scale: number;

    // First determine output dimensions based on target resolution
    if (currentAspectRatio > targetAspectRatio) {
      // Current view is wider than target
      finalWidth = targetResolution.width;
      finalHeight = roundToEven(Math.round(targetResolution.width / currentAspectRatio));
    } else {
      // Current view is taller than target
      finalHeight = targetResolution.height;
      finalWidth = roundToEven(Math.round(targetResolution.height * currentAspectRatio));
    }

    // Now calculate the video sprite scale within these dimensions
    if (currentAspectRatio >= videoAspectRatio) {
      // Output is wider than video - always FIT
      scale = finalHeight / videoHeight;
    } else {
      // Output is narrower than video - check mode
      if (isFit) {
        scale = finalWidth / videoWidth; // Scale down to fit width
      } else {
        // ZOOM mode - maintain height scale and crop width
        scale = finalHeight / videoHeight;
      }
    }

    // Ensure dimensions are even
    finalWidth = roundToEven(finalWidth);
    finalHeight = roundToEven(finalHeight);

    return {
      width: finalWidth,
      height: finalHeight,
      maintainedAspectRatio: currentAspectRatio,
      scale: scale,
    };
  }

  private async initializeEncoder(outputDimensions: ResolutionCalculation) {
    const initVideoConfig: Partial<VideoEncoderConfig> = {
      width: outputDimensions.width,
      height: outputDimensions.height,
      bitrate: this.config.bitRates * 1_000_000,
      framerate: this.config.frameRate,
    };

    const videoConfig = await videoSupportedCodec(initVideoConfig);

    if (!videoConfig) {
      throw new Error('No supported encoder found!');
    }

    return videoConfig;
  }

  private async setupExportStream() {
    const fileHandle = await window.showSaveFilePicker({
      suggestedName: 'video.mp4',
      types: [
        {
          description: 'MP4 Video',
          accept: { 'video/mp4': ['.mp4'] },
        },
      ],
    });

    return await fileHandle.createWritable();
  }

  private storeOriginalState() {
    return {
      width: this.sprite.width,
      height: this.sprite.height,
      x: this.sprite.x,
      y: this.sprite.y,
      rendererWidth: this.pixiRenderer.width,
      rendererHeight: this.pixiRenderer.height,
    };
  }

  private updateSpriteForExport(outputDimensions: ResolutionCalculation) {
    this.pixiRenderer.resize(outputDimensions.width, outputDimensions.height);
    const scale = outputDimensions.scale;
    this.sprite.width = this.sprite.texture.baseTexture.width * scale;
    this.sprite.height = this.sprite.texture.baseTexture.height * scale;
    this.sprite.x = outputDimensions.width / 2;
    this.sprite.y = outputDimensions.height / 2;
  }

  private restoreOriginalState(originalState: any) {
    if (!originalState) {
      return;
    }
    this.sprite.width = originalState.width;
    this.sprite.height = originalState.height;
    this.sprite.x = originalState.x;
    this.sprite.y = originalState.y;
    this.pixiRenderer.resize(originalState.rendererWidth, originalState.rendererHeight);
    this.video.currentTime = 0;
  }
}

export default VideoExporter;
