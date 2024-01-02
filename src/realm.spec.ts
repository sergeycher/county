import {exclude, lazy, pick, Realm, Ties, Trait, traverse, TraverseFunc, Unit, walkIn} from '../index';
import 'should';
import {add, having, pipe, ties, tips, union, walk, where} from "./traverse";
import {Lifecycle} from "./traits/trait";
import {Lazy} from "./core/utils";

/**
 * Define bound with traverse from current unit
 *
 * Автоматически (очень неэффективно) отслеживает изменения графа и сбрасывает кеш.
 * Автоматически исключает самого себя из результата.
 */
export function bound(trait: Trait, ...funcs: TraverseFunc[]): Lazy<Unit[]> {
  const unit = Unit.inject() || Unit.from(trait);

  const cell = lazy(() => traverse([unit], ...funcs, exclude(() => [unit])));

  const unsub = (unit.realm as Realm).events.subscribe(() => {
    // FIXME: resetting cache on EVERY event will produce heavy performance issues
    //  понятия не имею на что подписываться - в выборку потенциально могут попасть любые узлы
    cell.reset();
  });

  Lifecycle.of(trait).on('drop:before', () => {
    unsub();
    cell.unsubscribe();
  });

  return cell;
}

export class Landmark {
  name = '';

  readonly unit = Unit.inject();

  readonly neighbours$ = bound(this,
    walk(Road),
    tips()
  );

  get neighbours(): Unit[] {
    return traverse([this.unit],
      walk(Road),
      tips(),
      exclude(() => [this.unit])
    );
  }

  constructor() {
    (this.unit.realm as Realm).events.subscribe(() => {
      this.neighbours$.reset();
    })
  }
}

class Town extends Landmark {

}

class Village extends Landmark {
}

class Road {
  distance = 1;
}

describe('Realm', () => {
  let realm = new Realm();

  beforeEach(() => {
    realm = new Realm();
  });

  it('should traverse', () => {
    const [a, b, c, d, e, f] = Array(6).fill(0).map((_, i) => realm.unit().change(Town, (t) => t.name = i.toString()));
    const [g, h, i, j, k, l] = Array(22).fill(0).map(() => realm.unit().change(Village));
    const [m, n, o] = Array(66).fill(0).map(() => realm.unit().change(Landmark));

    const villagesWithRoadsToTown = pipe(
      having(Town),
      walk(Road),
      tips(),
      having(Village)
    );

    // Use .length.should. instead of .have.length() for performance purposes !!!
    realm.traverse(villagesWithRoadsToTown).length.should.be.exactly(0);

    a.as(Ties).tie(b).as(Road);

    a.as(Ties).tie(g).as(Road);
    a.as(Ties).tie(h).as(Road);
    f.as(Ties).tie(h).as(Road);
    f.as(Ties).tie(i).as(Road);
    k.as(Ties).tie(b).as(Road, r => r.distance = 5);

    a.as(Ties).tie(m);
    k.as(Ties).tie(n).as(Road);

    a.req(Town).neighbours.forEach(u => {
      console.log(u.find(Town)?.name || '???');
    })
    a.req(Town).neighbours.length.should.be.exactly(3);

    realm.traverse(villagesWithRoadsToTown).length.should.be.exactly(5);

    realm.traverse(ties(Road), tips()).length.should.be.exactly(14);
    realm.traverse(ties(Road), where(Road, r => r.distance >= 5), tips()).length.should.be.exactly(2);

    realm.traverse(union(having(Town), having(Village))).length.should.be.exactly(28);
    realm.traverse(having(Town), add(walk(Road), tips(), having(Village))).length.should.be.exactly(11);

    // town<-village roads
    realm.traverse(having(Town), walkIn(Road), tips(), having(Village)).length.should.be.exactly(1);
  });

  it('should watch on ties', () => {
    const [a, b, c, d, e, f] = Array(6).fill(0).map((_, i) => realm.unit().change(Town, (t) => t.name = i.toString())).map(pick(Town));

    let val: Unit[] = [];

    a.neighbours$(() => {
      val = a.neighbours$();
    });

    a.unit.as(Ties).tie(b.unit).as(Road);
    a.neighbours$().length.should.be.exactly(1);
    val.length.should.be.exactly(1);

    a.unit.as(Ties).tie(c.unit).as(Road);
    a.neighbours$().length.should.be.exactly(2);
    val.length.should.be.exactly(2);
    a.neighbours$().should.be.exactly(a.neighbours$()); // same instance
    a.neighbours$().should.be.exactly(val); // same instance
  });

  it('example', () => {
    const a = realm.unit('town:vivalia').as(Town, c => c.name = 'Vivalia');
    const b = realm.unit('town:egoset').as(Town, c => c.name = 'Egoset');

    a.unit.as(Ties).tie(b.unit).as(Road);

    console.log(a.neighbours.map(pick(Town)).map(t => t.name)); // [Egoset]
    console.log(b.neighbours.map(pick(Town)).map(t => t.name)); // [Vivalia]
  });
});
