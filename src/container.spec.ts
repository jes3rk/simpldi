import { beforeEach, describe, expect, inject, it } from "vitest";
import { Container } from "./container";
import { Inject } from "./decorators";
import { randomUUID } from "crypto";
import { IAfterInit } from "./lifecycle.interfaces";
import { ProviderScope } from "./constants";

describe("Container", {}, () => {
  const token = "token";
  const noArgsToken = "noArgs";
  const withArgsToken = "withArgs";
  let rootContainer: Container;
  class ProviderWithNoArgs {
    public readonly uniqueId: string;

    constructor() {
      this.uniqueId = randomUUID();
    }
    public sayHello(): string {
      return "Hello World";
    }
  }

  class ProviderWithOneArg {
    public readonly uniqueId: string;

    constructor(
      @Inject(noArgsToken) public readonly noArgsService: ProviderWithNoArgs,
    ) {
      this.uniqueId = randomUUID();
    }
  }

  beforeEach(() => {
    rootContainer = new Container();
  });

  describe(
    "basic functionality of a single container with no nested constructors",
    {},
    () => {
      it("should add a provider and enable retrival", {}, async () => {
        rootContainer.addProvider(token, ProviderWithNoArgs);

        const resolved = await rootContainer.resolveProvider(token);

        expect(resolved).toBeInstanceOf(ProviderWithNoArgs);
      });

      it("should cache an already retrieved provider", {}, async () => {
        const token = "token";
        rootContainer.addProvider(token, ProviderWithNoArgs);

        const resolved1 =
          await rootContainer.resolveProvider<ProviderWithNoArgs>(token);
        const resolved2 =
          await rootContainer.resolveProvider<ProviderWithNoArgs>(token);

        expect(resolved1.uniqueId).toEqual(resolved2.uniqueId);
      });
    },
  );

  describe(
    "complex functionality of a single container with recursive constructors",
    {},
    () => {
      beforeEach(() => {
        rootContainer.addProvider(noArgsToken, ProviderWithNoArgs);
      });

      it("should resolve a provider with a single dependent", {}, async () => {
        rootContainer.addProvider(withArgsToken, ProviderWithOneArg);

        const resolved =
          await rootContainer.resolveProvider<ProviderWithOneArg>(
            withArgsToken,
          );

        expect(resolved).toBeInstanceOf(ProviderWithOneArg);
        expect(resolved.noArgsService).not.toBeUndefined();
      });

      it("should cache internal providers as singletons", {}, async () => {
        rootContainer.addProvider(withArgsToken, ProviderWithOneArg);

        const withArgsResolved =
          await rootContainer.resolveProvider<ProviderWithOneArg>(
            withArgsToken,
          );
        const noArgsResolved =
          await rootContainer.resolveProvider<ProviderWithNoArgs>(noArgsToken);

        expect(withArgsResolved.noArgsService.uniqueId).toEqual(
          noArgsResolved.uniqueId,
        );
      });
    },
  );

  describe("nested containers", {}, () => {
    it(
      "should resolve a provider from the parent using the child",
      {},
      async () => {
        rootContainer.addProvider(token, ProviderWithNoArgs);

        const childContainer = new Container(rootContainer);

        expect(await childContainer.resolveProvider(token)).toBeInstanceOf(
          ProviderWithNoArgs,
        );
      },
    );

    it(
      "should not resolve a provider in the parent that has a dependency on a child",
      {},
      async () => {
        const childToken = "child";
        const parentToken = "parent";
        class ChildDependent {}
        class ParentToResolve {
          constructor(
            @Inject(childToken) public readonly child: ChildDependent,
          ) {}
        }

        rootContainer.addProvider(parentToken, ParentToResolve);
        const childContainer = new Container(rootContainer);
        childContainer.addProvider(childToken, ChildDependent);

        await expect(() =>
          childContainer.resolveProvider(parentToken),
        ).rejects.toThrowError();
      },
    );

    it(
      "should resolve a child if the same token is registered to both the parent and child",
      {},
      async () => {
        rootContainer.addProvider(token, ProviderWithNoArgs);
        const childContainer = new Container(rootContainer);
        childContainer.addProvider(token, ProviderWithNoArgs);

        const parentResolved =
          await rootContainer.resolveProvider<ProviderWithNoArgs>(token);
        const childResolved =
          await childContainer.resolveProvider<ProviderWithNoArgs>(token);

        expect(parentResolved.uniqueId).not.toEqual(childResolved.uniqueId);
      },
    );
  });

  describe("lifetime scopes", {}, async () => {
    it(
      "should resolve a transient provider each time it is requested",
      {},
      async () => {
        rootContainer.addProvider(token, ProviderWithNoArgs, {
          scope: ProviderScope.TRANSIENT,
        });

        const resolution1 =
          await rootContainer.resolveProvider<ProviderWithNoArgs>(token);
        const resolution2 =
          await rootContainer.resolveProvider<ProviderWithNoArgs>(token);

        expect(resolution1.uniqueId).not.toEqual(resolution2.uniqueId);
      },
    );

    it(
      "should cause any provider that is dependent on a transient provider to be transient",
      {},
      async () => {
        rootContainer.addProvider(noArgsToken, ProviderWithNoArgs, {
          scope: ProviderScope.TRANSIENT,
        });
        rootContainer.addProvider(withArgsToken, ProviderWithOneArg);

        const resolution1 =
          await rootContainer.resolveProvider<ProviderWithOneArg>(
            withArgsToken,
          );
        const resolution2 =
          await rootContainer.resolveProvider<ProviderWithOneArg>(
            withArgsToken,
          );

        expect(resolution1.uniqueId).not.toEqual(resolution2.uniqueId);
      },
    );
  });

  describe("lifecycle methods", {}, () => {
    it("should call the afterInit method if it exists", {}, async () => {
      class LifecycleProvider implements IAfterInit {
        private afterInitCalls: number = 0;
        get calls(): number {
          return this.afterInitCalls;
        }

        afterInit(): void | Promise<void> {
          this.afterInitCalls++;
        }
      }

      rootContainer.addProvider(token, LifecycleProvider);

      const resolved =
        await rootContainer.resolveProvider<LifecycleProvider>(token);

      expect(resolved.calls).toEqual(1);
    });
  });
});
