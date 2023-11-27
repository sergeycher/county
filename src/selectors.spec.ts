import 'should';
import {Realm} from "./realm";
import {Unit} from "./units/unit";
import {Tie} from "./ties/tie";
import {createSelector} from "./selector";
import {Trait} from "./traits/trait";

describe('Selectors', () => {
  let realm = new Realm();
  let a: Unit, b: Unit;
  let ab: Tie;

  class Trait1 extends Trait {
    value = 0;
  }

  const select = createSelector(Trait1);

  beforeEach(() => {
    realm = new Realm();

    a = realm.unit('1');
    b = realm.unit('2');
    ab = realm.tie(a, b);
  });

  it('should watch', () => {
    let [units, emitter] = select(realm);
    emitter.subscribe((v) => units = v)

    units.should.have.length(0);

    a.as(Trait1);
    units.should.have.length(1);

    b.as(Trait1);
    units.should.have.length(2);

    ab.as(Trait1);
    units.should.have.length(2);

    b.drop(Trait1);
    units.should.have.length(1);
    realm.despawn(ab);
    units.should.have.length(1);

    emitter.dispose();
    realm.despawn(a, b, ab);
    units.should.have.length(1);
  });
});
