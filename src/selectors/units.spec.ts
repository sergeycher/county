import 'should';
import {Realm} from "../realm";
import {Trait} from "../traits";
import {Units} from "./units";
import {Ties} from "../ties";

describe('Units selector', () => {
  let realm = new Realm();

  class Trait1 extends Trait {
    value = 0;
  }

  class Trait2 extends Trait {
    value = 0;
  }

  beforeEach(() => {
    realm = new Realm();
  });

  it('should select', () => {
    realm.unit().change(Trait1).as(Ties).tie(realm.unit().change(Trait2));

    const u1 = Units.select(realm, u => u.has(Trait1));
    const u2 = u1.pipe(u => u.as(Ties).select('out', [], [Trait2]));

    u2.items.should.have.length(1);
  });

  it('should watch', () => {
    const a = realm.unit().change(Trait1);
    const b = realm.unit().change(Trait2);

    const u1 = Units.select(realm, u => u.has(Trait1));
    const u2 = u1.pipe(u => u.as(Ties).select('out', [], [Trait2]));

    u1.items.should.have.length(1);
    u2.items.should.have.length(0);

    a.as(Ties).tie(b);

    u1.items.should.have.length(1);
    u2.items.should.have.length(1);

    const c = realm.unit().change(Trait1);
    const d = realm.unit().change(Trait1);

    a.as(Ties).tie(c);
    a.as(Ties).tie(b).break();

    u1.items.should.have.length(3);
    u2.items.should.have.length(0);

    d.as(Ties).tie(b);

    u2.items.should.have.length(1);
  });
});
