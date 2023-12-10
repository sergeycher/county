import {Emitter} from "../core/emitter";
import {ChangeEvent, CreateEvent, DeleteEvent, TraitsEvent} from "./events";
import {traitName} from "./traits-registry";
import {TC} from "./types";
import {Trait} from "./trait";

const CONTAINER_KEY = Symbol();
const ATTACHMENT_KEY = Symbol();

export let CURRENT: Traits | undefined = undefined;

export class TraitsError extends Error {
  constructor(msg: string, readonly entity?: Traits, readonly trait?: Trait) {
    super(msg);
  }
}

export class Traits {
  static of(trait: Trait): Traits {
    return (trait as any)[CONTAINER_KEY] as Traits;
  }

  static from(carrier: Object): Traits {
    let traits = (carrier as any)[ATTACHMENT_KEY] as Traits;

    if (!traits) {
      traits = new Traits();
      (carrier as any)[ATTACHMENT_KEY] = traits;
    }

    return traits;
  }

  private readonly traits = new Map<TC, Trait>();

  readonly events = new Emitter<TraitsEvent>();

  /**
   * Отслеживает вообще все события связанные с трейтом - даже удаление
   */
  onChange<T extends Trait>(Trt: TC<T>, handler: (trait: T) => any) {
    return this.events.subscribe((e) => {
      if (e.target instanceof Trt) {
        handler(e.target);
      }
    });
  }

  /**
   * Returns trait and runs `handler` on it. If trait not exists - creates it.
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
   * Throws error if trait does not exist
   */
  req<T extends Trait>(Trt: TC<T>): T {
    const t = this.find(Trt);

    if (!t) {
      throw new Error(`Unable to find trait "${traitName(Trt)}"`);
    }

    return t;
  }

  find<T extends Trait>(Trt: TC<T>): T | undefined {
    return this.traits.get(Trt) as T;
  }

  has(...Trts: TC[]): boolean {
    if (Trts.length === 0) {
      return true;
    }

    return Trts.every(Trt => this.find(Trt));
  }

  reset<T extends Trait>(Trt: TC<T>): T {
    this.drop(Trt);

    CURRENT = this;

    const trait = new Trt();
    (trait as any)[CONTAINER_KEY] = this;
    this.traits.set(Trt, trait);

    this.events.next(new CreateEvent(trait));
    this.events.next(new ChangeEvent(trait));// да, сразу два события

    trait.onAfterCreate();

    CURRENT = undefined;

    return trait;
  }

  drop(...Traits: TC[]): this {
    Traits.forEach(Trt => {
      const trait = this.find(Trt);

      if (trait) {
        trait.onBeforeDrop();
        this.traits.delete(Trt);
        this.events.next(new DeleteEvent(trait));
      }
    });

    return this;
  }

  /**
   * Clear all traits
   */
  empty() {
    this.traits.forEach((_, Trt) => this.drop(Trt));
    return this;
  }

  serialize() {
    const data: Record<string, any> = {};

    this.traits.forEach(t => {
      if (t.$name) {
        data[t.$name] = t.serialize();
      }
    })

    return data;
  }

  deserialize(data: Record<string, any>) {
    for (const n in data) {
      const tc = Trait.find(n);

      if (tc) {
        this.as(tc).deserialize(data[n]);
      } else {
        console.log(`[ONTHOLOGIC] Unable to find trait "${n}"`)
      }
    }
  }
}
