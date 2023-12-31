import {Entity} from "../core/types";
import {Emitter} from "../core/emitter";

export class Collection<T extends Entity> {
  private _items = new Map<string, T>();
  private _array?: T[] = [];

  get items(): T[] {
    if (!this._array) {
      this._array = Array.from(this._items.values());
    }

    return this._array;
  }

  readonly changes$ = new Emitter<{ type: 'add' | 'remove'; items: T[] }>();

  get(id: string) {
    return this._items.get(id);
  }

  has(item: T) {
    return this._items.has(item.id);
  }

  map<R extends Entity>(func: (u: T) => R): Collection<R> {
    const c = new Collection<R>();
    c.add(...this.items.map(func));
    return c;
  }

  clear() {
    const items = this.items;

    if (items.length > 0) {
      this._items.clear();
      this.changes$.next({type: 'remove', items});
      this._array = undefined;
    }
  }

  drop(...entities: T[]) {
    const deleted: T[] = [];

    entities.forEach(e => {
      if (this.has(e)) {
        this._items.delete(e.id);
        deleted.push(e);
      }
    });

    if (deleted.length > 0) {
      this.changes$.next({type: 'remove', items: deleted});
      this._array = undefined;
    }
  }

  add(...entities: T[]) {
    const added: T[] = [];

    entities.forEach(e => {
      if (e !== this.get(e.id)) {
        this._items.set(e.id, e);
        added.push(e);
      }
    });

    if (added.length > 0) {
      this.changes$.next({type: 'add', items: added});
      this._array = undefined;
    }
  }

  /**
   * Smart reset - remove all units that NOT in array
   */
  reset(items: T[]) {
    const index = new Set(items);
    const toRemove = this.items.filter(i => !index.has(i));

    this.drop(...toRemove);
    this.add(...items);
  }

  dispose() {
    this.changes$.dispose();
    this.clear();
  }
}
