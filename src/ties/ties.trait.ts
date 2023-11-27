import {Trait} from "../traits/trait";
import {Unit} from "../units/unit";
import {TC} from "../traits/types";
import {Tie} from "./tie";
import {TiesMap} from "./ties";

/**
 * Трейт для доступа к связям
 */
export class Ties extends Trait {
  private ties!: TiesMap;

  _init(ties: TiesMap) {
    this.ties = ties;
  }

  connect(dest: Unit | Trait) {
    return this.ties.get(this, dest);
  }

  connectedTo(target: Unit) {
    return !!this._list('both').find(t => t.dest === target || t.source === target);
  }

  isTiedWith(unit: Unit) {
    return !!(this.ties.find(this.$entity as Unit, unit) || this.ties.find(unit, this.$entity as Unit));
  }

  to<T extends Trait>(c: TC<T>): T[] {
    return this.list('out', [c]).map(t => t.dest.req(c));
  }

  from<T extends Trait>(c: TC<T>): T[] {
    return this.list('in', [c]).map(t => t.source.req(c));
  }

  list(type: 'out' | 'in' | 'both', withOf: TC[] = []): Tie[] {
    return this._list(type).filter(tie => {
      switch (type) {
        case "out": // this -> o
          return tie.dest.has(...withOf);
        case "in": // o -> this
          return tie.source.has(...withOf);
        case "both":
          if (tie.source === this.$entity) {
            return tie.dest.has(...withOf);
          } else {
            return tie.source.has(...withOf);
          }
      }
    });
  }

  private _list(type: 'out' | 'in' | 'both'): Tie[] {
    if (type === 'out') {
      return this.ties.findBy({src: this});
    }
    if (type === 'in') {
      return this.ties.findBy({dest: this});
    }

    // FIXME: алгоритм крайне неоптимален
    return [
      ...this.ties.findBy({src: this}),
      ...this.ties.findBy({dest: this})
    ];
  }
}
