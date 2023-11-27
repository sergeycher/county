# County

State manager based on traits, inspired by Entity-Component-System principle.

```typescript
import {Realm, Ties, Trait} from 'county';

@Trait.register('town')
class Town extends Trait {
  name = '';

  get neighbours(): Town[] {
    return this.as(Ties).list('both', [Town])
      .flatMap(({source, dest}) => {
        return [source, dest].filter(t => t !== this.$entity);
      })
      .map(u => u.as(Town));
  }
}

const realm = new Realm();

const a = realm.unit('town:vivalia').as(Town).change(c => c.name = 'Vivalia');
const b = realm.unit('town:egoset').as(Town).change(c => c.name = 'Egoset');

a.as(Ties).connect(b);

console.log(a.neighbours.map(t => t.name)); // [Egoset]
console.log(b.neighbours.map(t => t.name)); // [Vivalia]

```
