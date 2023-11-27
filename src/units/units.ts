import {Unit} from "./unit";
import {Emitter} from "../core/emitter";
import {CreateEvent, TraitsEvent} from "../traits/events";
import {Entities} from "../core/entities";

export class Units extends Entities<Unit> {
  readonly events = new Emitter<TraitsEvent>();

  get(id: string, createIfNotExist = true): Unit | undefined {
    let unit = this.items.get(id)!;

    if (!unit && createIfNotExist) {
      unit = new Unit(id);
      unit.events.retranslateTo(this.events);
      this.items.set(id, unit);
      this.events.next(new CreateEvent(unit));
    }

    return unit;
  }

  despawn(unit: Unit) {
    const deleted = this.delete(unit);

    if (deleted) {
      deleted.destroy();
    }

    return deleted;
  }
}
