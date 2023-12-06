import {CURRENT, Traits, TraitsError} from "../traits/traits";
import {Entity} from "../core/types";
import {Unit} from "../units/unit";
import {Trait} from "../traits/trait";

export class Tie extends Traits implements Entity {
  static id(source: Unit, dest: Unit) {
    return source.id + '->' + dest.id;
  }

  static inject(): Tie {
    if (CURRENT instanceof Tie) {
      return CURRENT;
    }

    throw new TraitsError(`Current entity is not a tie`, CURRENT);
  }

  get id() {
    return Tie.id(this.source, this.dest);
  }

  constructor(readonly source: Unit, readonly dest: Unit) {
    super();
  }

  isConnectedTo(target: Unit | Trait) {
    target = Unit.from(target);

    return (this.dest === target) || (this.source === target);
  }

  destroy() {
    this.events.dispose();
    this.empty();
  }
}
