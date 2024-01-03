import {Trait} from "./traits";
import {exclude, traverse, TraverseFunc} from "./traverse";
import {lazy, Lazy} from "./core/utils";
import {Unit} from "./unit";
import {Realm} from "./realm";
import {lifecycle} from "./traits/trait";

/**
 * Define bound with traverse from current unit
 *
 * Автоматически (очень неэффективно) отслеживает изменения графа и сбрасывает кеш.
 * Автоматически исключает самого себя из результата.
 * Автоматически останавливает отслеживание при удалении трейта
 */
export function bounds(trait: Trait, ...funcs: TraverseFunc[]): Lazy<Unit[]> {
  const unit = Unit.inject() || Unit.from(trait);

  if (!unit) {
    throw new Error('Unable to define bound: unit is undefined');
  }

  const cell = lazy(() => traverse([unit], ...funcs, exclude(() => [unit])));

  const unsub = (unit.realm as Realm).events.subscribe(() => {
    // FIXME: resetting cache on EVERY event will produce heavy performance issues
    //  понятия не имею на что подписываться - в выборку потенциально могут попасть любые узлы
    // TODO: Если сделать обход через Units то на каждом шаге можно подписываться только на релевантные события, собрав подписки в пачку
    cell.obsolete();
  });

  lifecycle(trait).on('drop:before', () => {
    unsub();
    cell.off();
  });

  return cell;
}