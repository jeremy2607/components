/** jsdom n'implémente pas ResizeObserver. Ce double permet de déclencher une mesure à la demande. */
export class ResizeObserverMock implements ResizeObserver {
  static instances: ResizeObserverMock[] = [];

  static reset(): void {
    ResizeObserverMock.instances = [];
  }

  /** Déclenche une mesure sur toutes les instances encore branchées. */
  static resizeAll(width: number, height: number): void {
    for (const instance of ResizeObserverMock.instances) instance.resize(width, height);
  }

  readonly targets = new Set<Element>();
  disconnected = false;

  constructor(private readonly callback: ResizeObserverCallback) {
    ResizeObserverMock.instances.push(this);
  }

  observe(target: Element): void {
    this.targets.add(target);
  }

  unobserve(target: Element): void {
    this.targets.delete(target);
  }

  disconnect(): void {
    this.disconnected = true;
    this.targets.clear();
  }

  resize(width: number, height: number): void {
    for (const target of this.targets) {
      const entry = { target, contentRect: { width, height } } as unknown as ResizeObserverEntry;
      this.callback([entry], this);
    }
  }
}

export function installResizeObserverMock(): void {
  globalThis.ResizeObserver = ResizeObserverMock;
}
