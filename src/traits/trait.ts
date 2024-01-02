import {TraitsRegistry} from "./traits-registry";
import {TRAIT} from "./decorators";
import {Emitter} from "../core/emitter";

export type TC<T extends Trait = Trait> = new () => T;

export interface Serializable<D> {
  serialize(): D;

  deserialize(data: D): void;
}

export function serializable<D, O extends Object = any>(obj: O): Serializable<D> | undefined {
  if (obj && 'serialize' in obj && 'deserialize' in obj) {
    return obj as Serializable<D>;
  }
}

export type LifecycleEvent = 'init' | 'create' | 'drop:before' | 'change:before' | 'change:after';

export class Lifecycle {
  private static KEY = Symbol();

  static of(trait: Object): Lifecycle {
    let instance = (trait as any)[Lifecycle.KEY];

    if (!instance) {
      (trait as any)[Lifecycle.KEY] = instance = new Lifecycle(trait);
    }

    return instance;
  }

  readonly __events = new Emitter<LifecycleEvent>();

  protected constructor(readonly target: Object) {
  }

  on(type: LifecycleEvent, handler: () => any) {
    this.__events.subscribe(e => {
      if (e === type) {
        handler();
      }
    });
  }

  __dispose() {
    this.__events.dispose();
  }
}

// TODO: избавиться от необходимости наследования. Трейт должен быть просто любым классом
export class Trait {
  /**
   * Find trait in registry by name
   */
  static find(name: string): TC | undefined {
    return TraitsRegistry.get().find(name);
  }

  /**
   * Decorator
   */
  static register(name: string) {
    return TRAIT(name);
  }
}
