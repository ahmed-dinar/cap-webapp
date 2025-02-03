export const CODEC_LIST = ['avc1.640C32', 'avc1.4d0034', 'avc1.640034', 'avc1.42E01E', 'avc1.42001E'];

export async function videoSupportedCodec(config: Partial<VideoEncoderConfig>): Promise<VideoEncoderConfig | null> {
  for (const codec of CODEC_LIST) {
    const conf: VideoEncoderConfig = {
      codec,
      hardwareAcceleration: 'prefer-hardware',
      width: config.width!,
      height: config.height!,
      bitrate: config.bitrate ?? 1_000_000,
      framerate: config.framerate!,
    };

    let supported = await VideoEncoder.isConfigSupported(conf);
    if (supported) {
      return conf;
    }

    conf.hardwareAcceleration = 'prefer-software';
    supported = await VideoEncoder.isConfigSupported(conf);

    if (supported) {
      return conf;
    }
  }

  return null;
}
