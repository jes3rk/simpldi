import { ProviderScope } from "./constants";

export type ProviderClass<T> = new (...args: any[]) => T;

export interface IProviderDef<T> {
  ctor: ProviderClass<T>;
  injectionTokens: string[];
  instance?: T;
  scope: ProviderScope;
}
