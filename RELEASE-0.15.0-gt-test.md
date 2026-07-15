# arch-wiki v0.15.0 — gt-тест (FPF wave 8: Structural-view correspondence)

> Поверх v0.14.0. Аддитивно, детерминированное Core. Зеркало не тронуто. Схема v2.
> FPF E.17.0 / C.34 / C.30.ASV / C.35.

## Что изменилось
- **`view-hub-uncorresponded` lint (low, FPF E.17.0/C.34):** arc42-хаб с тегом `c4` (это привязка
  viewpoint↔view) обязан ПОКАЗЫВАТЬ свой вид — секцию `## C4 …`. Тег `c4` = маркер соответствия;
  хаб без секции C4 помечается. Использует существующую конвенцию тегов (без нового конфига — merge #2).
- **Structural-view adequacy (C.30.ASV):** `adequacy` теперь оценивает и arc42-хабы — c4-хаб с
  показанным видом → adequate, без вида → thin (база `corresponds`).
- **C.35 admission-note картографу:** каждый предложенный `*.c4`-дифф несёт однострочную заметку —
  какой вид/элемент он допускает и какой wiki-артефакт это обосновывает (`.c4` — generated-carrier).
- **MVPK-именование зеркала (E.17, docs):** зеркало = MVPK PlainView PublicationUnit над английским каноном.

## Отложено (нужен model-JSON / MCP, хрупко — в release-loop.md)
- Расширение `C4Model` до relationships/views + `c4-relationship-without-wiki-trace` /
  `correspondence-orphan-view`: требует `likec4 export json`, фрагильно к форме — берётся отдельным
  user-gated шагом с реальным model-JSON.

## Acceptance §1 (проверено локально на gt)
- `version` → plugin **0.15.0**.
- `lint`: `view-hub-uncorresponded` = **0** (все c4-хаба gt показывают `## C4 source`); всего 13 (без регресса).
- `adequacy --kind arc42`: **12 adequate / 0 thin / 0 inadequate** (все хабы соответствуют).

## 0. Обновить + РЕСТАРТ / 1. Проверка
```
claude plugin marketplace update && claude plugin update arch-wiki@ypolosov-marketplace --scope local
arch-wiki lint --json           # view-hub-uncorresponded (low) — 0 на чистом gt
arch-wiki adequacy --kind arc42 # структурные виды
```

## Откат
Плагин — на v0.14.0 (`ref`). Контент не затрагивается (read-only правило + база adequacy).
