// video-decoder.worker.ts
class VideoDecoderWorker {
  private decoder: VideoDecoder | null = null;

  constructor() {
    self.onmessage = this.handleMessage.bind(this);
  }

  private handleMessage(e: MessageEvent) {
    const { type, data } = e.data;
    switch (type) {
      case 'decode':
        this.decodeFrame(data.currentTime, data.videoElement);
        break;
    }
  }

  private decodeFrame(currentTime: number, videoElement: HTMLVideoElement) {
    // Create a canvas to capture the video frame
    const canvas = new OffscreenCanvas(videoElement.videoWidth, videoElement.videoHeight);
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.drawImage(videoElement, 0, 0);
    const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);

    // Send the frame data back to main thread
    self.postMessage(
      {
        type: 'frame',
        data: imageData.data.buffer,
        width: canvas.width,
        height: canvas.height,
        timestamp: currentTime,
      },
      [imageData.data.buffer],
    );
  }
}

export default VideoDecoderWorker;
