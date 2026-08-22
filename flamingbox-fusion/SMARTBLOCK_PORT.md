# FlamingBox SmartBlock port

Reference implementation: Firefox `5b17b585c394a469267f65da3f9794162dd9c5a5`, especially `browser/extensions/webcompat/experiment-apis/trackingProtection.js`.

## Behavior to preserve

Firefox's compatibility layer does not globally disable tracking protection. It evaluates a blocked resource together with its top-level host and request type, then chooses one of three outcomes:

1. keep the resource blocked;
2. replace/shim the blocked resource with a compatibility substitute;
3. allow that specific resource for a scoped top-level-site exception.

Private browsing uses a separate allowlist/session state.

## FlamingBox native design

FlamingBox will implement the same behavior over Chromium primitives rather than XPCOM/Gecko:

- classification input: target URL, top-level SchemefulSite, resource type, off-the-record state;
- blocking hook: Chromium browser/network request policy, never page JavaScript;
- matcher: precompiled domain/pattern tables kept in memory;
- compatibility rule: `{targetPatterns, topLevelHosts, resourceTypes, action}`;
- actions: `block`, `allow_scoped`, `shim`;
- private state: stored only on the off-the-record profile and destroyed with it;
- payment/login handling: scoped rules may be granted only for the current top-level site/session, never a universal payment-domain whitelist;
- telemetry: local counters only by default; no URL history is sent to FlamingBox infrastructure.

## Rule priority

1. explicit user per-site bypass;
2. exact SmartBlock compatibility rule;
3. tracker classification;
4. normal Chromium request handling.

A compatibility allow never disables TLS checks, Site Isolation, Safe Browsing, sandboxing or Chromium's permission model.

## Performance requirements

- zero synchronous disk reads on the request hot path;
- rules loaded once and atomically swapped on update;
- host suffix lookup rather than regex scanning over the entire list;
- no JavaScript `webRequest` interception;
- no second HTTP/network stack.

## Status

Design locked. The first native FlamingBox build ships Chromium-native GPC, storage partitioning, HTTPS-First and DNT while this request-classifier port is implemented and tested separately. It must not be enabled in production until Chromium browser/network tests pass for Google search, OAuth, Stripe/3-D Secure style flows, downloads and WebSocket traffic.
