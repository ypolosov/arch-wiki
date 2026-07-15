# arch-wiki v0.19.0 — gt-тест (FPF wave 12: Second-wave gaps — completion tail)

> Поверх v0.18.0. Аддитивно, детерминированное Core + доки. Зеркало нейтрально (constraint-шаблон —
> только новые CON; render 156→156, 0/0). Схема v2. FPF A.6.B / A.21 / C.28 / D.5 / E.4.PFR.

## Что изменилось
- **Boundary Norm Square для CON (FPF A.6.B):** опциональный frontmatter `norm_kind:` (law |
  admissibility | deontic | work-effect) + секция `## Boundary Norm` в шаблоне constraint. Правило
  `constraint-norm-kind-invalid` (medium) валидирует значение (отсутствие — норма; typo — дефект).
- **Edition discipline (E.4.PFR / G.11):** секция в `FRAMEWORK.md` — supersession/refresh/deprecation
  реляции над schema-версией (migrate/adopt); закрывает ⚠️-строку в `FRAMEWORK-EVAL.md`.
- **CausalUse (C.28):** агент `architecture-linter` судит каузальные claim'ы в ADR/QA (correlation vs
  intervention vs mechanism).
- **Bias audit (D.5 / E.5.4):** агент `architecture-ingestor` — extraction это emphasis+omission;
  cross-disciplinary framings на равных.
- **OperationalGate (A.21) + projection surfaces:** `docs/dev/release-loop.md` — lint/validate-c4/
  verify-mirror/adequacy как register-backed гейты; inbound (`pull-stories`, C.26.1) и DESCRIPTION-USE
  (`query`→`concepts/`, A.6.2) поверхности и их дисциплина faithfulness.

## Acceptance §1 (проверено локально на gt)
- `version` → plugin **0.19.0**.
- `lint`: `constraint-norm-kind-invalid` = **0** (ни один gt-CON пока не несёт `norm_kind`); всего 13.
- **Зеркало:** render 156→156, 0 body / 0 hash (constraint-шаблон mirror-нейтрален).

## 0. Обновить + РЕСТАРТ / 1. Проверка
```
claude plugin marketplace update && claude plugin update arch-wiki@ypolosov-marketplace --scope local
arch-wiki lint --json    # constraint-norm-kind-invalid (medium) — 0 на gt
# добавить в CON `norm_kind: law` → валидируется; typo → flagged
```

## Откат
Плагин — на v0.18.0 (`ref`). Контент не затрагивается (read-only правило + additive шаблон + доки).
