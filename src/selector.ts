import {Unit} from "./units/unit";
import {Tie} from "./ties/tie";
import {Realm} from "./realm";
import {CreateEvent, DeleteEvent} from "./traits/events";
import {Emitter} from "./core/emitter";
import {TC} from "./traits/types";
import {Trait} from "./traits/trait";

export function createSelector(...having: TC[]): (graph: Realm, debug?: boolean) => [Unit[], Emitter<Unit[]>] {
  return (graph) => {
    const index = new Map<string, Unit | Tie>();
    const emitter = new Emitter<Unit[]>();

    // initial index value
    graph.select(...having).forEach(u => {
      index.set(u.id, u);
    });

    const selectFromIndex = () => {
      const result = new Set<Unit>();

      index.forEach(e => {
        if (e instanceof Unit) {
          result.add(e);
        } else {
          result.add(e.dest);
          result.add(e.source);
        }
      });

      return Array.from(result.values())
    }

    function check(e: Tie | Unit) {
      return (e instanceof Unit)
        ? e.has(...having)
        : false //(e.source.has(having) || e.dest.has(having) || e.has(having));
    }

    const unsub = graph.subscribe(e => {
      let u = e.entity as Unit | Tie;
      let changed = false;

      if (DeleteEvent.from(e) && !e.hasSomeTarget(Trait)) {
        index.delete(u.id);
        changed = true;
      } else {
        if ((DeleteEvent.from(e) || CreateEvent.from(e)) && having.some(T => e.target instanceof T)) {
          check(u) ? index.set(u.id, u) : index.delete(u.id);
          changed = true;
        }
      }

      if (changed) {
        emitter.next(selectFromIndex());
      }
    });

    emitter.onDispose(unsub);

    return [selectFromIndex(), emitter];
  }
}
