# arch-wiki v0.17.0 — gt-тест (FPF wave 10: Projection faithfulness gate)

> Поверх v0.16.0. Аддитивно, **verification-only** — рендер зеркала НЕ меняется (новый потребитель
> плана + новый экспорт-детектор; существующие функции нетронуты). Схема v2. FPF A.6.3.CSC / E.17.EFP.

## Что изменилось
- **`arch-wiki verify-mirror` — детерминированный гейт faithfulness (FPF A.6.3.CSC / E.17.EFP):**
  берёт сохранённый план `render-confluence` (`--plan <file>` или stdin) и УТВЕРЖДАЕТ приёмку,
  которая раньше была прозой в `publish.md`:
  - **tier i** — ни одного repo-internal пути в `body` НИ в RU-mask `restore[].original` (git
    source-of-truth не пережил проекцию). Exit 2 + типизированный `violations[]` при утечке.
  - **tier ii** — внешние/POC git-URL (bitbucket.org/…, git.shakuro.com) — decision-evidence, НЕ флагаются.
  - Переиспользует тот же анкорный allowlist-regex, что и нейтрализатор (новый экспорт
    `findRepoPathLeaks`) — детектор и рендер согласованы по построению.

## Отложено (в release-loop.md)
- Типизированный CSC source-loss-mode словарь вместо free-text `warnings[]` — меняет СТРУКТУРУ
  вывода `render-confluence` (mirror-adjacent), берётся отдельным user-gated шагом.

## Acceptance §1 (проверено локально на gt)
- `version` → plugin **0.17.0**.
- `render-confluence --all | verify-mirror`: **ok, checked 156, violations 0** — зеркало gt faithful
  (утечек путей нет; детерминированно подтверждено).
- Рендер не меняется (verify — новый потребитель; existing render-функции нетронуты).

## 0. Обновить + РЕСТАРТ / 1. Проверка
```
claude plugin marketplace update && claude plugin update arch-wiki@ypolosov-marketplace --scope local
arch-wiki render-confluence --all > /tmp/aw-mirror.json
arch-wiki verify-mirror --plan /tmp/aw-mirror.json    # ok / violations[]
```
Встраивается в `/arch-wiki:publish` как гейт после render (см. publish.md шаг 1).

## Откат
Плагин — на v0.16.0 (`ref`). Verify — read-only гейт; контент/рендер не затрагиваются.
