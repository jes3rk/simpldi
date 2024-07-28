import { META_CONSTRUCTOR_PARAMS } from "./constants";

export const Inject: (token: string) => ParameterDecorator =
  (token: string) => (target, _, index) => {
    const existingTokens: string[] =
      Reflect.getOwnMetadata(META_CONSTRUCTOR_PARAMS, target) || [];
    existingTokens[index] = token;
    Reflect.defineMetadata(META_CONSTRUCTOR_PARAMS, existingTokens, target);
  };
