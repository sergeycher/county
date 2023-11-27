import {Traits} from "./traits";
import {ConstructorOf, Entity} from "../core/types";
import {Trait} from "./trait";

export type EventTargetEntity = (Traits & Entity);
export type EventTarget = EventTargetEntity | Trait;

export class TraitsEvent {
  get entity(): EventTargetEntity {
    if (this.target instanceof Trait) {
      return this.target.$entity as EventTargetEntity;
    } else {
      return this.target;
    }
  }

  constructor(readonly target: EventTarget) {
  }

  fromTarget<T>(c: ConstructorOf<T>): T {
    return (this.target instanceof c) ? this.target : undefined as T;
  }

  hasSomeTarget(...targets: ConstructorOf<EventTarget>[]) {
    return targets.some(t => this.target instanceof t);
  }
}

export class CreateEvent extends TraitsEvent {
  static from(e: TraitsEvent): CreateEvent | undefined {
    if (e instanceof CreateEvent) {
      return e;
    }
  }

  constructor(readonly target: EventTarget) {
    super(target);
  }
}

export class ChangeEvent extends TraitsEvent {
  constructor(readonly target: Trait) {
    super(target);
  }

  static from(e: TraitsEvent): ChangeEvent | undefined {
    if (e instanceof ChangeEvent) {
      return e;
    }
  }
}

export class DeleteEvent extends TraitsEvent {
  static from(e: TraitsEvent): DeleteEvent | undefined {
    if (e instanceof DeleteEvent) {
      return e;
    }
  }
}
