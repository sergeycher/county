import {TC} from "./types";
import {NAME_KEY, TraitsRegistry} from "./traits-registry";

/**
 * Декоратор для объявления атрибута. Без него атрибут не получит имени и не будет сериализоваться
 */
export function TRAIT(name: string) {
  return (target: TC) => {
    (target as any)[NAME_KEY] = name;
    TraitsRegistry.get().register(target);
  };
}
