import {TC} from "./types";

export const NAME_KEY = Symbol();

export function traitName(trait: TC): string {
  return (trait as any)[NAME_KEY];
}

export class TraitsRegistry {
  private registry: Record<string, TC> = {};

  private static instance = new TraitsRegistry();

  static get() {
    return TraitsRegistry.instance;
  }

  private constructor() {
  }

  find(name: string): TC | undefined {
    return this.registry[name];
  }

  register(attr: TC) {
    this.registry[traitName(attr)] = attr;
  }
}
