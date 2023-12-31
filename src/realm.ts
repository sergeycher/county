import {RealmLike, Unit} from "./unit";
import {Create, Delete, EventType} from "./traits/events";
import {Emitter} from "./core/emitter";
import {TC, Trait} from "./traits/trait";
import {CountyEvent} from "./core/events";

function uid() {
  return Math.random().toString(36).split('.')[1];
}

export class Realm implements RealmLike {
  readonly events = new Emitter<CountyEvent<EventType, Trait | Unit>>();

  private units = new Map<string, Unit>();

  unit(): Unit;
  unit(id: string): Unit;
  unit(id: string, createIfNotExist: false): Unit | undefined;
  unit(id: string, createIfNotExist: true): Unit;
  unit(id: string = uid(), createIfNotExist: boolean = true): Unit | undefined {
    let unit = this.units.get(id)!;

    if (!unit && createIfNotExist) {
      unit = new Unit(id, this);
      unit.events.retranslateTo(this.events as Emitter<CountyEvent<EventType, Trait>>);
      this.units.set(id, unit);
      this.events.next(Create(unit));
    }

    return unit;
  }

  subscribe(handler: (v: CountyEvent<EventType, Trait | Unit>) => any): () => void {
    return this.events.subscribe(handler);
  }

  map<T>(doer: (u: Unit, id: string) => T): T[] {
    const result: T[] = [];

    this.units.forEach((u, i) => result.push(doer(u, i)));

    return result;
  }

  select(...traits: TC[]): Unit[] {
    return this.filter(u => u.has(...traits));
  }

  filter(filt: (u: Unit) => boolean): Unit[] {
    const result: Unit[] = [];

    this.units.forEach((u) => {
      if (filt(u))
        result.push(u);
    });

    return result;
  }

  /**
   * Returns REALLY despawned units.
   */
  despawn(...units: Unit[]): Unit[] {
    return units.filter(u => {
      const deleted = this.delete(u);

      if (deleted) {
        deleted._destroy();
        this.events.next(Delete(deleted));
      }

      return deleted;
    });
  }

  clear() {
    this.despawn(...this.map(u => u));
    this.units.clear();
  }

  private delete(unit: Unit): Unit | undefined {
    if (this.units.has(unit.id)) {
      this.units.delete(unit.id);
      return unit;
    }
  }

  fromJSON(DATA: Record<string, any>) {
    for (const id in DATA) {
      this.unit(id).deserialize(DATA[id]);
    }
  }

  toJSON(): Record<string, any> {
    const data: Record<string, any> = {};

    this.map((u, id) => {
      data[id] = u.serialize();
    });

    return data;
  }
}
