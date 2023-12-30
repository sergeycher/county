import 'should';
import {Serializable, Trait} from "./trait";
import {Traits} from "./traits";
import {ChangeEvent, CreateEvent, DeleteEvent, TraitsEvent} from "./events";
import {last} from "../utils";

class SimpleTrait extends Trait {
  value = 1;
}

@Trait.register('test')
class SerializableTrait extends Trait implements Serializable<number> {
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
  let events: TraitsEvent[] = [];

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
    events[0].should.be.instanceof(CreateEvent);
    events[1].should.be.instanceof(ChangeEvent);
    root.as(SimpleTrait).should.be.exactly(s);

    root.drop(SimpleTrait);
    events.should.have.length(3);
    last(events).should.be.instanceof(DeleteEvent);

    root.as(SimpleTrait).should.be.not.exactly(s);
    events.should.have.length(5);

    root.change(SimpleTrait, s => s.value = 5);
    events.should.have.length(6);
    last(events).should.be.instanceof(ChangeEvent);
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
