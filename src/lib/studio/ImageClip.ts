import * as PIXI from 'pixi.js';

import Clip from '@/lib/studio/Clip';
import { TimeRange } from '@/lib/studio/studio.types';

class ImageClip extends Clip<PIXI.Sprite> {
  constructor(texture: PIXI.Texture, time: TimeRange) {
    super(time, 'Image');
    this.element = new PIXI.Sprite(texture);
    this.element.anchor.set(0.5);
  }
}

export default ImageClip;
