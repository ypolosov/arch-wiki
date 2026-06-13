# arch-wiki v0.6.0 — тест-ранбук для `gt`

> Запускать **из корня `gt`** в **новой сессии Claude Code** (foam/likec4 MCP берут воркспейс из cwd).
> v0.6.0 = 6 фиксов из теста v0.5.0 (свёрнуты сюда) + **новая RU-проекция Confluence-зеркала** (CAP-2 RU).
> Полный флоу CAP-1..4 — в [RELEASE-0.5.0-gt-test.md](RELEASE-0.5.0-gt-test.md). Схема wiki не меняется (v2, миграции нет).

## 0. Обновить плагин + РЕСТАРТ (фикс P2#5)
```
claude plugin marketplace update
claude plugin update arch-wiki@ypolosov-marketplace --scope local
# ⚠️ ПЕРЕЗАПУСТИ сессию Claude Code: PATH-бинарь `arch-wiki` и MCP-реестр резолвятся на старте.
arch-wiki version        # ждём: plugin 0.6.0, schema 2
```
Если `arch-wiki version` ещё `0.5.0`/`0.5.1` — сессия не перезапущена (или зови по полному пути
`…/0.6.0/bin/arch-wiki`). Одно имя MCP на endpoint (несколько на один endpoint → тулы только одного).

## 1. Перепроверить фиксы 0.5.x (быстро)
- **P1#1 кросс-ссылки.** `arch-wiki render-confluence --all` → в `body` ссылки вида
  `/wiki/spaces/<SPACE>/pages/<id>` (НЕ голый id). После апдейта первый `publish` даст разовый
  `drifted:true` на страницах с кросс-ссылками — ожидаемая ре-публикация, чинит 404.
- **P1#2 2 прохода.** `publish` = create-all parent-first+record-page → re-render → update-drifted+record-page,
  пока `drifted=0`.
- **P2#3 prune.** `arch-wiki prune-stories --live <ids>` — план (`committed:false`, ничего не удаляет);
  удаление — `--commit`.
- **P2#4 page-version.** `record-story … --page-version <Confluence version.number>` → в `pulled-sources.json`
  реальная версия (не 0). Флаг `--version` больше не используется (его резервирует `cac`).
- **P3#6 validate-c4.** `arch-wiki validate-c4 --source regex` без `[c4]` → exit 2 с внятной подсказкой.

## 2. CAP-2 RU — RU-проекция зеркала (НОВОЕ, главное в 0.6.0)
Канон остаётся английским в `docs/architecture/**`; в Confluence публикуется **перевод**. Core детерминированно
защищает структурные токены, перевод делает LLM на этапе publish, restore — детерминированный.

1. **Включи язык** в `docs/architecture/.arch-wiki/config.json`:
   ```jsonc
   "integrations": { "confluence": {
     "space": "<TEST_SPACE_KEY>", "cloudId": "6eaea964-fdb6-4dd2-95ff-9cfab9de4397",
     "language": "ru",
     "preserveTerms": ["sweepstakes","sweep coins","redemption","wager","free spins","KYC","AML","RG","AMOE",
                       "brand","operator","player","wallet","arc42","ADR","C4","LikeC4","Kafka","Kubernetes"]
   } }
   ```
   `arch-wiki config --check` → exit 0. (Core до-мешивает в `preserveTerms` **жирные** термины из `glossary.md`.)
2. **Render + смотри план:** `arch-wiki render-confluence --all > /tmp/aw-mirror.json`. Проверь в нём:
   `data.language: "ru"`; `data.preserveTerms` = твой список + glossary-термины (sorted/unique); у страниц
   `body` содержит плейсхолдеры `%%AWP<n>%%` (Core замаскировал код / URL ссылок / ID), `restore` непустой.
   ⚠️ Включение `language` сменит `contentHash` у всех страниц → разовый `drifted:true` (ре-публикация в RU).
3. **Publish (по [publish.md](commands/publish.md), 2 прохода + перевод):** для каждой страницы переведи `body`
   на RU — **прозу/заголовки/label ссылок**, оставляя ДОСЛОВНО каждый `%%AWP<n>%%` и каждый термин из
   `data.preserveTerms`. Затем `arch-wiki finalize-confluence --source <relPath> --plan /tmp/aw-mirror.json
   < translated.md` → публикуй `data.body` из вывода (`contentFormat: markdown`). Если `missing` непуст или
   exit 2 — **перепереведи** страницу (потерян плейсхолдер), не публикуй.
4. **Проверь в Confluence:** проза на русском; **ID** (`UC-014`/`QA-…`/`ADR-…`) целы; **кросс-ссылки** ведут
   на целевые страницы (URL не переведён); **код**-блоки нетронуты; доменные/IT-термины из denylist остались
   на английском; заголовки вида `UC-014: <русский заголовок>`.
5. **Стабильность:** повтори `render-confluence --all` без правок канона → `drifted:false` (перевод НЕ в ключе
   хэша, зеркало не дрейфит от прогона к прогону).

## Откат
Контент — в git: `git checkout -- docs/architecture/.arch-wiki/` (+ убери `language`/`preserveTerms` из config
для возврата к английскому зеркалу) + `git clean -fd docs/architecture/raw/_synced/`. Плагин —
`claude plugin update …` на прежний тег. Тестовые Confluence-страницы — удалить вручную (только из ledger).
