# arch-wiki v0.8.6 — ре-тест на `gt` (полировка RENAME: record-id якорей + де-дуп склеек)

> Поверх v0.8.5. Источник: ре-тест v0.8.5 на `gt`. Acceptance (i)/(ii) v0.8.5 ПРОШЛИ
> (0 утечек путей в body+restore, keep'ы целы, no-false-drift) — НЕ регрессировать. Схема v2.
> Закрывает один новый класс от наивного rename (15 находок, 9 страниц) + минорные склейки.

## Что изменилось
- **Главный (medium): якорная register-ссылка сохраняет record-id.** `[[risks#^C-003|C-003]]` теперь
  → `C-003` (не «the risk register»). Правило в `resolveCrossLinks`: (1) id-образный alias (`^[A-Z]{1,4}-\d+`)
  → отдать alias; (2) иначе anchor `#^<id>` → отдать `<id>`; (3) голый `[[risks]]` → фраза «the risk register».
  `Resolves [[risks#^C-003|C-003]]` → `Resolves C-003` (грамматично + traceability; path-алиас `risks.md` не утекает).
- **B (double-article):** `in the [[kanban|…]]` → `in the backlog` (нет «the the»). Срезается дублирующий артикль.
- **C (adjacent-repeat):** `raw/A, raw/B` → `the source brief` (одна), `the source brief, the source brief`
  схлопывается; разные id якорей теперь дают разные тексты (`C-010/R-015/Q-003`), не один повтор.
- **D (tautology):** `CLAUDE.md` → «the contributor guide» (а не «the schema contract» — убрана тавтология
  `the schema contract lives in the schema contract`).
- **E (index.md):** `[iterations/](iterations/)` → `iterations` (без хвостового слеша-фрагмента).

De-dup склеек применяется ТОЛЬКО к строке, реально получившей rename (no-false-drift сохранён).

## НЕ трогали (по верификации v0.8.5 — читаются хорошо)
Голый `[[risks]]` → «the risk register»; `Recorded in the risk register`; чистая скобка `(see …, the risk
register)`. Nav-пункт `[[kanban|…]]` → «the backlog» (без ссылки) — приемлемо. ITER-01 безалиасный
wikilink → slug — pre-existing, отложено.

## Acceptance §1 v0.8.6
- Всё из v0.8.5 (0 утечек путей в body **и** `restore[].original`, keep'ы, no-false-drift) — НЕ регрессировать.
- 0 «the the»; 0 adjacent-repeat одинаковой фразы; 0 тавтологий subject==object.
- Якорная register-ссылка сохраняет record-id (`C-003`/`Q-003`/`R-012`…); 0 повисших plain-text id
  (id в прозе согласован со ссылками — напр. ITER-04 «Resolves C-003» совпадает с plain «C-003» на стр. 52/89).
- index.md: нет голого `iterations/`.

## 0. Обновить + РЕСТАРТ
```
claude plugin marketplace update
claude plugin update arch-wiki@ypolosov-marketplace --scope local
# РЕСТАРТ сессии. arch-wiki version → ждём plugin 0.8.6
```

## 1. Проверка (из КОРНЯ репо)
```
arch-wiki render-confluence --all > /tmp/aw-mirror.json
```
- Скан `data.pages[].body` И `data.pages[].restore[].original`: ноль repo-путей (как 0.8.5).
- На ADR-0038/0045/0049, CONC-007, QA-023, ITER-04/05: якорные ссылки → record-id (`C-003`…), не «the risk register»;
  «Resolves C-003» согласовано с plain-text «C-003» в прозе.
- arc42/04-solution-strategy, roadmap: нет «the the».
- ADR-0049/roadmap/engagement: разные id подряд (нет повтора одинаковой фразы); CON-007: `raw/A, raw/B` → одна фраза.
- documentation-as-code: нет `the schema contract lives in the schema contract` (CLAUDE.md → «the contributor guide»).
- index.md: «Lives in» → `iterations` (без `/`).
- Дрейф: затронутые страницы дрейфнут один раз; чистые — байт-идентичны.

## 2. Публикация
`publish` (2 прохода): record-id в ссылках на register сохранены; проза без «the the»/повторов/тавтологий.

## Откат
Плагин — `claude plugin update …` на v0.8.5 (`ref`). Контент — git.
