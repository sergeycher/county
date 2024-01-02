import 'should';
import {Realm} from "../realm";
import {Unit} from "../unit";
import {having_, Selector} from "./selector2";
import {Tie, Ties} from "../ties";

describe('Selector 2', () => {
  let realm = new Realm();
  let a: Unit, b: Unit;
  let ab: Tie;

  class Trait1 {
    value = 0;
  }

  class Trait2 {
    value = 0;
  }

  const selector = Selector.create(having_(Trait1));

  beforeEach(() => {
    realm = new Realm();

    a = realm.unit('a');
    b = realm.unit('b');
    ab = a.as(Ties).tie(b);
  });

  it('should watch', () => {
    let units$ = selector().watch(realm);
    let counter = 0;

    units$.subscribe(() => counter++);

    units$.should.have.length(0);
    counter.should.be.exactly(0);

    a.as(Trait1);
    units$.should.have.length(1);
    counter.should.be.exactly(1);

    b.as(Trait1);
    units$.should.have.length(2);
    counter.should.be.exactly(2);

    ab.root.as(Trait2);
    units$.should.have.length(2);
    counter.should.be.exactly(2);

    b.drop(Trait1);
    counter.should.be.exactly(3);
    units$.should.have.length(1);
    ab.break();
    counter.should.be.exactly(3);
    units$.should.have.length(1);

    units$.dispose();
    realm.despawn(a, b, ab.root);
    units$.should.have.length(1);
  });

  it('should watch changes', () => {
    const units$ = selector();
    let unit: Unit = null as any;

    units$.on('add', (units) => {
      [unit] = units;
    });

    units$.on('remove', (units) => {
      [unit] = units;
    });

    units$.watch(realm);

    (unit == null).should.be.true();

    a.as(Trait1);
    unit.should.be.exactly(a);
    b.as(Trait1);
    unit.should.be.exactly(b);

    a.drop(Trait1);
    unit.should.be.exactly(a);

    units$.dispose();
    a.as(Trait1);
    b.drop(Trait1);
    unit.should.be.exactly(a);
  });
});
