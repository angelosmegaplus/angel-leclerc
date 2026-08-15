import { createHash, timingSafeEqual } from "node:crypto";
import { createServerFn } from "@tanstack/react-start";

const DEFAULT_PIN_HASH = "051c2e380d07844ffaca43743957f8c0efe2bdf74c6c1e6a9dcccb8d1a3c596b";

function pinHash(pin: string) {
  return createHash("sha256").update(pin).digest("hex");
}

export const verifyFilmAccessPin = createServerFn({ method: "POST" })
  .validator((input: { pin: string }) => ({ pin: String(input?.pin ?? "").replace(/\D/g, "").slice(0, 8) }))
  .handler(async ({ data }) => {
    const expected = (process.env.FILMS_SERIES_PIN_SHA256 || DEFAULT_PIN_HASH).trim().toLowerCase();
    const received = pinHash(data.pin);
    const left = Buffer.from(received, "hex");
    const right = Buffer.from(expected, "hex");
    const ok = left.length === right.length && timingSafeEqual(left, right);
    if (!ok) throw new Error("CODE REFUSÉ");
    return { ok: true as const };
  });
