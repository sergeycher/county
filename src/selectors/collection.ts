import {Entity} from "../core/types";
import {Emitter} from "../core/emitter";

export class Collection<T extends Entity> {
  private _items = new Map<string, T>();

  readonly changes$ = new Emitter<{ type: 'add' | 'remove'; items: T[] }>();

  list(): T[] {
    return Array.from(this._items.values());
  }

  get(id: string) {
    return this._items.get(id);
  }

  has(id: string) {
    return this._items.has(id);
  }

  clear() {
    const items = this.list();

    if (items.length > 0) {
      this._items.clear();
      this.changes$.next({type: 'remove', items});
    }
  }

  drop(...entities: T[]) {
    const items: T[] = [];

    entities.forEach(e => {
      if (this.has(e.id)) {
        this._items.delete(e.id);
        items.push(e);
      }
    });

    if (items.length > 0) {
      this.changes$.next({type: 'remove', items});
    }
  }

  add(...entities: T[]) {
    const items: T[] = [];

    entities.forEach(e => {
      if (e !== this.get(e.id)) {
        this._items.set(e.id, e);
        items.push(e);
      }
    });

    if (items.length > 0) {
      this.changes$.next({type: 'add', items});
    }
  }

  dispose() {
    this.changes$.dispose();
    this.clear();
  }
}