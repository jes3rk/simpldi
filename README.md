# simpldi

A simple dependency injection library for Typescript.

## Usage

```ts
// Create a container instance
const container = new Container();

// Add a user as a constant provider
container.addConstant("User", {
  id: 1,
  email: "jon.doe@gmail.com",
});

////

// Get the previously stored user
const user = await container.resolveProvider("User");
```

### Provider Scope

The default scope for a provider is a singleton.
This behavior can be changed and instead the container will provide a new instance of the dependency for each resolution.

### Container Lifetime

All providers registered to a container can depend on other providers in that container or on any parent containers.
This structure allows for the creation of multiple child containers to force scoping or to enforce a specific lifetime for provider instances.

For example, imagine a webserver with a single root container with database connections and the like.
This structure works well for global providers but for providers and content that is specific to a given HTTP request, this pattern falls short.
To get around this limitations, a developer could add a child container to each incomming request and add the request specific providers to the container, giving each request its own instances of providers, for example for tenant specific database connections.
