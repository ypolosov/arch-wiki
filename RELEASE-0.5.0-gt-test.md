# arch-wiki v0.5.0 — тест-ранбук для проекта `gt`

> Это инструкция **для Claude Code, запущенного из репозитория `gt`** (cwd = корень gt, чтобы
> Foam/LikeC4 MCP видели `docs/architecture` и `c4/`). Выполняй по шагам, **строго соблюдая
> safety-пометки**. `gt` — живая wiki (100+ артефактов); ничего не ломаем.

## 0. Предусловия (делает человек, до запуска)
1. Запушены `arch-wiki` (main + tag `v0.5.0`) и каталог `ypolosov-marketplace`.
2. MCP в user scope подключены и `✓`: `atlassian`, `foam`, `likec4` (для CAP-2 ещё `atlassian`).
   Проверь: `claude mcp list` — все три `✓ Connected`. `foam`/`likec4` берут воркспейс из **cwd**,
   поэтому Claude должен быть запущен из корня `gt`.

## 1. Обновить плагин в gt (миграции НЕ нужны — схема остаётся v2)
```
claude plugin marketplace update
claude plugin update arch-wiki@ypolosov-marketplace --scope local
arch-wiki version --target        # ждём: plugin 0.5.0, schema 2, migrationNeeded:false
arch-wiki doctor                  # ok:true, pluginVersion 0.5.0
```
Если `version --target` покажет `migrationNeeded:true` — **СТОП**, сообщи человеку (не ожидается).

## 2. Дополнить project-config (агностичные, опциональные поля)
Открой `docs/architecture/.arch-wiki/config.json` и добавь (значения для gt):
```jsonc
{
  "integrations": {
    "confluence": {
      "space": "<TEST_SPACE_KEY>",          // ⚠️ ТЕСТОВОЕ пространство, НЕ продовое gt!
      "cloudId": "6eaea964-fdb6-4dd2-95ff-9cfab9de4397"
      // опц.: "exclude": { "statuses": ["proposed","rejected"], "basenames": ["risks","gap-analysis","kanban"] }
    },
    "upstream": {
      "userStoryLog": { "cloudId": "6eaea964-fdb6-4dd2-95ff-9cfab9de4397", "pageId": "16121885", "childTitlePrefix": "Story:" }
    }
  }
  // опц. тюнинг C4-проверки: "c4": { ..., "consistency": { "requireDocumentation": ["system","container"] } }
}
```
Проверь: `arch-wiki config --check` → exit 0. **Не коммить секреты** — здесь их нет (только id/space).

---

## 3. CAP-4 — `validate-c4` (read-only; безопасно, начни с него)
Модель берём из **LikeC4 MCP**, проверку делает Core (он MCP не вызывает — получает JSON через stdin).
1. `ToolSearch "mcp likec4"` → вызови `read-project-summary` (project по умолчанию). Сохрани JSON.
2. **Сначала baseline** (gt — легаси, иначе утонем в шуме): передай тот JSON в
   `arch-wiki validate-c4 --stdin --establish-baseline`. Ждём `baselineEstablished: <N>`,
   создан `docs/architecture/.arch-wiki/c4-baseline.json`.
3. Теперь дельта: `arch-wiki validate-c4 --stdin` (снова передай модель). Ждём **0 findings**
   сразу после baseline. Затем убери одну wiki-entity ИЛИ добавь элемент в `c4/src/*.c4` и
   повтори — должна появиться `c4-element-without-wiki-entity` / `wiki-entity-without-c4-element`.
4. Fallback без MCP: `arch-wiki validate-c4 --source regex` (читает `c4().dir`, лоссиво).
- **Ожидаемо:** read-only, ничего не пишет кроме `c4-baseline.json`. Реверт: `git checkout docs/architecture/.arch-wiki/c4-baseline.json`.

## 4. CAP-1 — `pull-stories` (пишет в `raw/_synced/`; реверсивно через git)
1. `arch-wiki pull-stories --plan` → ждём `cloudId`, `rootPageId: "16121885"`, `childTitlePrefix: "Story:"`,
   `alreadyPulled: []`. Если exit 2 → не заполнен `userStoryLog` (шаг 2).
2. `ToolSearch "mcp confluence"` (atlassian). `getConfluencePageDescendants(cloudId, 16121885, depth 2)`,
   пагинация по `cursor`. Оставь детей с title, начинающимся на `Story:`. Собери их page-id = LIVE-набор.
3. На каждую Story: `getConfluencePage(..., contentFormat: markdown)` → **передай тело в stdin**:
   `arch-wiki record-story --page <id> --title "<title>" --page-version <v> [--parent <id>] [--slug <s>]`
   (`--page-version` = Confluence `version.number`; `cac` резервирует `--version`).
   Для русских/нелатинских заголовков **обязателен `--slug`**. Идемпотентно: повтор без изменений → `written:false`.
4. Проверь: появились `docs/architecture/raw/_synced/user-story-log/<id>-<slug>.md` (read-only машинные снапшоты,
   frontmatter `source: confluence`), и `docs/architecture/.arch-wiki/pulled-sources.json`.
5. Orphan-reconcile (human-gate): `arch-wiki prune-stories --live <comma-sep live page-ids>` — **план по
   умолчанию** (печатает orphan'ов, `committed:false`, ничего не удаляет). Покажи список человеку, затем
   удали явно: `arch-wiki prune-stories --live <ids> --commit`.
6. Затем обычный ingest: `/arch-wiki:ingest raw/_synced/user-story-log/` — **дедуп**: если драйвер уже имеет
   `source:` на снапшот, SKIP/UPDATE по выбору SA, не плодить дубликат. User Story Log — advisory, драйверы — канон.
- **Safety:** `raw/_synced/` машинно-владеемая, ручные правки блокирует guard-хук. Реверт: `git clean/checkout` по `raw/_synced/` и `.arch-wiki/pulled-sources.json`.

## 5. CAP-2 — `publish` (⚠️ САЙД-ЭФФЕКТ в Confluence — сначала dry, потом ТЕСТ-пространство)
1. **Сначала lint:** `arch-wiki lint --severity high` — если есть `duplicate-basename`, **СТОП** и почини
   (коллизия basename схлопнёт страницы зеркала).
2. **Dry-run (без side-effect):** `arch-wiki render-confluence --all` → `MirrorPlan`: посмотри `pages`
   (parent-first, `body`, `parentSource`, `contentHash`, `alreadyPublished`, `drifted`) и `orphans`.
   Убедись, что фильтр видимости отработал (нет `risks`/`gap-analysis`/proposed-ADR; per-page `confluence:false`/
   `audience:internal` исключают). Exit 2 → не заполнен `confluence.space`.
3. **Публикация только в ТЕСТ-пространство** (`<TEST_SPACE_KEY>`, не продовое gt):
   `ToolSearch "mcp confluence"` → **human-gate**: покажи человеку списки create/update/**delete**;
   удаление сирот — только с явным подтверждением и **только** для страниц, числящихся в ledger.
   Публикуй parent-first (`createConfluencePage`/`updateConfluencePage`, `contentFormat: markdown`,
   `spaceId`, `parentId` = page-id родителя). После каждой: `arch-wiki record-page --source <relPath> --page <pageId> --hash <contentHash>`.
4. Второй прогон `render-confluence --all` → кросс-ссылки на уже опубликованные страницы должны стать
   page-id-ссылками; `alreadyPublished:true`, `drifted:false` на неизменённых.
- **Safety:** публикуй В ТЕСТ-ПРОСТРАНСТВО. Реверт: удали тестовые страницы в Confluence + `git checkout`
  `docs/architecture/.arch-wiki/published-pages.json` и `published_as`-frontmatter затронутых артефактов.
  **Никогда** не удаляй Confluence-страницу, которой нет в ledger.

## 6. CAP-3 — Foam/LikeC4 MCP (навигация, read-only; уже использованы в 3–5)
- `foam`: `get_workspace_info` (`read_only:true`), `search_resources`/`get_connections` — навигация по wiki.
- `likec4`: `read-project-summary`/`search-element`/`query-graph` — обзор модели.
- **Инвариант:** это только подсказки; любой вердикт (ссылки/линт/coverage/C4-дрейф/ID) даёт **только** `arch-wiki`.

## 7. Трассировка end-to-end (склейка всех CAP)
`arch-wiki trace <ID>` на драйвере, рождённом из Story (шаг 4→6) и опубликованном (шаг 5): цепочка
Story-снапшот → driver → ADR → issue → Confluence-страница (`showcase`/`published_as`).

## Откат всего теста
Всё в git, кроме Confluence-страниц: `git checkout -- docs/architecture/.arch-wiki/` +
`git clean -fd docs/architecture/raw/_synced/` + удалить тестовые страницы в Confluence-`<TEST_SPACE_KEY>`.
Плагин-откат: `claude plugin update arch-wiki@ypolosov-marketplace --scope local` на прежний тег.
