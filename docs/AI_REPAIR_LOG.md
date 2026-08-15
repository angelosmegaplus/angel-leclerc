# Angel OS IA — journal de réparation

Dernière mise à jour : 15 août 2026, 18:29 UTC.

Ce journal ne contient aucun secret. Il distingue explicitement le code présent sur `main`, la release réellement servie en production et les validations fonctionnelles.

## Matrice de contrôle

| Surface | Chemin principal | Release testée | HTTP | Résultat réel | État |
|---|---|---:|---:|---|---|
| Assistant public | `POST /api/assistant`, mode `site` | `b10d9dcf47485b0e9f45b5ef2b7cbe3874882db7` | 200 | réponse textuelle réelle, `source=openai`, `reason=ok` | validé en production |
| Contact IA | `POST /api/assistant`, mode `contact` | `b10d9dcf47485b0e9f45b5ef2b7cbe3874882db7` | 200 | réponse textuelle réelle, `source=openai`, `reason=ok` | validé en production |
| Contexte multi-tour | `POST /api/assistant` avec `history` | `b10d9dcf47485b0e9f45b5ef2b7cbe3874882db7` | 200 | le mot `ORION` fourni dans l’historique a été correctement restitué | validé en production |
| Angel OS IA privé | `runPrivateAngelOsIaChat` + auth Supabase + OpenAI | `b10d9dcf47485b0e9f45b5ef2b7cbe3874882db7` | — | Supabase Auth est joignable et le fournisseur commun OpenAI est validé ; le chemin authentifié doit encore être testé avec une vraie session admin | validation authentifiée restante |
| Recherche/veille IA | `searchNewsWithOpenAI` puis fusion Google News | — | — | architecture OpenAI direct → AI Gateway présente ; le endpoint public combiné ne prouve pas à lui seul que la partie IA a répondu | test AI-only restant |
| Génération d’article | `generateArticleDraft` | — | — | architecture OpenAI direct → AI Gateway + web search présente ; aucun faux article n’est créé si le moteur échoue | test réel restant |

## Diagnostic confirmé

- La panne historique de `/api/assistant` avant l’appel OpenAI venait de la mémoire Supabase obligatoire. Le correctif `729d7e957a195acb11347550774f04ac17bedd97` rend cette mémoire optionnelle afin qu’une dépendance secondaire ne fasse plus tomber la conversation principale.
- Le cœur conversationnel en production répond réellement via OpenAI. Les modes site, contact et contexte multi-tour ont été revalidés sur la release actuellement servie, pas seulement sur une ancienne release.
- OpenAI est configuré et joignable sur la release actuelle.
- Supabase Auth est également joignable depuis la production ; cela confirme le prérequis d’authentification du chat privé sans fabriquer de session administrateur.
- TMDB est désormais configuré et joignable sur la release actuelle. L’ancien incident `http_401` n’est plus présent au dernier contrôle.
- Le contrôle d’observabilité exige une vraie génération sur les modes site, contact et contexte multi-tour. Seules les dépendances IA critiques peuvent faire échouer ce contrôle ; les dépendances optionnelles restent visibles comme avertissements.

## Correctifs et validations récents

- `d50f4e88109dc88438561c10e7b92b47db2b1531` — ajout d’un vrai test de génération IA en production.
- `8d8cd1aa72c16ca885364e6dedb1ae9a3d5137de` — les erreurs secondaires ne peuvent plus empêcher le smoke test IA ; journal d’incident corrigé.
- `ad21776c99fdc256f84bf1c4a193cb1f7709d75a` — couverture du mode Contact et du contexte multi-tour.
- `4b0ecc0bef40371c4630790baa9c3e3678324f8d` — ajout d’un contrôle non sensible de la disponibilité de Supabase Auth, prérequis du chat privé.
- `7b9511d1620234a6a9f0610424d91720a923cc36` — l’observabilité ne transforme plus un échec de dépendance optionnelle en panne générale Angel OS IA ; OpenAI reste la dépendance critique contrôlée.
- Validation relancée manuellement après publication du dernier `main` : le job `Contrôle production` a terminé avec succès à 18:29 UTC et a réellement interrogé le domaine public.

## État production observé lors du dernier contrôle

- Release servie par le domaine public : `b10d9dcf47485b0e9f45b5ef2b7cbe3874882db7`, identique au `main` testé au moment du contrôle.
- `/api/angel-os/health` : `healthy=true`.
- OpenAI : configuré et joignable.
- TMDB : configuré et joignable via `vercel-connect-api-key`.
- Supabase Auth : configuré et joignable via la configuration publique embarquée prévue pour l’authentification.
- `POST /api/assistant` mode site : HTTP 200, `source=openai`, `reason=ok`, réponse exploitable.
- `POST /api/assistant` mode contact : HTTP 200, `source=openai`, `reason=ok`, réponse exploitable.
- Contexte multi-tour : HTTP 200, restitution correcte de `ORION`.
- Aucune dépendance critique ou optionnelle testée par le health check n’était en échec lors de cette validation.

## Blocages / vérifications restantes

1. Le chat privé nécessite une vraie session administrateur Supabase pour un test end-to-end. Ne jamais fabriquer de JWT ou contourner l’authentification. Le prérequis Supabase Auth est désormais sain.
2. La veille IA et la génération d’article doivent encore être validées de façon à prouver la réponse du moteur IA lui-même, et pas seulement un fallback RSS/cache ou une file d’attente.
3. Les chemins serveur qui exigent `SUPABASE_URL` / `SUPABASE_SERVICE_ROLE_KEY` doivent afficher une panne propre lorsqu’ils ne sont pas configurés et ne jamais faire tomber le cœur conversationnel.
4. Les timeouts `ai-news-search` doivent rester bornés et récupérables ; ils ne doivent pas contaminer les conversations qui n’exigent pas explicitement la recherche web.
5. Le prochain cycle doit privilégier un test AI-only de la veille et un test réel de génération d’article avant de considérer toute l’IA Angel OS réparée de bout en bout.

## Règle anti-régression

Une surface IA n’est considérée saine que si elle produit une réponse exploitable sur le chemin réel de production. Un build vert, un HTTP 200 vide, un fallback local, une réponse cache/RSS, un JSON brut ou un simple test `/v1/models` ne suffisent pas.
