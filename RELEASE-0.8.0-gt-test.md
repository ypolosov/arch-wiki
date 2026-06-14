# arch-wiki v0.8.0 — тест-ранбук для `gt`

> Тема: **сделать путь публикации в Confluence детерминированным и безопасным** — чтобы весь KB gt
> (источник правды) зеркалился надёжно. 7 правок, схема не меняется (v2, миграции нет).
> Полный флоу — [RELEASE-0.7.1-gt-test.md](RELEASE-0.7.1-gt-test.md).

## 0. Обновить + РЕСТАРТ
```
claude plugin marketplace update
claude plugin update arch-wiki@ypolosov-marketplace --scope local
# ⚠️ РЕСТАРТ сессии. Если version всё ещё 0.7.1 — арч-вики сам предупредит (см. 0.7.1 §3).
arch-wiki version        # ждём: plugin 0.8.0
```

## 1. Конфиг публикации (numeric spaceId + cloudId)
`createConfluencePage` требует **numeric** spaceId (ключ `SD` → HTTP 400). Один раз получи id:
`getConfluenceSpaces(keys:["SD"])` → напр. `163845`. В `docs/architecture/.arch-wiki/config.json`:
```jsonc
"integrations": { "confluence": {
  "space": "SD",                 // KEY — для /wiki/spaces/SD/... URL кросс-ссылок
  "spaceId": "163845",           // numeric — для createConfluencePage (НОВОЕ)
  "cloudId": "6eaea964-...",     // нужен create/update (НОВОЕ: пробрасывается в план)
  "siteUrl": "https://veryuniquename.atlassian.net",
  "language": "ru", "preserveTerms": [ ... ]
} }
```
`arch-wiki render-confluence --all > /tmp/aw-mirror.json` → в плане: `data.spaceKey`/`data.spaceId`/`data.cloudId`,
плюс **preflight** `data.warnings` (если spaceId/cloudId не заданы — публикация остановится с понятным списком,
а не упадёт в середине). publish.md шлёт `cloudId`+`data.spaceId` (numeric) в MCP.

## 2. Destination-drift guard (не затирать ручные правки)
- `record-page --page-version <n>` пишет версию Confluence-страницы в ledger (`PageLedgerRow.pageVersion`).
- В плане у каждой страницы — `ledgerPageVersion`. Перед `updateConfluencePage` publish.md делает
  `getConfluencePage`, сравнивает live-версию с `ledgerPageVersion`; **live выше → страницу правили руками →
  WARN+skip** (перезапись только по явному force). Детерминированный вердикт, не «на глаз».
- Проверка: опубликуй страницу → поправь её в Confluence UI → `publish` снова → она должна быть пропущена с варнингом.

## 3. render-confluence --page fail-fast
`arch-wiki render-confluence --page <неверный/исключённый путь>` → **exit 2** с подсказкой (раньше — тихий
`ok:true` с пустым `pages[]`). Согласовано с `record-page`/`finalize`.

## 4. Reverse trace edge (issue ↔ page)
Если у артефакта есть `realized_by:[GRMTCH-N]` (пишет `record-issue`), Core добавляет в тело страницы строку
**`Realized by: [GRMTCH-N](…/browse/GRMTCH-N)`** — двусторонний трейс (forward-ссылка уже в теле issue с 0.7.1).
Нужен `integrations.jira.siteUrl` (или берётся `confluence.siteUrl`). Строка — часть тела (переводится/защищается
в RU, дрейфит при смене issue). ⚠️ Разовый дрейф у страниц с `realized_by` при первом publish 0.8.0.

## 5. C4-диаграммы — заглушки (пока)
Локальные картинки `![..](../c4/x.png)` → детерминированная **заглушка** «C4 diagram placeholder — source `...`»
(в MCP нет загрузки вложений). Зеркало показывает место диаграммы без битой картинки; саму диаграмму пока
прикрепляй в Confluence руками. `data.pages[].warnings` перечисляет заглушенные источники. Реальное встраивание — позже.

## Проверка полноты KB-зеркала в gt
`render-confluence --all` → сверь число `data.pages` с числом видимых wiki-страниц; `data.orphans` = кандидаты
на удаление; `data.warnings` пуст (конфиг полон). Затем `publish` (2 прохода), `trace <ID>` показывает обе стороны.

## Закалка (фиксы ревью + фидбэк 0.7.1, вошли в 0.8.0)
- **B-1** — термины `confluence.preserveTerms` (+ bold из `glossary.md`) теперь **детерминированно
  маскируются Core** в `%%AWP%%` (как код), а не «просьба к переводчику». Чтобы оставить структурный
  ярлык английским — добавь его в `preserveTerms`.
- **B-2** — `record-issue` теперь **апдейтит** строку леджера при смене hash (key+source+kind+role),
  а не только при первом создании.
- **R1 (HIGH)** — `record-page` обновляет `pageVersion` в леджере даже при неизменном контенте
  (force-republish с новой версией Confluence) → drift-baseline больше не «застревает».
- **R2** — нейтрализация ссылок/заглушки картинок **не трогают код** (fenced/inline) — нет порчи примеров.
- **R3** — `--page-version` нечисловой → **exit 1** (fail-fast), не тихий `NaN`.
- **R4** — `confluence.spaceId` в схеме теперь обязан быть **числом** (не KEY) — ловится при `config`,
  а не как HTTP 400 в середине публикации.
- **R6/R7** — reverse-edge: разные варнинги для «нет siteUrl» vs «не-Jira issue»; ключ Jira обёрнут в
  inline-code (защищён в RU).
- **C-2** — `render-confluence --page <X>` отдаёт цель **+ цепочку предков** (parent-first) — частичная
  публикация сохраняет иерархию зеркала.
- **D** — нейтрализованный ярлык вида `CLAUDE.md` обёрнут в inline-code (Confluence не авто-линкует в
  `http://CLAUDE.md`).
- **C-1** — role-prefix в примерах/фикстурах — два тега `[BE] [Techdesign]` (агностично; задаётся в конфиге gt).
- **B-3** — stale-binary-варнинг ловит апгрейды с 0.7.1+ (с 0.7.0 на 0.7.1 его не было — старый бинарь без фичи).

## Откат
Плагин — `claude plugin update …` на v0.7.1 (`ref`). Контент — git. Конфиг: убрать `spaceId`/`jira.siteUrl` → старое поведение.
