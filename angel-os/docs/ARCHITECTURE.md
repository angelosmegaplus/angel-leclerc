# Angel OS architecture

## Goal

Angel OS separates reusable system primitives from products built on top of them.

```text
Linux / host system
└── Angel OS Core
    ├── modules
    ├── events
    ├── configuration
    ├── capabilities
    └── adapters
        ├── web
        ├── server
        ├── desktop
        └── future embedded/mobile
            └── distributions
                └── Angel OS IA
```

## Non-invasive rule

The existing website is a consumer, never the Core. Angel OS must not import routes, UI components, Supabase tables, site content or deployment configuration from the current website.

Any future website integration must happen through an explicit adapter and feature flag so that disabling Angel OS restores the previous behaviour without migration.

## Linux relationship

Angel OS is not a replacement kernel. For desktop/server/embedded uses it should normally run above Linux and reuse mature Linux facilities. Linux-derived source code may only be incorporated after checking the original license and preserving the corresponding GPL obligations.

## Extension model

Third parties should add functionality through modules and adapters. Forking the Core should be the exception rather than the normal path.
