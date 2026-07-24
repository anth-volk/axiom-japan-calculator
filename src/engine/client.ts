import AxiomWorker from "./axiom.worker?worker";
import type {
  CalculationPersonInput,
  CalculationResult,
  GeneratedManifest,
  WorkerRequest,
  WorkerResponse,
} from "./types";

type WorkerRequestWithoutId =
  | { type: "boot"; baseUrl: string }
  | {
      type: "calculate";
      calendarYear: number;
      people: CalculationPersonInput[];
    };

interface PendingRequest<T> {
  resolve: (value: T) => void;
  reject: (reason: Error) => void;
}

export class AxiomEngineClient {
  private readonly worker = new AxiomWorker();
  private readonly pending = new Map<number, PendingRequest<unknown>>();
  private nextId = 1;

  constructor() {
    this.worker.addEventListener("message", (event: MessageEvent<WorkerResponse>) => {
      const message = event.data;
      const pending = this.pending.get(message.id);
      if (!pending) return;
      this.pending.delete(message.id);

      if (message.type === "error") {
        pending.reject(new Error(message.message));
      } else if (message.type === "booted") {
        pending.resolve(message.manifest);
      } else {
        pending.resolve(message.result);
      }
    });

    this.worker.addEventListener("error", (event) => {
      const error = new Error(event.message || "The Axiom worker stopped unexpectedly");
      for (const pending of this.pending.values()) pending.reject(error);
      this.pending.clear();
    });
  }

  private request<T>(request: WorkerRequestWithoutId): Promise<T> {
    const id = this.nextId++;
    return new Promise<T>((resolve, reject) => {
      this.pending.set(id, {
        resolve: resolve as (value: unknown) => void,
        reject,
      });
      this.worker.postMessage({ ...request, id });
    });
  }

  boot(baseUrl: string): Promise<GeneratedManifest> {
    return this.request({ type: "boot", baseUrl });
  }

  calculate(
    calendarYear: number,
    people: CalculationPersonInput[],
  ): Promise<CalculationResult> {
    return this.request({ type: "calculate", calendarYear, people });
  }

  destroy() {
    this.worker.terminate();
    const error = new Error("The Axiom worker was closed");
    for (const pending of this.pending.values()) pending.reject(error);
    this.pending.clear();
  }
}
