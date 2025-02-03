'use client';

class WorkerManager {
  private workers: Worker[] = [];
  private maxWorkers: number;
  private activeWorkers: number = 0;

  constructor() {
    if (!this.checkSupport()) {
      throw new Error('Web Workers or VideoEncoder not supported');
    }
    this.maxWorkers = this.calculateOptimalWorkers();
  }

  private checkSupport(): boolean {
    return window.Worker !== undefined && window.VideoEncoder !== undefined;
  }

  private calculateOptimalWorkers(): number {
    const cores = navigator.hardwareConcurrency || 2;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const systemMemory = (navigator as any).deviceMemory || 4;

    const byCPU = Math.max(1, cores - 1);
    const byRAM = Math.floor(systemMemory / 2);

    return Math.min(byCPU, byRAM, 4);
  }

  public initializeWorkers(config: any): Worker[] {
    for (let i = 0; i < this.maxWorkers; i++) {
      const worker = new Worker('/video-worker.js');
      worker.postMessage({ type: 'init', config });
      this.workers.push(worker);
      this.monitorPerformance(worker);
    }
    return this.workers;
  }

  private monitorPerformance(worker: Worker) {
    let lastCheck = Date.now();
    let messageCount = 0;

    worker.addEventListener('message', () => {
      messageCount++;
      const now = Date.now();

      if (now - lastCheck > 5000) {
        const messagesPerSecond = messageCount / 5;
        if (messagesPerSecond < 1) {
          this.adjustWorkload(worker);
        }
        messageCount = 0;
        lastCheck = now;
      }
    });
  }

  private adjustWorkload(worker: Worker) {
    if (this.workers.length > 1) {
      const index = this.workers.indexOf(worker);
      if (index > -1) {
        worker.terminate();
        this.workers.splice(index, 1);
        this.redistributeWork();
      }
    }
  }

  private redistributeWork() {
    // Implementation for redistributing work among remaining workers
    // This would need to be customized based on your specific needs
  }

  public terminateAll() {
    this.workers.forEach((worker) => worker.terminate());
    this.workers = [];
  }
}

export default WorkerManager;
