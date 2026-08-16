# Google ADK inspirations for Angel OS

Sources studied: google/adk-samples (`sdlc-task-planner`, `cyber-guardian-agent`, `software-bug-assistant`, `deep-search`, `llm-auditor`, `customer-service`).

The samples are Apache-2.0 licensed and intended as demonstrations. Angel OS does not vendor/copy them wholesale: it adapts architecture patterns to the existing TypeScript/TanStack/Supabase runtime.

## Patterns retained

- **Planner / executor split** — complex requests are decomposed into explicit steps before execution; each step records status, evidence and failure reason.
- **Audit pass** — important AI outputs can be reviewed by a second pass that checks unsupported claims, missing evidence, contradictions and unsafe tool requests.
- **Deep-search workflow** — research tasks are decomposed, sources are collected independently, then synthesized with provenance instead of relying on one generation.
- **Bug assistant loop** — production errors are grouped, relevant logs/code context is collected, a repair hypothesis is produced, then the fix is validated before being marked complete.
- **Security guardian** — sensitive operations are classified by risk and require stronger checks; secrets never enter model-visible prompts or browser payloads.
- **Tool-oriented agent design** — agents receive narrow, explicit server tools rather than broad credentials. Tool results are logged and can be evaluated.
- **Evaluation harness** — agent behavior should have repeatable scenarios and regression checks instead of being judged only by manual chat tests.
- **Session/state discipline** — useful contextual state is separated from secrets and operational credentials.

## Angel OS mapping

- Planner -> `ai_actions` / task queue and future orchestration layer.
- Auditor -> Angel OS IA quality/safety supervisor around `angelAi` responses.
- Deep search -> news/research/article generation pipelines.
- Bug assistant -> maintenance + Vercel/GitHub/runtime diagnostics.
- Security guardian -> Angel Vault + admin server authorization + action risk gates.
- Customer-service tools -> explicit Gmail, Calendar, Drive, Supabase and site-management tools.

## Google Agent Platform / ADK

Agent Platform / Agents CLI / ADK can later become an optional execution backend for specialist agents, especially if Vertex AI / Agent Runtime is enabled. It must remain behind an adapter so Angel OS is not locked to Google and OpenAI remains usable. The existing Angel Vault remains the credential boundary.

## Non-goals

- Do not copy demo mock tools into production.
- Do not grant an agent unrestricted GitHub, mail, database or deployment access.
- Do not expose OAuth access/refresh tokens to the browser or model context.
- Do not treat an AI-produced repair as successful until an objective check passes.
