import 'should';
import {Realm} from "./realm";
import {Unit} from "./unit";
import {Trait} from "./traits/trait";

class Trait1 extends Trait {
  unit = Unit.inject();
}

describe('Units', () => {
  let realm = new Realm();

  beforeEach(() => {
    realm = new Realm();
  });

  it('should be persistent', () => {
    const a = realm.unit();
    const b = realm.unit('b');

    realm.unit(a.id).should.be.exactly(a);
    realm.unit('b').should.be.exactly(b);

    const c = realm.unit('c', false);
    (c == null).should.be.true();
  });

  it('should select by traits', () => {
    const a = realm.unit().as(Trait1);
    const b = realm.unit();
    b.should.not.be.exactly(a);

    const units = realm.select(Trait1);
    units.should.have.length(1);
    units[0].should.be.exactly(a.unit);
  });

  it('should inject unit', () => {
    const a = realm.unit();
    a.as(Trait1).unit.should.be.exactly(a);
  });
});
