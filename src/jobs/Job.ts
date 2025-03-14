export interface Progress<T> {
  total: number;
  current: number;
  data: T;
}

export type JobStatus = "idle" | "running" | "done" | "cancelled";

export abstract class Job<T> {
  result: Promise<T> | null = null;
  cancelling = false;
  currentProgress: Progress<T> | null = null;
  status = "idle" as JobStatus;
  error = "";

  constructor(
    public id: string,
    public name: string,
    public description: string,
  ) {}

  abstract _task(): AsyncGenerator<Progress<T>>;

  cancel() {
    this.status = "cancelled";
    this.cancelling = true;
  }

  async start(): Promise<T> {
    this.result = new Promise<T>(async (resolve, reject) => {
      console.log("Starting job", this.id);
      this.status = "running";
      const task = this._task();

      for await (const value of task) {
        this.currentProgress = value;

        try {
          await this.onStep(value);

          if (this.cancelling) {
            const failure = { message: "Job was cancelled", progress: value };
            reject(failure);
            this.onFail(failure);
            return;
          }
        } catch (error) {
          reject(error);
          this.onFail(error);
          return;
        }
      }

      if (!this.currentProgress) {
        reject("No progress was made");
        return;
      }

      this.status = "done";
      resolve(this.currentProgress.data);
      this.onDone(this.currentProgress);
    });
    return this.result;
  }

  async onStep(_progress: Progress<T>) {}
  async onDone(_progress: Progress<T>) {}
  async onFail(_error: any) {}
}
