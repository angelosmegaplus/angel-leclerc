# Angel OS IA — journal de réparation

Dernière mise à jour : 15 août 2026.

Ce journal ne contient aucun secret. Il distingue explicitement le code présent sur `main`, la release réellement servie en production et les validations fonctionnelles.

## Matrice de contrôle

| Surface | Chemin principal | Release testée | HTTP | Résultat réel | État |
|---|---|---:|---:|---|---|
| Assistant public | `POST /api/assistant`, mode `site` | `27af9ecc3eb9d505245b3a631ffa364ef991dada` | 200 | réponse textuelle réelle, `source=openai`, `reason=ok` | validé en production |
| Contact IA | `POST /api/assistant`, mode `contact` | `27af9ecc3eb9d505245b3a631ffa364ef991dada` | 200 | réponse textuelle réelle, `source=openai`, `reason=ok` | validé en production |
| Contexte multi-tour | `POST /api/assistant` avec `history` | `27af9ecc3eb9d505245b3a631ffa364ef991dada` | 200 | le mot `ORION` fourni dans l’historique a été correctement restitué | validé en production |
| Angel OS IA privé | `runPrivateAngelOsIaChat` + auth Supabase + OpenAI | — | — | fournisseur commun validé, mais le chemin authentifié doit encore être testé avec une vraie session admin | validation authentifiée restante |
| Recherche/veille IA | `searchNewsWithOpenAI` puis fusion Google News | — | — | architecture OpenAI direct → AI Gateway présente ; le endpoint public combiné ne prouve pas à lui seul que la partie IA a répondu | test AI-only restant |
| Génération d’article | `generateArticleDraft` | — | — | architecture OpenAI direct → AI Gateway + web search présente ; aucun faux article n’est créé si le moteur échoue | test réel restant |

## Diagnostic confirmé

- La panne historique de `/api/assistant` avant l’appel OpenAI venait de la mémoire Supabase obligatoire. Le correctif `729d7e957a195acb11347550774f04ac17bedd97` rend cette mémoire optionnelle afin qu’une dépendance secondaire ne fasse plus tomber la conversation principale.
- Le cœur conversationnel en production répond désormais réellement via OpenAI. Trois scénarios distincts ont été validés, pas seulement un endpoint de santé ou une interface visuelle.
- OpenAI est configuré et joignable sur la release testée.
- TMDB est actuellement configuré mais renvoie `401`. Ce problème est indépendant du cœur conversationnel et ne doit jamais empêcher les tests IA de s’exécuter.
- Le contrôle d’observabilité a été durci : une vraie génération est obligatoire et les dépendances secondaires sont contrôlées après le smoke test IA afin d’éviter les faux négatifs/faux positifs.

## Correctifs de ce cycle

- `d50f4e88109dc88438561c10e7b92b47db2b1531` — ajout d’un vrai test de génération IA en production.
- `8d8cd1aa72c16ca885364e6dedb1ae9a3d5137de` — les erreurs secondaires ne peuvent plus empêcher le smoke test IA ; journal d’incident corrigé.
- `ad21776c99fdc256f84bf1c4a193cb1f7709d75a` — couverture du mode Contact et du contexte multi-tour.
- `4b0ecc0bef40371c4630790baa9c3e3678324f8d` — ajout d’un contrôle non sensible de la disponibilité de Supabase Auth, prérequis du chat privé.

## Blocages / vérifications restantes

1. La production sert encore `27af9ecc3eb9d505245b3a631ffa364ef991dada`, tandis que les nouveaux contrôles sont plus récents sur `main`. Ils doivent être publiés avant d’être considérés comme actifs en production.
2. Le workflow de publication GitHub nécessite `VERCEL_TOKEN`. La dernière exécution vérifiée l’avait absent ; aucune clé ne doit être inventée ou contournée.
3. Le chat privé nécessite une vraie session administrateur Supabase pour un test end-to-end. Ne jamais fabriquer de JWT de test.
4. La veille IA et la génération d’article doivent encore être validées de façon à prouver la réponse du moteur IA lui-même, et pas seulement un fallback RSS/cache ou une file d’attente.

## Règle anti-régression

Une surface IA n’est considérée saine que si elle produit une réponse exploitable sur le chemin réel de production. Un build vert, un HTTP 200 vide, un fallback local, une réponse cache/RSS, un JSON brut ou un simple test `/v1/models` ne suffisent pas.
