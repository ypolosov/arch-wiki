# arch-wiki v0.8.5 — ре-тест на `gt` (проза-нейтрализация: DELETE → RENAME)

> Поверх v0.8.4. Источник: ре-тест v0.8.3 на `gt` (RU-зеркало, ветка `llm-wiki`).
> v0.8.3 закрыл утечки путей (acceptance i/ii ПОЛНОСТЬЮ) — НЕ регрессировать. Оставалась порча
> ПРОЗЫ (~45 обрубков на 27 страницах). Схема не меняется (v2). Затрагивается только `render-confluence`.

## Что изменилось (по 7 классам дефектов ре-теста 0.8.3)
**Сдвиг философии: для in-prose ссылок на git-артефакты — RENAME (путь → человеческое имя), не DELETE.**
Новая чистая `humanizeRepoRef`: `risks.md`→«the risk register», `gap-analysis`→«the gap analysis»,
`kanban`→«the backlog», `glossary`→«the glossary», `utility-tree`→«the utility tree»,
`c4/src/model.c4`/bare `c4/`/glob `c4/src/*.c4`→«the C4 model» (`views.c4`→«the C4 views`,
`deployment.c4`→«the C4 deployment view»), `raw/…`→«the source brief», `*.csv`→«the data file»,
`docs/architecture/…`→«the architecture wiki», `CLAUDE.md`→«the schema contract»; `.foam/…` — drop.

- **Классы 1,2,4 (dangling verb/connective, subject removal, litter):** путь переименовывается на месте,
  связка/глагол/скобка уцелевают сами. `tracked in `risks.md`.` → `tracked in the risk register.`;
  `` `raw/TODO.md` directs …`` → `the source brief directs …`. Висячих обрубков/мусора нет.
- **Класс 3 (dangling arrow/colon):** c4-линк-подпись теперь даёт фразу: `- Model:` → `- Model: the C4 model`.
- **Класс 5 (wikilink на excluded register):** `[[risks]]`/`(see [[risks]])` → «the risk register»
  (а не голое `risks`); алиас с путём `[[risks#^R-007|risks.md (R-007)]]` → «the risk register».
- **Класс 6 (md-форма cross-link):** `[ADR-0023](0023-…md)` на зеркалированную ADR теперь резолвится в
  `/wiki/...` (раньше резолвился только `[[wikilink]]`; Supersedes-связь снова кликабельна).
- **Класс 7 (c4-glob):** `c4/src/*.c4` распознаётся ЦЕЛИКОМ (charset `*`) → «the C4 model», без
  осиротевшего `*.c4` и непарного backtick; соседние code-span целы.
- **`**Source:**`:** git-путь в значении переименовывается, не-git остаток (Jira-ref, атрибуция) сохраняется.

## Acceptance §1 v0.8.5 (ре-тест gate)
- **(i) 0 утечек путей — НЕ регрессировать (как 0.8.3).** Скан И `data.pages[].body`, **И**
  `data.pages[].restore[].original` (утечка могла бы прятаться в значениях замаскированных линков).
- **(ii) by-design keep целы:** внешние/POC git-URL (`bitbucket.org`×4, `git.shakuro.com`×1),
  C4-id `product.gaming.brand.core.service`×15, `README.md`×1; `CLAUDE.md` отсутствует в `data.pages`.
- **Прозовый sanity (РАСШИРЕННЫЙ):** 0 dangling-verb/connective обрубков; 0 whitespace/punct-litter
  (`( `, `(,`, `..`, ведущий пробел); 0 осиротевших `*.c4`/непарных backtick. На in-prose ref видно
  человеческое имя («the risk register»/«the C4 model»/«the gap analysis»), не путь и не голое `risks`.
- **Класс 6:** md-форма cross-link на зеркалированную ADR резолвится в `/wiki` (Supersedes кликабельна).
- **Без дрейфа на чистых страницах** (байт-идентичность; затронутые дрейфнут один раз).

## 0. Обновить + РЕСТАРТ
```
claude plugin marketplace update
claude plugin update arch-wiki@ypolosov-marketplace --scope local
# РЕСТАРТ сессии. arch-wiki version → ждём plugin 0.8.5
```

## 1. Проверка (из КОРНЯ репо)
```
arch-wiki render-confluence --all > /tmp/aw-mirror.json
```
- Скан `data.pages[].body` И `data.pages[].restore[].original`: ноль `raw/`, `docs/architecture/`,
  `c4/src/`, `.foam/`, `*.c4`, `*.csv`, register-имён, голых корней `c4/`/`raw/`, битых `[](…)`.
- На бывших проблемных страницах (ADR-0003/0006/0027/0028/0029/0035/0037/0045, ITER-05/06, CONC-005/007,
  arc42 §3/§5/§6/§7, documentation-as-code, index.md) — человеческие фразы, проза без обрубков.
- C4-id и `README.md` целы; POC git-URL целы; `CLAUDE.md` отсутствует в `data.pages`.
- Затронутые страницы дрейфнут **один раз** + warning'и; чистые — без дрейфа.

## 2. Публикация
`publish` (2 прохода) → выборка страниц: проза с человеческими именами вместо путей; Supersedes-связи
кликабельны (md-cross-link → /wiki); C4-stub-картинки целы; соседние code-span целы.

## Откат
Плагин — `claude plugin update …` на v0.8.4 (`ref`). Контент — git.
