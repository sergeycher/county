import {TC} from "./types";
import {traitName, TraitsRegistry} from "./traits-registry";
import {TRAIT} from "./decorators";
import {Entity} from "../core/types";
import {ChangeEvent} from "./events";
import {Traits} from "./traits";

export class Trait {
  static find(name: string): TC | undefined {
    return TraitsRegistry.get().find(name);
  }

  /**
   * Decorator
   */
  static register(name: string) {
    return TRAIT(name);
  }

  get $name(): string {
    return traitName(this.constructor as TC);
  }

  get $entity(): Entity & Traits {
    return Traits.of(this) as any;
  }

  get $id() {
    return this.$entity.id;
  }

  change(doer?: (self: this) => any) {
    if (doer) {
      doer(this);
    }

    Traits.of(this).events.next(new ChangeEvent(this));

    return this;
  }

  as<T extends Trait>(Trt: TC<T>): T {
    return Traits.of(this).as(Trt);
  }

  req<T extends Trait>(Trt: TC<T>): T {
    return Traits.of(this).req(Trt);
  }

  has<T extends Trait>(...Trt: TC<T>[]) {
    return Traits.of(this).has(...Trt);
  }

  onBeforeDrop() {

  }

  serialize(): any {
    return true;
  }

  deserialize(data: any) {

  }
}
