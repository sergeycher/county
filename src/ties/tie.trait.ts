import {Lifecycle, Serializable} from "../traits/trait";
import {Unit} from "../unit";
import {Ties} from "./ties.trait";
import {TRAIT} from "../traits";

@TRAIT('-->')
export class Tie implements Serializable<[string, string]> {
  readonly root = Unit.inject();

  private units!: [Unit, Unit]; // src, dest | from, to | 0 -> 1

  private lifecycle = Lifecycle.of(this);

  get src(): Unit {
    return this.units[0];
  }

  get dest(): Unit {
    return this.units[1];
  }

  break() {
    this.root.despawn();
  }

  constructor() {
    if (this.root.has(Ties)) {
      throw new Error(`Unable to use Ties as Tie`);
    }

    this.lifecycle.on('drop:before', () => {
      this.units.forEach(u => u.find(Ties)?.remove(this));
    });
  }

  __init(src: Unit, dest: Unit): this {
    if (src === dest) {
      throw new Error('Unable connect unit to itself');
    }

    this.units = [src, dest];

    this.units.forEach(u => u.as(Ties).append(this));

    return this;
  }

  serialize(): [string, string] {
    return this.units.map(u => u.id) as [string, string];
  }

  deserialize(data: [string, string]) {
    const realm = this.root.realm;
    this.__init(realm.unit(data[0]), realm.unit(data[1]));
  }
}
