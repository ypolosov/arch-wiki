# arch-wiki v0.8.1 — ре-тест на `gt` (patch: зеркало не несёт git-источник)

> Один фикс поверх v0.8.0. Схема не меняется (v2, миграции нет). Полный флоу — [RELEASE-0.8.0-gt-test.md](RELEASE-0.8.0-gt-test.md).

## Что изменилось
Зеркало Confluence — **курируемая проекция**, а не байтовая копия. Раздел `## Sources`
(провенанс: указывает на git source-of-truth `raw/…`) теперь **срезается** на этапе
рендера, до `contentHash` и до RU-маскинга. Схему (rule 6 — Sources остаётся в wiki) **не трогаем**.

Симптом v0.8.0: 36 из 133 публикуемых страниц несли `## Sources` со ссылками на `raw/…`
(путь лежал как inline-code → `neutralizeRepoRelativeLinks` его пропускал).

## 0. Обновить + РЕСТАРТ
```
claude plugin marketplace update
claude plugin update arch-wiki@ypolosov-marketplace --scope local
# РЕСТАРТ сессии. arch-wiki version → ждём plugin 0.8.1
```

## 1. Проверка фикса
```
arch-wiki render-confluence --all > /tmp/aw-mirror.json
```
- Ни у одной `data.pages[].body` нет раздела `## Sources` и нет путей `raw/…` / repo-URL.
- У страниц, где был провенанс, в `data.pages[].warnings` — строка
  «stripped the `## Sources` provenance section…».
- `data.pages[].drifted: true` примерно у 36 страниц (контент изменился — Sources убран) →
  при `publish` они **один раз** перепубликуются чистыми, дальше drift-guard молчит.
- Fence-aware: если в теле есть пример с ` ``` `…`## Sources`…` ``` ` внутри код-блока — он сохраняется.

## 2. Публикация
`publish` (2 прохода) → открой выборку страниц в Confluence: **нет** раздела Sources,
нет ссылок на `docs/architecture/raw/...`. Остальное (кросс-ссылки, reverse-edge, C4-заглушки,
RU) — как в v0.8.0, без регрессий.

## Откат
Плагин — `claude plugin update …` на v0.8.0 (`ref`). Контент — git.
