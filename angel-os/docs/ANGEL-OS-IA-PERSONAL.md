# Angel OS IA — couche personnelle intelligente

Angel OS IA est la distribution personnelle et intelligente construite au-dessus d'Angel OS.

## Principe

Angel OS reste neutre, réutilisable et système. Il fournit les primitives d'exécution : événements, workflows, mémoire système, données, synchronisation, stockage, déploiement, nœuds, supervision technique et reprise.

Angel OS IA exploite ces primitives pour les usages personnels : assistant, agents, mémoire personnelle, recommandations, priorisation, candidatures, mails, agenda, actualités personnalisées, films/Movix et automatisations intelligentes.

## Règle de dépendance

```text
Angel OS IA -> Angel OS
Angel OS -X-> Angel OS IA
```

Une panne d'Angel OS IA ne doit pas empêcher Angel OS de continuer à servir les fonctions système.

## Répartition

### Angel OS

- Core
- Event Bus
- Durable Workflow Engine
- Event Log
- Telemetry
- Memory primitives
- Data / Sync
- Storage
- Release / Deploy
- Node / Gateway
- Guardian / Recovery
- Application Runtime

### Angel OS IA

- fournisseurs IA
- conversation
- génération
- analyse
- agents
- mémoire personnelle
- préférences et historique utilisateur
- recommandations
- priorisation personnelle
- supervision intelligente
- candidatures
- mails
- agenda
- actualités personnalisées
- recommandations films / Movix
- automatisations intelligentes

## Règle d'architecture

Angel OS observe et exécute. Angel OS IA comprend, personnalise, recommande et décide dans les limites autorisées.
