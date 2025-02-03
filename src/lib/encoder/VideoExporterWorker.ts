'use client';

import WorkerManager from '@/lib/encoder/WorkerManager';

class VideoExporterWorker {
  private workerManager?: WorkerManager;

  constructor() {
    // try {
    //   this.workerManager = new WorkerManager();
    // } catch (error) {
    //   console.warn('Worker processing not available:', error);
    // }
  }

  // private async processFramesWithWorkers(totalFrames: number, videoConfig: VideoEncoderConfig, encoder: VideoEncoder) {
  //   if (!this.workerManager) throw new Error('Worker manager not initialized');
  //
  //   const workers = this.workerManager.initializeWorkers({
  //     width: videoConfig.width,
  //     height: videoConfig.height,
  //     framerate: videoConfig.framerate,
  //   });
  //
  //   const frameChunks = this.distributeFrames(totalFrames, workers.length);
  //   const processingPromises = workers.map((worker, index) =>
  //     this.processFrameChunk(worker, frameChunks[index], videoConfig, encoder),
  //   );
  //
  //   await Promise.all(processingPromises);
  // }

  private distributeFrames(totalFrames: number, workerCount: number): Array<[number, number]> {
    const framesPerWorker = Math.ceil(totalFrames / workerCount);
    const chunks: Array<[number, number]> = [];

    for (let i = 0; i < workerCount; i++) {
      const start = i * framesPerWorker;
      const end = Math.min(start + framesPerWorker, totalFrames);
      chunks.push([start, end]);
    }

    return chunks;
  }

  // private async processFrameChunk(
  //   worker: Worker,
  //   [startFrame, endFrame]: [number, number],
  //   videoConfig: VideoEncoderConfig,
  //   encoder: VideoEncoder,
  // ): Promise<void> {
  //   return new Promise((resolve, reject) => {
  //     worker.onmessage = async (event: MessageEvent<WorkerMessage>) => {
  //       const { type, frameData, error, progress } = event.data;
  //
  //       if (type === 'error') {
  //         reject(new Error(error));
  //       } else if (type === 'frame' && frameData) {
  //         const frame = new VideoFrame(frameData, {
  //           timestamp: (startFrame + progress!) * (1000 / videoConfig.framerate!),
  //           duration: 1000 / videoConfig.framerate!,
  //         });
  //         await encoder.encode(frame);
  //         frame.close();
  //
  //         this.onProgress({
  //           progress: ((startFrame + progress!) / (endFrame - startFrame)) * 100,
  //           currentFrame: startFrame + progress!,
  //           totalFrames: endFrame - startFrame,
  //         });
  //       } else if (type === 'complete') {
  //         resolve();
  //       }
  //     };
  //
  //     worker.postMessage({
  //       type: 'processFrames',
  //       startFrame,
  //       endFrame,
  //       videoConfig,
  //     });
  //   });
  // }
}

export default VideoExporterWorker;
