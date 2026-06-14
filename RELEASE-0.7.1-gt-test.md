# arch-wiki v0.7.1 — тест-ранбук для `gt`

> Патч по фидбэку ре-теста v0.7.0 (все 3 минора + RU + live-раунд-трип прошли). 4 правки, схема не меняется (v2).
> Полный флоу — [RELEASE-0.7.0-gt-test.md](RELEASE-0.7.0-gt-test.md).

## 0. Обновить + РЕСТАРТ
```
claude plugin marketplace update
claude plugin update arch-wiki@ypolosov-marketplace --scope local
# ⚠️ РЕСТАРТ сессии (PATH-бинарь резолвится на старте). Если version всё ещё 0.7.0 — см. §3.
arch-wiki version        # ждём: plugin 0.7.1
```

## 1. [P1] issue: inline trace-ссылки (не дамп «Источник»)
`/arch-wiki:issue <ID> arch` после publish зеркала → ссылка на зеркало стоит **по первому упоминанию**
артефакта в прозе (как в зеркале: `Keycloak ([ADR-011](url)) отвечает за identity`); **раздела `## Источник`
и мета-приписок больше нет**. Данные — `render-issue data.traceLinks[]` (id/title/url). Идемпотентность та же:
URL не в `contentHash`. Шаблоны `issue-arch.md`/`issue-techdesign.md` и `commands/issue.md` инвертированы.

## 2. [P2] record-page --from-plan
`arch-wiki record-page --source <relPath> --page <id> --from-plan /tmp/aw-mirror.json` — читает **актуальный**
`contentHash` (и `pageId`, если `--page` не задан) из сохранённого плана. Больше не копируешь `--hash` руками →
на pass-2 (резолв кросс-ссылок меняет хеш) нет ложного `drifted`. `publish.md` обновлён на этот вызов.

## 3. [P2] version/doctor: варнинг про устаревший PATH-бинарь
`arch-wiki version` / `arch-wiki doctor` теперь выдают `warnings: ["a newer arch-wiki (X) is installed but
this PATH binary is Y — restart…"]`, если в `~/.claude/plugins/installed_plugins.json` зарегистрирована версия
новее запущенной (бинарь доходит вверх до файла от своего install-дира). Best-effort: при локальном
`--plugin-dir`/запуске из исходников — молча null. Проверка: после `plugin update` БЕЗ рестарта старый
`arch-wiki version` должен показать варнинг про 0.7.1.

## 4. [P3] RU: EN структурные метки
В RU-зеркале **структурные/методологические метки держим на английском**: 6-частный QA-сценарий
(Source/Stimulus/Artifact/Environment/Response/Measure), arc42-маркеры секций, ADD-поля / заголовки
структурных таблиц — переводится только их содержимое. Для детерминированного enforcement — добавь их в
`integrations.confluence.preserveTerms`. Зафиксировано в `schema/CLAUDE.md` и `publish.md`.

## Откат
Плагин — `claude plugin update …` на v0.7.0 (`ref` в каталоге). Контент — git.
