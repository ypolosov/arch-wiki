# arch-wiki v0.11.0 — gt-тест (FPF wave 4: Evidence completion)

> Поверх v0.10.0. Аддитивно, детерминированное Core. Зеркало не тронуто (`## Sources` и
> provenance-frontmatter стрипаются/не рендерятся). Схема v2. FPF A.10 / B.3.4.

## Что изменилось
- **Typed provenance frontmatter (FPF A.10):** `verified_by` (design-time) / `validated_by`
  (run-time) — опциональные списки carrier'ов; machine-read, mirror-stripped. Документированы в
  шаблонах `quality-attribute` / `constraint`. File-path carrier, которого нет на диске, попадает в
  реестр как `missing-source`.
- **Overdue evidence (FPF B.3.4):** опциональный `valid_until: YYYY-MM-DD` на артефакте. Просроченный
  дальше грейса `evidence.debtBudgetDays` (config, default 0) → новый вид долга **overdue-evidence** в
  `epistemic-debt.md` (с числом дней). Непарсимый `valid_until` тоже попадает в реестр (не молча).
- **Waive (FPF B.3.4 CC-ED.5):** `arch-wiki waive-debt --subject <id> --reason <…> [--until <date>]
  --by <who>` — human-gated аудируемый вейвер в новом леджере `.arch-wiki/epistemic-debt-waivers.json`;
  активный вейвер (until ≥ сегодня или бессрочный) подавляет весь долг субъекта. Идемпотентно по subject.
  Fail-fast на отсутствующих `--subject/--reason/--by` и на кривом `--until`.
- `update-epistemic-debt` теперь берёт `now` из clock (`ARCH_WIKI_NOW` для воспроизводимости) и
  бюджет из конфига; результат несёт `waived`.

## Что НЕ трогали
Зеркало (рендер), AssuranceLevel L0/L1/L2, adequacy, существующие правила lint. Provenance-поля и
`valid_until` — во frontmatter, в Confluence не попадают.

## Acceptance §1 (проверено локально на gt)
- `version` → plugin **0.11.0**.
- `update-epistemic-debt`: **18 строк без изменений** (4 paper + 14 superseded; overdue=0 — у gt нет
  `valid_until` → нет false-positive; регресса нет).
- `waive-debt --subject CON-012-… --until 2026-12-01 --by @sa` → recorded; повторный
  `update-epistemic-debt` → debt **17**, `waived: 1` (paper-coverage 4→3). Вейвер снят с реестра.

## 0. Обновить + РЕСТАРТ
```
claude plugin marketplace update
claude plugin update arch-wiki@ypolosov-marketplace --scope local
# РЕСТАРТ. arch-wiki version → 0.11.0
```

## 1. Проверка (из КОРНЯ репо gt)
```
arch-wiki update-epistemic-debt              # overdue=0 (нет valid_until), без регресса
arch-wiki waive-debt --subject <id> --reason "…" --until 2026-12-01 --by @you
arch-wiki update-epistemic-debt              # waived: 1, субъект снят
# (опц.) добавить valid_until: 2026-01-01 в один драйвер → overdue-evidence в реестре
```
Config (опц.): `"evidence": { "debtBudgetDays": 30 }` в `.arch-wiki/config.json`.

## Откат
Плагин — на v0.10.0 (`ref`). Реестр — `rm epistemic-debt.md`; вейверы — `rm .arch-wiki/epistemic-debt-waivers.json`.
