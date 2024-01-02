import {Unit} from "../unit";
import {Realm} from "../realm";
import {EventType} from "../traits/events";
import {TC, Trait} from "../traits/trait";
import {Collection} from "./collection";
import {Traits} from "../traits";
import {CountyEvent} from "../core/events";

export type Filter = (u: Unit) => boolean;

export function having_(...Trts: TC[]): Filter {
  return u => u.has(...Trts);
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

  private _handleEvent(e: CountyEvent<EventType, unknown>) {
    const handleTrait = (tr: Trait) => this._handleTrait(tr);

    [
      Unit.when(EventType.delete, u => {
        this._index.drop(u);
        this._units = this._index.items;
      }),

      Unit.whenTrait(EventType.delete, handleTrait),
      Unit.whenTrait(EventType.create, handleTrait)
    ].map(w => w(e));
  }

  private _handleTrait(tr: Trait) {
    const u = Traits.of(tr) as Unit;

    if (this.filterFunc(u)) {
      this._index.add(u);
    } else {
      this._index.drop(u);
    }

    this._units = this._index.items;
  }
}
