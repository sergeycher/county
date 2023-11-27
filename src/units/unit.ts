import {Traits} from "../traits/traits";
import {Entity} from "../core/types";
import {DeleteEvent} from "../traits/events";
import {Trait} from "../traits/trait";

export class Unit extends Traits implements Entity {
  static from(u: Unit | Trait): Unit {
    let unit: any = u;

    if (u instanceof Trait) {
      unit = Traits.of(u) as Unit;
    }

    if (!unit || !(unit instanceof Unit)) {
      throw new Error('Trait is not belongs to unit');
    }

    return unit;
  }

  constructor(readonly id: string) {
    super();
  }

  destroy() {
    this.events.next(new DeleteEvent(this));
    this.events.dispose();
  }
}
