import 'should';
import {Realm} from "./realm";
import {Unit} from "./units/unit";
import {Tie} from "./ties/tie";
import {Trait} from "./traits/trait";
import {having, Selector} from "./selector2";

describe('Selector 2', () => {
  let realm = new Realm();
  let a: Unit, b: Unit;
  let ab: Tie;

  class Trait1 extends Trait {
    value = 0;
  }

  const selector = Selector.create(having(Trait1));

  beforeEach(() => {
    realm = new Realm();

    a = realm.unit('a');
    b = realm.unit('b');
    ab = realm.tie(a, b);
  });

  it('should watch', () => {
    let units$ = selector().watch(realm);
    let counter = 0;

    units$.subscribe((v) => counter++);

    counter.should.be.exactly(0);
    units$.should.have.length(0);

    a.as(Trait1);
    counter.should.be.exactly(1);
    units$.should.have.length(1);

    b.as(Trait1);
    counter.should.be.exactly(2);
    units$.should.have.length(2);

    ab.as(Trait1);
    counter.should.be.exactly(2);
    units$.should.have.length(2);

    b.drop(Trait1);
    counter.should.be.exactly(3);
    units$.should.have.length(1);
    realm.despawn(ab);
    counter.should.be.exactly(3);
    units$.should.have.length(1);

    units$.dispose();
    realm.despawn(a, b, ab);
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
