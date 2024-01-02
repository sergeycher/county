import {Realm, Ties, TRAIT, Unit} from '../index';
import 'should';

@TRAIT('town')
class Town {
  name = '';

  readonly unit = Unit.inject();

  get neighbours(): Town[] {
    return this.unit.as(Ties).list('both', [Town])
      .flatMap(({src, dest}) => {
        return [src, dest].filter(t => t !== this.unit);
      })
      .map(u => u.as(Town));
  }
}

describe('Realm', () => {
  let realm = new Realm();

  beforeEach(() => {
    realm = new Realm();
  });

  it('ties', () => {
    const a = realm.unit('town:vivalia').as(Town, c => c.name = 'Vivalia');
    const b = realm.unit('town:egoset').as(Town, c => c.name = 'Egoset');

    a.unit.as(Ties).tie(b.unit);

    console.log(a.neighbours.map(t => t.name)); // [Egoset]
    console.log(b.neighbours.map(t => t.name)); // [Vivalia]
  });
});
