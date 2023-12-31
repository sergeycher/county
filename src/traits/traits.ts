import {Emitter} from "../core/emitter";
import {traitName} from "./traits-registry";
import {TC, Trait} from "./trait";
import {CountyEvent} from "../core/events";
import {Change, Create, Delete, EventType} from "./events";

const CONTAINER_KEY = Symbol();
const ATTACHMENT_KEY = Symbol();

export let CURRENT: Traits | undefined = undefined;

export class TraitsError extends Error {
  constructor(msg: string, readonly entity?: Traits, readonly trait?: Trait) {
    super(msg);
  }
}

export class Traits {
  /**
   * Returns root object of specified trait
   */
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

  // readonly events = new Emitter<TraitsEvent>();
  readonly events = new Emitter<CountyEvent<EventType, Trait>>();

  /**
   * Calls doer on specified trait and emits ChangeEvent
   */
  change<T extends Trait>(Trt: TC<T>, doer?: (trait: T) => any) {
    const trait = this.as(Trt)

    if (doer) {
      doer(trait);
    }

    this.events.next(Change(trait));

    return this;
  }

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
   * Require trait. Throws error if trait does not exist
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

    // да, сразу два события - одно на создание а второе на изменение
    // TODO: не уверен что события на создание трейта нужны
    this.events.next(Create(trait));
    this.events.next(Change(trait));

    try {
      trait.onAfterCreate();
    } catch (e) {
      this.drop(Trt);
      throw e;
    }

    CURRENT = undefined;

    return trait;
  }

  drop(...Traits: TC[]): Traits {
    Traits.forEach(Trt => {
      const trait = this.find(Trt);

      if (trait) {
        trait.onBeforeDrop();
        this.traits.delete(Trt);
        this.events.next(Delete(trait));
      }
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

  serialize() {
    const data: Record<string, any> = {};

    this.traits.forEach((trait) => {
      if (trait.$name && trait.serialize) {
        data[trait.$name] = trait.serialize();
      }
    })

    return data;
  }

  deserialize(data: Record<string, any>) {
    for (const n in data) {
      const tc = Trait.find(n);

      if (tc) {
        const trait = this.as(tc);

        if (trait.deserialize) {
          trait.deserialize(data[n]);
        }
      } else {
        console.log(`[ONTHOLOGIC] Unable to find trait "${n}"`)
      }
    }
  }
}
