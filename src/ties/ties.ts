import {Tie} from "./tie";
import {Emitter} from "../core/emitter";
import {CreateEvent, DeleteEvent, TraitsEvent} from "../traits/events";
import {Unit} from "../units/unit";
import {Entities} from "../core/entities";
import {Trait} from "../traits/trait";

export class TiesMap extends Entities<Tie> {
  readonly events = new Emitter<TraitsEvent>();

  findBy({src, dest}: { src?: Unit | Trait, dest?: Unit | Trait }): Tie[] {
    src = src && Unit.from(src);
    dest = dest && Unit.from(dest);

    const result: Tie[] = [];
    // FIXME: поиск перебором очень медленный, нужна индексация
    this.items.forEach(t => {
      if (src && dest) {
        if ((src === t.source) && (dest === t.dest)) {
          result.push(t);
        }
      } else {
        if ((src && (t.source === src)) || (dest && (dest === t.dest))) {
          result.push(t);
        }
      }
    });

    return result;
  }

  find(src: Unit, dest: Unit) {
    return this.items.get(Tie.id(src, dest));
  }

  get(src: Unit | Trait, dest: Unit | Trait): Tie {
    src = Unit.from(src);
    dest = Unit.from(dest);

    let tie = this.items.get(Tie.id(src, dest));

    if (!tie) {
      tie = new Tie(src, dest);
      tie!.events!.retranslateTo(this.events);
      this.items.set(tie.id, tie);
      this.events.next(new CreateEvent(tie));
    }

    return tie;
  }

  despawn(tie: Tie) {
    const deleted = this.delete(tie);

    if (deleted) {
      deleted.destroy();
      this.events.next(new DeleteEvent(deleted));
    }

    return deleted;
  }
}
