export class Emitter<T> {
  protected handlers = new Set<(v: T) => any>();
  protected disposeHandlers = new Set<() => any>();

  next(value: T) {
    this.handlers.forEach(h => h(value));
  }

  subscribe(handler: (v: T) => any) {
    this.handlers.add(handler);

    return () => {
      this.handlers.delete(handler);
    };
  }

  dispose() {
    this.handlers.clear();
    this.disposeHandlers.forEach(h => h());
    this.disposeHandlers.clear();
  }

  onDispose(handler: () => any) {
    this.disposeHandlers.add(handler);

    return () => {
      this.disposeHandlers.delete(handler);
    };
  }

  retranslateTo(e: Emitter<T>): this {
    const unsub = this.subscribe((value) => e.next(value));

    e.onDispose(unsub);

    return this;
  }
}
