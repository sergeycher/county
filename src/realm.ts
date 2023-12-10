import {Unit} from "./units/unit";
import {TraitsEvent} from "./traits/events";
import {Graph} from "./graph";
import {Tie} from "./ties/tie";
import {TC} from "./traits/types";
import {Ties} from "./ties/ties.trait";

export class Realm extends Graph {
  subscribe(handler: (v: TraitsEvent) => any) {
    return this.events.subscribe(handler);
  }

  map<T>(doer: (u: Unit, id: string) => T): T[] {
    return this.units.map(doer);
  }

  mapTies<T>(doer: (t: Tie, id: string) => T): T[] {
    return this.ties.map(doer);
  }

  select(...traits: TC[]): Unit[] {
    return this.units.select(...traits);
  }

  filter(filt: (u: Unit) => boolean): Unit[] {
    return this.units.filter(filt);
  }

  fromJSON(DATA: Record<string, any>) {
    for (const id in DATA) {
      // TODO: transaction
      const unit = this.unit(id);
      const data = DATA[id];
      const _data: Record<string, any> = {};

      for (let t in data) {
        if (t.startsWith('$->')) {
          const destId = t.replace('$->', '');
          const dest = this.unit(destId);
          this.tie(unit, dest).deserialize(data[t]);
        } else if (t.startsWith('$<-')) {
          const srcId = t.replace('$<-', '');
          const src = this.unit(srcId);
          this.tie(src, unit).deserialize(data[t]);
        } else {
          _data[t] = data[t];
        }
      }

      unit.deserialize(_data);
    }
  }

  toJSON(): Record<string, any> {
    const data: Record<string, any> = {};

    this.map((u, id) => {
      const ties: Record<string, any> = {};

      u.as(Ties).list('out').forEach(t => {
        ties['$->' + t.dest.id] = t.serialize();
      });

      data[id] = {...u.serialize(), ...ties};
    });

    return data;
  }
}
