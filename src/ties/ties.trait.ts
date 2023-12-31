import {lifecycle, TC, Trait} from "../traits/trait";
import {Unit} from "../unit";
import {Tie} from "./tie.trait";

/**
 * Трейт для доступа к связям
 *
 * TODO: отслеживание связей между сущностями на уровне самой сущности.
 *   Реализуется легко для добавления и удаления связей, но с трейтами уже сложнее.
 */
export class Ties {
  readonly unit = Unit.inject();

  private readonly __ties = new Set<Tie>();

  private readonly lc = lifecycle(this);

  select(type: 'out' | 'in', tiesHaving: TC[], targetsHaving: TC[]): Unit[] {
    return this.list(type, targetsHaving)
      .filter(t => t.root.has(...tiesHaving))
      .map((t) => {
        return type === 'in' ? t.src : t.dest;
      });
  }

  tie(dest: Unit): Tie {
    return this.unit.realm.unit(`${this.unit.id}->${dest.id}`).as(Tie).__init(this.unit, dest);
  }

  connectedTo(target: Unit): boolean {
    const tie1 = this.unit.realm.unit(`${this.unit.id}->${target.id}`, false);
    const tie2 = this.unit.realm.unit(`${target.id}->${this.unit.id}`, false);

    return !!(tie1 || tie2);
  }

  to<T extends Trait>(c: TC<T>): T[] {
    return this.list('out', [c]).map(t => t.dest.req(c));
  }

  from<T extends Trait>(c: TC<T>): T[] {
    return this.list('in', [c]).map(t => t.src.req(c));
  }

  constructor() {
    if (this.unit.has(Tie)) {
      throw new Error(`Unable to use Tie as Ties`);
    }

    this.lc.on('drop:before', () => {
      this.list().forEach(t => t.root.despawn());
    });
  }

  list(type: 'out' | 'in' | 'both' = 'both', withOf: TC[] = []): Tie[] {
    return this._list(type).filter(tie => {
      switch (type) {
        case "out": // this -> o
          return tie.dest.has(...withOf);
        case "in": // o -> this
          return tie.src.has(...withOf);
        case "both":
          if (tie.src === this.unit) {
            return tie.dest.has(...withOf);
          } else {
            return tie.src.has(...withOf);
          }
      }
    });
  }

  _list(type: 'out' | 'in' | 'both'): Tie[] {
    const result: Tie[] = [];

    const tips = (tie: Tie) => {
      if (type === 'in') return [tie.dest];
      if (type === 'out') return [tie.src];

      return [tie.src, tie.dest];
    }

    this.__ties.forEach((tie) => {
      if (tips(tie).includes(this.unit)) {
        result.push(tie);
      }
    });

    return result;
  }

  __append(...ties: Tie[]) {
    let changed = false;
    ties.forEach(tie => {
      if (this.__ties.has(tie)) return;

      this.__ties.add(tie);
      changed = true;
    });

    if (changed)
      this.unit.change(Ties);
  }

  __remove(...ties: Tie[]) {
    let changed = false;
    ties.forEach(tie => {
      if (!this.__ties.has(tie)) return;

      this.__ties.delete(tie);
      changed = true;
    });

    if (changed)
      this.unit.change(Ties);
  }
}
