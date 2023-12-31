import {ConstructorOf} from "./types";

export type CountyEvent<K extends string, T> = {
  type: K;
  target: T;
}

export function eventFilter<T, K extends string>(type: K, Target: ConstructorOf<T>): (e: CountyEvent<string, unknown>) => CountyEvent<K, T> | undefined {
  return (e) => {
    if (e.type === type && e.target instanceof Target) {
      return e as CountyEvent<K, T>;
    }
  }
}

export function when<T, K extends string>(type: K, Target: ConstructorOf<T>): <R>(e: CountyEvent<string, unknown>, doer: (e: CountyEvent<K, T>) => R) => void {
  return (e, doer) => {
    if (e.type === type && e.target instanceof Target) {
      doer(e as CountyEvent<K, T>);
    }
  }
}

export function eventFactory<K extends string>(type: K): <T>(target: T) => CountyEvent<K, T> {
  return (target) => ({type, target})
}