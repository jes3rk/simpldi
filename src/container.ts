import {
  INTERNAL_PROP_SCOPE,
  META_CONSTRUCTOR_PARAMS,
  ProviderScope,
} from "./constants";
import { IAfterInit } from "./lifecycle.interfaces";
import {
  IConstantDef,
  IProviderDef,
  ProviderClass,
} from "./provider.interface";

interface AddProviderOpts {
  scope?: ProviderScope;
}

export class Container {
  private readonly parent?: Container;
  private readonly providers: Map<
    string,
    IProviderDef<unknown> | IConstantDef<unknown>
  >;

  public constructor();
  public constructor(parent: Container);
  public constructor(parent?: Container) {
    this.parent = parent;
    this.providers = new Map();
  }

  public addProvider<T>(token: string, provider: ProviderClass<T>): void;
  public addProvider<T>(
    token: string,
    provider: ProviderClass<T>,
    opts: AddProviderOpts,
  ): void;
  public addProvider<T>(
    token: string,
    provider: ProviderClass<T>,
    opts?: AddProviderOpts,
  ): void {
    const { scope = ProviderScope.SINGLETON } = opts || {};
    this.providers.set(token, {
      ctor: provider,
      injectionTokens:
        Reflect.getOwnMetadata(META_CONSTRUCTOR_PARAMS, provider) || [],
      scope,
      providerType: "class",
    });
  }

  /**
   * Add a constant value to the container. All constants are provided
   * as singletons.
   */
  public addConstant<T>(token: string, constant: T): void {
    this.providers.set(token, {
      providerType: "constant",
      instance: constant,
    });
  }

  public createChildContainer(): Container {
    return new Container(this);
  }

  public async resolveProvider<T>(token: string): Promise<T> {
    const definition = this.providers.get(token);
    if (!definition) {
      const parentProvider = await this.parent?.resolveProvider<T>(token);
      if (!parentProvider)
        throw new Error(`Token: ${token} is not registered in this context`);
      return parentProvider;
    }

    switch (definition.providerType) {
      case "class":
        return this.resolveClassProvider<T>(definition as IProviderDef<T>);
      case "constant":
        return definition.instance as T;
      default:
        throw new Error("Undefined provider type");
    }
  }

  private async resolveClassProvider<T>(
    definition: IProviderDef<T>,
  ): Promise<T> {
    if (definition.instance) return definition.instance as T;

    const provider = await this.constructProvider(definition);
    if (
      definition.scope === ProviderScope.SINGLETON &&
      (provider as any)[INTERNAL_PROP_SCOPE] === ProviderScope.SINGLETON
    ) {
      definition.instance = provider;
    }

    return provider as T;
  }

  private async constructProvider<T>(definition: IProviderDef<T>): Promise<T> {
    const injectableProviders = [];
    let scope = definition.scope;
    for (var token of definition.injectionTokens) {
      const injectableProvider = await this.resolveProvider<any>(token);
      const injectableScope = injectableProvider[INTERNAL_PROP_SCOPE];
      if (injectableScope === ProviderScope.TRANSIENT) {
        scope = ProviderScope.TRANSIENT;
      }
      injectableProviders.push(injectableProvider);
    }
    const instance = new definition.ctor(...injectableProviders);
    (instance as any)[INTERNAL_PROP_SCOPE] = scope;
    await (instance as IAfterInit).afterInit?.();
    return instance;
  }
}
