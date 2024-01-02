import {Unit} from "./unit";
import {Tie, Ties} from "./ties";
import {TC, Trait} from "./traits/trait";

export type TraverseFunc = (units: Unit) => Unit[];

export function having(...traits: TC[]): TraverseFunc {
  return (u: Unit) => u.has(...traits) ? [u] : [];
}

export function exclude(get: () => Unit[]): TraverseFunc {
  return (u) => {
    const ex = new Set(get());
    return ex.has(u) ? [] : [u];
  }
}

/**
 * Same as having() but only for ties
 *
 * Use ties() without arguments to filter ties
 */
export function ties(...traits: TC[]): TraverseFunc {
  return (u: Unit) => u.has(Tie, ...traits) ? [u] : [];
}

export function pick<T extends Trait>(trait: TC<T>) {
  return (u: Unit) => u.req(trait)
}

/**
 * Select unit's ties in both directions
 */
export function walk(...traits: TC[]): TraverseFunc {
  return (u) => {
    return u.for(Ties, (t) => t._list('both').map(t => t.root).filter(u => u.has(...traits))) || [];
  }
}

/**
 * Select unit's ties in "out" directions
 */
export function walkOut(...traits: TC[]): TraverseFunc {
  return (u) => {
    return u.for(Ties, (t) => t._list('out').map(t => t.root).filter(u => u.has(...traits))) || [];
  }
}

/**
 * Select unit's ties in "in" directions
 */
export function walkIn(...traits: TC[]): TraverseFunc {
  return (u) => {
    return u.for(Ties, (t) => t._list('in').map(t => t.root).filter(u => u.has(...traits))) || [];
  }
}

/**
 * Pick tip from tie
 *
 * @param type 'out' picks Tie.dest, 'in' picks Tie.src
 */
export function tips(type?: 'dest' | 'source'): TraverseFunc {
  return (u) => {
    const tie = u.find(Tie);

    if (!tie) return [];

    switch (type) {
      case "dest":
        return [tie.dest];
      case "source":
        return [tie.src];
      default:
        return [tie.src, tie.dest];
    }
  }
}

export function where<T extends Trait>(t: TC<T>, func: (t: T) => boolean): TraverseFunc {
  return (u: Unit) => {
    const inst = u.find(t);

    if (!inst) {
      return [];
    } else {
      return func(inst) ? [u] : [];
    }
  };
}

export function add(...funcs: TraverseFunc[]): TraverseFunc {
  const f = pipe(...funcs);

  return (u) => {
    return [u, ...f(u)];
  }
}

export function union(...funcs: TraverseFunc[]): TraverseFunc {
  return (unit) => {
    let units: Unit[] = [];
    funcs.forEach((func) => {
      units = units.concat([unit].flatMap(func));
    });

    return units;
  }
}

export function pipe(...funcs: TraverseFunc[]): TraverseFunc {
  return (unit) => {
    let units = [unit];
    funcs.forEach((func) => {
      units = units.flatMap(func);
    });

    return units;
  }
}

export function traverse(units: Unit[], ...funcs: TraverseFunc[]): Unit[] {
  const result: Unit[] = [];
  const f = pipe(...funcs);

  units.forEach((u) => {
    result.push(...f(u));
  });

  return result;
}
