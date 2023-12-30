import {NAME_KEY, TraitsRegistry} from "./traits-registry";
import {TC} from "./trait";

/**
 * Декоратор для объявления атрибута. Без него атрибут не получит имени и не будет сериализоваться
 */
export function TRAIT(name: string) {
  return (target: TC) => {
    (target as any)[NAME_KEY] = name;
    TraitsRegistry.get().register(target);
  };
}
