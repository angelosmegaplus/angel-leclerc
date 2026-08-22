# FlamingBox Fusion — Firefox → Chromium port plan

Base engine: Chromium `8c7281d3300aa386be904fb9ee881babe85e12dc`
Firefox reference: `5b17b585c394a469267f65da3f9794162dd9c5a5`

FlamingBox does not attempt to run Gecko and Blink simultaneously. Chromium remains the only rendering/runtime engine. Firefox code is used as a behavioral and implementation reference for features that are ported into Chromium-compatible components.

## Priority 0 — Stability

- Preserve Chromium Network Service, process sandbox, Site Isolation, GPU process and native cache.
- No JavaScript interception layer for every network request.
- No synchronous disk reads in request hot paths.
- Keep Chromium crash handling and process model intact.

## Priority 1 — Privacy

- Total-cookie-protection-style storage partitioning using Chromium StoragePartition / NetworkIsolationKey primitives.
- Global Privacy Control (`Sec-GPC: 1`).
- Do Not Track (`DNT: 1`) as an optional compatibility signal.
- HTTPS-First / HTTPS-Upgrades.
- Third-party tracking protection with per-site exceptions.
- Private browsing profile with ephemeral storage.

## Priority 2 — Anti-tracking and compatibility

- Curated tracker lists compiled into efficient host/domain matchers.
- Smart compatibility exceptions when blocking breaks authentication, checkout or embedded content.
- Never blanket-whitelist payment domains; permissions remain scoped to the current top-level site/session.
- Privacy report showing blocked trackers and storage partitions.

## Priority 3 — Anti-fingerprinting

- Reduce high-entropy APIs where Chromium already exposes preference/feature hooks.
- User-agent and client-hints policy designed for compatibility rather than unique spoofed fingerprints.
- Canvas/WebGL/audio protections only where they do not create a more unique browser fingerprint.

## Priority 4 — FlamingBox identity

- Product name, icon, first-run page and settings branded FlamingBox / Angel OS.
- Dedicated `flamingbox://privacy` and `flamingbox://about` pages.
- Import bookmarks/history from Chromium-family browsers and Firefox without importing secrets silently.

## Explicitly not merged

- Gecko rendering engine.
- SpiderMonkey JavaScript engine.
- Firefox XUL/browser UI runtime.
- Firefox networking stack as a second parallel network stack.

Those components would conflict with Blink/V8/Chromium's process and network architecture and would make the resulting application unmaintainable.
