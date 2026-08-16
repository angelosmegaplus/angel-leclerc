# Angel OS IA — journal de réparation

Dernière mise à jour : 16 août 2026, 08:34 UTC.

Ce journal ne contient aucun secret. Il distingue explicitement le code présent sur `main`, la release réellement servie en production et les validations fonctionnelles.

## Matrice de contrôle

| Surface | Chemin principal | Dernière validation réelle | HTTP | Résultat réel | État |
|---|---|---:|---:|---|---|
| Assistant public | `POST /api/assistant`, mode `site` | production, 16 août 07:50 UTC | 200 | réponse textuelle réelle, `source=openai`, `reason=ok`, modèle observé `gpt-4.1-mini` | validé en production |
| Contact IA | `POST /api/assistant`, mode `contact` | production, 16 août 07:50 UTC | 200 | réponse textuelle réelle, `source=openai`, `reason=ok` | validé en production |
| Contexte multi-tour | `POST /api/assistant` avec `history` | production, 16 août 07:50 UTC | 200 | le mot témoin transmis dans l’historique est correctement restitué | validé en production |
| Échec contrôlé assistant | `POST /api/assistant` avec question invalide | production, 16 août 07:19 UTC | 400 | `reason=invalid_question`, pas de faux succès | validé en production |
| Angel OS IA privé | `runPrivateAngelOsIaChat` + auth Supabase + `resilientAngelAi` | code `main` + build production inspectés | — | chemin authentifié, persistance `ai_messages`, aucun fallback conversationnel local autorisé | validation authentifiée restante |
| Recherche/veille IA | `searchNewsWithOpenAI` puis fusion Google News | production, 16 août 07:50 UTC | 200 | `phase=combined`, 66 éléments dont 1 contribution `openai-web-*` vérifiable | validé en production |
| Génération d’article | `generateArticleDraft` | code `main` + bundle production inspectés | — | OpenAI direct → AI Gateway, web search, modèles de repli, parsing JSON et refus de créer un article vide | test réel autorisé restant |
| Santé fournisseur | `/api/angel-os/health` | production, 16 août 07:50 UTC | 200 | `healthy=true`, OpenAI configuré et joignable, credential serveur `env` | validé en production |
| Déploiement du dernier `main` | Vercel / GitHub deployment | commit `4c083a8c9012c0514c717924b37b56b499f6bd73`, 16 août 08:02 UTC | — | statut final Vercel `success`, environnement production | validé |

## Diagnostic actuel

- Le cœur conversationnel public fonctionne réellement en production. Les scénarios court, normal, Contact et multi-tour produisent des réponses OpenAI exploitables ; le scénario invalide échoue proprement.
- Les logs runtime Vercel observés jusqu’au 16 août 08:32 UTC ne montrent aucune nouvelle erreur de production sur la période récente. Les derniers appels observés passent par OpenAI `gpt-4.1-mini`, credential serveur `env`, sans récupération depuis un échec direct.
- La panne historique de `/api/assistant` avant l’appel OpenAI venait de la mémoire Supabase obligatoire. Le correctif `729d7e957a195acb11347550774f04ac17bedd97` garde cette mémoire optionnelle afin qu’une dépendance secondaire ne fasse plus tomber la conversation principale.
- Les anciens incidents `insufficient_quota`, accès modèle/organisation vérifiée, timeouts web et mémoire Supabase obligatoire restent historiques : aucun nouvel échec conversationnel critique correspondant n’a été observé après les correctifs actuels.
- La veille IA est prouvée par deux contrôles distincts : `Maintenance Angel OS` a validé les scénarios conversationnels à 07:19 UTC et `Observabilité Angel OS` a validé assistant/Contact/contexte ainsi qu’une contribution OpenAI réelle dans le flux actualités à 07:50 UTC.
- Le dernier `main` contient uniquement un snapshot mails supplémentaire par rapport au code IA validé et a reçu un déploiement production Vercel réussi à 08:02 UTC.
- L’échec du workflow de synchronisation de données au même commit vient de secrets de synchronisation GitHub absents ; il est distinct du runtime IA et n’a pas empêché le déploiement Vercel, qui est passé au statut `success`.

## Correctifs et validations récents

- `729d7e957a195acb11347550774f04ac17bedd97` — mémoire Supabase rendue optionnelle pour le cœur conversationnel.
- `d50f4e88109dc88438561c10e7b92b47db2b1531` — ajout d’un vrai test de génération IA en production.
- `ad21776c99fdc256f84bf1c4a193cb1f7709d75a` — couverture du mode Contact et du contexte multi-tour.
- `a408ed7b44ccc55f17b864d5b0145fac797b8dc1` — veille web structurée fiabilisée.
- `3c95f67ae8f53a7723ce05455d9db330c75d1797` — scénarios end-to-end renforcés : message court, question normale, Contact, contexte, échec contrôlé.
- `51c2451232084abe61341ff05f7a85e7cb7191d5` — correction du chemin JSON du health endpoint dans la maintenance.
- `8a911ba3f4b87f6fd2eb0b29c588b9e7076fbb03` — notification admin immédiate en cas d’arrêt de réponse de l’IA intégrée ; maintenance et observabilité suivantes réussies.

## Contrôle global du cycle

Le dernier workflow `Maintenance Angel OS` réussi a exécuté lint, build, TypeScript, scénarios IA réels, health OpenAI, inventaire dynamique des routes depuis `src/routes` + sitemap, contrôle HTTP de 26 URL concrètes, sonde 404, météo et actualités. Toutes les pages concrètes contrôlées répondaient en HTTP 2xx et la 404 renvoyait bien 404. Le lint reste à 0 erreur avec des avertissements non bloquants existants.

## Vérifications restantes sans contournement

1. **Chat privé authentifié** : le test end-to-end exige une vraie session administrateur Supabase. Ne jamais fabriquer de JWT, contourner l’auth ou exposer une route de diagnostic publique pour simuler ce test. Aucun log `angel-os-ia.private-chat` n’a été trouvé sur les dernières 24 h ; cela signifie « pas de preuve d’invocation récente », pas « panne ».
2. **Génération d’article** : aucune invocation `article-ai` récente n’apparaît dans les logs. Le chemin est présent dans le bundle production et le code refuse les faux brouillons, mais une invocation réelle dans un contexte admin autorisé reste nécessaire pour valider OpenAI + web search + parsing + résultat structuré. Ne pas publier un article juste pour un test.
3. **Timeouts veille web** : continuer à les surveiller. Ils doivent rester bornés et récupérables et ne jamais faire tomber la conversation principale.
4. **Dépendances de données** : `SUPABASE_SERVICE_ROLE_KEY` / secrets de synchronisation GitHub manquants peuvent bloquer certaines écritures automatisées, mais ne doivent pas être confondus avec la santé du moteur conversationnel OpenAI.

## Règle anti-régression

Une surface IA n’est considérée saine que si elle produit une réponse exploitable sur le chemin réel de production. Un build vert, un HTTP 200 vide, un fallback local, une réponse cache/RSS, un JSON brut ou un simple test `/v1/models` ne suffisent pas.
