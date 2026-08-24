import { createFileRoute } from "@tanstack/react-router";
import { checkMistralRate } from "@/lib/mistral-rate.server";
import { supabaseAdmin } from "@/integrations/supabase/client.server";

const ENDPOINT = "https://api.mistral.ai/v1/chat/completions";
const MODEL = "mistral-small-latest";
const MAX_LENGTH = 5000;

const headers = {
  "Cache-Control": "no-store",
  "Content-Type": "application/json; charset=utf-8",
};

type Body = {
  action?: unknown;
  content?: unknown;
  kind?: unknown;
  scope?: unknown;
  confirmed?: unknown;
  targetType?: unknown;
  targetId?: unknown;
  reason?: unknown;
  details?: unknown;
};

type ModerationResult = {
  decision: "allow" | "review" | "block";
  severity: 0 | 1 | 2 | 3;
  categories: string[];
  reason?: string;
};

function ip(request: Request) {
  return request.headers.get("x-forwarded-for")?.split(",")[0]?.trim()
    || request.headers.get("x-real-ip")
    || "unknown";
}

async function authenticatedUser(request: Request) {
  const authorization = request.headers.get("authorization") || "";
  const token = authorization.toLowerCase().startsWith("bearer ") ? authorization.slice(7).trim() : "";
  if (!token) return null;
  const { data, error } = await supabaseAdmin.auth.getUser(token);
  if (error || !data.user) return null;
  return data.user;
}

async function classify(key: string, content: string, kind: string, scope: string): Promise<ModerationResult> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 15_000);
  try {
    const response = await fetch(ENDPOINT, {
      method: "POST",
      signal: controller.signal,
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${key}` },
      body: JSON.stringify({
        model: MODEL,
        temperature: 0,
        max_tokens: 220,
        response_format: { type: "json_object" },
        messages: [
          {
            role: "system",
            content:
              "Tu modères Flamme, un réseau social français. Analyse uniquement le contenu fourni. Retourne strictement un JSON: decision ('allow','review','block'), severity (0,1,2,3), categories (tableau parmi spam, harassment, hate, sexual, violence, self_harm, impersonation, scam, illegal, other) et reason (phrase très courte). Utilise 'block' uniquement pour un contenu manifestement grave ou interdit, une arnaque évidente, du spam massif, des menaces explicites, de la haine explicite ou une usurpation manifeste. 'review' signifie qu'une vérification humaine est préférable. Ne déduis jamais l'identité, l'origine, la religion, l'orientation ou la santé de l'auteur.",
          },
          { role: "user", content: `Type: ${kind}\nPortée: ${scope}\nContenu:\n${content}` },
        ],
      }),
    });
    if (!response.ok) return { decision: "allow", severity: 0, categories: [], reason: "upstream_error" };
    const payload = (await response.json()) as { choices?: Array<{ message?: { content?: unknown } }> };
    const raw = payload.choices?.[0]?.message?.content;
    if (typeof raw !== "string") return { decision: "allow", severity: 0, categories: [] };
    let parsed: { decision?: unknown; severity?: unknown; categories?: unknown; reason?: unknown } = {};
    try { parsed = JSON.parse(raw) as typeof parsed; } catch { return { decision: "allow", severity: 0, categories: [] }; }
    const decision: ModerationResult["decision"] = parsed.decision === "block" ? "block" : parsed.decision === "review" ? "review" : "allow";
    const numericSeverity = typeof parsed.severity === "number" ? Math.max(0, Math.min(3, Math.round(parsed.severity))) : 0;
    const severity = numericSeverity as ModerationResult["severity"];
    const allowedCategories = new Set(["spam", "harassment", "hate", "sexual", "violence", "self_harm", "impersonation", "scam", "illegal", "other"]);
    const categories = Array.isArray(parsed.categories)
      ? parsed.categories.filter((value): value is string => typeof value === "string" && allowedCategories.has(value)).slice(0, 5)
      : [];
    const reason = typeof parsed.reason === "string" ? parsed.reason.slice(0, 240) : undefined;
    return { decision, severity, categories, reason };
  } finally {
    clearTimeout(timeout);
  }
}

async function targetContent(targetType: string, targetId: string) {
  if (targetType === "post") {
    const { data } = await supabaseAdmin.from("flamme_posts").select("content").eq("id", targetId).maybeSingle();
    return { text: data?.content ?? "", table: "flamme_posts" };
  }
  if (targetType === "comment") {
    const { data } = await supabaseAdmin.from("flamme_comments").select("content").eq("id", targetId).maybeSingle();
    return { text: data?.content ?? "", table: "flamme_comments" };
  }
  if (targetType === "forum_topic") {
    const { data } = await supabaseAdmin.from("flamme_forum_topics").select("title,body").eq("id", targetId).maybeSingle();
    return { text: data ? `${data.title}\n${data.body}` : "", table: "flamme_forum_topics" };
  }
  if (targetType === "forum_reply") {
    const { data } = await supabaseAdmin.from("flamme_forum_replies").select("body").eq("id", targetId).maybeSingle();
    return { text: data?.body ?? "", table: "flamme_forum_replies" };
  }
  if (targetType === "story") {
    const { data } = await supabaseAdmin.from("flamme_stories").select("text").eq("id", targetId).maybeSingle();
    return { text: data?.text ?? "", table: "flamme_stories" };
  }
  return { text: "", table: null as string | null };
}

export const Route = createFileRoute("/api/flamme-social-moderate")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        try {
          const user = await authenticatedUser(request);
          if (!user) return Response.json({ error: "unauthorized" }, { status: 401, headers });
          if (!checkMistralRate(ip(request))) return Response.json({ error: "rate_limit" }, { status: 429, headers });

          const body = (await request.json().catch(() => ({}))) as Body;
          const action = body.action === "report" ? "report" : "preflight";
          const scope = body.scope === "reported_private" ? "reported_private" : "public";
          const confirmed = body.confirmed === true;
          const key = process.env["MISTRAL_API_KEY"]?.trim();

          if (scope === "reported_private" && !confirmed) {
            return Response.json({ error: "explicit_confirmation_required" }, { status: 400, headers });
          }

          if (action === "report") {
            const targetType = typeof body.targetType === "string" ? body.targetType.slice(0, 40) : "";
            const targetId = typeof body.targetId === "string" ? body.targetId : "";
            const reason = typeof body.reason === "string" ? body.reason.slice(0, 80) : "other";
            const details = typeof body.details === "string" ? body.details.slice(0, 1000) : "";
            if (!targetType || !/^[0-9a-f-]{36}$/i.test(targetId)) return Response.json({ error: "invalid_target" }, { status: 400, headers });

            const { data: report, error: reportError } = await supabaseAdmin.from("flamme_reports").insert({
              reporter_id: user.id,
              target_type: targetType,
              target_id: targetId,
              reason,
              details,
              status: "open",
            }).select("id").single();
            if (reportError) return Response.json({ error: "report_failed" }, { status: 400, headers });

            const target = await targetContent(targetType, targetId);
            if (!key || !target.text.trim()) return Response.json({ ok: true, reportId: report?.id, ai: { available: false } }, { headers });

            const result = await classify(key, target.text.slice(0, MAX_LENGTH), targetType, scope);
            const autoHide = Boolean(target.table && (result.decision === "block" || result.severity >= 3));
            if (autoHide && target.table) {
              await supabaseAdmin.from(target.table).update({ moderation_status: "hidden" }).eq("id", targetId);
              await supabaseAdmin.from("flamme_moderation_actions").insert({
                target_type: targetType,
                target_id: targetId,
                action: "hide",
                reason: result.reason ?? "Masqué automatiquement après signalement.",
                categories: result.categories,
                source: MODEL,
                actor_id: user.id,
              });
            } else if (result.decision === "review" && target.table) {
              await supabaseAdmin.from(target.table).update({ moderation_status: "review" }).eq("id", targetId);
              await supabaseAdmin.from("flamme_moderation_actions").insert({
                target_type: targetType,
                target_id: targetId,
                action: "review",
                reason: result.reason ?? "Vérification recommandée.",
                categories: result.categories,
                source: MODEL,
                actor_id: user.id,
              });
            }
            await supabaseAdmin.from("flamme_reports").update({
              ai_decision: result.decision,
              ai_reason: result.reason ?? null,
              ai_categories: result.categories,
              ai_checked_at: new Date().toISOString(),
              status: autoHide ? "actioned" : result.decision === "review" ? "review" : "open",
            }).eq("id", report?.id);

            return Response.json({ ok: true, reportId: report?.id, ai: { available: true, ...result, autoHide } }, { headers });
          }

          const content = typeof body.content === "string" ? body.content.trim() : "";
          const kind = typeof body.kind === "string" ? body.kind.slice(0, 40) : "publication";
          if (!content || content.length > MAX_LENGTH) return Response.json({ error: "invalid_content" }, { status: 400, headers });
          if (!key) return Response.json({ available: false, decision: "allow", severity: 0, categories: [] }, { headers });
          const result = await classify(key, content, kind, scope);
          return Response.json({ available: true, ...result }, { headers });
        } catch (error) {
          const timeout = error instanceof Error && error.name === "AbortError";
          return Response.json({ available: true, decision: "allow", severity: 0, categories: [], reason: timeout ? "timeout" : "server_error" }, { status: 200, headers });
        }
      },
    },
  },
});
