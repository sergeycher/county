import {Emitter} from "../core/emitter";
import {traitName, TraitsRegistry} from "./traits-registry";
import {lifecycle, Serializable, serializable, TC, Trait} from "./trait";
import {CountyEvent} from "../core/events";
import {Change, Create, Delete, EventType} from "./events";

const CONTAINER_KEY = Symbol();

let CURRENT_TRAITS: Traits | undefined = undefined;

export class TraitsError extends Error {
  constructor(msg: string, readonly entity?: Traits, readonly trait?: Trait) {
    super(msg);
  }
}

export class Traits implements Serializable<Record<string, any>> {
  /**
   * Returns root object of specified trait
   */
  static of(trait: Trait): Traits {
    return (trait as any)[CONTAINER_KEY] as Traits;
  }

  static inject() {
    return CURRENT_TRAITS;
  }

  private readonly traits = new Map<TC, Trait>();

  readonly events = new Emitter<CountyEvent<EventType, Trait>>();

  /**
   * Calls doer() on specified trait and emits ChangeEvent.
   * Behavior same as `as()`
   */
  change<T extends Trait>(Trt: TC<T>, doer?: (trait: T) => any) {
    const trait = this.as(Trt);

    lifecycle(trait).emit('change:before');

    if (doer) {
      doer(trait);
    }

    lifecycle(trait).emit('change:after');
    this.events.next(Change(trait));

    return this;
  }

  /**
   * Returns trait and runs `handler` (if specified) on it. If trait not exists - creates it.
   *
   * handler.init===true if trait created just now
   */
  as<T extends Trait>(Trt: TC<T>, handler?: (trait: T, init: boolean) => any): T {
    let trait = this.traits.get(Trt) as T;
    handler = handler || (() => void 0);

    if (trait) {
      handler(trait, false);
    } else {
      trait = this.reset(Trt);
      handler(trait, true);
    }

    return trait;
  }

  /**
   * Call func if trait found, otherwise returns undefined
   */
  for<T extends Trait, A>(Trt: TC<T>, func: (t: T) => A): A | undefined {
    const trait = this.traits.get(Trt) as T;

    return trait ? func(trait) : undefined;
  }

  find<T extends Trait>(Trt: TC<T>): T | undefined {
    return this.for(Trt, (t) => t);
  }

  /**
   * Require trait. Throws error if trait does not exist
   *
   * Using `.for(Trt, ifExist)` is preferrable
   */
  req<T extends Trait>(Trt: TC<T>): T {
    const t = this.find(Trt);

    if (!t) {
      throw new Error(`Unable to find trait "${traitName(Trt)}"`);
    }

    return t;
  }

  has(...Trts: TC[]): boolean {
    if (Trts.length === 0) {
      return true;
    }

    return Trts.every(Trt => this.find(Trt));
  }

  /**
   * Creates new trait.
   * Immediately removes trait if AfterCreate throws an exception.
   */
  reset<T extends Trait>(Trt: TC<T>): T {
    this.drop(Trt);

    CURRENT_TRAITS = this;

    const trait = new Trt();
    (trait as any)[CONTAINER_KEY] = this;

    this.traits.set(Trt, trait);

    try {
      lifecycle(trait).emit('create');

      // да, сразу два события - одно на создание а второе на изменение
      // TODO: не уверен что события на создание трейта вообще нужны
      this.events.next(Create(trait));
      this.events.next(Change(trait));
    } catch (e) {
      this.drop(Trt);
      throw e;
    }

    CURRENT_TRAITS = undefined;

    return trait;
  }

  drop(...Traits: TC[]): Traits {
    Traits.forEach(Trt => {
      this.for(Trt, (trait) => {
        lifecycle(trait).emit('drop:before');

        this.traits.delete(Trt);

        this.events.next(Delete(trait));
        lifecycle(trait).end();
      })
    });

    return this;
  }

  /**
   * Clear all traits
   */
  clear(): Traits {
    this.traits.forEach((_, Trt) => this.drop(Trt));
    return this;
  }

  /**
   * Remove all traits and event handlers
   */
  destroy() {
    this.clear();
    this.events.dispose();
  }

  serialize(): Record<string, any> {
    const data: Record<string, any> = {};

    this.traits.forEach((trait) => {
      const name = traitName(trait.constructor as TC);
      const srl = serializable(trait);

      if (name && srl) {
        data[name] = srl.serialize();
      }
    })

    return data;
  }

  deserialize(data: Record<string, any>): void {
    for (const n in data) {
      const tc = TraitsRegistry.get().find(n);

      if (tc) {
        serializable(this.as(tc))?.deserialize(data[n]);
      } else {
        console.log(`[ONTHOLOGIC] Unable to find trait "${n}"`)
      }
    }
  }
}
