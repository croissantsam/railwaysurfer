export class ObjectPool<T> {
  private available: T[] = [];
  private inUse: Set<T> = new Set();
  private factory: () => T;
  private resetFn?: (item: T) => void;

  constructor(factory: () => T, resetFn?: (item: T) => void, initialSize: number = 0) {
    this.factory = factory;
    this.resetFn = resetFn;

    for (let i = 0; i < initialSize; i++) {
      this.available.push(this.factory());
    }
  }

  acquire(): T {
    let item: T;
    if (this.available.length > 0) {
      item = this.available.pop()!;
    } else {
      item = this.factory();
    }
    this.inUse.add(item);
    return item;
  }

  release(item: T): void {
    if (this.inUse.has(item)) {
      this.inUse.delete(item);
      if (this.resetFn) {
        this.resetFn(item);
      }
      this.available.push(item);
    }
  }

  releaseAll(): void {
    for (const item of Array.from(this.inUse)) {
      this.release(item);
    }
  }

  getActiveCount(): number {
    return this.inUse.size;
  }

  getTotalCount(): number {
    return this.available.length + this.inUse.size;
  }
}
