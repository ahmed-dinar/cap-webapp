'use client';

import * as PIXI from 'pixi.js';
import gsap from 'gsap';

import {
  backgroundBlurs,
  BackgroundConfig,
  backgroundSizes,
  Dimension,
  ExportConfig,
  ExportProgress,
  PointXY,
  TimelineSegment,
} from '@/components/studio/studio.types';
import { validDuration } from '@/components/studio/studio.utils';
import EditorEventEmitter, { EditorEventMap } from '@/lib/encoder/EditorEventEmitter';
import VideoExporter from '@/lib/encoder/VideoExporter';
import { defaultBackgroundConfig } from '@/components/studio/studio.data';
import { DropShadowFilter } from '@pixi/filter-drop-shadow';

const defaultBgColor = '#000000';

const shadowBorderConfig = {
  name: 'videoBorder1232',
  border: {
    enabled: true,
    thickness: 30,
    color: 0x00ff00,
    alpha: 1,
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

class VideoEditor extends EditorEventEmitter<EditorEventMap> {
  private renderer: PIXI.IRenderer;
  private stage: PIXI.Container;
  private videoContainer: PIXI.Container;
  private sprite: PIXI.Sprite;
  private canvas: HTMLCanvasElement;
  private canvasContainer: HTMLDivElement;
  private video: HTMLVideoElement;
  private videoDimension: Dimension;
  private viewHeight: number;
  private aspectRatio: number;
  private currentTime: number = 0;
  private duration: number = 0;
  private isPlaying: boolean = false;
  private segments: TimelineSegment[] = [];
  private segmentIds: Set<string> = new Set<string>();
  private baseScale: number = 1;
  private fitOnResize: boolean = true;
  private backgroundConfig: BackgroundConfig = defaultBackgroundConfig;

  // Zoom editing properties
  private isEditingZoom: boolean = false;
  private zoomPoint: PIXI.Graphics | null = null;
  private previewCanvas: HTMLCanvasElement | null = null;
  private previewContext: CanvasRenderingContext2D | null = null;
  private clickHandler: ((event: PIXI.FederatedPointerEvent) => void) | null = null;
  private isZoomed: boolean = false;

  constructor(canvas: HTMLCanvasElement, canvasContainer: HTMLDivElement, video: HTMLVideoElement) {
    super();

    this.viewHeight = canvasContainer.clientHeight;
    this.canvasContainer = canvasContainer;

    this.canvas = canvas;
    this.video = video;
    this.videoDimension = { width: video.videoWidth, height: video.videoHeight };

    const adjustedDimension = this.getAdjustedViewDimension(this.videoDimension);
    this.aspectRatio = adjustedDimension.width / adjustedDimension.height;

    this.canvasContainer.style.width = `${adjustedDimension.width}px`;

    this.renderer = PIXI.autoDetectRenderer({
      view: canvas,
      width: adjustedDimension.width,
      height: adjustedDimension.height,
      backgroundColor: '#000',
    });

    this.stage = new PIXI.Container();
    this.videoContainer = new PIXI.Container();

    const videoTexture = PIXI.Texture.from(video);
    this.sprite = new PIXI.Sprite(videoTexture);

    this.sprite.anchor.set(0.5);

    this.sprite.x = adjustedDimension.width / 2;
    this.sprite.y = adjustedDimension.height / 2;

    this.sprite.width = adjustedDimension.width;
    this.sprite.height = adjustedDimension.height;

    this.videoContainer.addChild(this.sprite);
    this.stage.addChild(this.videoContainer);

    this.baseScale = this.sprite.scale.x;

    this.updateBackground();
    this.init();
  }

  public addSegment(segment: TimelineSegment) {
    this.segments.push(segment);
  }

  public setSegments(segments: TimelineSegment[]) {
    this.segments = segments;
  }

  public setCurrentTime(time: number) {
    this.currentTime = time;
    this.video.currentTime = time;
  }

  public setBackgroundConfig(backgroundConfig: BackgroundConfig) {
    this.backgroundConfig = backgroundConfig;
    this.updateBackground();
  }

  public resize(ratio: number, isFit = true) {
    const newWidth = this.viewHeight * ratio;
    const newHeight = this.viewHeight;

    this.canvasContainer.style.width = `${newWidth}px`;
    this.renderer.resize(newWidth, newHeight);

    const videoWidth = this.videoDimension.width;
    const videoHeight = this.videoDimension.height;
    const videoAspectRatio = videoWidth / videoHeight;

    let scale;
    if (ratio >= videoAspectRatio) {
      // Going to wider aspect ratio - always FIT
      scale = newHeight / videoHeight;
    } else {
      // Going to narrower aspect ratio - check mode
      if (isFit) {
        scale = newWidth / videoWidth; // Scale down to fit width
      } else {
        // ZOOM mode - maintain height scale and crop width
        scale = newHeight / videoHeight;
      }
    }

    // Update sprite dimensions
    this.sprite.width = videoWidth * scale;
    this.sprite.height = videoHeight * scale;

    // Center the sprite
    this.sprite.x = newWidth / 2;
    this.sprite.y = newHeight / 2;

    this.baseScale = this.sprite.scale.x;
    this.aspectRatio = ratio;
    this.fitOnResize = isFit;

    // this.updateBackground();
  }

  public render() {
    this.isPlaying = true;
    this.renderer.render(this.stage);
  }

  async encode(config: ExportConfig, onProgress: (progress: ExportProgress) => void) {
    const encoder = new VideoExporter(this.video, this.sprite, this.stage, this.renderer, config, this.fitOnResize);
    await encoder.encode(onProgress);
  }

  private getAdjustedViewDimension(dimension: Dimension): Dimension {
    const currentAspectRatio = dimension.width / dimension.height;
    const newWidth = this.viewHeight * currentAspectRatio;
    return { height: this.viewHeight, width: newWidth };
  }

  private zoomSegment(time: number) {
    if (this.isEditingZoom) {
      return;
    }

    const segment = this.findSegment(time);

    if (!segment) {
      return;
    }

    this.segmentIds.add(segment.id);

    const scale = segment.data;
    this.baseScale = this.sprite.scale.x;

    const targetScale = this.baseScale * scale;
    if (this.sprite.scale.x === targetScale) {
      return;
    }

    const x = segment.xy?.x ?? this.renderer.width / 2;
    const y = segment.xy?.y ?? this.renderer.height / 2;

    console.log('zooming segment: ', segment);

    gsap.to(this.sprite.scale, {
      x: targetScale,
      y: targetScale,
      duration: 1,
    });
    gsap.to(this.sprite.position, {
      x: x,
      y: y,
      duration: 1,
    });

    this.resetZoom(segment.duration);
  }

  private findSegment(time: number): TimelineSegment | null {
    let segment: TimelineSegment | null = null;

    for (const seg of this.segments) {
      if (time >= seg.startTime && time < seg.startTime + seg.duration && !this.segmentIds.has(seg.id)) {
        segment = seg;
      } else if (time > seg.startTime + seg.duration) {
        this.segmentIds.delete(seg.id);
      }
    }

    return segment;
  }

  private init() {
    this.video.addEventListener('timeupdate', () => {
      this.currentTime = this.video.currentTime;
      this.emit('timeUpdated', this.currentTime);
      this.zoomSegment(this.currentTime);
      // zoomSegment(video.currentTime);
      // // zoomAndFollow(video.currentTime);
      // // triggerRipples(video.currentTime);
      if (validDuration(this.video.duration)) {
        if (this.duration === 0 && this.video.duration > 0) {
          this.duration = this.video.duration;
          this.emit('duration', this.duration);
        }
      }

      if (this.currentTime === 0 || this.currentTime === this.duration) {
        this.cleanUpEffects();
      }
    });
  }

  private resetZoom(duration?: number) {
    gsap.to(this.sprite.scale, {
      x: this.baseScale,
      y: this.baseScale,
      duration: 1,
      delay: duration || 0,
    });
    gsap.to(this.sprite.position, {
      x: this.renderer.width / 2,
      y: this.renderer.height / 2,
      duration: 1,
      delay: duration || 0,
    });
    this.isZoomed = false;
  }

  private cleanUpEffects() {
    console.log('cleanUpEffects');
    this.resetZoom();
    this.segmentIds.clear();
  }

  private updateBackground() {
    const scale =
      this.backgroundConfig.backgroundSize === 'None' ? 1 : backgroundSizes[this.backgroundConfig.backgroundSize];

    if (this.backgroundConfig.backgroundSize === 'None') {
      this.renderer.background.color = defaultBgColor;
    } else if (this.backgroundConfig.backgroundType === 'Color') {
      if (this.backgroundConfig.backgroundBlur === 'None' || !this.backgroundConfig.background) {
        this.renderer.background.color = this.backgroundConfig.background ?? defaultBgColor;
      } else {
        const colorSprite = new PIXI.Sprite(PIXI.Texture.WHITE);
        colorSprite.width = this.renderer.width;
        colorSprite.height = this.renderer.height;
        colorSprite.tint = this.backgroundConfig.background;

        const blurFilter = new PIXI.BlurFilter();
        blurFilter.blur = backgroundBlurs[this.backgroundConfig.backgroundBlur];
        blurFilter.quality = 2;
        colorSprite.filters = [blurFilter];

        const existingBg = this.stage.getChildAt(0);
        if (existingBg && existingBg !== this.videoContainer) {
          this.stage.removeChild(existingBg);
        }

        this.stage.addChildAt(colorSprite, 0);
      }
    } else if (this.backgroundConfig.backgroundType === 'Image' || this.backgroundConfig.backgroundType === 'Pattern') {
      if (!this.backgroundConfig.background) {
        this.renderer.background.color = defaultBgColor;
      } else {
        const bgTexture = PIXI.Texture.from(this.backgroundConfig.background);
        const bgSprite = new PIXI.Sprite(bgTexture);

        bgSprite.scale.set(5);

        bgSprite.width = this.renderer.width;
        bgSprite.height = this.renderer.height;

        if (this.backgroundConfig.backgroundBlur !== 'None') {
          const blurFilter = new PIXI.BlurFilter();
          blurFilter.blur = backgroundBlurs[this.backgroundConfig.backgroundBlur];
          blurFilter.quality = 2;
          bgSprite.filters = [blurFilter];
        }

        const existingBg = this.stage.getChildAt(0);
        if (existingBg && existingBg !== this.videoContainer) {
          this.stage.removeChild(existingBg);
        }

        this.stage.addChildAt(bgSprite, 0);
      }
    }

    this.videoContainer.position.set(this.renderer.width / 2, this.renderer.height / 2);
    this.videoContainer.pivot.set(this.sprite.width / 2, this.sprite.height / 2);
    this.videoContainer.scale.set(scale);

    this.updateBorderAndShadowBackground();
  }

  private updateBorderAndShadowBackground() {
    const existingBorder = this.videoContainer.children.find((child) => child.name === shadowBorderConfig.name);
    if (existingBorder) {
      this.videoContainer.removeChild(existingBorder);
    }

    this.videoContainer.filters = [];

    if (this.backgroundConfig.applyBorder) {
      const border = new PIXI.Graphics();
      border.name = shadowBorderConfig.name;
      border.lineStyle(
        shadowBorderConfig.border.thickness,
        shadowBorderConfig.border.color,
        shadowBorderConfig.border.alpha,
        shadowBorderConfig.border.alignment,
        shadowBorderConfig.border.native,
      );
      console.log('Sprite dimensions:', this.sprite.width, this.sprite.height);
      console.log('Sprite scale:', this.sprite.scale.x, this.sprite.scale.y);
      console.log('Video container dimensions:', this.videoContainer.width, this.videoContainer.height);
      console.log('Video container scale:', this.videoContainer.scale.x, this.videoContainer.scale.y);
      border.drawRect(0, 0, this.sprite.width, this.sprite.height);
      this.videoContainer.addChild(border);
    }

    if (this.backgroundConfig.applyShadow) {
      const shadowFilter = new DropShadowFilter({
        color: shadowBorderConfig.shadow.color,
        alpha: shadowBorderConfig.shadow.alpha,
        blur: shadowBorderConfig.shadow.blur,
        offset: { x: shadowBorderConfig.shadow.offsetX, y: shadowBorderConfig.shadow.offsetY },
        // angle: Math.atan2(shadowBorderConfig.shadow.offsetY, shadowBorderConfig.shadow.offsetX),
        quality: 2,
      });

      this.videoContainer.filters = [shadowFilter];
    }
  }

  /**
   * ************************************************
   * ************************ Zoom editing ************************
   * ************************************************
   */
  public setZoomEditing(editing: boolean, previewCanvas?: HTMLCanvasElement | null) {
    if (editing && !this.isEditingZoom) {
      this.isEditingZoom = editing;

      this.clickHandler = this.handleSpriteClick.bind(this);
      this.sprite.eventMode = 'static'; // Enable interaction
      this.sprite.on('click', this.clickHandler);
      this.sprite.on('tap', this.clickHandler);

      if (previewCanvas) {
        this.setPreviewCanvas(previewCanvas);
      }
    } else if (!editing && this.isEditingZoom) {
      this.isEditingZoom = false;

      // Remove click handler
      if (this.clickHandler) {
        this.sprite.eventMode = 'none'; // Disable interaction
        this.sprite.off('click', this.clickHandler);
        this.sprite.off('tap', this.clickHandler);
        this.clickHandler = null;
      }

      // Remove zoom point
      if (this.zoomPoint) {
        this.videoContainer.removeChild(this.zoomPoint);
        this.zoomPoint = null;
      }

      // Clear preview
      if (this.previewContext && this.previewCanvas) {
        this.previewContext.clearRect(0, 0, this.previewCanvas.width, this.previewCanvas.height);
      }

      this.resetZoom();
    }
  }

  private handleSpriteClick(event: PIXI.FederatedPointerEvent) {
    if (!this.isEditingZoom) {
      return;
    }

    const localPos = event.getLocalPosition(this.sprite);
    console.log('Local:', localPos.x, localPos.y);

    const globalPos = event.global;
    console.log('Global:', globalPos.x, globalPos.y);

    // if (!this.isZoomed) {
    //   const oldPivot = this.sprite.pivot.clone();
    //   this.sprite.pivot.set(localPos.x, localPos.y);
    //   this.sprite.position.x += (localPos.x - oldPivot.x) * this.sprite.scale.x;
    //   this.sprite.position.y += (localPos.y - oldPivot.y) * this.sprite.scale.y;
    //
    //   gsap.to(this.sprite.scale, {
    //     x: this.sprite.scale.x * 1.2,
    //     y: this.sprite.scale.y * 1.2,
    //     duration: 0.5,
    //     ease: 'power2.out',
    //   });
    //
    //   this.isZoomed = true;
    //   this.lastClickPosition = localPos;
    // } else if (this.lastClickPosition) {
    //   const deltaX = this.lastClickPosition.x - globalPos.x;
    //   const deltaY = this.lastClickPosition.y - globalPos.y;
    //
    //   gsap.to(this.sprite, {
    //     x: this.sprite.position.x + deltaX,
    //     y: this.sprite.position.y + deltaY,
    //     duration: 0.5,
    //     ease: 'power2.out',
    //   });
    //
    //   this.lastClickPosition = localPos;
    // }

    this.updateZoomPoint(event.getLocalPosition(this.stage));
  }

  private updateZoomPoint(localPos: PointXY) {
    if (this.zoomPoint) {
      this.videoContainer.removeChild(this.zoomPoint);
    }

    this.zoomPoint = new PIXI.Graphics();
    this.zoomPoint.beginFill(0xff0000);
    this.zoomPoint.drawCircle(0, 0, 5);
    this.zoomPoint.endFill();

    this.zoomPoint.position.set(localPos.x, localPos.y);

    this.videoContainer.addChild(this.zoomPoint);
    this.updatePreview(localPos);

    this.emit('zoomPointUpdated', localPos);
  }

  private setPreviewCanvas(canvas: HTMLCanvasElement) {
    this.previewCanvas = canvas;
    this.previewContext = canvas.getContext('2d');

    // Set initial dimensions maintaining aspect ratio
    const previewWidth = canvas.clientWidth;
    const previewHeight = previewWidth / this.aspectRatio;
    canvas.width = previewWidth;
    canvas.height = previewHeight;

    this.updatePreview();
  }

  private updatePreview(localPos?: PointXY) {
    if (!localPos) return;

    const drawPreview = () => {
      if (!this.previewCanvas || !this.previewContext || !this.zoomPoint) return;

      const previewCanvas = this.previewCanvas;
      const ctx = this.previewContext;
      const video = this.video;

      const aspectRatio = video.videoWidth / video.videoHeight;
      // Set the fixed width for the canvas
      const fixedWidth = previewCanvas.clientWidth;
      previewCanvas.width = fixedWidth;
      // Set the height based on the aspect ratio and fixed width
      previewCanvas.height = fixedWidth / aspectRatio;

      ctx.clearRect(0, 0, previewCanvas.width, previewCanvas.height); // Clear the canvas
      ctx.drawImage(video, 0, 0, previewCanvas.width, previewCanvas.height);

      const zoomX = localPos.x;
      const zoomY = localPos.y;
      const w = this.stage.width;
      const h = this.stage.height;
      const sc = this.stage.scale.x;

      const scaleX = previewCanvas.width / w;
      const scaleY = previewCanvas.height / h;
      const zoomedX = zoomX * scaleX * sc;
      const zoomedY = zoomY * scaleY * sc;

      ctx.strokeStyle = 'red';
      ctx.lineWidth = 2;
      const rectSize = 100; // Example size
      ctx.strokeRect(zoomedX - rectSize / 2, zoomedY - rectSize / 2, rectSize, rectSize);

      // const dot = new PIXI.Graphics();
      // dot.beginFill(0xff0000); // Red color
      // dot.drawCircle(zoomX, zoomY, 10); // Radius of 5
      // dot.endFill();
      // ctx.addChild(dot);

      requestAnimationFrame(drawPreview);
    };

    drawPreview();
  }

  // private updatePreview() {
  //   if (!this.previewCanvas || !this.previewContext || !this.zoomPoint) return;
  //
  //   // Clear preview canvas
  //   this.previewContext.clearRect(0, 0, this.previewCanvas.width, this.previewCanvas.height);
  //
  //   // Draw video frame
  //   this.previewContext.drawImage(this.video, 0, 0, this.previewCanvas.width, this.previewCanvas.height);
  //
  //   // Calculate normalized position of zoom point relative to sprite
  //   const normalizedX = (this.zoomPoint.x + this.sprite.width / 2) / this.sprite.width;
  //   const normalizedY = (this.zoomPoint.y + this.sprite.height / 2) / this.sprite.height;
  //
  //   // Calculate zoom area dimensions
  //   const zoomWidth = this.previewCanvas.width * 0.5;
  //   const zoomHeight = this.previewCanvas.height * 0.5;
  //
  //   // Calculate zoom area position
  //   const zoomX = normalizedX * this.previewCanvas.width - zoomWidth / 2;
  //   const zoomY = normalizedY * this.previewCanvas.height - zoomHeight / 2;
  //
  //   // Draw zoom area rectangle
  //   this.previewContext.strokeStyle = '#FF0000';
  //   this.previewContext.lineWidth = 2;
  //   this.previewContext.strokeRect(zoomX, zoomY, zoomWidth, zoomHeight);
  // }
}

export default VideoEditor;
