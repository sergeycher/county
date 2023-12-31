import {Trait} from "./trait";
import {Unit} from "../unit";
import {eventFactory, eventFilter, when} from "../core/events";

export enum EventType {
  create = 'create',
  delete = 'delete',
  change = 'change'
}

export const Change = eventFactory(EventType.change);
export const Create = eventFactory(EventType.create);
export const Delete = eventFactory(EventType.delete);

export const OnTrait = {
  create: eventFilter('create', Trait),
  delete: eventFilter('delete', Trait),
  change: eventFilter('change', Trait)
}

export const OnUnit = {
  create: eventFilter('create', Unit),
  delete: eventFilter('delete', Unit),
  when: (t: EventType) => when(t, Unit)
}
