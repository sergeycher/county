import {CURRENT, Traits, TraitsError} from "./traits/traits";
import {Entity} from "./core/types";
import {Trait} from "./traits";
import {EventType} from "./traits/events";
import {CountyEvent} from "./core/events";

export interface RealmLike {
  despawn(unit: Unit): void;

  unit(): Unit;

  unit(id: string): Unit;

  unit(id: string, createIfNotExist: false): Unit | undefined;

  unit(id: string, createIfNotExist: true): Unit;

  unit(id?: string, createIfNotExist?: boolean): Unit | undefined;
}

export class Unit extends Traits implements Entity {
  static when<K extends EventType>(t: K, doer: (t: Unit) => any) {
    return (e: CountyEvent<EventType, unknown>) => {
      if (e.type === t && e.target instanceof Unit) {
        doer(e.target);
      }
    }
  }

  static whenTrait<K extends EventType>(t: K, doer: (t: Trait) => any) {
    return (e: CountyEvent<EventType, unknown>) => {
      if (e.type === t && e.target instanceof Trait) {
        doer(e.target);
      }
    }
  }

  /**
   * Inject current Unit in trait instance. Should be used in trait constructor ONLY
   */
  static inject(): Unit {
    if (CURRENT instanceof Unit) {
      return CURRENT;
    }

    throw new TraitsError(`Current entity is not a unit`, CURRENT);
  }

  static from(u: Unit | Trait): Unit {
    let unit: any = u;

    if (u instanceof Trait) {
      unit = Traits.of(u) as Unit;
    }

    if (!unit || !(unit instanceof Unit)) {
      throw new Error('Trait is not belongs to unit');
    }

    return unit;
  }

  constructor(readonly id: string, readonly realm: RealmLike) {
    super();
  }

  despawn(): void {
    this.realm.despawn(this);
  }

  _destroy() {
    this.clear();
    this.events.dispose();
  }
}
