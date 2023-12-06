import 'should';
import {Realm} from "./realm";
import {Unit} from "./units/unit";
import {Tie} from "./ties/tie";
import {Trait} from "./traits/trait";
import {TraitsError} from "./traits/traits";

class TraitForUnits extends Trait {
  unit = Unit.inject();
}

class TraitForTies extends Trait {
  unit = Tie.inject();
}

describe('Selectors', () => {
  let realm = new Realm();
  let a: Unit, b: Unit;
  let ab: Tie;

  beforeEach(() => {
    realm = new Realm();

    a = realm.unit('1');
    b = realm.unit('2');
    ab = realm.tie(a, b);
  });

  it('should inject', () => {
    a.as(TraitForUnits).unit.should.be.exactly(a);
    ab.as(TraitForTies).unit.should.be.exactly(ab);

    let err: any;

    try {
      a.as(TraitForTies).unit.should.be.exactly(a);
    } catch (e) {
      err = e;
    }

    err.should.be.instanceof(TraitsError);
  });
});
