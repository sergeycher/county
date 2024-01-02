import {Collection} from "./collection";
import {Unit} from "../unit";
import {Emitter} from "../core/emitter";
import {CountyEvent} from "../core/events";
import {EventType} from "../traits/events";
import {Trait} from "../traits";
import {Realm} from "../realm";
import {TC} from "../traits/trait";
import {pipe, TraverseFunc} from "../traverse";

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

  static bound(unit: Unit, type: 'out' | 'in', tiesHaving: TC[], targetsHaving: TC[]): Units {
    const realm = (unit.realm as Realm);

    // TODO
    return Units.select(realm, (u) => true);
  }

  readonly events = new Emitter<CountyEvent<EventType, Trait | Unit>>();

  protected constructor(events: Emitter<CountyEvent<EventType, Trait | Unit>>) {
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

  pipe(func: TraverseFunc, ...funcs: TraverseFunc[]): Units {
    const result = new Units(this.events);

    const update = () => result.reset(this._reduce(func).flatMap(pipe(...funcs)));

    update();

    // при любом изменении втупую пересчитываем всю пачку
    const unsub = this.events.subscribe(update);

    result.changes$.onDispose(unsub);

    return result;
  }

  private _reduce(func: TraverseFunc): Unit[] {
    const result: Unit[] = [];
    this.map(u => {
      result.push(...func(u));
      return u;
    });
    return result;
  }
}
