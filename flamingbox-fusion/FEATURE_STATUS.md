# FlamingBox Native — feature status

Pinned base:
- Chromium `8c7281d3300aa386be904fb9ee881babe85e12dc`
- Firefox reference `5b17b585c394a469267f65da3f9794162dd9c5a5`

## Implemented in the native patch pipeline

- FlamingBox product branding on the Chromium build.
- Blink + V8 + Chromium Network Service remain the only active engine/runtime/network stack.
- Chromium process sandbox, Site Isolation, GPU process and native cache are preserved.
- Global Privacy Control forced through Chromium's native `GlobalPrivacyControlForce` feature.
- Third-party storage partitioning forced through Chromium's native `ThirdPartyStoragePartitioning` feature.
- Do Not Track enabled by default through Chromium's preference registry.
- HTTPS-First enabled by default through Chromium's existing HTTPS-Only preference.
- Incognito/private browsing remains Chromium's off-the-record profile implementation.
- Chromium's native popup blocker, permission model, download protection, password manager, extensions and DevTools remain available.
- Native Windows Release build script and post-patch validation script.

## Deliberately not forced by default

- Global blocking of every third-party cookie. Storage is partitioned instead, closer to Firefox Total Cookie Protection, to preserve payment/login compatibility. Chromium's user-facing third-party-cookie blocking remains available.
- Blanket payment-domain allowlists. Payment/auth exceptions must stay scoped and Chromium-managed.
- Canvas/WebGL/audio spoofing that would make FlamingBox users more fingerprintable.
- Google Chrome Sync/private Google API access. FlamingBox does not bypass Google's service restrictions or extract Google passwords silently.

## Next native ports

1. Efficient tracking-domain matcher inside Chromium, with no JavaScript request interception.
2. Per-site compatibility bypass inspired by Firefox SmartBlock.
3. FlamingBox privacy report UI backed by native counters.
4. Dedicated FlamingBox privacy/about WebUI pages.
5. Import UI for Firefox/Chromium bookmarks and history without silent secret import.
6. Rebase tooling for newer Chromium security releases.

A feature is not considered shipped until the exact Chromium checkout has been patched, validated and compiled successfully on Windows.
