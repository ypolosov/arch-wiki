# arch-wiki v0.10.0 — gt-тест (FPF wave 3: Adequacy review)

> Поверх v0.9.0. Аддитивно, детерминированное Core, зеркало не тронуто. Схема v2.
> Продолжает FPF-план (`result.md`): `/arch-wiki:review` + верб `adequacy`.

## Что изменилось
- **`arch-wiki adequacy [--kind <k>] [--id <ID>]` / `/arch-wiki:review`** — по-видовая
  структурная адекватность артефактов (FPF C.32.ADA / C.30.AD). Каждый артефакт получает `band`
  (`adequate` / `thin` / `inadequate`) из проверяемых `bases` — **capped structural floor, не оценка
  качества**: `inadequate` = падает *критический* base (ADR без Decision Outcome / без Considered
  Options / невалидный статус; драйвер на AssuranceLevel L0); `thin` = падают только некритические.
- Bases **композируют сигналы wave 2**: у драйвера base `covered` читает его AssuranceLevel,
  `no-debt` — реестр epistemic-debt.
- **MADR-толерантность**: принимаются обе формы MADR — короткая (`## Decision`, прозаический
  `## Status`) и полная (`## Decision Outcome`, frontmatter `status:`) — чтобы не было ложных срабатываний.
- Скилл **`adequacy-rubric`** — LLM-слой суждения (различимость вариантов, тестируемость меры,
  сбалансированность последствий) поверх детерминированного пола. Команда `/arch-wiki:review` только
  предлагает правки, ничего не редактирует.

## Что НЕ трогали
Зеркало (рендер), шаблоны, существующие правила lint/assurance/epistemic-debt — без изменений.
`adequacy` — read-only Core-верб.

## Acceptance §1 (проверено локально на gt)
- `version` → plugin **0.10.0**.
- `adequacy`: 153 артефакта → adequate 99, thin 37, inadequate 17.
- Cross-check: драйверы с `covered=false` = **10** (совпадает с L0-набором из assurance).
- ADR inadequate = **7** (0000-template + 6 ADR без секции Considered Options — настоящие находки, не
  false-positive от формы MADR).

## 0. Обновить + РЕСТАРТ
```
claude plugin marketplace update
claude plugin update arch-wiki@ypolosov-marketplace --scope local
# РЕСТАРТ. arch-wiki version → 0.10.0
```

## 1. Проверка (из КОРНЯ репо gt)
```
arch-wiki adequacy                       # summary band-ов + bases
arch-wiki adequacy --kind adr            # только ADR
arch-wiki adequacy --id UC-018           # один артефакт (L0 → inadequate)
```
Или агентом: `/arch-wiki:review` (нарратив inadequate→thin→adequate + рубрика суждения).

## Откат
Плагин — на v0.9.0 (`ref`). Контент — не затрагивается (read-only верб).
