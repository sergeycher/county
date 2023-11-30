import {Emitter} from "../core/emitter";
import {ChangeEvent, CreateEvent, DeleteEvent, TraitsEvent} from "./events";
import {traitName} from "./traits-registry";
import {TC} from "./types";
import {Trait} from "./trait";

const CONTAINER_KEY = Symbol();
const ATTACHMENT_KEY = Symbol();

export class Traits {
  static of(from: Trait): Traits {
    return (from as any)[CONTAINER_KEY] as Traits;
  }

  static from(from: Object): Traits {
    return (from as any)[ATTACHMENT_KEY] as Traits;
  }

  private readonly traits = new Map<TC<Trait>, Trait>();

  readonly events = new Emitter<TraitsEvent>()

  as<T extends Trait>(Trt: TC<T>): T {
    let trait = this.traits.get(Trt) as T;

    if (!trait) {
      trait = this.reset(Trt);
    }

    return trait;
  }

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

    const trait = new Trt();
    (trait as any)[CONTAINER_KEY] = this;
    this.traits.set(Trt, trait);

    this.events.next(new CreateEvent(trait));
    this.events.next(new ChangeEvent(trait));// да, сразу два события

    return trait;
  }

  drop<T extends Trait>(Trt: TC<T>): void {
    const trait = this.find(Trt);

    if (trait) {
      trait.onBeforeDrop();
      this.traits.delete(Trt);
      this.events.next(new DeleteEvent(trait));
    }
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
