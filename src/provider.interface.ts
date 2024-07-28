import { ProviderScope } from "./constants";

export type ProviderClass<T> = new (...args: any[]) => T;

export type ProviderType = "class" | "constant";

interface BaseProviderDef {
  providerType: ProviderType;
}

export interface IProviderDef<T> extends BaseProviderDef {
  ctor: ProviderClass<T>;
  injectionTokens: string[];
  instance?: T;
  providerType: "class";
  scope: ProviderScope;
}

export interface IConstantDef<T> extends BaseProviderDef {
  instance: T;
  providerType: "constant";
}
