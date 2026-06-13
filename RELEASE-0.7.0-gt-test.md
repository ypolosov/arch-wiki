# arch-wiki v0.7.0 — тест-ранбук для `gt`

> Запускать **из корня `gt`** в **новой сессии Claude Code**.
> v0.7.0 = по итогам ре-теста v0.6.0: **P0 релиз-гейт** (битый тег 3×) + **issue→Confluence trace-ссылка**
> + 3 минора зеркала (стабильность ре-перевода, перевод title, repo-relative ссылки). Схема wiki не меняется
> (v2, миграции нет). Полный флоу CAP-1..4 — в [RELEASE-0.6.0-gt-test.md](RELEASE-0.6.0-gt-test.md).

## 0. Обновить плагин + РЕСТАРТ
```
claude plugin marketplace update
claude plugin update arch-wiki@ypolosov-marketplace --scope local
# ⚠️ ПЕРЕЗАПУСТИ сессию Claude Code (бинарь PATH + MCP резолвятся на старте).
arch-wiki version        # ждём: plugin 0.7.0, schema 2
```

## 1. P0 — релиз-пайплайн (главный фикс; проверять В РЕПО arch-wiki, не на gt)
Маркетплейс ставит по **тегу**, а CI шёл только на `main`/PR → битый тег не ловился. Теперь три заслона:
- **`scripts/release-check.sh [version]`** — локальный pre-tag гейт: версия-синк (package.json ↔ plugin.json ↔
  version.ts ↔ arg) → пересборка `dist/cli.cjs` + проверка «не stale» → `npm test` → HEAD ≠ коммит прошлого
  тега → печатает точные команды `tag -f` / `push -f` + строки верификации peeled `^{}`.
- **`.github/workflows/release.yml`** — триггер `on: push tags v*`: на самом теге сверяет версии == тег,
  свежесть `dist`, гоняет тесты. Красный = битый тег виден сразу.
- **version-sync unit-тест** — `tests/unit/version-sync.spec.ts` валит обычный CI, если три файла разошлись.
- Проверка: после коммита 0.7.0 — `bash scripts/release-check.sh` → `OK` и команды; намеренно сломать версию
  в одном файле → гейт падает с понятной причиной.

## 2. issue → Confluence trace-ссылка (НОВОЕ)
Тело issue остаётся **self-contained** (инлайн-выжимки, без ссылок/id в теле), но добавляется раздел
**`## Источник`** со ссылками на Confluence-зеркало источника и связанных артефактов — навигируемый трейс.
1. **Конфиг** (`integrations.confluence`): для **абсолютных** ссылок в Jira добавь
   `"siteUrl": "https://<site>.atlassian.net"`. Без него ссылки root-relative `/wiki/…` (резолвятся из Jira
   на том же сайте Atlassian). `arch-wiki config --check` → exit 0.
2. **Сначала опубликуй зеркало** (`/arch-wiki:publish`) — иначе у целей нет page-id и ссылки не будет.
3. `arch-wiki render-issue --from <QA-…> --kind arch` → в `data.traceLinks` ссылки на mirror-страницы
   (source + его `## Related` артефакты, что уже в зеркале); `data.payload` несёт раздел `## Источник`.
   Если источник ещё не в зеркале — `traceLinks: []` + warning «not yet mirrored» (не ошибка).
4. `/arch-wiki:issue <ID> arch` → создаёт issue с разделом «Источник» (кликабельные ссылки на зеркало).
   **Идемпотентность:** `contentHash` НЕ включает trace-ссылки → публикация зеркала **не** дрейфит уже
   созданный issue (проверь: `render-issue` до и после publish → один `contentHash`).

## 3. Миноры зеркала (RU)
- **Стабильность ре-перевода (#1):** в RU-зеркале (`language:"ru"`) кросс-ссылка на ещё не опубликованную
  страницу резервируется как masked-ссылка `…/pages/pending`. Pass-2 меняет только restore-значение →
  **переводимый текст байт-в-байт тот же**, страницу НЕ переводишь заново. Проверь: pass-1 переведён →
  pass-2 `render-confluence` → у тех же страниц masked-body не изменился (поменялся только URL в restore).
- **Перевод title (#2):** `data.pages[].titleLabel` переводи, `titlePrefix` (`UC-014:`) оставляй as-is →
  заголовок `UC-014: <русский>`. Больше не делаешь руками.
- **Repo-relative ссылки (#3):** `[..](../iterations/)`, `[CLAUDE.md](CLAUDE.md)` и т.п. Core превращает в
  плоский текст (в Confluence это мёртвые href); список — в `data.pages[].warnings`. `/wiki/…`, absolute,
  `#anchor`, картинки — не трогаются. ⚠️ Разовый дрейф у страниц, где были такие ссылки (englishBody меняется).

## Откат
Контент — git (`git checkout -- docs/architecture/`). Плагин — `claude plugin update …` на v0.6.0
(`ref` в каталоге). Confluence-страницы — вручную (из ledger). Конфиг: убрать `siteUrl` → ссылки снова root-relative.
