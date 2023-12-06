import {CURRENT, Traits, TraitsError} from "../traits/traits";
import {Entity} from "../core/types";
import {DeleteEvent} from "../traits/events";
import {Trait} from "../traits/trait";

export class Unit extends Traits implements Entity {
  /**
   * Inject current Unit in trait instance. Should be used in trait constructor ONLY
   */
  static inject(): Unit {
    if (CURRENT instanceof Unit) {
      return CURRENT;
    }

    throw new TraitsError(`Current entity is not a unit`, CURRENT);
  }

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
    this.empty();
    this.events.next(new DeleteEvent(this));
    this.events.dispose();
  }
}
