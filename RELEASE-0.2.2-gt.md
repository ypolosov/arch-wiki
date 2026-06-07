# Релиз arch-wiki 0.2.2 → gt: публикация и adoption

Документ из двух частей. **PART A** выполняет автор плагина здесь — в репозитории
`ypolosov/arch-wiki` и в каталоге `ypolosov/ypolosov-marketplace` — ДО передачи на gt.
**PART B** — самодостаточный блок, который вставляется Claude Code на стороне gt.

Контекст распространения: gt ставит arch-wiki через marketplace с пиннингом. Каталог
`ypolosov/ypolosov-marketplace` указывает на git-ref через `source.ref`, а версия — через
поле `version`. Сейчас каталог пинит `ref: "v0.1.0"` / `version: "0.1.0"` — это СТАРЫЙ
prose-плагин. Новый код 0.2.2 лежит на `feat/deterministic-core` (commit `054cbd9`);
`main` всё ещё старый плагин (`7d9bdbd`); единственный тег `v0.1.0` указывает на старый код.
Пока PART A не выполнен, `claude plugin update arch-wiki@ypolosov-marketplace` на gt НЕ
доставит 0.2.2.

---

## PART A — Публикация (сделать здесь, ДО передачи gt)

### A.1. Опубликовать код 0.2.2 в репозитории плагина

Marketplace отдаёт ровно то, на что указывает `source.ref`. Нужен **иммутабельный тег**
`v0.2.2`. Ветка `feat/deterministic-core` для распространения непригодна (мутабельна),
`main` без merge всё ещё старый.

Рекомендуемая гигиена — влить ветку в `main` (она на 3 коммита впереди: `2.0.0`, `0.2.1`,
`0.2.2`), затем тег:

```bash
git -C /home/ypolosov/DEV/GITS/arch-wiki checkout main
git -C /home/ypolosov/DEV/GITS/arch-wiki merge --ff-only feat/deterministic-core
git -C /home/ypolosov/DEV/GITS/arch-wiki push origin main
```

Создать и запушить аннотированный тег `v0.2.2` (после ff-merge HEAD `main` = тот же `054cbd9`):

```bash
git -C /home/ypolosov/DEV/GITS/arch-wiki tag -a v0.2.2 054cbd9 -m "arch-wiki 0.2.2 — deterministic tool-first contract (schema v1)"
git -C /home/ypolosov/DEV/GITS/arch-wiki push origin v0.2.2
```

Минимум (если merge в `main` пока не делается): тег `v0.2.2` всё равно ставится прямо на
`054cbd9` и пушится — именно на него будет пинить каталог. Команды `git tag -a v0.2.2 054cbd9`
и `git push origin v0.2.2` выше работают и без merge.

> ⚠️ Не используй `claude plugin tag` — он создаёт тег вида `arch-wiki--v0.2.2`, на который
> ref `v0.2.2` в каталоге не разрешится. Нужен обычный `git tag v0.2.2`, как выше.

### A.2. Обновить каталог `ypolosov/ypolosov-marketplace`

> ⚠️ Локальный клон `/home/ypolosov/DEV/GITS/ypolosov-marketplace` отстаёт от `origin/main`
> на 2 коммита и записи `arch-wiki` в нём ещё НЕТ (она есть только на `origin/main`).
> **Сначала подтяни origin**, иначе будешь править файл без нужной записи:

```bash
git -C /home/ypolosov/DEV/GITS/ypolosov-marketplace checkout main
git -C /home/ypolosov/DEV/GITS/ypolosov-marketplace pull --ff-only origin main
```

Теперь в `.claude-plugin/marketplace.json` в записи `arch-wiki` обнови **на месте** три поля,
СОХРАНИВ все остальные (`author`, `repository`, `license`, `keywords`):

- `source.ref`: `"v0.1.0"` → `"v0.2.2"`
- `version`: `"0.1.0"` → `"0.2.2"`
- `description`: старое prose-описание → актуальное (детерминированный tool-first контракт)

**Оба поля `source.ref` и `version` обязаны быть подняты** — иначе `/plugin marketplace update`
не увидит изменений и потребитель останется на старой версии. Целевой вид записи (это
ЧАСТИЧНОЕ обновление полей, не замена всей записи — `author`/`repository`/`license`/`keywords`
остаются):

```json
{
  "name": "arch-wiki",
  "source": {
    "source": "github",
    "repo": "ypolosov/arch-wiki",
    "ref": "v0.2.2"
  },
  "version": "0.2.2",
  "description": "Deterministic, tool-first architecture-wiki contract: CLI + hooks for next-id, scaffold, lint, validate-graph, sync-templates, guard-path, migrate/adopt (schema v1). JSON-envelope output, non-destructive adoption of existing wikis."
}
```

Закоммитить и запушить (коммит/пуш — за тобой):

```bash
git -C /home/ypolosov/DEV/GITS/ypolosov-marketplace add .claude-plugin/marketplace.json
git -C /home/ypolosov/DEV/GITS/ypolosov-marketplace commit -m "arch-wiki: bump to v0.2.2 (deterministic contract, schema v1)"
git -C /home/ypolosov/DEV/GITS/ypolosov-marketplace push origin main
```

### A.3. Проверка согласованности (one-liner)

Тег в репо плагина и пин в каталоге должны совпадать (`source.ref` и `version` оба `v0.2.2`/`0.2.2`):

```bash
git -C /home/ypolosov/DEV/GITS/arch-wiki rev-parse v0.2.2 >/dev/null 2>&1 && git -C /home/ypolosov/DEV/GITS/ypolosov-marketplace grep -E '"ref": *"v0.2.2"|"version": *"0.2.2"' -- .claude-plugin/marketplace.json && echo "OK: тег v0.2.2 существует и каталог пинит v0.2.2/0.2.2" || echo "FAIL: тег или пин каталога не согласованы"
```

Только после прохождения A.3 передавай PART B на сторону gt.

---

## PART B — Инструкция для Claude Code в проекте gt

> Вставь весь блок ниже (до конца документа) в сессию Claude Code, открытую в корне
> репозитория gt — каталог, содержащий `docs/architecture`.

**Твоя миссия:** обновить плагин arch-wiki до версии **0.2.2**, выполнить **недеструктивную**
adoption-миграцию вики `docs/architecture`, доказать, что НИЧЕГО из существующего контента не
изменилось, и вернуть структурированный отчёт. Все команды — из корня репозитория gt.

### Жёсткие правила безопасности (читать первым)

1. **Никогда** не редактируй файлы в `raw/`, существующие артефакты (`adrs/`, `drivers/`,
   `iterations/`, `qa/`, `risks.md`, `glossary.md` и т.д.) и кураторские шаблоны
   `.foam/templates/*.md`.
2. Adoption пишет **исключительно** в `docs/architecture/.arch-wiki/*` — ровно три файла:
   `version.json`, `template-snapshot.json`, `lint-baseline.json`.
3. Если `git diff` / `git status` показывают изменение чего-либо, кроме новых файлов под
   `docs/architecture/.arch-wiki/` — **СТОП и откат** (раздел «Откат»). Не коммить.

### Шаг 0. Обновить плагин до 0.2.2 и подтвердить активную версию

Обновить каталог, затем обновить установленный плагин (gt стоит из marketplace с пиннингом —
канонический путь обновления именно `update`, не `install`):

```bash
claude plugin marketplace update ypolosov-marketplace
claude plugin update arch-wiki@ypolosov-marketplace
```

Слэш-эквивалент внутри сессии:

```text
/plugin marketplace update ypolosov-marketplace
/plugin update arch-wiki@ypolosov-marketplace
```

Если `update` пишет «Already up to date», хотя каталог точно бумпнут — переустанови явно:
`claude plugin uninstall arch-wiki@ypolosov-marketplace` затем
`claude plugin install arch-wiki@ypolosov-marketplace`.

Перезагрузить плагины (после обновления; рестарт сессии не нужен):

```text
/reload-plugins
```

Подтвердить активную версию через CLI плагина (это НЕ слэш-команда — `doctor` существует
только как `arch-wiki doctor`):

```bash
arch-wiki doctor
```

Ожидаемо: `data.pluginVersion == "0.2.2"`, `data.templatesPresent == true`. Альтернатива —
`claude plugin list` или `/plugin` → вкладка **Installed** → arch-wiki.

> **Если `arch-wiki: command not found`** — это первая реальная установка из marketplace,
> и нужно проверить, попал ли `bin/` плагина в PATH. Тогда: (а) используй слэш-команды как
> основной путь (`/arch-wiki:migrate`, `/arch-wiki:lint`), они вызывают CLI сами; (б) для
> прямых вызовов попробуй `node "$CLAUDE_PLUGIN_ROOT/dist/cli.cjs" <args>` (если переменная
> установлена). **Обязательно отметь в отчёте**, был ли `arch-wiki` на PATH — это открытый
> эмпирический вопрос, который эта установка как раз проверяет.

> **GATE (критично, fail-closed).** Если версия НЕ `0.2.2` — каталог всё ещё пинит старый
> плагин. **СТОП, не продолжай.** Adoption под старым плагином некорректен. Сообщи автору,
> что нужно выполнить PART A (тег `v0.2.2` + bump каталога), и останься на этом шаге.

### Шаг 1. Pre-flight проверки

Чистое дерево (доказательство недеструктивности строится на `git diff` — на грязном дереве оно невозможно):

```bash
git status --porcelain && test -z "$(git status --porcelain)" && echo CLEAN || echo "ABORT: working tree dirty, commit/stash first"
```

Зафиксировать baseline списка файлов вики:

```bash
git rev-parse HEAD; git ls-files docs/architecture | sort > /tmp/gt-wiki-files.before
```

Подтвердить версию/схему через CLI (ещё одна проверка GATE):

```bash
arch-wiki version --target
```

Ожидаемо: `data.plugin == "0.2.2"`, `data.schema == 1`, `data.targetSchema == null` (первая
adoption), `data.migrationNeeded == true`. Если `data.plugin != "0.2.2"` — **СТОП** (см. GATE).

Статус миграции (проверка первого запуска):

```bash
arch-wiki migrate --status
```

Ожидаемо: `data.from == 0`, `data.to == 1`, `data.applied == []`.

### Шаг 2. Dry-run

Предпочтительно — слэш-команда (печатает план без записи, НЕ применяет автоматически):

```text
/arch-wiki:migrate
```

Для первого запуска она выполнит `arch-wiki version --target`, `arch-wiki migrate --status`,
затем `arch-wiki adopt --dry-run` и покажет план.

CLI-fallback (ровно то, что слэш-команда вызывает под капотом):

```bash
arch-wiki adopt --dry-run
```

Ожидаемо: `{ok:true, command:"adopt", data:{ from:0, to:1, pending:[{from:0,to:1,description:"introduce .arch-wiki marker; snapshot templates + lint baseline (adopt existing wiki)"}], applied:[] }}`.
`applied:[]` подтверждает, что НИЧЕГО не записано. Exit code 0.

Узнать число pre-existing findings, которое станет baseline (на проверенной копии gt было 0):

```bash
arch-wiki lint --json
```

Запиши `data.counts` — это попадёт в `lint-baseline.json` и будет подавлено.

### Шаг 3. Применить (единственный шаг записи)

Предпочтительно — подтверди план dry-run, дай слэш-команде дойти до `arch-wiki adopt`:

```text
/arch-wiki:migrate
```

CLI-fallback (точная команда, которую выполняет слэш-команда):

```bash
arch-wiki adopt
```

Ожидаемо: `{ok:true, command:"adopt", data:{ from:0, to:1, pending:[...], applied:[{ to:1, description:"introduce .arch-wiki marker; ...", log:["snapshotted N curated template(s)","recorded lint baseline: M pre-existing finding(s)"] }] }}`. Exit code 0.

> **Не запускай `arch-wiki adopt` дважды.** Повторный non-dry-run adopt падает с exit 1
> («already adopted (schema v1); use 'migrate' instead»). Для БУДУЩИХ bump-ов схемы —
> `/arch-wiki:migrate` → `arch-wiki migrate`, не adopt.

### Шаг 4. Верификация недеструктивности (4 независимые проверки)

**A. `git status` — только новые файлы `.arch-wiki/*`, ничего изменённого/удалённого:**

```bash
git status --porcelain | grep -vE '^\?\? docs/architecture/\.arch-wiki/' && echo "FAIL: изменилось что-то кроме .arch-wiki/" || echo "PASS: добавлено только .arch-wiki/*"
```

**A'. Ровно три untracked-файла:**

```bash
git status --porcelain docs/architecture/.arch-wiki
```

Ожидаемо ровно: `?? docs/architecture/.arch-wiki/lint-baseline.json`,
`?? docs/architecture/.arch-wiki/template-snapshot.json`,
`?? docs/architecture/.arch-wiki/version.json`.

**A''. Tracked-файлы вики байт-в-байт как раньше (выполнять ДО `git add` — проверка
полагается на то, что `.arch-wiki/*` ещё untracked, тогда `git diff` их игнорирует):**

```bash
git ls-files docs/architecture | sort > /tmp/gt-wiki-files.after; diff /tmp/gt-wiki-files.before /tmp/gt-wiki-files.after && echo "PASS: список tracked-файлов не изменился"; git diff --quiet -- docs/architecture && echo "PASS: ноль модификаций tracked-контента вики"
```

**B. Детерминированный lint — 0 НОВЫХ findings над baseline (подавление автоматическое —
линтер читает `.arch-wiki/lint-baseline.json`):**

```bash
arch-wiki lint --json
```

Ожидаемо: `{ok:true, command:"lint", data:{ findings:[], counts:{high:0,medium:0,low:0} }}`,
exit 0. Любой finding здесь был бы НОВЫМ (после baseline).

**C. `sync-templates --check` сохраняет кураторские шаблоны (только отчёт, никогда не пишет):**

```bash
arch-wiki sync-templates --check
```

Классифицирует каждый шаблон: synced/missing/stale/curated. Кураторские (`curated`) — твои
авторские, помечаются как сохранённые (warning «<n> curated template(s) preserved»). Exit 2
возможен ТОЛЬКО как отчёт о дрейфе (missing/stale) — это не запись, кураторский файл не
модифицируется. **Не запускай `--force`** в рамках adoption.

**D. Маркер отражает новую версию/схему:**

```bash
arch-wiki version --target
```

Ожидаемо: `data.targetSchema == 1`, `data.migrationNeeded == false`, `data.plugin == "0.2.2"`.

Только после прохождения A, B, C, D — закоммить три новых файла (существующие артефакты НЕ трогать):

```bash
git add docs/architecture/.arch-wiki && git commit -m "chore(arch-wiki): adopt deterministic contract (schema v1, plugin 0.2.2)"
```

### Откат

adopt добавил только `docs/architecture/.arch-wiki/`, поэтому откат тотален.

До коммита (файлы ещё untracked):

```bash
rm -rf docs/architecture/.arch-wiki
git status --porcelain docs/architecture
```

Второй вывод должен быть пустым — дерево как до adoption; `arch-wiki version --target` снова
покажет `targetSchema == null`.

После коммита adopt:

```bash
git revert --no-edit HEAD
```

или, если adopt-коммит на вершине и не запушен:

```bash
git reset --hard HEAD~1
rm -rf docs/architecture/.arch-wiki
```

Проверка чистоты: `git status --porcelain` (пусто) и `ls docs/architecture/.arch-wiki` →
«No such file or directory».

> Откат версии плагина: на gt версия пиннится каталогом — возврат записи arch-wiki в
> `ypolosov/ypolosov-marketplace` к прежним ref/version + `claude plugin update
> arch-wiki@ypolosov-marketplace` восстановят прежний плагин. Контент вики при смене версии
> плагина не затрагивается; adopt никогда не менял артефакты/`raw/`/шаблоны, так что удаления
> `.arch-wiki/` достаточно для полного undo.

### Структурированный отчёт (вернуть в чат)

MCP (Atlassian/GitLab/Discord) на gt не подключён — отчёт верни текстом в чат. Собери:

- **environment:** вывод `arch-wiki version --target` и `arch-wiki doctor`
  (plugin/schema/node, templatesPresent); **был ли `arch-wiki` на PATH** (или пришлось
  слэш-команды / `$CLAUDE_PLUGIN_ROOT`).
- **worked/broke:** прошёл ли version gate (plugin == 0.2.2)? вышли ли
  `arch-wiki adopt --dry-run` и `arch-wiki adopt` с кодом 0? вставь `data.applied[].log` из
  envelope adopt (snapshot count N, baseline count M).
- **non-destructiveness proof:** вставь `git status --porcelain` (только 3 строки
  `.arch-wiki/*`) и результат `git diff --quiet -- docs/architecture` (PASS = ноль модификаций).
- **lint deltas:** `data.counts` из `arch-wiki lint --json` на момент adoption (= baseline M)
  и из повторного запуска после adoption (должно быть 0 новых). Отметь любое заново
  сработавшее правило.
- **false positives:** baseline-findings, похожие на реальный контент вики, а не на шум
  линтера; и любой кураторский шаблон, ошибочно помеченный `sync-templates --check` как
  stale/missing.
- **ergonomics:** показала ли `/arch-wiki:migrate` понятный first-time план? были ли
  непонятные envelope/exit-code? достаточно ли быстр lint на вики 100+ артефактов?

Опционально — GitHub issue (только если `gh` аутентифицирован под `ypolosov`). Сначала
`gh auth status`; если не залогинен — пропусти и верни только текстовый отчёт:

```bash
gh auth status && gh issue create --repo ypolosov/arch-wiki --title "gt adoption report: v0.2.2 schema v1" --body "Env: <version --target + doctor; arch-wiki on PATH?>. Adopt: exit 0, snapshot N, baseline M. Non-destructive: git status only .arch-wiki/* (paste). Lint: baseline M, 0 new post-adopt. sync-templates --check: curated preserved (n). False positives: <list>. Ergonomics: <notes>."
```
