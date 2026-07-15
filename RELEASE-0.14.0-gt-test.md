# arch-wiki v0.14.0 — gt-тест (FPF wave 7: Ontology & self-eval tail)

> Поверх v0.13.0. Аддитивно, детерминированное Core. Зеркало не тронуто. Схема v2.
> FPF E.2.DA / E.4.DPF.DA / E.22 / E.23.

## Что изменилось
- **`arch-wiki adequacy --purpose <floor|gaps>` (FPF E.22):** объявляем цель оценки. `floor`
  (default) — все артефакты; `gaps` — только non-adequate (thin+inadequate); `summary` всегда полный.
- **Инструменты само-оценки (developer-facing, в target-репо НЕ поставляются):**
  - `FRAMEWORK-EVAL.md` — DPF package-adequacy (E.4.DPF.DA) + 7 инженерных принципов как
    principle-adequacy (E.2.DA): каждый принцип помечен «mechanism» или «doctrine».
  - `docs/dev/release-loop.md` — ритм RELEASE-*/gt-retest как E.23 improvement-loop + ledger волн +
    раздел «Deferred/dropped с обоснованием».

## Отброшено (с обоснованием, в release-loop.md)
- **`driver-depends-on-decision` lint (C.2.P/C.32.PAD)** — конфликтует с конвенцией плагина
  (bidirectional-in-spirit: драйвер намеренно форвард-линкует реализующие ADR, Foam деривит
  backlinks). Затопило бы gt и противоречило QA-шаблону. Направление ADR→драйвер уже соблюдается.

## Acceptance §1 (проверено локально на gt)
- `version` → plugin **0.14.0**.
- `adequacy --purpose gaps`: список 54 (только non-adequate = 37 thin + 17 inadequate); `summary`
  полный (total 153). Регресса нет.

## 0. Обновить + РЕСТАРТ / 1. Проверка
```
claude plugin marketplace update && claude plugin update arch-wiki@ypolosov-marketplace --scope local
arch-wiki adequacy --purpose gaps   # только пробелы; summary полный
```

## Откат
Плагин — на v0.13.0 (`ref`). Контент не затрагивается (read-only + dev-доки).
