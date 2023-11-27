import {Unit} from "./units/unit";
import {Tie} from "./ties/tie";
import {Emitter} from "./core/emitter";
import {TraitsEvent} from "./traits/events";
import {TiesMap} from "./ties/ties";
import {Units} from "./units/units";
import {Trait} from "./traits/trait";
import {Ties} from "./ties/ties.trait";

export class Graph {
  readonly events = new Emitter<TraitsEvent>();

  protected units = new Units();
  protected ties = new TiesMap();

  constructor() {
    this.units.events.retranslateTo(this.events);
    this.ties.events.retranslateTo(this.events);
  }

  clear() {
    this.despawn(...this.units.map(u => u));

    this.ties.clear();
    this.units.clear();
  }

  unit(id: string): Unit;
  unit(id: string, createIfNotExist: false): Unit | undefined;
  unit(id: string, createIfNotExist = true): Unit | undefined {
    const unit = this.units.get(id, createIfNotExist);

    unit?.as(Ties)._init(this.ties);

    return unit;
  }

  tie(src: Unit | Trait, dest: Unit | Trait): Tie;
  tie(src: Unit | Trait, dest: Unit | Trait, createIfNotExist: false): Tie | undefined;
  tie(src: Unit | Trait, dest: Unit | Trait, createIfNotExist = true): Tie | undefined {
    src = Unit.from(src);
    dest = Unit.from(dest);

    return createIfNotExist ? this.ties.get(src, dest) : this.ties.find(src, dest);
  }

  despawn(...ents: (Unit | Tie)[]): (Unit | Tie)[] {
    return ents.flatMap(e => {
      if (e instanceof Tie) {
        return [this.ties.despawn(e)];
      } else {
        const ties = e.req(Ties)
          .list('both')
          .map(t => this.ties.despawn(t));

        return [
          this.units.despawn(e),
          ...ties
        ];
      }
    }).filter(t => t) as (Unit | Tie)[];
  }
}
