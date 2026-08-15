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

Angel OS is **not** the current website and does not replace it. The current site may consume Angel OS later through optional adapters, but the Core must remain independently usable.

## Principles

- Core first, interface second.
- No dependency on the current website.
- Modules are optional and replaceable.
- Adapters isolate platform-specific code.
- Distributions compose modules without modifying the Core.
- Backward-compatible public APIs whenever possible.
- Safe-by-default configuration.
- Open-source and fork-friendly.

## Storage

The native `Angel Storage` service remains the fast, independent storage layer. External providers can be added as replaceable adapters instead of becoming hard dependencies of the Core.

A Google Drive storage adapter is available at `adapters/google-drive-storage.server.ts`. It implements the same storage capability as native Angel Storage and is intended for large files, archives, attachments and backups. It uses Drive `appProperties` to keep Angel OS logical paths independent from the visible Drive folder layout.

Required server-side environment variables:

```text
GOOGLE_DRIVE_CLIENT_ID=
GOOGLE_DRIVE_CLIENT_SECRET=
GOOGLE_DRIVE_REFRESH_TOKEN=
GOOGLE_DRIVE_ROOT_FOLDER_ID=   # optional dedicated Angel OS folder
```

The recommended OAuth scope is `https://www.googleapis.com/auth/drive.file`, so Angel OS only manages files created or explicitly granted to the application. Secrets must remain in the server/runtime secret store and must never be committed to Git.

## Current status

`v0.1` establishes the reusable foundation: module registry, event bus, configuration, capability contracts and platform adapters.

The first distribution is `Angel OS IA`, which adds AI-oriented modules above the base Core.

## License

Angel OS source code in this directory is intended to be distributed under GPL-2.0-only. Third-party components remain under their own licenses.
