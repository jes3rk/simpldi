import { ProviderScope } from "./constants";

export type ProviderClass<T> = new (...args: any[]) => T;

export type ProviderType = "class" | "constant" | "factory";

interface BaseProviderDef {
  providerType: ProviderType;
}

interface MakeableProvider<T> extends BaseProviderDef {
  injectionTokens: string[];
  instance?: T;
  scope: ProviderScope;
}

export interface IProviderDef<T> extends MakeableProvider<T> {
  ctor: ProviderClass<T>;
  providerType: "class";
}

export interface IConstantDef<T> extends BaseProviderDef {
  instance: T;
  providerType: "constant";
}

export interface IFactoryDef<T> extends MakeableProvider<T> {
  providerType: "factory";
  factoryFn: (...args: any[]) => T | Promise<T>;
}
