import {Realm} from "./realm";
import {TraitsEvent} from "./traits/events";
import 'should';
import {Unit} from "./unit";
import {Trait} from "./traits/trait";
import {Ties} from "./ties/ties.trait";
import {Tie} from "./ties/tie.trait";

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
    ab = a.as(Ties).tie(b);
  });

  it('should emit units', () => {

  });

  it('should emit traits', () => {

  });
});
