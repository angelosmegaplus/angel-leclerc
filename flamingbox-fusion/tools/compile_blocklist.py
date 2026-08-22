#!/usr/bin/env python3
"""Compile simple host-style blocker rules into a deterministic binary-safe table.

This intentionally runs at build/update time, never on Chromium's request hot path.
It accepts common host rules such as ||tracker.example^ and plain domains. Complex
cosmetic/regex rules are ignored until a native Chromium matcher is wired in.
"""

from __future__ import annotations

import argparse
import hashlib
import json
import re
from pathlib import Path

HOST_RE = re.compile(r"^[a-z0-9.-]+$", re.I)


def normalize(line: str) -> str | None:
    line = line.strip()
    if not line or line.startswith(("!", "[", "#")):
        return None
    if line.startswith("@@"):
        return None
    if line.startswith("||") and line.endswith("^"):
        line = line[2:-1]
    if line.startswith("0.0.0.0 ") or line.startswith("127.0.0.1 "):
        parts = line.split()
        if len(parts) >= 2:
            line = parts[1]
    line = line.lower().rstrip(".")
    if "/" in line or "*" in line or "$" in line or "?" in line:
        return None
    if not HOST_RE.fullmatch(line) or "." not in line:
        return None
    return line


def main() -> int:
    parser = argparse.ArgumentParser()
    parser.add_argument("inputs", nargs="+", type=Path)
    parser.add_argument("--out", required=True, type=Path)
    parser.add_argument("--meta", required=True, type=Path)
    args = parser.parse_args()

    domains: set[str] = set()
    source_hashes: dict[str, str] = {}
    for path in args.inputs:
        data = path.read_bytes()
        source_hashes[str(path)] = hashlib.sha256(data).hexdigest()
        for raw in data.decode("utf-8", errors="ignore").splitlines():
            host = normalize(raw)
            if host:
                domains.add(host)

    ordered = sorted(domains)
    payload = "\n".join(ordered) + ("\n" if ordered else "")
    args.out.parent.mkdir(parents=True, exist_ok=True)
    args.out.write_text(payload, encoding="utf-8", newline="\n")

    meta = {
        "format": "flamingbox-hostset-v1",
        "count": len(ordered),
        "sha256": hashlib.sha256(payload.encode()).hexdigest(),
        "sources": source_hashes,
        "runtimePolicy": "load-once-into-memory; no per-request disk reads",
    }
    args.meta.write_text(json.dumps(meta, indent=2, sort_keys=True) + "\n", encoding="utf-8")
    print(f"Compiled {len(ordered)} domains -> {args.out}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
