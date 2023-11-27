import {Trait} from "./trait";

export type TC<T extends Trait = Trait> = new () => T;
