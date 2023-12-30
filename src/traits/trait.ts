import {traitName, TraitsRegistry} from "./traits-registry";
import {TRAIT} from "./decorators";

export interface Serializable<D> {
  serialize(): D;

  deserialize(data: D): void;
}

export type TC<T extends Trait = Trait> = new () => T;

export class Trait implements Serializable<any> {
  /**
   * Find trait in registry by name
   */
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

  /**
   * If throws an error trait will be immediately removed from unit
   * Error will be rethrow
   */
  onAfterCreate() {

  }

  onBeforeDrop() {

  }

  serialize(): any {
    return true;
  }

  deserialize(data: any) {

  }
}
