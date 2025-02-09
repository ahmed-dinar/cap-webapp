import * as PIXI from 'pixi.js';
import gsap from 'gsap';
import Studio from '@/lib/studio/studio';

export interface ZoomRange {
  startTime: number;
  endTime: number;
  x: number;
  y: number;
}

export interface MousePosition {
  time: number;
  x: number;
  y: number;
}

class AnimationManager {
  private zoomRanges: ZoomRange[];
  private mousePositions: MousePosition[];
  private clickPositions: MousePosition[];
  private studio: Studio;
  private isZoomActive: boolean = false;
  private lastZoom: number = -1;
  private lastMouse: number = 0;
  private lastClick: number = 0;
  private zoomLevel: number = 1.2;

  constructor(studio: Studio) {
    this.zoomRanges = [];
    this.mousePositions = [];
    this.clickPositions = [];
    this.studio = studio;
  }

  public reset() {
    this.isZoomActive = false;
    this.lastZoom = -1;
    this.lastMouse = 0;
    this.lastClick = 0;
  }

  setZoomRanges(ranges: ZoomRange[]) {
    this.zoomRanges = ranges.sort((a, b) => a.startTime - b.startTime);
  }

  setMousePositions(positions: MousePosition[]) {
    positions.sort((a, b) => a.time - b.time);
    this.mousePositions = positions;
    console.log('this.mousePositions  ', this.mousePositions);
  }

  setClickPositions(positions: MousePosition[]) {
    positions.sort((a, b) => a.time - b.time);
    this.clickPositions = positions;
    console.log('this.clickPositions  ', this.clickPositions);
  }

  public async updateAnimations(timeMillis: number) {
    await this.handleMousePosition(timeMillis);
    this.handleClickPosition(timeMillis);
  }

  private async handleMousePosition(timeMillis: number) {
    const zoom = this.handleZoom(timeMillis);

    if (!zoom) {
      return;
    }

    const mousePos = this.mousePositions.find((pos) => Math.abs(pos.time - timeMillis) <= 50);
    if (!mousePos) {
      return;
    }

    const local = this.mapRecordingToRendererCoords(mousePos.x, mousePos.y);

    gsap.to(this.studio.mainContainer.pivot, {
      x: local.x,
      y: local.y,
      duration: 0.5,
      ease: 'power1.out',
    });
  }

  private handleZoom(timeMillis: number) {
    if (this.isZoomActive) {
      if (this.lastZoom >= 0 && timeMillis >= this.zoomRanges[this.lastZoom].endTime) {
        this.studio.reset();
        this.isZoomActive = false;
        return false;
      }
      return true;
    }

    for (let i = this.lastZoom + 1; i < this.zoomRanges.length; i++) {
      if (timeMillis >= this.zoomRanges[i].startTime && timeMillis < this.zoomRanges[i].endTime) {
        console.log('this.zoomRanges[i] ', this.zoomRanges[i], ' ', timeMillis);
        this.lastZoom = i;
        const scale = this.zoomLevel * this.studio.baseScale;
        gsap.to(this.studio.mainContainer.scale, {
          x: scale,
          y: scale,
          duration: 0.5,
          ease: 'power1.out',
        });
        this.isZoomActive = true;
        return true;
      }
    }

    return false;
  }

  private async handleClickPosition(timeMillis: number) {
    for (let i = this.lastClick + 1; i < this.clickPositions.length; i++) {
      if (Math.abs(this.clickPositions[i].time - timeMillis) < 50) {
        this.lastClick = i;
        const local = this.mapRecordingToRendererCoords(this.clickPositions[i].x, this.clickPositions[i].y);
        this.createRipple(local.x, local.y);
        return;
      }
    }
  }

  createRipple(x: number, y: number) {
    const ripple = new PIXI.Graphics();
    ripple.beginFill('#B91C1C', 0.5);
    ripple.drawCircle(0, 0, 10);
    ripple.endFill();
    ripple.position.set(x, y);

    this.studio.mainContainer.addChild(ripple);

    const baseSize = 100;
    gsap.to(ripple, {
      alpha: 0,
      width: baseSize * this.studio.baseScale,
      height: baseSize * this.studio.baseScale,
      duration: 1,
      ease: 'power2.out',
      onComplete: () => {
        this.studio.mainContainer.removeChild(ripple);
      },
    });
  }

  public mapRecordingToRendererCoords(x: number, y: number): { x: number; y: number } {
    // Calculate scale factors between recording screen and current renderer
    const scaleX = this.studio.settings.contentWidth / this.studio.settings.width;
    const scaleY = this.studio.settings.contentHeight / this.studio.settings.height;

    // Map coordinates
    const mappedX = x * scaleX;
    const mappedY = y * scaleY;

    // Convert to stage coordinates (relative to center)
    return {
      x: mappedX,
      y: mappedY,
    };
  }
}

export default AnimationManager;
