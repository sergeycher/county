import 'should';
import {Serializable, TRAIT, Trait} from "./trait";
import {Traits} from "./traits";
import {last} from "../core/utils";
import {CountyEvent} from "../core/events";
import {EventType} from "./events";
import {Unit} from "../unit";

class SimpleTrait {
  value = 1;
}

// @ts-ignore
@TRAIT('test')
class SerializableTrait implements Serializable<number> {
  value = 1;

  serialize(): number {
    return this.value;
  }

  deserialize(data: number) {
    this.value = data;
  }
}

describe('Traits', () => {
  let root = new Traits();
  let events: CountyEvent<EventType, Unit | Trait>[] = [];

  beforeEach(() => {
    root = new Traits();
    events = [];

    root.events.subscribe((e) => {
      events.push(e);
    });
  });

  it('basic functions and events', () => {
    const s = root.as(SimpleTrait);
    events.should.have.length(2);
    events[0].type.should.be.exactly(EventType.create);
    events[1].type.should.be.exactly(EventType.change);
    root.as(SimpleTrait).should.be.exactly(s);

    root.drop(SimpleTrait);
    events.should.have.length(3);
    last(events).type.should.be.exactly(EventType.delete);

    root.as(SimpleTrait).should.be.not.exactly(s);
    events.should.have.length(5);

    root.change(SimpleTrait, s => s.value = 5);
    events.should.have.length(6);
    last(events).type.should.be.exactly(EventType.change);
  });

  it('serialization', () => {
    const t = root.as(SerializableTrait);

    root.serialize().should.be.deepEqual({'test': 1});

    root.clear();
    root.has(SerializableTrait).should.be.false();

    root.deserialize({test: 5});

    root.req(SerializableTrait).value.should.be.exactly(5);
  });
});
