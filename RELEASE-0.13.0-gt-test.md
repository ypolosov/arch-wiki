# arch-wiki v0.13.0 — gt-тест (FPF wave 6: Process loops)

> Поверх v0.12.0. Аддитивно, детерминированное Core. **Зеркало не затрагивается** (шаблон
> итерации влияет только на НОВЫЕ скаффолды; правила абдукции — над hypothesis-страницами;
> рендер не меняется). Схема v2. FPF B.4 / B.5 / B.5.2 / C.22.2 / A.20.

## Что изменилось
- **ProblemCard на `/arch-wiki:hypothesis` (FPF C.22.2 + B.5.2):** скаффолд гипотезы теперь несёт
  секцию **Problem Card** — Prompt · Scope cut · Why not just a wish · **Rival** · **Acceptance probe**
  · Next use — плюс секцию Hypothesis. (`ScaffoldArtifact` получил `appendBody`.)
- **Абдуктивные lint-правила:** `hypothesis-unfalsifiable` (low) — hypothesis без Acceptance probe /
  Refutation; `hypothesis-no-rival` (low) — hypothesis без названного соперника. Над страницами
  `status: hypothesis`. Скаффолженная гипотеза проходит их автоматически.
- **ADD-итерация как Evolution Loop (FPF B.4):** шаблон `iteration` получил секции
  **Observation / Trigger** (шаг Observe) и **Transformer** (названный метод/агент, A.3).
- **Именование стадий цикла (docs, без новых статусов):** add-method skill — ADD-петля = Evolution
  Loop (B.4) поверх Reasoning Cycle (B.5.1: Explore→Shape→Evidence→Operate); гипотеза = абдукция (B.5.2).

## Что НЕ трогали
Рендер зеркала (шаблон итерации в проекцию не входит), AssuranceLevel, adequacy, epistemic-debt,
glossary. Существующие итерации/гипотезы gt не меняются.

## Acceptance §1 (проверено локально на gt)
- `version` → plugin **0.13.0**.
- `lint`: `hypothesis-*` = 0 (у gt нет `status: hypothesis` страниц), всего lint-находок **13** (без
  регресса относительно wave 5).
- Скаффолд гипотезы (в темп-репо / юнит): тело содержит `## Problem Card`, `**Acceptance probe:**`,
  `**Rival:**`; `lint` НЕ помечает её как unfalsifiable/no-rival.

## 0. Обновить + РЕСТАРТ
```
claude plugin marketplace update
claude plugin update arch-wiki@ypolosov-marketplace --scope local
# РЕСТАРТ. arch-wiki version → 0.13.0
```

## 1. Проверка (из КОРНЯ репо gt)
```
arch-wiki hypothesis --title "Edge caching probe"   # тело с Problem Card
arch-wiki lint --json                                # hypothesis-* = 0 на существующем gt
arch-wiki scaffold iter --title "cycle 3"            # шаблон с Observation/Transformer
```
(Обнови `.foam/templates` через `sync-templates --force`, чтобы получить новый шаблон итерации.)

## Откат
Плагин — на v0.12.0 (`ref`). Контент не затрагивается (новые правила low, baseline-suppressible).
