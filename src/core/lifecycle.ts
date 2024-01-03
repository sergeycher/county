import {Emitter} from "./emitter";

/**
 * Can be used for lifecycle hooking of any object
 */
export class Lifecycle<E extends String> {
  private static KEY = Symbol();

  /**
   * Return Lifecycle attached to specified object
   */
  static of<E extends String>(object: Object): Lifecycle<E> {
    let instance = (object as any)[Lifecycle.KEY];

    if (!instance) {
      (object as any)[Lifecycle.KEY] = instance = new Lifecycle(object);
    }

    return instance;
  }

  private readonly _events = new Emitter<E>();

  protected constructor(private object: Object) {
  }

  emit(e: E): void {
    this._events.next(e);
  }

  on(type: E, handler: () => any): void {
    this._events.subscribe(e => {
      if (e === type) {
        handler();
      }
    });
  }

  end(): void {
    this._events.dispose();
    delete (this.object as any)[Lifecycle.KEY];
  }
}