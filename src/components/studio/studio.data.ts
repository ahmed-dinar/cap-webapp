import {
  AspectRatioType,
  BackgroundConfig,
  BitRates,
  ResolutionItem,
  ResolutionKey,
} from '@/components/studio/studio.types';

export const defaultBackgroundConfig: BackgroundConfig = {
  backgroundType: 'Color',
  background: '#FC0000',
  backgroundSize: 'Small',
  backgroundBlur: 'Subtle',
  applyBorder: true,
  applyShadow: true,
};

export const BitRateData: { [K in BitRates]: string } = {
  3: 'Web',
  5: 'Mobile',
  10: 'Social Pro',
  25: 'UltraHD',
  32: 'Cinema Grade',
} as const;

export const Resolutions: { [K in ResolutionKey]: ResolutionItem } = {
  fhd_1080: {
    name: '1080P',
    width: 1920,
    height: 1080,
    desc: 'For YouTube and widescreen content (Full HD).',
    codecs: ['avc1.640034', 'avc1.640C32'],
  },
  hd_720: {
    name: '720P',
    width: 1280,
    height: 720,
    desc: 'For HD videos and smaller file sizes.',
    codecs: ['avc1.4d0034', 'avc1.42E01E'],
  },
  uhd_4k: {
    name: '4K',
    width: 3840,
    height: 2160,
    desc: 'For 4K UHD videos and high-quality content.',
    codecs: ['avc1.640034', 'avc1.640C32'],
  },
} as const;

export const aspectRatioList: AspectRatioType[] = [
  {
    label: '16:9',
    name: 'Widescreen (HD)',
    value: 16 / 9,
    desc: 'For Web and Social Media: YouTube, widescreen displays, and modern TVs.',
    sizes: [
      {
        width: 1920,
        height: 1080,
        desc: 'For YouTube and widescreen content (Full HD).',
        codecs: ['avc1.640034', 'avc1.640C32'],
      },
      {
        width: 1280,
        height: 720,
        desc: 'For HD videos and smaller file sizes.',
        codecs: ['avc1.4d0034', 'avc1.42E01E'],
      },
      {
        width: 3840,
        height: 2160,
        desc: 'For 4K UHD videos and high-quality content.',
        codecs: ['avc1.640034', 'avc1.640C32'],
      },
    ],
  },
  {
    label: '16:10',
    name: 'Widescreen (Laptop)',
    value: 16 / 10,
    desc: 'For laptop screens and some monitors.',
    sizes: [
      {
        width: 1920,
        height: 1200,
        desc: 'For high-resolution laptop screens (WUXGA).',
        codecs: ['avc1.640034', 'avc1.640C32'],
      },
      {
        width: 1280,
        height: 800,
        desc: 'For standard laptop screens (WXGA).',
        codecs: ['avc1.4d0034', 'avc1.42E01E'],
      },
    ],
  },
  {
    label: '3:2',
    name: 'Classic Camera Frame',
    value: 3 / 2,
    desc: 'For digital cameras, tablets, and some photography.',
    sizes: [
      {
        width: 1080,
        height: 720,
        desc: 'For standard photography and digital cameras.',
        codecs: ['avc1.4d0034', 'avc1.42E01E'],
      },
      {
        width: 2160,
        height: 1440,
        desc: 'For high-resolution photography.',
        codecs: ['avc1.640034', 'avc1.640C32'],
      },
      {
        width: 3240,
        height: 2160,
        desc: 'For 4K photography and cinematic content.',
        codecs: ['avc1.640034', 'avc1.640C32'],
      },
    ],
  },
  {
    label: '4:3',
    name: 'Standard (SD)',
    value: 4 / 3,
    desc: 'For older TVs, presentations, and some industrial displays.',
    sizes: [
      {
        width: 1024,
        height: 768,
        desc: 'For presentations and older monitors (XGA).',
        codecs: ['avc1.4d0034', 'avc1.42E01E'],
      },
      {
        width: 800,
        height: 600,
        desc: 'For older displays and presentations (SVGA).',
        codecs: ['avc1.4d0034', 'avc1.42E01E'],
      },
      {
        width: 640,
        height: 480,
        desc: 'For legacy displays and low-resolution content (VGA).',
        codecs: ['avc1.4d0034', 'avc1.42E01E'],
      },
      {
        width: 2880,
        height: 2160,
        desc: 'For 4K content in 4:3 aspect ratio.',
        codecs: ['avc1.640034', 'avc1.640C32'],
      },
    ],
  },
  {
    label: '1:1',
    name: 'Square',
    value: 1 / 1,
    desc: 'For Instagram posts, profile pictures, and square content.',
    sizes: [
      {
        width: 1080,
        height: 1080,
        desc: 'For Instagram posts and square videos.',
        codecs: ['avc1.4d0034', 'avc1.42E01E'],
      },
      {
        width: 600,
        height: 600,
        desc: 'For smaller square content.',
        codecs: ['avc1.4d0034', 'avc1.42E01E'],
      },
      {
        width: 2160,
        height: 2160,
        desc: 'For 4K square content.',
        codecs: ['avc1.640034', 'avc1.640C32'],
      },
    ],
  },
  {
    label: '3:4',
    name: 'Portrait (Vertical 4:3)',
    value: 3 / 4,
    desc: 'For portrait-oriented content and some mobile devices.',
    sizes: [
      {
        width: 768,
        height: 1024,
        desc: 'For portrait-oriented displays and tablets.',
        codecs: ['avc1.4d0034', 'avc1.42E01E'],
      },
      {
        width: 600,
        height: 800,
        desc: 'For smaller portrait-oriented content.',
        codecs: ['avc1.4d0034', 'avc1.42E01E'],
      },
    ],
  },
  {
    label: '2:3',
    name: 'Portrait (Classic Film)',
    value: 2 / 3,
    desc: 'For classic film photography and some mobile devices.',
    sizes: [
      {
        width: 720,
        height: 1080,
        desc: 'For classic film photography and portrait videos.',
        codecs: ['avc1.4d0034', 'avc1.42E01E'],
      },
      {
        width: 480,
        height: 720,
        desc: 'For smaller portrait-oriented content.',
        codecs: ['avc1.4d0034', 'avc1.42E01E'],
      },
    ],
  },
  {
    label: '10:16',
    name: 'Vertical (10:16)',
    value: 10 / 16,
    desc: 'For vertical videos and mobile content.',
    sizes: [
      {
        width: 1080,
        height: 1920,
        desc: 'For vertical videos and mobile content (Full HD).',
        codecs: ['avc1.640034', 'avc1.640C32'],
      },
      {
        width: 720,
        height: 1280,
        desc: 'For smaller vertical videos (HD).',
        codecs: ['avc1.4d0034', 'avc1.42E01E'],
      },
    ],
  },
  {
    label: '9:16',
    name: 'Vertical (Portrait)',
    value: 9 / 16,
    desc: 'For vertical videos and mobile content.',
    sizes: [
      {
        width: 1080,
        height: 1920,
        desc: 'For vertical videos and mobile content (Full HD).',
        codecs: ['avc1.640034', 'avc1.640C32'],
      },
      {
        width: 720,
        height: 1280,
        desc: 'For smaller vertical videos (HD).',
        codecs: ['avc1.4d0034', 'avc1.42E01E'],
      },
    ],
  },
] as const;
