# arch-wiki v0.9.0 — gt-тест (FPF wave 1 + 2: слой «Свидетельства и уверенность»)

> Первый релиз FPF-обоснованных улучшений (план — `result.md`). Всё **аддитивно**;
> рабочее зеркало Confluence не тронуто (новый реестр из зеркала исключён). Схема v2.
> Основано на First Principles Framework (`FPF-Spec.md`).

## Что изменилось

### Wave 1 — фундамент (документация, 0 риска)
- **`schema/CLAUDE.md`:** секция `Methodology roles` переписана как FPF-таблица — ADD = `U.Method`
  (A.3.1), skill add-method = `U.MethodDescription` (A.3.2), `ITER-NN` = `U.Work` (A.15.1), карточка
  kanban = `U.WorkPlan` (A.15.2), arc42 = access carrier, C4 = notation/View (E.5.2 GR-2), driver =
  problem-side episteme (C.2.P). Callout **Notational Independence** (entities — семантический канон).
- **`FPF kind`-заметки** в 4 скиллах; новый **`FRAMEWORK.md`** (developer-facing PFAD-запись, E.4.PFAD —
  arch-wiki как FPF Domain Principle Framework). В целевой репозиторий и в зеркало НЕ поставляется.

### Wave 1 — первое Core-правило
- **`driver-not-live-covered`** (severity **low**, аддитивное; FPF B.3.3/A.2.4): драйвер, чьи входящие
  ADR все не-`accepted` (proposed/superseded/deprecated), — «бумажно покрыт». Правило `uncovered-driver`
  (medium) и его сообщение НЕ изменены → старые baseline'ы работают, массового churn нет.

### Wave 2 — слой «Свидетельства и уверенность» (детерминированное Core)
- **`arch-wiki assurance` / `/arch-wiki:assurance`** — `AssuranceLevel` L0/L1/L2 на каждый драйвер
  (доменная проекция FPF B.3.3): **L0** нет живого решения (или только paper-coverage), **L1**
  live-covered принятым ADR/итерацией, **L2** дополнительно реализован нестарелой ledger-issue
  (`realized_by`). Design-time покрытие и run-time реализация не сливаются в один балл.
- **`arch-wiki update-epistemic-debt`** — реестр `epistemic-debt.md` (managed-region, как
  `gap-analysis.md`; FPF B.3.4): superseded-citation, paper-coverage, stale-issue, missing-source.
  Дедуплицирован; заметки вне маркеров сохраняются; **исключён из зеркала Confluence**.
- **`trace`** теперь несёт `assuranceLevel`/`assuranceReason` для драйвера.

## Что НЕ трогали
Рабочий пайплайн зеркала v0.8.2–v0.8.6 (RENAME/нейтрализация/перевод/маскирование) — без изменений.
`epistemic-debt` добавлен в `DEFAULT_EXCLUDE` → в зеркало не попадает. Английский граф — source of truth.
Шаблоны артефактов не менялись. `gap-analysis`/`kanban`/`risks` — без изменений.

## Acceptance §1 v0.9.0 (проверено локально на gt)
- `version` → plugin **0.9.0**.
- `assurance`: 68 драйверов → **L0=10, L1=58, L2=0**; L0 = 6 uncovered + 4 paper-coverage (согласовано с lint).
- `lint`: `uncovered-driver`=6 (без изменений), `driver-not-live-covered`=4 (low).
- `update-epistemic-debt`: `epistemic-debt.md` = **18 строк** (4 paper-coverage + 14 superseded-citation,
  дедуп); managed-region идемпотентна; заметки вне маркеров выживают.
- `trace UC-018` → **L0**; `trace QA-001` → **L1**.
- Зеркало: `render-confluence --all` → 156 страниц, `epistemic-debt` **отсутствует**; существующие
  страницы байт-стабильны (wave 2 не даёт дрейфа; правка онтологии — в mirror-excluded `CLAUDE.md`).

## 0. Обновить + РЕСТАРТ
```
claude plugin marketplace update
claude plugin update arch-wiki@ypolosov-marketplace --scope local
# РЕСТАРТ сессии. arch-wiki version → ждём plugin 0.9.0
```

## 1. Проверка (из КОРНЯ репо gt)
```
arch-wiki version                       # plugin 0.9.0
arch-wiki assurance                     # summary L0/L1/L2; L0-драйверы — кандидаты на ратификацию ADR
arch-wiki update-epistemic-debt         # пишет docs/architecture/epistemic-debt.md (managed region)
arch-wiki trace UC-018                   # assuranceLevel: L0 (paper coverage)
arch-wiki trace QA-001                   # assuranceLevel: L1 (live-covered)
arch-wiki lint --json | ...             # driver-not-live-covered (low) + uncovered-driver (6, без изменений)
arch-wiki render-confluence --all        # 156 страниц; epistemic-debt отсутствует; проза без дрейфа
```
Или через агента: `/arch-wiki:assurance` (нарратив по уровням + реестр).

## 2. Публикация зеркала (регресс-чек)
`publish` (2 прохода): существующие страницы НЕ дрейфуют из-за wave 2; `epistemic-debt.md` не публикуется.

## Откат
Плагин — `claude plugin update …` на v0.8.6 (`ref`). Контент — git. Реестр — `rm docs/architecture/epistemic-debt.md`.
