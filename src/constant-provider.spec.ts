import { beforeEach, describe, expect, it } from "vitest";
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
