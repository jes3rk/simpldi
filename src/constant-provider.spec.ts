import { beforeEach, describe, expect, it, vi } from "vitest";
import { Container } from "./container";

describe("Container - Constant Provider", {}, () => {
  let rootContainer: Container;

  beforeEach(() => {
    rootContainer = new Container();
  });

  it("should provide a constant", {}, async () => {
    const token = "constant";
    const value = "Hello world";

    rootContainer.addConstant(token, value);

    expect(await rootContainer.resolveProvider<string>(token)).toEqual(value);
  });
});

describe("Container - Factory Provider", {}, () => {
  let rootContainer: Container;

  beforeEach(() => {
    rootContainer = new Container();
  });

  it("should resolve a mounted factory provider", {}, async () => {
    const token = "constant";
    const providerFn = vi.fn().mockResolvedValue({});

    rootContainer.addFactoryProvider(token, [], providerFn);

    await rootContainer.resolveProvider(token);

    expect(providerFn).toHaveBeenCalled();
  });
});
