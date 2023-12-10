import {Entity} from "./types";
import {Traits} from "../traits/traits";
import {TC} from "../traits/types";

export class Entities<T extends Entity & Traits> {
  protected items = new Map<string, T>();

  select(...traits: TC[]): T[] {
    const units: T[] = [];

    // TODO: index by traits
    this.items.forEach((u) => {
      if (u.has(...traits)) {
        units.push(u);
      }
    });

    return units;
  }

  filter(filt: (u: T) => boolean): T[] {
    const units: T[] = [];

    this.items.forEach((u) => {
      if (filt(u)) {
        units.push(u);
      }
    });

    return units;
  }

  map<K>(doer: (u: T, id: string) => K): K[] {
    const res: K[] = [];

    this.items.forEach((u, id) => res.push(doer(u, id)));

    return res;
  }

  clear() {
    this.items.clear();
  }

  delete(item: T) {
    if (this.items.has(item.id)) {
      this.items.delete(item.id);
      return item;
    }
  }
}
