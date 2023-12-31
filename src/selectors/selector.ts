import {Unit} from "../unit";
import {Realm} from "../realm";
import {Emitter} from "../core/emitter";
import {TC, Trait} from "../traits/trait";
import {EventType} from "../traits/events";
import {Traits} from "../traits";

export function createSelector(...having: TC[]): (graph: Realm, debug?: boolean) => [Unit[], Emitter<Unit[]>] {
  return (graph) => {
    const index = new Map<string, Unit>();
    const emitter = new Emitter<Unit[]>();

    // initial index value
    graph.select(...having).forEach(u => {
      index.set(u.id, u);
    });

    const selectFromIndex = () => {
      const result = new Set<Unit>();

      index.forEach(e => {
        result.add(e);
      });

      return Array.from(result.values())
    }

    function check(e: Unit) {
      return e.has(...having);
    }

    const unsub = graph.subscribe(event => {
      let changed = false;

      const onTraitChange = (t: Trait) => {
        if (having.some(T => t instanceof T)) {
          const u = Traits.of(t) as Unit;
          check(u) ? index.set(u.id, u) : index.delete(u.id);

          changed = true;
        }
      }

      [
        Unit.when(EventType.delete, (u) => {
          index.delete(u.id);
          changed = true;
        }),
        Unit.whenTrait(EventType.delete, onTraitChange),
        Unit.whenTrait(EventType.create, onTraitChange)
      ]
        .map(wh => wh(event));

      if (changed) {
        emitter.next(selectFromIndex());
      }
    });

    emitter.onDispose(unsub);

    return [selectFromIndex(), emitter];
  }
}
