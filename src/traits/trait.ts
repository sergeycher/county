import {Lifecycle} from "../core/lifecycle";
import {NAME_KEY, TraitsRegistry} from "./traits-registry";

/**
 * Define trait name. Without name trait cannot be serialized and deserialized.
 */
export function TRAIT(name: string) {
  return (target: TC) => {
    (target as any)[NAME_KEY] = name;
    TraitsRegistry.get().register(target);
  };
}

export type TC<T extends Trait = Trait> = new () => T;

export function tc<T extends Trait>(t: T): TC<T> {
  return t.constructor as TC<T>;
}

export interface Serializable<D> {
  serialize(): D;

  deserialize(data: D): void;
}

export function serializable<D, O extends Object = any>(obj: O): Serializable<D> | undefined {
  if (obj && 'serialize' in obj && 'deserialize' in obj) {
    return obj as Serializable<D>;
  }
}

export type LifecycleEvent = 'create' | 'drop:before' | 'change:before' | 'change:after';

export function lifecycle(trait: Trait) {
  return Lifecycle.of<LifecycleEvent>(trait);
}

// TODO: избавиться от необходимости наследования. Трейт должен быть просто любым классом

export type Trait = Object;
