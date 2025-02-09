import * as PIXI from 'pixi.js';

import { StudioSettings, BaseConfig, defaultBgColor, shadowBorderConfig } from '@/lib/studio/studio.types';
import Clip from '@/lib/studio/Clip';
import { frameToTimeMillis, scaleDimension } from '@/lib/studio/studio.utils';
import EditorEventEmitter, { EditorEventMap } from '@/lib/encoder/EditorEventEmitter';
import {
  AspectRatioType,
  backgroundBlurs,
  BackgroundConfig,
  backgroundSizes,
  Dimension,
  VideoSegment,
} from '@/components/studio/studio.types';
import { defaultBackgroundConfig } from '@/components/studio/studio.data';
import { DropShadowFilter } from '@pixi/filter-drop-shadow';
import AnimationManager, { ZoomRange } from '@/lib/studio/v2/AnimationManager';

// PIXI.BaseTexture.defaultOptions.scaleMode = PIXI.SCALE_MODES.NEAREST;

const zIndexes = {
  mask: 1,
  content: 2,
};

class Studio2 extends EditorEventEmitter<EditorEventMap> {
  private backgroundConfig: BackgroundConfig = defaultBackgroundConfig;
  public baseScale: number = 1;
  private readonly baseConfig: BaseConfig;

  private renderer: PIXI.IRenderer;
  public stage: PIXI.Container;
  public container: PIXI.Container;
  public backgroundContainer: PIXI.Container;
  public mainContainer: PIXI.Container;
  public contentContainer: PIXI.Container;

  private previewCanvas?: HTMLCanvasElement;
  private previewCtx?: CanvasRenderingContext2D;
  public settings: StudioSettings;

  public durationMillis = 0;
  private currentFrame = 0;
  private totalFrames = 0;
  public isPlaying = false;
  private clips: Clip<PIXI.Container>[] = [];
  private speed = 1;
  private fixedHeight: number = 1;

  private animationManager: AnimationManager;

  constructor(settings: StudioSettings) {
    super();
    this.settings = settings;
    this.baseConfig = {
      ...settings,
      scale: 1,
    };

    this.renderer = PIXI.autoDetectRenderer<HTMLCanvasElement>({
      width: settings.width,
      height: settings.height,
      backgroundColor: '#000',
      resolution: window.devicePixelRatio || 1,
      autoDensity: true,
    });

    this.stage = new PIXI.Container();
    this.stage.width = settings.width;
    this.stage.height = settings.height;
    const stageBg = new PIXI.Graphics()
      .beginFill(0x000000, 0)
      .drawRect(0, 0, settings.width, settings.height)
      .endFill();
    this.stage.addChild(stageBg);

    this.container = new PIXI.Container();
    this.container.width = settings.width;
    this.container.height = settings.height;
    const containerBg = new PIXI.Graphics()
      .beginFill(0x000000, 0)
      .drawRect(0, 0, settings.width, settings.height)
      .endFill();
    this.container.addChild(containerBg);

    this.stage.addChild(this.container);

    this.backgroundContainer = new PIXI.Container();
    this.backgroundContainer.width = settings.width;
    this.backgroundContainer.height = settings.height;

    this.mainContainer = new PIXI.Container();
    this.mainContainer.width = settings.width;
    this.mainContainer.height = settings.height;

    this.contentContainer = new PIXI.Container();
    this.contentContainer.width = settings.width;
    this.contentContainer.height = settings.height;
    this.contentContainer.sortableChildren = true;

    this.mainContainer.addChild(this.contentContainer);

    this.container.addChild(this.backgroundContainer);
    this.container.addChild(this.mainContainer);

    this.updateCurrentFrame(0);
    this.totalFrames = 0;
    this.isPlaying = false;
    this.clips = [];
    this.speed = 1;

    this.animationManager = new AnimationManager(this);
    this.updateBackground();
  }

  addPreview(canvas: HTMLCanvasElement, fixedHeight: number) {
    this.previewCanvas = canvas;
    this.fixedHeight = fixedHeight;

    this.resizeCanvasPreview();

    this.previewCanvas.style.background = '#000';
    this.previewCtx = this.previewCanvas.getContext('2d')!;
    this.previewCtx.imageSmoothingEnabled = false;

    this.processCurrentFrame();
  }

  public resizeCanvasPreview() {
    if (!this.previewCanvas) {
      return;
    }

    // Keep canvas at original dimensions
    this.previewCanvas.width = this.settings.width;
    this.previewCanvas.height = this.settings.height;

    // Calculate scale to fit the fixed height
    const scale = this.fixedHeight / this.settings.height;

    // Apply CSS transform
    this.previewCanvas.style.transform = `scale(${scale})`;
    this.previewCanvas.style.transformOrigin = 'center';

    // Set the container size to match the scaled dimensions
    this.previewCanvas.style.width = `${this.settings.width}px`;
    this.previewCanvas.style.height = `${this.settings.height}px`;
  }

  setDuration(seconds: number) {
    this.durationMillis = seconds * 1000;
    this.totalFrames = Math.floor(seconds * this.settings.fps);
  }

  addClip<T extends PIXI.Container>(clip: Clip<T>): void {
    clip.studio = this;
    clip.resize();
    this.clips.push(clip);
    clip.element.zIndex = zIndexes.content;
    this.contentContainer.addChild(clip.element);
    this.contentContainer.sortChildren();
  }

  public setSpeed(newSpeed: number) {
    this.speed = newSpeed;
  }

  public setMouseMovements(mouseSegments: VideoSegment[]) {
    mouseSegments.sort((a, b) => a.time - b.time);

    this.animationManager.setZoomRanges([
      {
        startTime: 1000,
        endTime: this.durationMillis,
        x: mouseSegments[0].x,
        y: mouseSegments[0].y,
      },
    ]);

    this.animationManager.setMousePositions(mouseSegments);
  }

  public setMouseClicks(clickSegments: VideoSegment[]) {
    this.animationManager.setClickPositions(clickSegments);
  }

  play() {
    console.log('play');
    if (!this.isPlaying) {
      this.isPlaying = true;
      this.ticker();
      this.emit('playing', true);
    }
  }

  pause() {
    this.isPlaying = false;
    this.clips.forEach((clip) => {
      if (clip.type === 'Video') {
        clip.pause();
      }
    });
    this.emit('pause', true);
  }

  async seek(timeInSeconds: number): Promise<void> {
    if (this.isPlaying) {
      this.pause();
    }

    const frame = Math.floor(timeInSeconds * this.settings.fps);
    const curFrame = Math.min(Math.max(0, frame), this.totalFrames);
    this.updateCurrentFrame(curFrame);

    console.log('seek ', timeInSeconds, ' curFrame ', curFrame);

    const millis = frameToTimeMillis(curFrame, this.settings.fps);
    for (const clip of this.clips) {
      await clip.seek(millis);
    }

    this.processCurrentFrame();
  }

  private ticker() {
    const FIXED_TIMESTEP = 1000 / this.settings.fps;
    const MAX_FRAME_TIME = 250;
    let accumulator = 0;
    let lastTime = performance.now();

    if (this.currentFrame > this.totalFrames) {
      this.updateCurrentFrame(0);
    }

    console.log('ticker currentFrame ', this.currentFrame, ' totalframes ', this.totalFrames);

    const loop = () => {
      const currentTime = performance.now();
      let frameTime = currentTime - lastTime;
      lastTime = currentTime;

      if (frameTime > MAX_FRAME_TIME) {
        frameTime = MAX_FRAME_TIME;
      }

      accumulator += frameTime;

      while (accumulator >= FIXED_TIMESTEP) {
        this.processFrame(this.currentFrame);
        accumulator -= FIXED_TIMESTEP;
      }

      if (this.currentFrame > this.totalFrames) {
        console.log('video ended');
        this.pause();
        this.updateCurrentFrame(0);
        this.seek(0);
      } else if (this.isPlaying) {
        requestAnimationFrame(loop);
      }
    };

    requestAnimationFrame(loop);
  }

  public processCurrentFrame() {
    this.processFrame(this.currentFrame);
  }

  private processFrame(frameNumber: number) {
    const timeMillis = frameToTimeMillis(frameNumber, this.settings.fps);
    // console.log('frameNumber ', frameNumber, ' timeMillis ', timeMillis);

    // Update all clips
    this.clips.forEach((clip) => {
      if (timeMillis >= clip.time.startTime && timeMillis <= clip.time.endTime) {
        clip.update(timeMillis);
        clip.element.visible = true;
      } else {
        clip.element.visible = false;
      }
    });

    this.animationManager.updateAnimations(timeMillis);

    this.render();

    // Render to preview canvas
    if (this.previewCtx && this.previewCanvas) {
      this.previewCtx.clearRect(0, 0, this.renderer.width, this.renderer.height);
      this.previewCtx.drawImage(this.renderer.view as HTMLCanvasElement, 0, 0);
    }

    if (this.isPlaying) {
      this.updateCurrentFrame(this.currentFrame + 1);
    }
  }

  public render() {
    this.renderer.render(this.stage);
  }

  private updateCurrentFrame(frame: number) {
    this.currentFrame = frame;
    this.emit('timeUpdated', frameToTimeMillis(frame, this.settings.fps) / 1000);
  }

  public setBackgroundConfig(backgroundConfig: BackgroundConfig) {
    this.backgroundConfig = backgroundConfig;
    this.updateBackground();
  }

  private updateBaseScale(scale: number) {
    this.baseScale = scale;
  }

  /**
   * *********************************************
   * *************** Resize ********************
   * *********************************************
   */
  public resize({
    selectedAspectRatio,
    isFit = true,
  }: {
    selectedAspectRatio: AspectRatioType;
    isFit: boolean;
    dimension?: Dimension;
  }) {
    const aspectRatio = selectedAspectRatio.value;
    this.doResize({ aspectRatio, isFit });
  }

  private doResize({ aspectRatio, dimension }: { aspectRatio: number; isFit: boolean; dimension?: Dimension }) {
    let newWidth;
    let newHeight;

    if (dimension) {
      newWidth = dimension.width;
      newHeight = dimension.height;
    } else {
      const originalAspectRatio = this.baseConfig.width / this.baseConfig.height;
      // The key logic: maintain the larger dimension to preserve quality
      if (originalAspectRatio > aspectRatio) {
        // Original video is wider than target - maintain height
        newHeight = this.baseConfig.height;
        newWidth = Math.round(this.baseConfig.height * aspectRatio);
      } else {
        // Original video is taller than target - maintain width
        newWidth = this.baseConfig.width;
        newHeight = Math.round(this.baseConfig.width / aspectRatio);
      }
    }

    this.renderer.resize(newWidth, newHeight);

    this.settings.width = newWidth;
    this.settings.height = newHeight;

    const contentDimension = scaleDimension({ width: newWidth, height: newHeight }, this.baseConfig);
    this.settings.contentWidth = contentDimension.width;
    this.settings.contentHeight = contentDimension.height;

    this.mainContainer.width = contentDimension.width;
    this.mainContainer.height = contentDimension.height;

    this.centerMainContainer();

    this.clips.forEach((clip) => clip.resize());

    this.resizeCanvasPreview();
    this.updateBackground();
  }

  /**
   * **********************  ****************
   * ********************** Background Manager ****************
   * **********************  ****************
   */
  private async updateBackground() {
    this.backgroundContainer.removeChildren();

    const scale =
      this.backgroundConfig.backgroundSize === 'None' ? 1 : backgroundSizes[this.backgroundConfig.backgroundSize];

    const addBgColor = (color: string | number) => {
      const colorBg = new PIXI.Graphics();
      colorBg.beginFill(color);
      colorBg.drawRect(0, 0, this.renderer.width, this.renderer.height);
      colorBg.endFill();
      this.backgroundContainer.addChild(colorBg);
    };

    if (this.backgroundConfig.backgroundSize === 'None') {
      addBgColor(defaultBgColor);
    } else if (this.backgroundConfig.backgroundType === 'Color') {
      if (this.backgroundConfig.backgroundBlur === 'None' || !this.backgroundConfig.background) {
        addBgColor(this.backgroundConfig.background ?? defaultBgColor);
      } else {
        const colorSprite = new PIXI.Sprite(PIXI.Texture.WHITE);
        colorSprite.width = this.renderer.width;
        colorSprite.height = this.renderer.height;
        colorSprite.tint = this.backgroundConfig.background;

        const blurFilter = new PIXI.BlurFilter();
        blurFilter.blur = backgroundBlurs[this.backgroundConfig.backgroundBlur];
        blurFilter.quality = 2;
        colorSprite.filters = [blurFilter];
        this.backgroundContainer.addChild(colorSprite);
      }
    } else if (this.backgroundConfig.backgroundType === 'Image' || this.backgroundConfig.backgroundType === 'Pattern') {
      if (!this.backgroundConfig.background) {
        addBgColor(defaultBgColor);
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
        this.backgroundContainer.addChild(bgSprite);
      }
    }

    this.centerMainContainer();

    // Apply scale directly without animation
    this.mainContainer.scale.set(scale);
    this.updateBaseScale(scale);

    this.updateBorderAndShadowBackground();

    // Render the changes
    this.render();
    this.resizeCanvasPreview();
    this.processCurrentFrame();
  }

  public centerMainContainer() {
    this.mainContainer.pivot.x = this.settings.contentWidth / 2;
    this.mainContainer.pivot.y = this.settings.contentHeight / 2;
    this.mainContainer.position.x = this.settings.width / 2;
    this.mainContainer.position.y = this.settings.height / 2;
  }

  private updateBorderAndShadowBackground() {
    this.removeBorder();

    if (this.baseScale === 1) {
      return;
    }

    if (this.backgroundConfig.applyBorder) {
      const border = new PIXI.Graphics();
      border.name = shadowBorderConfig.name;

      // Get actual dimensions
      const width = this.settings.contentWidth;
      const height = this.settings.contentHeight;
      const borderSize = shadowBorderConfig.border.thickness;

      border.beginFill(shadowBorderConfig.border.color, shadowBorderConfig.border.alpha);

      // Outer rectangle with border
      border.drawRoundedRect(
        -borderSize,
        -borderSize,
        width + borderSize * 2,
        height + borderSize * 2,
        shadowBorderConfig.radius.size,
      );
      border.endFill();

      // Cut out the inner part
      border.beginHole();
      border.drawRoundedRect(-width / 2, -height / 2, width, height, shadowBorderConfig.radius.size);
      border.endHole();

      // Add at index 0 to be behind content
      this.mainContainer.addChildAt(border, 0);
    }

    if (this.backgroundConfig.applyShadow) {
      const shadowFilter = new DropShadowFilter({
        color: shadowBorderConfig.shadow.color,
        alpha: shadowBorderConfig.shadow.alpha,
        blur: shadowBorderConfig.shadow.blur,
        offset: { x: shadowBorderConfig.shadow.offsetX, y: shadowBorderConfig.shadow.offsetY },
        quality: 2,
      });

      this.mainContainer.filters = [shadowFilter];
    }

    this.drawBorderRadius();
  }

  private removeBorder() {
    const existingBorder = this.mainContainer.children.find((child) => child.name === shadowBorderConfig.name);
    if (existingBorder) {
      this.mainContainer.removeChild(existingBorder);
    }
    this.mainContainer.filters = [];
  }

  private drawBorderRadius() {
    this.removeBorderRadius();

    // Create a dedicated container for the mask
    // This ensures the mask stays in the correct coordinate space
    const maskContainer = new PIXI.Container();
    maskContainer.name = 'maskContainer';

    // Create the mask graphics with correct dimensions
    const mask = new PIXI.Graphics();
    mask.name = shadowBorderConfig.radius.name;

    // Use contentContainer's dimensions for the mask
    const width = this.settings.contentWidth;
    const height = this.settings.contentHeight;

    // Draw the rounded rectangle mask
    mask.beginFill(0xffffff);
    mask.drawRoundedRect(0, 0, width, height, shadowBorderConfig.radius.size);
    mask.endFill();

    // Add mask to its container
    maskContainer.addChild(mask);

    // Position the mask container to match contentContainer
    maskContainer.position.copyFrom(this.contentContainer.position);

    maskContainer.zIndex = zIndexes.mask;
    this.contentContainer.addChildAt(maskContainer, 0);
    this.contentContainer.mask = mask;
    this.contentContainer.sortChildren();
  }

  private removeBorderRadius() {
    const existingMask = this.contentContainer.getChildByName(shadowBorderConfig.radius.name);
    if (existingMask) {
      this.mainContainer.removeChild(existingMask);
      this.contentContainer.mask = null;
    }
  }
}

export default Studio2;
