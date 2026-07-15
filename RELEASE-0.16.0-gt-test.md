# arch-wiki v0.16.0 — gt-тест (FPF wave 9: Quality attributes / Q-Bundle)

> Поверх v0.15.0. Аддитивно, детерминированное Core. **Зеркало доказано нейтрально**
> (QA-шаблон влияет только на новые QA; old-vs-new render 156→156, 0 body/0 hash). Схема v2.
> FPF C.16 / C.25 / A.18 / A.2.6 (USM) / C.27.TA.

## Что изменилось
- **Quality Bundle в QA-шаблоне (FPF C.25 / A.18):** новая секция распаковывает «-ility» в
  Characteristic · Scale · Polarity · Target · Current · **Window** (C.27.TA) · **Scope** (ClaimScope,
  A.2.6 USM). Аддитивно — только новые QA; существующие gt-страницы и зеркало не затрагиваются.
- **`qa-measure-untestable` lint (low, FPF C.16):** консервативно помечает КОРОТКУЮ вакуозную меру
  без числа и без оператора сравнения («fast and reliable»). Длинные качественные инварианты
  (idempotence и т.п.) и числовые пороги — пропускаются; их судит LLM-рубрика adequacy.

## Отложено (в release-loop.md)
- utility-tree как Evaluation CharacteristicSpace + детерминированный ScoringMethod; qa-composite
  classify; missing-window как отдельное правило — требуют нового формата/оценочной программы.

## Acceptance §1 (проверено локально на gt)
- `version` → plugin **0.16.0**.
- `lint`: `qa-measure-untestable` = **0** (меры gt числовые или детально-качественные — консервативная
  проверка не даёт false-positive на QA-018/021); всего 13 (без регресса).
- **Зеркало:** old-vs-new render 156→156, **0 body / 0 hash** — QA-шаблон не сдвигает байты зеркала.

## 0. Обновить + РЕСТАРТ / 1. Проверка
```
claude plugin marketplace update && claude plugin update arch-wiki@ypolosov-marketplace --scope local
arch-wiki lint --json                  # qa-measure-untestable (low) — 0 на gt
arch-wiki scaffold qa --title "…"      # шаблон с Quality Bundle
```
(Обнови `.foam/templates` через `sync-templates --force` для нового QA-шаблона.)

## Откат
Плагин — на v0.15.0 (`ref`). Контент не затрагивается (read-only правило + additive шаблон).
