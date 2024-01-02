export function last<T>(arr: T[]): T {
  return arr[arr.length - 1];
}

export interface Lazy<T> {
  (onReset?: () => any): T;

  reset(): void;

  subscribe(f: () => any): () => void;

  unsubscribe(f?: () => any): void;
}

export function lazy<T>(func: () => T): Lazy<T> {
  let cache: [T] | [] = [];
  const handlers = new Set<() => any>();

  calculate.reset = () => {
    cache = [];
    handlers.forEach(h => h());
  };

  const subscribe = calculate.subscribe = (f: () => any) => {
    handlers.add(f);
    return () => handlers.delete(f);
  };

  calculate.unsubscribe = (f?: () => any) => {
    f ? handlers.delete(f) : handlers.clear();
  };

  return calculate;

  function calculate(onReset?: () => any) {
    if (onReset) {
      subscribe(onReset);
    }

    if (cache.length === 0) {
      cache = [func()];
    }

    return cache[0];
  }
}