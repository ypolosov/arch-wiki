# arch-wiki v0.12.0 — gt-тест (FPF wave 5: Lexicon & glossary)

> Поверх v0.11.0. Аддитивно, детерминированное Core. Зеркало не тронуто. Схема v2.
> FPF Unification Suite (F.7/F.8/F.13/F.17, A.6.9).

## Что изменилось
- **Глоссарий как Unified Term Sheet (FPF F.17):** парсер `parseTermSheet` читает таблицу
  `glossary.md`. Канон — `| Term | Definition |`; опционально расширяется колонкой **Context**
  (bounded-context смысл термина, A.6.9) и **Status** (лексическая непрерывность, F.13). Парсинг
  толерантный: обычный `Term | Definition` sheet парсится без изменений.
- **Детерминированные glossary-правила в `lint`:**
  - `glossary-near-duplicate` (low, F.8) — два термина в пределах Levenshtein ≤ 2 (mint-or-reuse).
  - `glossary-term-unlinked` (low, F.17) — термин без ссылки на управляющую страницу `[[…]]`.
  - `deprecated-term-without-successor` (medium, F.13) — deprecated/retired термин без преемника.
  - `entity-without-glossary-term` (low) — entity-страница, не упомянутая ни одним термином.
  LLM-агент по-прежнему судит собственно *дрейф* (термин используется, но не заведён в лист).

## Что НЕ трогали (отложено)
- **preserveTerms-as-Term-column** — правка `extractGlossaryTerms` (маскировать имя строки, а не любой
  bold-спан) **отложена**: влияет на RU-перевод зеркала, а render-diff этого не докажет (нужен publish
  + RU-ретест, наружу). Текущее поведение (маскирует bold) сохранено. Возьмём отдельным user-gated шагом.
- Зеркало (рендер), AssuranceLevel, adequacy, epistemic-debt — без изменений.

## Acceptance §1 (проверено локально на gt)
- `version` → plugin **0.12.0**.
- `lint`: 3 новых `glossary-term-unlinked` (low: "Gaming Core Service", "qa-ready tag", "Visitor" —
  термины без See-ссылки; legit, baseline-suppressible). `glossary-near-duplicate` / `deprecated-…` /
  `entity-without-…` = 0 (глоссарий gt чист по ним). Всего lint-находок: 13 (было 10 + 3 glossary).

## 0. Обновить + РЕСТАРТ
```
claude plugin marketplace update
claude plugin update arch-wiki@ypolosov-marketplace --scope local
# РЕСТАРТ. arch-wiki version → 0.12.0
```

## 1. Проверка (из КОРНЯ репо gt)
```
arch-wiki lint --json     # + glossary-* правила (low); baseline: adopt/re-baseline при желании
```
Опц.: добавить в `glossary.md` колонки `Context`/`Status`; deprecated-строку без `[[преемник]]` → medium.

## Откат
Плагин — на v0.11.0 (`ref`). Контент — не затрагивается (read-only правила; baseline подавляет).
