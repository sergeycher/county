export interface Entity {
  readonly id: string;
}

export type ConstructorOf<T> = new (...params: any[]) => T;
