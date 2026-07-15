# arch-wiki v0.18.0 — gt-тест (FPF wave 11: Decision records / ADR)

> Поверх v0.17.0. Аддитивно, детерминированное Core. **Зеркало доказано нейтрально**
> (ADR-шаблон влияет только на новые ADR; old-vs-new render 156→156, 0 body/0 hash — снят
> top-risk «шаблон × нейтрализатор»). Схема v2. FPF C.32.ADA / C.32.FAIL.

## Что изменилось
- **ADR-шаблон (аддитивно):** секции `## Confirmation` (как/когда решение подтверждается — C.32.ADA)
  и `## Reopen Triggers` (что его переоткроет — C.32.FAIL). Только новые ADR; существующие и зеркало
  не затрагиваются.
- **`adr-options-empty` lint (low, FPF C.32.ADA):** accepted ADR, у которого секция
  `## Considered Options` присутствует, но ПУСТА — решение без набора альтернатив. **Робастно к любому
  формату опций** (нумерация / жирные буллеты / таблица) — не даёт false-positive на заполненной секции.
  ОТСУТСТВУЮЩАЯ секция — задача adequacy-базы (не двойной флаг). Достаточность/различимость заполненного
  набора — суждение LLM на `/arch-wiki:review`, не детерминированный счётчик.
- **madr-format доктрина:** supersession-reason (различать «решение заменено» vs «обоснование
  распалось», C.32.FAIL); Confirmation/Reopen; ≥2 различимых опции.

## Отброшено по ходу (в release-loop.md)
- Детерминированный ПОДСЧЁТ опций (`adr-options-thin`, «< 2») — фрагилен: реальные gt-ADR перечисляют
  опции нумерацией, буллетами И таблицами; счётчик давал ложные срабатывания (0003/0014). Заменён
  робастной проверкой «пусто/не пусто»; «достаточно ли опций» отдано LLM-рубрике.

## Acceptance §1 (проверено локально на gt)
- `version` → plugin **0.18.0**.
- `lint`: `adr-options-empty` = **0** (все gt-ADR с секцией опций её заполняют, любой формат); всего 13.
- **Зеркало:** old-vs-new render 156→156, **0 body / 0 hash** — ADR-шаблон не сдвигает байты зеркала.

## 0. Обновить + РЕСТАРТ / 1. Проверка
```
claude plugin marketplace update && claude plugin update arch-wiki@ypolosov-marketplace --scope local
arch-wiki lint --json           # adr-options-empty (low) — 0 на gt
arch-wiki scaffold adr --title "…"  # шаблон с Confirmation / Reopen Triggers
```
(Обнови `.foam/templates` через `sync-templates --force` для нового ADR-шаблона; при желании — publish-регресс-чек.)

## Откат
Плагин — на v0.17.0 (`ref`). Контент не затрагивается (read-only правило + additive шаблон).
