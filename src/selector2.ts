import {Unit} from "./units/unit";
import {Tie} from "./ties/tie";
import {Realm} from "./realm";
import {CreateEvent, DeleteEvent, TraitsEvent} from "./traits/events";
import {Emitter} from "./core/emitter";
import {Trait} from "./traits/trait";
import {TC} from "./traits/types";
import {Entity} from "./core/types";

export type Filter = (u: Unit) => boolean;

export function having(...Trts: TC[]): Filter {
  return u => u.has(...Trts);
}

export function where<T extends Trait>(Trt: TC<T>, filt: (t?: T) => boolean): Filter {
// TODO: должен подписываться на изменения в указанном трейте
  return u => filt(u.find(Trt));
}

class EMap<T extends Entity> {
  private _index = new Map<string, T>();

  readonly changes$ = new Emitter<{ type: 'add' | 'remove'; items: T[] }>();

  list(): T[] {
    return Array.from(this._index.values());
  }

  get(id: string) {
    return this._index.get(id);
  }

  has(id: string) {
    return this._index.has(id);
  }

  clear() {
    const items = this.list();

    if (items.length > 0) {
      this._index.clear();
      this.changes$.next({type: 'remove', items});
    }
  }

  drop(...entities: T[]) {
    const items: T[] = [];

    entities.forEach(e => {
      if (this.has(e.id)) {
        this._index.delete(e.id);
        items.push(e);
      }
    });

    if (items.length > 0) {
      this.changes$.next({type: 'add', items});
    }
  }

  add(...entities: T[]) {
    const items: T[] = [];

    entities.forEach(e => {
      if (e !== this.get(e.id)) {
        this._index.set(e.id, e);
        items.push(e);
      }
    });

    if (items.length > 0) {
      this.changes$.next({type: 'add', items});
    }
  }

  dispose() {
    this.clear();
    this.changes$.dispose();
  }
}

/**
 * Selects only units, without ties
 */
export class Selector {
  static create(...filters: Filter[]) {
    const filter: Filter = (u) => filters.every(f => f(u))
    return () => new Selector(filter);
  }

  get units() {
    return this._units;
  }

  get length() {
    return this.units.length;
  }

  private _units: Unit[] = [];

  private _index = new EMap<Unit>();

  readonly units$ = new Emitter<Unit[]>();
  private _realm?: Realm;

  protected constructor(private filterFunc: Filter) {

  }

  /**
   * Start watching realm units
   */
  watch(realm: Realm) {
    if (this._realm) return this;

    this._units = realm.filter(u => this.filterFunc(u));
    this._index.add(...this._units);

    const unsub = realm.subscribe((e) => {
      this._handleEvent(e);
    });

    this.units$.onDispose(unsub);

    this._realm = realm;

    return this;
  }

  /**
   * Полезно подписаться ДО вызова watch(realm)
   */
  on(event: 'add' | 'remove', handler: (units: Unit[]) => any) {
    return this._index.changes$.subscribe((e) => {
      if (e.type === event) {
        handler(e.items);
      }
    })
  }

  subscribe(handler: (units: Unit[]) => any) {
    return this.units$.subscribe(handler);
  }

  dispose() {
    this.units$.dispose();
    this._index.dispose();
  }

  private _handleEvent(e: TraitsEvent) {
    if (!(e.entity instanceof Unit)) {
      return;
    }

    const u = e.entity;

    if (DeleteEvent.from(e) && !e.hasSomeTarget(Trait) && this._index.has(u.id)) {
      this._index.drop(u);
      return this._emitChange();
    }

    if (DeleteEvent.from(e) || CreateEvent.from(e)) {
      if (this._verify(u)) {
        this._index.add(u);
      } else {
        this._index.drop(u);
      }

      return this._emitChange();
    }
  }

  private _emitChange() {
    this._units = this._index.list();
    this.units$.next(this._units);
  }

  private _verify(e: Tie | Unit) {
    return (e instanceof Unit) ? this.filterFunc(e) : false;
  }
}
