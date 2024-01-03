export function last<T>(arr: T[]): T {
  return arr[arr.length - 1];
}

export interface Lazy<T> {
  (subscriber?: () => any): T;

  obsolete(): void;

  on(f: () => any): () => void;

  off(f?: () => any): void;
}

export function lazy<T>(func: () => T): Lazy<T> {
  let cache: [T] | [] = [];
  const handlers = new Set<() => any>();

  calculate.obsolete = () => {
    cache = [];
    handlers.forEach(h => h());
  };

  const subscribe = calculate.on = (f: () => any) => {
    handlers.add(f);
    return () => handlers.delete(f);
  };

  calculate.off = (f?: () => any) => {
    f ? handlers.delete(f) : handlers.clear();
  };

  return calculate;

  function calculate(subscriber?: () => any) {
    if (subscriber) {
      subscribe(subscriber);
    }

    if (cache.length === 0) {
      cache = [func()];
    }

    return cache[0];
  }
}