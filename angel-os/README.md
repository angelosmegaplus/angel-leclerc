# Angel OS

Angel OS is a lightweight, modular, open-source core designed to be reused across different projects without imposing a specific interface, website, AI provider, database, or device.

The guiding model is the Linux ecosystem: a small common base, then distributions and products built on top of it.

## Architecture

```text
Host OS / Linux
   ↓
Angel OS Core
   ↓
Distributions (Angel OS IA, future variants)
   ↓
Adapters / apps / websites / desktop / embedded clients
```

Angel OS is **not** the current website and does not replace it. `angel-leclerc.fr` is a distinct web application that now consumes the `Angel OS IA` distribution through the `angel-leclerc.fr.web` adapter. The Core remains independently reusable and has no dependency on the website.

## Principles

- Core first, interface second.
- No dependency on the current website.
- Modules are optional and replaceable.
- Adapters isolate platform-specific code.
- Distributions compose modules without modifying the Core.
- Backward-compatible public APIs whenever possible.
- Safe-by-default configuration.
- Open-source and fork-friendly.

## Current status

`v0.1` establishes the reusable foundation: module registry, event bus, configuration, capability contracts and platform adapters.

The first distribution is `Angel OS IA`, which adds AI and automation capabilities above the base Core. `angel-leclerc.fr` boots that distribution as an application consumer and exposes a safe runtime status endpoint at `/api/angel-os/status`.

## License

Angel OS source code in this directory is intended to be distributed under GPL-2.0-only. Third-party components remain under their own licenses.
