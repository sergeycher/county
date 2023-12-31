import {Collection} from "./collection";
import {Unit} from "../unit";
import {Emitter} from "../core/emitter";
import {CountyEvent} from "../core/events";
import {EventType} from "../traits/events";
import {Trait} from "../traits";
import {Realm} from "../realm";

export class Units extends Collection<Unit> {
  static select(realm: Realm, filt: (item: Unit) => boolean) {
    const result = new Units(realm.events);
    result.reset(realm.filter(filt));

    const unsub = realm.events.subscribe(() => {
      result.reset(realm.filter(filt));
    });

    result.events.onDispose(unsub);

    return result;
  }

  readonly events = new Emitter<CountyEvent<EventType, Trait | Unit>>();

  constructor(events: Emitter<CountyEvent<EventType, Trait | Unit>>) {
    super();

    events.retranslateTo(this.events, (e) => {
      const unit = Unit.from(e.target);

      if (this.has(unit)) {
        // без раздумий удаляем узел который был удален из родительской коллекции
        Unit.when(EventType.delete, (u) => this.drop(u))(e);

        return true;
      }

      return false;
    });
  }

  pipe(func: (item: Unit) => Unit[]): Units {
    const result = new Units(this.events);
    result.reset(this._reduce(func));

    // при любом изменении втупую пересчитываем всю пачку
    const unsub = this.events.subscribe(() => {
      result.reset(this._reduce(func));
    });

    result.changes$.onDispose(unsub);

    return result;
  }

  private _reduce(func: (item: Unit) => Unit[]): Unit[] {
    const result: Unit[] = [];
    this.map(u => {
      result.push(...func(u));
      return u;
    });
    return result;
  }
}
