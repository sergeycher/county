import {Realm, Ties, Unit, walkIn} from '../index';
import 'should';
import {add, having, pipe, ties, tips, union, walk, where} from "./traverse";

export class Landmark {
  name = '';
}

class Town extends Landmark {
  readonly unit = Unit.inject();

  get neighbours(): Town[] {
    return this.unit.as(Ties).list('both', [Town])
      .flatMap(({src, dest}) => {
        return [src, dest].filter(t => t !== this.unit);
      })
      .map(u => u.as(Town));
  }
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
    const [a, b, c, d, e, f] = Array(6).fill(0).map(() => realm.unit().change(Town));
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

    realm.traverse(villagesWithRoadsToTown).length.should.be.exactly(5);

    realm.traverse(ties(Road), tips()).length.should.be.exactly(14);
    realm.traverse(ties(Road), where(Road, r => r.distance >= 5), tips()).length.should.be.exactly(2);

    realm.traverse(union(having(Town), having(Village))).length.should.be.exactly(28);
    realm.traverse(having(Town), add(walk(Road), tips(), having(Village))).length.should.be.exactly(11);

    // town<-village roads
    realm.traverse(having(Town), walkIn(Road), tips(), having(Village)).length.should.be.exactly(1);
  });

  it('ties', () => {
    const a = realm.unit('town:vivalia').as(Town, c => c.name = 'Vivalia');
    const b = realm.unit('town:egoset').as(Town, c => c.name = 'Egoset');

    a.unit.as(Ties).tie(b.unit);

    console.log(a.neighbours.map(t => t.name)); // [Egoset]
    console.log(b.neighbours.map(t => t.name)); // [Vivalia]
  });
});
