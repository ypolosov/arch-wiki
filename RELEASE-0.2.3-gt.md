# arch-wiki 0.2.3 → gt: hotfix-обновление (плагин теперь загружается)

Контекст: 0.2.2 на gt установился, но **падал при загрузке** (`Duplicate hooks file
detected`) — манифест декларировал `hooks/hooks.json`, который Claude Code грузит сам.
Из-за этого не работали слэш-команды, хуки и `arch-wiki` на PATH (adoption прошёл только
через прямой вызов бандла). **0.2.3 убирает декларацию хуков из манифеста** — плагин должен
грузиться нормально, а `bin/arch-wiki` автоматически попадать на PATH.

**Adoption повторять НЕ нужно** — схема не менялась (v1). Это обновление лишь чинит загрузку
плагина. Публикация со стороны автора уже сделана: тег `v0.2.3`, каталог
`ypolosov/ypolosov-marketplace` пинит `v0.2.3`/`0.2.3`.

---

## Инструкция для Claude Code в проекте gt

**Миссия:** обновить arch-wiki до **0.2.3**, подтвердить, что плагин теперь **загружается**
(а не `failed to load`), что слэш-команды/хуки/`arch-wiki` на PATH работают, и что вики
осталась нетронутой (re-adopt не требуется). Отчитаться.

### Шаг 1. Обновить плагин

gt стоит в scope **local**, поэтому `update` нужен с `--scope local` (иначе «not installed
at scope user»):

```bash
claude plugin marketplace update ypolosov-marketplace
claude plugin update arch-wiki@ypolosov-marketplace --scope local
```

Перезагрузить плагины:

```text
/reload-plugins
```

Если `update` пишет «Already up to date», но версия не сменилась — переустанови в том же scope:
`claude plugin uninstall arch-wiki@ypolosov-marketplace --scope local` →
`claude plugin install arch-wiki@ypolosov-marketplace --scope local`.

### Шаг 2. Подтвердить, что плагин ЗАГРУЗИЛСЯ (главная проверка)

```bash
claude plugin list
```

Ожидаемо: `arch-wiki@ypolosov-marketplace  Version: 0.2.3  Status: ✓ loaded` (или без
пометки failed). **Если снова `failed to load`** — пришли точный текст ошибки и СТОП.

### Шаг 3. Проверить, что заработало то, что было сломано

**3a. `arch-wiki` на PATH** (раньше — command not found):

```bash
which arch-wiki && arch-wiki doctor
```
Ожидаемо: путь к bin найден; `doctor` → `data.pluginVersion == "0.2.3"`,
`data.templatesPresent == true`. **Отметь в отчёте, на PATH ли теперь `arch-wiki`** (это была
открытая проверка).

**3b. Слэш-команды** (раньше недоступны) — выполни любую лёгкую, напр. статус миграции через
команду lint или migrate:

```text
/arch-wiki:migrate
```
Для уже принятой вики первый шаг команды (`arch-wiki version --target` / `migrate --status`)
должен показать, что миграций не требуется (см. 3c). Достаточно убедиться, что команда
**распознана и запускается** (а не «unknown command»).

**3c. Re-adopt НЕ нужен — подтвердить, что схема уже v1:**

```bash
arch-wiki version --target
arch-wiki migrate --status
```
Ожидаемо: `version --target` → `data.plugin == "0.2.3"`, `data.targetSchema == 1`,
`data.migrationNeeded == false`; `migrate --status` → `from == 1, to == 1, applied == []`
(ничего применять не нужно). **Не запускай `adopt`** — вики уже принята.

**3d. Lint всё так же чист над baseline:**

```bash
arch-wiki lint --json
```
Ожидаемо: `findings:[]`, `counts:{high:0,medium:0,low:0}`, exit 0 (baseline из adoption
по-прежнему подавляет pre-existing).

**3e. Хуки живут** (необязательно, мягкая проверка): попытка записи в `raw/` должна
блокироваться PreToolUse-хуком `guard-path` (exit 2). Не выполняй деструктивно — достаточно
отметить, что хуки загрузились (в `claude plugin list`/`/hooks` нет ошибок).

### Шаг 4. Чистота вики

Обновление версии плагина не трогает контент. Проверь, что рабочее дерево чистое:

```bash
git status --porcelain
```
Ожидаемо: пусто (adoption-коммит уже был сделан ранее; новых изменений быть не должно).

### Отчёт (вернуть в чат)

- **loaded?** статус `arch-wiki` в `claude plugin list` (loaded vs failed; если failed —
  текст ошибки).
- **PATH?** найден ли `arch-wiki` через `which` / отработал ли `arch-wiki doctor` без
  `$CLAUDE_PLUGIN_ROOT`.
- **slash?** распозналась ли `/arch-wiki:migrate` (и любая другая).
- **hooks?** загрузились ли хуки без ошибок.
- **schema/lint:** `version --target` (targetSchema 1, migrationNeeded false), `lint` (0
  findings).
- **ergonomics:** любые шероховатости обновления (scope, reload, и т.п.).
