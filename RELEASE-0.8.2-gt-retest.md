# arch-wiki v0.8.2 — ре-тест на `gt` (зеркало: полная очистка git source-of-truth)

> Поверх v0.8.1 (срез `## Sources`). Закрывает широкий критерий §1: git-источник не должен утекать НИГДЕ.
> Схема не меняется (v2, миграции нет). Полный флоу — [RELEASE-0.8.0-gt-test.md](RELEASE-0.8.0-gt-test.md).

## Что изменилось (по находкам ре-теста 0.8.1)
- **A** — `**Source:**`-поля со значением-путём `raw/…` дропаются построчно (QA-сценарный `- **Source:** <актор>` **не** трогается — гейт по значению-пути).
- **B** — repo-внутренние пути в прозе/коде/скобках нейтрализуются: `raw/…`, `docs/architecture/…`, `c4/src/*.c4`, `.foam/…`, register-файлы (`risks.md`/`glossary.md`/…), `*.csv`; провенанс-скобки `(from raw/…)`. Строгий якорный allowlist → C4-id `product.gaming.brand.core.service` и доменные термины **не** задеваются. Пропускаются fenced-код и markdown-URL `](…)` (картинки C4-stub целы).
- **D** — `CLAUDE.md` (Layer-3 мета-док) исключён из зеркала целиком.
- **C** — внешние/POC git-URL в ADR (`bitbucket.org/…`, `git.shakuro.com`) **оставлены by design** (decision-evidence, не KB-провенанс).
- **cwd-ловушка** — `render-confluence` из самой `docs/architecture` теперь падает с внятным «wiki root … does not exist — run from repo root / pass --cwd», а не с загадочным «no [integrations.confluence.space]».

## Acceptance §1 (два уровня — критерий разведён)
- **(i) обязаны исчезнуть:** repo-внутренние source-пути (`raw/`, `docs/architecture/`, `c4/src/`, `.foam/`, register-имена, `*.csv`).
- **(ii) by design остаются:** внешние/POC git-URL в ADR. Их наличие — НЕ провал критерия.

## 0. Обновить + РЕСТАРТ
```
claude plugin marketplace update
claude plugin update arch-wiki@ypolosov-marketplace --scope local
# РЕСТАРТ сессии. arch-wiki version → ждём plugin 0.8.2
```

## 1. Проверка (из КОРНЯ репо, не из docs/architecture)
```
arch-wiki render-confluence --all > /tmp/aw-mirror.json
```
- Ни одно `data.pages[].body` не содержит `raw/…`, `docs/architecture/…`, `c4/src/*.c4`, `.foam/…`, `*.csv`, голых `risks.md`/`glossary.md`, ни `**Source:**`-полей с путём.
- `CLAUDE.md` отсутствует в `data.pages` (исключён).
- C4-id (`product.gaming.brand.core.service`) и доменные термины — на месте (нет ложных срабатываний).
- POC git-URL в ADR — остаются (tier ii, ожидаемо).
- Затронутые страницы: `drifted:true` + warning'и (`stripped a **Source:** field…`, `neutralized repo-internal path…`). Перепубликуются один раз чисто.
- cwd-проверка: запусти `render-confluence` из `docs/architecture` → exit 1 с «wiki root … does not exist».

## 2. Публикация
`publish` (2 прохода) → выборка страниц: чистая проза без repo-путей; C4-stub-картинки целы.

## Откат
Плагин — `claude plugin update …` на v0.8.1 (`ref`). Контент — git.
