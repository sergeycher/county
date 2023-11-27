import {Realm} from "./realm";
import {ChangeEvent, CreateEvent, TraitsEvent} from "./traits/events";
import 'should';
import {Unit} from "./units/unit";
import {Tie} from "./ties/tie";

import {Trait} from "./traits/trait";

describe('Events', () => {
  let realm = new Realm();
  let events: TraitsEvent[] = [];
  let a: Unit, b: Unit;
  let ab: Tie;

  class Trait1 extends Trait {
    value = 0;
  }

  beforeEach(() => {
    realm = new Realm();
    events = [];

    realm.subscribe((e) => {
      events.push(e);
    });

    a = realm.unit('1');
    b = realm.unit('2');
    ab = realm.tie(a, b);
  });

  it('should emit units', () => {
    events.should.have.length(7); // 2 units + 2 ties + 4 TiesTrait
    events[0].should.be.instanceof(CreateEvent);
    events[1].should.be.instanceof(CreateEvent);
    events[3].should.be.instanceof(CreateEvent);

    const despawned = realm.despawn(a);
    despawned.should.have.length(2);
    events.should.have.length(9);

    realm.despawn(b);
    events.should.have.length(10);
  });

  it('should emit traits', () => {
    a.as(Trait1);

    events.should.have.length(9);

    a.as(Trait1).change((t) => {
      t.value++;
    });

    events.should.have.length(10);

    events[7].should.be.instanceof(CreateEvent);
    events[7].target.should.be.exactly(a.req(Trait1));

    events[8].should.be.instanceof(ChangeEvent);
    events[8].target.should.be.exactly(a.req(Trait1));
  });
});
