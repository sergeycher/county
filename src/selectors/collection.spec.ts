import 'should';
import {Realm} from "../realm";
import {Collection} from "./collection";
import {Unit} from "../unit";
import {having_, Selector} from "./selector2";
import {Ties} from "../ties";

class Trait1 {
  value = 0;
}

class Trait2 {
  value = 0;
}

describe('Collections', () => {
  let realm = new Realm();
  const selector = Selector.create(having_(Trait1));

  beforeEach(() => {
    realm = new Realm();
  });

  it('should change', () => {
    const a = realm.unit('a').change(Trait1);
    const b = realm.unit('b').change(Trait1);

    const c = realm.unit('c').change(Trait2);
    const d = realm.unit('d').change(Trait2);

    const e = realm.unit('e').change(Trait1).change(Trait2);

    const ac = a.as(Ties).tie(c);

    const list1 = new Collection<Unit>();
    list1.add(...realm.select(Trait1));

    const items = list1.items;
    list1.items.should.have.length(3);

    list1.add(...realm.select(Trait1));
    list1.items.should.be.exactly(items);
  });
});
