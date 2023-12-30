import {Unit} from "../unit";
import {Realm} from "../realm";
import {CreateEvent, DeleteEvent, TraitsEvent} from "../traits/events";
import {TC, Trait} from "../traits/trait";
import {Collection} from "./collection";

export type Filter = (u: Unit) => boolean;

export function having(...Trts: TC[]): Filter {
  return u => u.has(...Trts);
}

export function where<T extends Trait>(Trt: TC<T>, filt: (t?: T) => boolean): Filter {
// TODO: должен подписываться на изменения в указанном трейте
  return u => filt(u.find(Trt));
}

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

  private _index = new Collection<Unit>();

  private _realm?: Realm;

  protected constructor(private filterFunc: Filter) {

  }

  /**
   * Start watching realm units
   */
  watch(realm: Realm): this {
    if (this._realm) return this;

    this._units = realm.filter(u => this.filterFunc(u));
    this._index.add(...this._units);

    const unsub = realm.subscribe((e) => {
      this._handleEvent(e);
    });

    this._index.changes$.onDispose(unsub);

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
    return this._index.changes$.subscribe(() => {
      handler(this._units);
    });
  }

  dispose() {
    this._index.dispose();
  }

  private _handleEvent(e: TraitsEvent) {
    const u = e.entity as Unit;

    if (DeleteEvent.from(e) && !e.hasSomeTarget(Trait) && this._index.has(u.id)) {
      this._index.drop(u);
      this._units = this._index.list();
      return;
    }

    if (DeleteEvent.from(e) || CreateEvent.from(e)) {
      if (this.filterFunc(u)) {
        this._index.add(u);
      } else {
        this._index.drop(u);
      }

      this._units = this._index.list();
    }
  }
}
