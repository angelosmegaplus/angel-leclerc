import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/integrations/supabase/types";
import type { AiMessage } from "@/lib/ai-gateway.server";
import { resilientAngelAi } from "@/lib/ai-resilient.server";
import { aiMemoryPrompt } from "@/lib/ai-memory.server";
import { searchPersonalContext } from "./personal-context.server";
import { operationalContextPrompt, readOperationalContext } from "./operational-context.server";
import { adminUniversePrompt, readAdminUniverse } from "./admin-universe.server";
import {
  ensureSiteKnowledgeFresh,
  searchSiteKnowledge,
  siteKnowledgePrompt,
  SITE_KNOWLEDGE_POLICY,
} from "./site-knowledge.server";
import {
  recordMaintenanceReport,
  tryExecuteExplicitAdminAction,
} from "./admin-actions.server";
import { recordAngelOperation } from "@/lib/angel-runtime.server";

const InputSchema = z.object({ command: z.string().trim().min(2).max(2_000) });
type Db = SupabaseClient<Database>;

const LEGACY_AUTOMATIC_RESPONSE = /^État réel\s*:/i;

function looksLikeHtml(value: string | null | undefined) {
  if (!value) return false;
  const sample = value.trim().slice(0, 800).toLowerCase();
  return sample.startsWith("<!doctype html") || sample.startsWith("<html") || /<head[\s>]|<body[\s>]|<title>this page didn't load<\/title>/.test(sample);
}

function safeTechnicalDetail(value: string | null | undefined) {
  if (!value?.trim()) return "Aucune réponse Angel OS IA exploitable n’a été reçue.";
  if (looksLikeHtml(value)) return "Le service amont a renvoyé une page d’erreur HTML au lieu d’une réponse API exploitable.";
  return value.trim().slice(0, 700);
}

async function assertAdmin(db: Db, userId: string) {
  const { data, error } = await db.from("user_roles").select("role").eq("user_id", userId).eq("role", "admin").maybeSingle();
  if (error) throw error;
  if (!data) throw new Error("Accès réservé à l’administrateur.");
}

async function recentConversation(db: Db) {
  const { data, error } = await db.from("ai_messages").select("content,response,status,created_at").order("created_at", { ascending: false }).limit(14);
  if (error) return [] as AiMessage[];
  return ((data ?? []) as Array<{ content?: string | null; response?: string | null; status?: string | null }>)
    .reverse()
    .flatMap((row) => {
      const messages: AiMessage[] = [];
      if (row.content?.trim()) messages.push({ role: "user", content: row.content.trim().slice(0, 2_000) });
      const response = row.response?.trim();
      if (row.status === "completed" && response && !LEGACY_AUTOMATIC_RESPONSE.test(response) && !looksLikeHtml(response)) {
        messages.push({ role: "assistant", content: response.slice(0, 3_000) });
      }
      return messages;
    })
    .slice(-14);
}

export type PrivateAngelOsIaResult = {
  response: string;
  status: "completed";
  source: "openai" | "angel-os";
  autoExecuted: boolean;
  actionId: string | null;
};

export const runPrivateAngelOsIaChat = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .validator((input: unknown) => InputSchema.parse(input))
  .handler(async ({ context, data }): Promise<PrivateAngelOsIaResult> => {
    const db = context.supabase as Db;
    await assertAdmin(db, context.userId);
    const startedAt = Date.now();
    const { data: stored, error: insertError } = await db.from("ai_messages").insert({
      author: "angel",
      content: data.command,
      status: "running",
      context: { source: "angel-os-ia", private: true },
    }).select("id").single();
    if (insertError) throw insertError;

    try {
      // Explicit, unambiguous admin commands are tools, not suggestions. The
      // command itself is the authorization. Every execution is journaled in
      // ai_actions + activity_log and is limited to a strict whitelist.
      const explicitAction = await tryExecuteExplicitAdminAction(db, context.userId, data.command);
      if (explicitAction.response) {
        await db.from("ai_messages").update({
          response: explicitAction.response,
          status: "completed",
          context: {
            source: "angel-os",
            private: true,
            angel_os_ia: true,
            auto_executed: explicitAction.executed,
            action_id: explicitAction.actionId ?? null,
            action_kind: explicitAction.kind ?? null,
          },
        }).eq("id", stored.id);

        await recordAngelOperation({
          type: "angel-os-ia.private-chat.action",
          source: "angel-os-ia",
          ok: true,
          durationMs: Date.now() - startedAt,
          payload: {
            messageId: stored.id,
            actionId: explicitAction.actionId ?? null,
            actionKind: explicitAction.kind ?? null,
            executed: explicitAction.executed,
          },
        });

        return {
          response: explicitAction.response,
          status: "completed",
          source: "angel-os",
          autoExecuted: explicitAction.executed,
          actionId: explicitAction.actionId ?? null,
        };
      }

      // Bug/error reports are centralized even when the user only asks for an
      // explanation. The report is evidence for maintenance, not permission for
      // arbitrary self-modifying code.
      const maintenanceActionId = await recordMaintenanceReport(db, data.command).catch(() => null);

      const [history, universe, memory, operational] = await Promise.all([
        recentConversation(db),
        readAdminUniverse(db, context.userId),
        aiMemoryPrompt("private"),
        readOperationalContext({ refreshIfStale: true }),
        ensureSiteKnowledgeFresh(),
      ]);

      const personal = searchPersonalContext(data.command, 8);
      const siteHits = searchSiteKnowledge(data.command, 14);
      const personalText = personal.length
        ? personal.map((hit) => `${hit.title}: ${hit.text.slice(0, 700)}`).join("\n")
        : "Aucun contexte personnel pertinent indexé.";
      const operationalText = operationalContextPrompt(operational);
      const universeText = adminUniversePrompt(universe);
      const siteText = siteKnowledgePrompt(siteHits);

      const messages: AiMessage[] = [
        {
          role: "system",
          content: `Tu es Angel OS IA, la distribution d’intelligence artificielle privée fonctionnant au-dessus d’Angel OS dans l’espace administrateur privé. Tu réponds uniquement via Angel OS IA dans cette interface. Il n’existe aucun moteur conversationnel local de secours ici : ne prétends jamais être un fallback local.

Tu disposes d’un index local du code du site, des routes, de la documentation et du texte des pages publiques réellement rendues en production. Cet index est reconstruit automatiquement depuis le code livré avec Angel OS et depuis angel-leclerc.fr : ce n’est pas une mémoire imaginative. Tu ne prétends lire que les extraits effectivement fournis dans le contexte de la demande. Quand une question concerne le fonctionnement du site, appuie-toi d’abord sur ces preuves et cite naturellement le chemin de fichier ou la route lorsque c’est utile.

Tu peux également lire et croiser les données de l’ensemble de l’espace administrateur qui te sont fournies dans l’univers admin, notamment candidatures, projets, tâches, articles, messages du site, abonnés, actions, rapports, caches, Google Agenda et la boîte mail reçue/envoyée lorsqu’elle est connectée. Les mails envoyés sont une source opérationnelle de vérité : s’ils prouvent qu’une candidature a été envoyée, utilise la date, le destinataire, l’objet et le fil pour comprendre l’état réel, puis compare avec la base applications. Tu peux rédiger des brouillons de mail à partir des fils réels.

Angel OS possède aussi une couche d’actions administrateur auditée. Les commandes explicites reconnues par cette couche sont exécutées avant de t’être envoyées ; si tu reçois la demande ici, n’invente donc jamais une exécution. Pour les bugs, erreurs ou anomalies, un rapport de maintenance peut déjà avoir été centralisé. Tu peux analyser et proposer une correction, mais tu ne dois jamais prétendre avoir modifié le code ou les données sans preuve d’une action réellement exécutée.

Tu peux être autonome pour lire, analyser, diagnostiquer, prioriser et préparer les opérations internes sûres et réversibles. Une synchronisation interne factuelle et idempotente à partir d’une preuve certaine peut être proposée comme correction ; ne transforme jamais une inférence faible en fait. Un nouvel envoi externe, une publication publique, un paiement ou une opération destructive ambiguë nécessitent une demande explicite. Une commande destructive explicite et non ambiguë peut être exécutée par la couche d’actions whitelistée. Garde la continuité de conversation et dis clairement quand une source est indisponible. Les informations les plus récentes et les preuves directes priment en cas de contradiction. N’affirme jamais qu’une action externe ou une synchronisation a été exécutée si elle ne l’a pas réellement été.

${SITE_KNOWLEDGE_POLICY}`,
        },
        ...history,
        {
          role: "user",
          content: `Demande actuelle : ${data.command}${memory}${operationalText}${universeText}${siteText}\n\nMémoire personnelle Angel OS IA :\n${personalText}${maintenanceActionId ? `\n\nRapport maintenance centralisé : ${maintenanceActionId}` : ""}`,
        },
      ];

      const ai = await resilientAngelAi({ messages, priority: "interactive", maxTokens: 1_800, temperature: 0.2, cacheTtlMs: 1 });
      const candidate = ai.text?.trim() ?? "";
      if ((ai as typeof ai & { adminFailure?: boolean }).adminFailure || !candidate || looksLikeHtml(candidate) || LEGACY_AUTOMATIC_RESPONSE.test(candidate)) {
        const technical = safeTechnicalDetail((ai as typeof ai & { detail?: string | null; adminFailureMessage?: string | null }).detail ?? (ai as typeof ai & { adminFailureMessage?: string | null }).adminFailureMessage);
        throw new Error(`Angel OS IA est indisponible : ${technical} Aucun moteur local ne répond à sa place dans l’espace privé.`);
      }

      const response = candidate.slice(0, 7_000);
      const { error: updateError } = await db.from("ai_messages").update({
        response,
        status: "completed",
        context: {
          source: "openai",
          private: true,
          angel_os_ia: true,
          auto_executed: false,
          maintenance_action_id: maintenanceActionId,
          operational_context_at: operational?.generatedAt ?? null,
          admin_universe_at: universe.generatedAt,
          site_knowledge_sources: siteHits.map((hit) => hit.source).slice(0, 14),
        },
      }).eq("id", stored.id);
      if (updateError) throw updateError;

      await recordAngelOperation({
        type: "angel-os-ia.private-chat.completed",
        source: "angel-os-ia",
        ok: true,
        durationMs: Date.now() - startedAt,
        payload: {
          messageId: stored.id,
          maintenanceActionId,
          operationalContextAt: operational?.generatedAt ?? null,
          adminUniverseAt: universe.generatedAt,
          siteKnowledgeSources: siteHits.length,
        },
      });
      return { response, status: "completed", source: "openai", autoExecuted: false, actionId: maintenanceActionId };
    } catch (error) {
      const rawDetail = error instanceof Error ? error.message : "Angel OS IA indisponible.";
      const detail = looksLikeHtml(rawDetail)
        ? "Angel OS IA indisponible : le service amont a renvoyé une page d’erreur non exploitable."
        : rawDetail.slice(0, 900);
      await db.from("ai_messages").update({ response: null, status: "failed", context: { source: "openai", private: true, error: detail } }).eq("id", stored.id);
      await recordAngelOperation({ type: "angel-os-ia.private-chat.failed", source: "angel-os-ia", ok: false, durationMs: Date.now() - startedAt, payload: { messageId: stored.id, error: detail } });
      throw new Error(detail);
    }
  });
