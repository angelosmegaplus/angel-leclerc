# Angel OS IA — journal de réparation

Dernière mise à jour : 16 août 2026, 00:34 UTC.

Ce journal ne contient aucun secret. Il distingue explicitement le code présent sur `main`, la release réellement servie en production et les validations fonctionnelles.

## Matrice de contrôle

| Surface | Chemin principal | Dernière validation réelle | HTTP | Résultat réel | État |
|---|---|---:|---:|---|---|
| Assistant public | `POST /api/assistant`, mode `site` | release `52e09ac6135927b1062427f29dba8a2995d0b0c9` | 200 | réponse textuelle réelle, `source=openai`, `reason=ok`, modèle observé `gpt-4.1-mini` | validé en production |
| Contact IA | `POST /api/assistant`, mode `contact` | release `52e09ac6135927b1062427f29dba8a2995d0b0c9` | 200 | réponse textuelle réelle, `source=openai`, `reason=ok` | validé en production |
| Contexte multi-tour | `POST /api/assistant` avec `history` | release `52e09ac6135927b1062427f29dba8a2995d0b0c9` | 200 | le mot témoin fourni dans l’historique est correctement restitué | validé en production |
| Échec contrôlé assistant | `POST /api/assistant` avec question invalide | release `46745e35d9dc5220764b4ca5460335626da98ef4` | 400 | `reason=invalid_question`, pas de faux succès | validé en production |
| Angel OS IA privé | `runPrivateAngelOsIaChat` + auth Supabase + OpenAI | code `main` inspecté | — | Supabase Auth est joignable et le fournisseur commun OpenAI est validé ; le chemin authentifié doit encore être testé avec une vraie session admin | validation authentifiée restante |
| Recherche/veille IA | `searchNewsWithOpenAI` puis fusion Google News | release `52e09ac6135927b1062427f29dba8a2995d0b0c9` | 200 | endpoint combiné `phase=combined`, 68 éléments dont 5 identifiés `openai-web-*` | validé en production |
| Génération d’article | `generateArticleDraft` | code `main` inspecté | — | architecture OpenAI direct → AI Gateway + web search, modèles de repli et parsing JSON ; aucun faux article n’est créé si le moteur échoue | test réel restant |

## Diagnostic confirmé

- La panne historique de `/api/assistant` avant l’appel OpenAI venait de la mémoire Supabase obligatoire. Le correctif `729d7e957a195acb11347550774f04ac17bedd97` rend cette mémoire optionnelle afin qu’une dépendance secondaire ne fasse plus tomber la conversation principale.
- Le cœur conversationnel en production répond réellement via OpenAI. Les modes site, contact, contexte multi-tour et l’échec contrôlé sont validés avec du contenu réel.
- Les derniers logs runtime observés montrent des succès `angel-ai-gateway` via OpenAI `gpt-4.1-mini`, credential serveur `env`, sans récupération depuis un échec direct.
- La veille IA est désormais prouvée par le workflow d’observabilité : le dernier contrôle réussi a trouvé 5 contributions OpenAI sur 68 éléments du flux combiné.
- Les anciens incidents `insufficient_quota`, modèle nécessitant une organisation vérifiée, timeouts web et mémoire Supabase obligatoire restent des événements historiques ; aucun nouvel échec conversationnel critique n’a été observé après les correctifs actuels.
- Les erreurs `ai-news-search` par timeout restent bornées et récupérables ; elles ne font pas tomber la conversation principale.
- Supabase Auth est joignable depuis la production ; cela confirme le prérequis du chat privé sans fabriquer de session administrateur.

## Correctifs et validations récents

- `729d7e957a195acb11347550774f04ac17bedd97` — mémoire Supabase rendue optionnelle pour le cœur conversationnel.
- `d50f4e88109dc88438561c10e7b92b47db2b1531` — ajout d’un vrai test de génération IA en production.
- `ad21776c99fdc256f84bf1c4a193cb1f7709d75a` — couverture du mode Contact et du contexte multi-tour.
- `a408ed7b44ccc55f17b864d5b0145fac797b8dc1` — veille web structurée fiabilisée.
- `3c95f67ae8f53a7723ce05455d9db330c75d1797` — scénarios end-to-end renforcés : message court, question normale, Contact, contexte, échec contrôlé.
- `51c2451232084abe61341ff05f7a85e7cb7191d5` — correction d’un faux échec de maintenance : le workflow lisait encore `.openai.*` alors que le health endpoint expose désormais `.dependencies.openai.*`. CI complet réussi et déploiement Vercel READY.

## État production observé lors du dernier contrôle fonctionnel

- `/api/angel-os/health` : `healthy=true`.
- OpenAI : configuré et joignable.
- TMDB : configuré et joignable.
- Supabase Auth : configuré et joignable via la configuration publique prévue pour l’authentification.
- `POST /api/assistant` mode site : HTTP 200, `source=openai`, réponse exploitable.
- `POST /api/assistant` mode contact : HTTP 200, `source=openai`, réponse exploitable.
- Contexte multi-tour : HTTP 200, historique effectivement utilisé.
- Veille : HTTP 200, `phase=combined`, contribution OpenAI vérifiable.
- Le dernier `main` après correction du workflow est `51c2451232084abe61341ff05f7a85e7cb7191d5`; son déploiement production est READY. Cette modification ne touche pas au runtime IA applicatif.

## Blocages / vérifications restantes

1. Le chat privé nécessite une vraie session administrateur Supabase pour un test end-to-end. Ne jamais fabriquer de JWT ni contourner l’authentification. Le code privé interdit explicitement le fallback conversationnel local et utilise le même `resilientAngelAi` que les chemins validés.
2. La génération d’article doit encore être invoquée réellement dans un contexte autorisé pour vérifier OpenAI + web search + parsing + résultat structuré. Ne pas créer un article public juste pour un test si aucune voie de prévisualisation sûre n’est disponible.
3. Les chemins serveur nécessitant `SUPABASE_URL` / `SUPABASE_SERVICE_ROLE_KEY` doivent continuer à échouer proprement lorsqu’ils ne sont pas configurés et ne jamais faire tomber le cœur conversationnel.
4. Surveiller les timeouts de `ai-news-search`; ils doivent rester bornés et récupérables.
5. Le workflow `Maintenance Angel OS` doit être revalidé au prochain passage avec le nouveau chemin JSON du health endpoint ; son précédent échec était un faux négatif après des scénarios IA eux-mêmes réussis.

## Règle anti-régression

Une surface IA n’est considérée saine que si elle produit une réponse exploitable sur le chemin réel de production. Un build vert, un HTTP 200 vide, un fallback local, une réponse cache/RSS, un JSON brut ou un simple test `/v1/models` ne suffisent pas.
