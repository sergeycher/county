import 'should';
import {Realm} from "../realm";
import {Unit} from "../unit";
import {createSelector} from "./selector";
import {Trait} from "../traits";
import {Tie, Ties} from "../ties";

describe('Selectors', () => {
  let realm = new Realm();
  let a: Unit, b: Unit;
  let ab: Tie;

  class Trait1 extends Trait {
    value = 0;
  }

  class Trait2 extends Trait {
    value = 0;
  }

  const select = createSelector(Trait1);

  beforeEach(() => {
    realm = new Realm();

    a = realm.unit('1');
    b = realm.unit('2');
    ab = a.as(Ties).tie(b);
  });

  it('should watch', () => {
    let [units, emitter] = select(realm);
    emitter.subscribe((v) => units = v)

    units.should.have.length(0);

    a.as(Trait1);
    units.should.have.length(1);

    b.as(Trait1);
    units.should.have.length(2);

    ab.root.as(Trait2);
    units.should.have.length(2);

    b.drop(Trait1);
    units.should.have.length(1);
    ab.break();
    units.should.have.length(1);

    emitter.dispose();
    realm.despawn(a, b, ab.root);
    units.should.have.length(1);
  });
});
