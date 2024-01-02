import {eventFactory} from "../core/events";

export enum EventType {
  create = 'create',
  delete = 'delete',
  change = 'change'
}

export const Change = eventFactory(EventType.change);
export const Create = eventFactory(EventType.create);
export const Delete = eventFactory(EventType.delete);
