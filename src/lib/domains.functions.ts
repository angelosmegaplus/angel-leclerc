import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { resolve4, resolve6, resolveCname } from "node:dns/promises";
import { requireAngelAuth } from "@/lib/auth/require-angel-auth";
import { assertAngelAdmin } from "@/lib/auth/require-admin";

const domainSchema = z.string().trim().toLowerCase().transform((value) => value.replace(/^https?:\/\//, "").replace(/\/.*$/, "").replace(/^www\./, "")).refine((value) => /^(?:[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?\.)+[a-z]{2,63}$/i.test(value), "Nom de domaine invalide");

type DomainEntry = {
  domain: string;
  createdAt: string;
};

type DomainState = {
  domains: DomainEntry[];
};

async function dataClient() {
  const { angelDataServerAdapter } = await import("../../angel-os/adapters/data.server");
  return angelDataServerAdapter.connect();
}

async function readState(): Promise<DomainState> {
  const client = await dataClient();
  return (await client.get<DomainState>("system", "domains")) ?? { domains: [] };
}

async function saveState(state: DomainState) {
  const client = await dataClient();
  await client.set("system", "domains", state);
}

function publicTargets() {
  return {
    ipv4: (process.env.ANGEL_PUBLIC_IPV4 || "").trim() || null,
    ipv6: (process.env.ANGEL_PUBLIC_IPV6 || "").trim() || null,
    canonical: (process.env.ANGEL_DOMAIN_TARGET || "").trim().replace(/\.$/, "") || null,
  };
}

export const listDomains = createServerFn({ method: "GET" })
  .middleware([requireAngelAuth])
  .handler(async ({ context }) => {
    await assertAngelAdmin(context);
    const state = await readState();
    return { domains: state.domains, targets: publicTargets() };
  });

export const addDomain = createServerFn({ method: "POST" })
  .middleware([requireAngelAuth])
  .inputValidator((input: unknown) => z.object({ domain: domainSchema }).parse(input))
  .handler(async ({ context, data }) => {
    await assertAngelAdmin(context);
    const state = await readState();
    if (!state.domains.some((item) => item.domain === data.domain)) {
      state.domains.push({ domain: data.domain, createdAt: new Date().toISOString() });
      await saveState(state);
    }
    return { ok: true, domain: data.domain };
  });

export const removeDomain = createServerFn({ method: "POST" })
  .middleware([requireAngelAuth])
  .inputValidator((input: unknown) => z.object({ domain: domainSchema }).parse(input))
  .handler(async ({ context, data }) => {
    await assertAngelAdmin(context);
    const state = await readState();
    state.domains = state.domains.filter((item) => item.domain !== data.domain);
    await saveState(state);
    return { ok: true };
  });

export const verifyDomain = createServerFn({ method: "POST" })
  .middleware([requireAngelAuth])
  .inputValidator((input: unknown) => z.object({ domain: domainSchema }).parse(input))
  .handler(async ({ context, data }) => {
    await assertAngelAdmin(context);
    const target = publicTargets();
    const [a, aaaa, cname, https] = await Promise.all([
      resolve4(data.domain).catch(() => [] as string[]),
      resolve6(data.domain).catch(() => [] as string[]),
      resolveCname(data.domain).catch(() => [] as string[]),
      fetch(`https://${data.domain}`, { method: "HEAD", redirect: "manual", signal: AbortSignal.timeout(7000) })
        .then((response) => ({ ok: response.status > 0 && response.status < 600, status: response.status }))
        .catch(() => ({ ok: false, status: null as number | null })),
    ]);

    const dnsOk = Boolean(
      (target.ipv4 && a.includes(target.ipv4)) ||
      (target.ipv6 && aaaa.includes(target.ipv6)) ||
      (target.canonical && cname.map((item) => item.replace(/\.$/, "")).includes(target.canonical))
    );

    return {
      domain: data.domain,
      dnsOk,
      httpsOk: https.ok,
      httpStatus: https.status,
      found: { a, aaaa, cname },
      targets: target,
      checkedAt: new Date().toISOString(),
    };
  });
