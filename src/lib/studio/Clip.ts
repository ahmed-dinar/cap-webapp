import * as PIXI from 'pixi.js';

import { Animation, ClipType, TimeRange } from '@/lib/studio/studio.types';
import Studio from '@/lib/studio/studio';

class Clip<T extends PIXI.Container> {
  public animations: Animation[] = [];
  public time: TimeRange;
  public type: ClipType;
  public element!: T;
  declare public studio: Studio;

  constructor(time: TimeRange, type: ClipType) {
    this.time = time;
    this.type = type;
  }

  update(timeMillis: number) {
    this.animations.forEach((animation) => {
      if (timeMillis >= animation.startTime && timeMillis <= animation.endTime) {
        const progress = (timeMillis - animation.startTime) / (animation.endTime - animation.startTime);
        animation.update(progress);
      }
    });
  }

  pause() {}

  async seek(timeMillis: number): Promise<void> {}

  addAnimation(time: TimeRange, properties?: gsap.TweenVars) {
    const animation = {
      ...time,
      update: (progress: any) => {
        gsap.to(this.element, {
          ...properties,
          duration: 0,
          progress,
          ease: 'none',
        });
      },
    };
    this.animations.push(animation);
  }

  resize() {}
}

export default Clip;
