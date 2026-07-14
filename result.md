# Улучшение плагина **arch-wiki** на основе First Principles Framework (FPF)

> **Что это.** FPF-обоснованный, приоритизированный план улучшений для плагина
> `arch-wiki` (v0.8.6) — детерминированное TS/CLI-ядро + LLM-оркестратор над
> Foam-графом (arc42 + ADD 3.0 + ADR/MADR + C4/LikeC4).
> **Источники:** `FPF-Spec.md` (Core Conceptual Specification, July 2026, 97 255 строк);
> исходники плагина `/home/ypolosov/DEV/GITS/arch-wiki/**`; целевой корпус
> `/home/ypolosov/DEV/GITS/gt/docs/architecture/**` (52 ADR, 20 UC, 26 QA, 8 CONC, 11 CON,
> 7 ITER); живое RU-зеркало в Confluence (space SD) — проверено вживую.
> **Дата:** 2026-07-12.

## Как получен этот доклад

Материал собран многоагентной оркестрацией с адверсариальной проверкой, а не одним
проходом: **10 тем × (агент-автор → агент-скептик)**, затем синтез и **критик полноты**.
Каждый агент читал точные срезы `FPF-Spec.md` по id паттернов и соответствующие файлы
плагина; скептик проверял каждое предложение по четырём осям — (a) реальность и
корректность FPF-основания, (b) совместимость с инвариантами плагина
(детерминированное Core, английский канон, human-gated, идемпотентность, fail-fast,
аддитивность), (c) соотношение польза/трудоёмкость, (d) риск регресса рабочего зеркала.
Из исходного набора **49 предложений прошли проверку; 5 отброшены** (в т.ч. одно с
«сфабрикованным обоснованием» и одно, неверно трактовавшее `C.30.ASV:4.2`). Раздел
**«Что скорректировала адверсариальная проверка»** честно фиксирует одно
неверно-обоснованное предложение, перекрытия под слияние и топ-риски внедрения. Это **план, а не патч**: применять инкрементально, каждое правило —
за конфиг-флагом и с ре-baseline на gt.

---

## 📌 Резюме и мета-тезис

**First Principles Framework (FPF)** — нормативный паттерн-язык инженерного, исследовательского и управленческого рассуждения (Anatoly Levenchuk): он даёт единый онтологический словарь (holon, Method / MethodDescription / Work, EntityOfConcern, Episteme), теорию морфизмов (эффект-свободные преобразования эпистем: EpistemicViewing, ConservativeRetextualization, Controlled Semantic Coarsening), исчисление свидетельств и уверенности (Evidence Graph, F–G–R, AssuranceLevel), аппарат измерения качеств (CharacteristicSpace / Scale / Level / Coordinate) и многовидовое описание (Viewpoint / View / Correspondence). Паттерны (`A.3.1`, `C.32.ADR`, `E.17.0`, …) несут Problem-фрейм, Solution, срезы и чек-лист — то есть проверяемые правила, а не советы.

**Мета-тезис доклада.** arch-wiki уже реализует ровно эти сущности, но кустарно и разрозненно: ADR-адекватность, C4↔wiki-морфизм, покрытие драйверов, дисциплину зеркала Confluence, глоссарий, QA-меры и петли процесса. FPF показывает, что arch-wiki правильнее понимать и авторствовать как **Domain Principle Framework (DPF)** — доменную специализацию FPF для solution architecture. При такой рамке FPF поставляет онтологию, теорию морфизмов, calculus свидетельств/уверенности и quality-gates, которые плагин сегодня кодирует ad-hoc; а каждое улучшение получает точный паттерн-id как основание и, где возможно, детерминированное Core-правило вместо «на глаз». Ключевой ход — зафиксировать это как Principle-Framework Architecture Decision (PFAD) и переописать методологическую онтологию в явных FPF-kind'ах, после чего остальные темы становятся согласованными проекциями одного каркаса.

**Как читать.** Ниже — сначала единый приоритизированный roadmap (все предложения, P0→P2), затем секция sequencing (быстрые победы, зависимости, что не трогать), далее — детальные секции по темам в порядке themeOrder, от самых фундаментальных (онтология/мета-рамка) к замыкающей само-оценке.

---

## 🧭 Приоритизированная дорожная карта

| Приоритет | Предложение | Тема | FPF-паттерны | Трудоёмкость |
|---|---|---|---|---|
| P0 | Reframe the methodology ontology in explicit FPF kinds (Method / MethodDescription / Work / WorkPlan / notation) | Онтология/мета-каркас | A.3.1, A.3.2, A.15, A.15.1, A.15.2, E.5.2 | M |
| P0 | Record the Principle-Framework Architecture Decision: arch-wiki as an FPF Domain Principle Framework | Онтология/мета-каркас | E.4.PFAD, E.4.DPF, E.4.PFR, E.5.3 | M |
| P0 | Compute a status-weighted AssuranceLevel (L0/L1/L2) per driver, replacing the binary covered/uncovered flag | Граф свидетельств | B.3.3, A.10, A.2.4 | M |
| P0 | Deterministic epistemic-debt register from valid_until + existing decay signals (Refresh/Deprecate/Waive) | Граф свидетельств | B.3.4, B.3.3, A.10 | M |
| P0 | ADR-adequacy rubric skill (declared-use, coordinate-set, no-average) перед промоушеном в accepted | Записи решений | C.32.ADA, C.32.ADR, E.21 | M |
| P0 | Deterministic C4-relationship-to-wiki morphism check (projection faithfulness) | Адекватность арх. описания | C.34, C.30.ASV | M |
| P0 | Missing-structural-view return + unpublished-element check (arc42 view coverage) | Адекватность арх. описания | C.30.ASV, C.33, C.34 | M |
| P0 | Move the two-tier mirror acceptance out of publish.md prose into a deterministic `verify-mirror` Core gate | Проекция/зеркало | A.6.2:4.3.3 (P2), CC-EFEM.4, A.6.3.CSC, CC-CSC-2, E.17.EFP | M |
| P0 | Declare a TEVB-importing arch viewpoint bundle in config + require a `viewpoint:` on view pages, checked deterministically | Мульти-виды | E.17.0, E.17.1, E.17.2 | M |
| P0 | Upgrade the QA template Measure into an explicit CSLC / Q-Bundle block (Characteristic·Scale·Polarity·Target·Current·Window) | Атрибуты качества | A.18, C.16, C.25, C.16.Q | M |
| P0 | Deterministic measure-well-formedness lint rule in Core | Атрибуты качества | A.18, C.16 | M |
| P0 | Детерминированная проверка покрытия глоссария в Core (entity/concept ⟷ строка-термин, строка ⟷ ссылка на управляющую страницу) | Лексикон/глоссарий | F.17, E.10.D2, F.8 | M |
| P0 | preserveTerms как проекция Term-колонки (Core): маскировать имя строки, а не каждый bold-span; собирать алиасы | Лексикон/глоссарий | F.17, A.6.9, F.13 | S |
| P0 | Дать /hypothesis настоящий ProblemCard (Prompt / Scope cut / Why-not-a-wish / Acceptance probe / Next use) до превращения гипотезы в драйвер | Циклы процесса | C.22.2, B.5.2, C.22 | M |
| P0 | Абдуктивная дисциплина: критерий опровержения (и названный соперник) обязательны до промоушена гипотезы | Циклы процесса | B.5.2, B.5 | M |
| P0 | /arch-wiki:review + ordinal per-kind adequacy rubric (ADR/QA/driver) | Само-оценка | A.19.ECS, E.21, E.22, E.19 | M |
| P1 | Add a deterministic unidirectional-dependency lint rule: drivers must not depend on decisions | Онтология/мета-каркас | E.5.3, E.5 | S |
| P1 | Name Notational Independence (GR-2) as a schema invariant: wiki entities are the semantic canon, C4 is one notation | Онтология/мета-каркас | E.5.2, E.5 | S |
| P1 | Детерминированное Core-правило: ADR перечисляет выгоды, но не фиксирует ни одной принятой потери | Записи решений | C.32.PAD, C.32.ADR, C.32.ADA | S |
| P1 | Status-aware покрытие драйверов: драйвер, закрытый только proposed/rejected/superseded ADR, помечается как не-живой | Записи решений | C.32.ADA, C.32.PAD | M |
| P1 | Секции Confirmation и Reopen Triggers в шаблоне ADR + рекомендуемый (закомментированный) requiredSections['adr'] | Записи решений | C.32.ADR, C.32.ADA, C.32.PAD | M |
| P1 | Replace free-text mirror `warnings[]` with the typed CSC source-loss-mode vocabulary | Проекция/зеркало | A.6.3.CSC, A.6.3.CSC:4.5, CC-CSC-9 | S |
| P1 | Turn the free-prose ## Sources block into typed verifiedBy/validatedBy entries with carrier date/hash | Граф свидетельств | A.10, A.2.4 | M |
| P1 | A Core `correspondence-missing` / `correspondence-orphan-view` check: every view-hub must link the C4 view that realizes its viewpoint | Мульти-виды | E.17.0 | M |
| P1 | Make the arc42/C4 map a viewpoint↔view correspondence table (split view-sections from concern/decision/register containers) | Мульти-виды | E.17.2, E.17.0 | S |
| P1 | C.35 admission note on every proposed .c4 diff (generated-carrier discipline) | Адекватность арх. описания | C.35, C.33 | S |
| P1 | Deterministic time-window / temporal-adequacy check on rate & percentile measures | Атрибуты качества | C.16, C.27.TA, C.25 | S |
| P1 | Model the utility-tree as an Evaluation CharacteristicSpace with a deterministic Core ScoringMethod | Атрибуты качества | A.19.ECS, A.18, C.16 | M |
| P1 | Глоссарий → Unified Term Sheet: колонка Context + явные Bridge-строки + Core-детектор umbrella-предикатов | Лексикон/глоссарий | A.6.9, F.9, F.7, F.17 | M |
| P1 | Назвать стадии цикла в терминах FPF и сделать зрелость артефакта явной: Explore→Shape→Evidence→Operate поверх пайплайна (без изобретения новых status) | Циклы процесса | B.5.1, B.5, B.5.2 | S |
| P1 | Замкнуть ADD-итерацию как Evolution Loop: фиксировать Observe-триггер и названного Transformer, а не только Drivers Impact | Циклы процесса | B.4, B.5.2 | S |
| P1 | Formalize RELEASE-*/gt-retest cadence as an E.23 improvement-loop ledger | Само-оценка | E.23, E.22, E.11.PUA | S |
| P1 | Сделать человеческий гейт эйлеровым: аггрегатный CV.Status перед GateFit, воздержание пока CV≠pass (сначала на уровне команд, потом Core) | Циклы процесса | A.20, E.18 | L |
| P1 | Deterministic-Core adequacy verb: arch-wiki adequacy <file> --json (evidence bases + capped structural floor, not a value ladder) | Само-оценка | A.19.ECS, E.21 | L |
| P2 | Ship a DPF package-adequacy self-evaluation rubric (E.4.DPF.DA) as the framework's quality spine | Онтология/мета-каркас | E.4.DPF.DA, E.4.DPF, E.2.DA | M |
| P2 | Flag name-only C4↔wiki matches as unverified correspondence (weakest-adequate-mapping) | Адекватность арх. описания | C.34, C.30.ASV | S |
| P2 | Детерминированное Core-правило: accepted ADR c менее чем двумя Considered Options (или без явного 'no candidate set is live') | Записи решений | C.32.PAD, C.32.ADA | S |
| P2 | Суперсессия как событие адекватности: обязательная строка-причина + Core-правило supersede-no-reason; различать 'решение заменено' и 'обоснование распалось' | Записи решений | C.32.ADA, C.32.FAIL, C.32.PAD | M |
| P2 | Witness that the one body-ADDING stage (`**Realized by:**`) adds no linkage absent from the source frontmatter | Проекция/зеркало | A.6.2:4.3.3 (P2), CC-EFEM.4, A.6.3.CR:4.5.f | S |
| P2 | Assert the coarsening sub-chain is idempotent and drift-free (EFEM P4) as a Core property check | Проекция/зеркало | A.6.2:4.3.5 (P4), CC-EFEM.5 | M |
| P2 | Лексическая непрерывность: Status-маркер строки (alias-of / deprecated→successor / retired) на основе F.13 | Лексикон/глоссарий | F.13, F.17, F.8 | S |
| P2 | Дисциплина Mint-or-Reuse при ingest + детерминированный детектор near-duplicate строк | Лексикон/глоссарий | F.8, F.13, F.7 | M |
| P2 | Add an Evidence anchor to each Measure and check it via the existing minWikilinks machinery | Атрибуты качества | C.16, A.18 | S |
| P2 | Classify each -ility endpoint as single-Characteristic vs Q-Bundle at scaffold time | Атрибуты качества | C.16.Q, C.25 | M |
| P2 | Name the mirror an MVPK PlainView PublicationUnit + tightly-scoped primary-EntityOfConcern-shift guard | Мульти-виды | E.17, E.17.AUD, E.17.AUD.OOTD | M |
| P2 | Rozanski questionnaire elicits over the declared viewpoint bundle Σ instead of a hardcoded six | Мульти-виды | E.17.1, E.17.2 | S |
| P2 | Типизировать вход questionnaire/raw как pre-абдуктивный RoutedCueSet (Observe→Notice→Stabilize→Route) | Циклы процесса | B.4.1, B.5.2 | S |
| P2 | Whole-plugin Principle-Adequacy instrument (7 principles) consumed by the release loop | Само-оценка | A.19.ECS, E.2.DA, E.13 | S |
| P2 | Declare evaluation purpose up front and scale ceremony to reliance | Само-оценка | E.22, E.11.PUA, E.21 | S |

---

## 🚦 Порядок внедрения

### Быстрые победы (сделать первыми)
Наибольший рычаг при минимальной трудоёмкости — детерминированные Core-правила и проекции существующих данных, без затрагивания живых артефактов:
- **preserveTerms как проекция Term-колонки** (P0/S) — чистое усиление уже работающего маскирования в зеркале, аддитивно.
- **unidirectional-traceability-lint** и **notational-independence-invariant** (P1/S) — новые lint-правила поверх текущего графа, ничего не переписывают.
- **adr-consequences-balance-lint** (P1/S) и **typed-source-loss-modes** (P1/S) — детерминизация того, что сегодня «на глаз».

### Зависимости (порядок внутри тем)
- **Онтология-мета сначала.** `fpf-kind-ontology-map` и `pfad-fpf-conformance-spine` (оба P0) задают общий словарь и PFAD-решение; `dpf-adequacy-self-eval` (P2) и `notational-independence-invariant`/`unidirectional-traceability-lint` — их прямые следствия и должны идти после.
- **Свидетельства → решения → само-оценка.** `graded-assurance-level` (P0) вводит AssuranceLevel L0/L1/L2; на нём стоят `status-aware-driver-coverage`, `epistemic-debt-register` и `typed-evidence-provenance-entry`. Рубрики адекватности (`adr-adequacy-rubric-skill`, `arch-wiki-review-adequacy-rubric`, затем `core-adequacy-structural-coordinates`) потребляют эти уровни — авторствовать после того, как calculus уверенности определён.
- **QA-меры.** `qa-measure-cslc-block` (структура) идёт перед `qa-measure-wellformed-check`/`qa-measure-window-check`/`qa-measure-evidence-stub` (проверки над структурой) и перед `utility-tree-as-charspace`.
- **Мульти-виды.** `viewpoint-bundle-frontmatter-lint` (объявление bundle Σ) — предпосылка для `deterministic-view-correspondence-check`, `arc42-c4-viewpoint-correspondence-map` и `questionnaire-reads-declared-bundle`.
- **Тяжёлые (L) в конец волны.** `flow-validity-gate`, `core-adequacy-structural-coordinates` — авторские, сначала на уровне команд/агентов, промоушен в Core лишь после стабилизации правил.

### Не трогать без крайней необходимости
**Рабочее зеркало Confluence (пайплайн v0.8.2–v0.8.6) — заморожено, кроме аддитивных/проверяющих изменений.** Это самая свежая и хрупкая инвестиция; RU-проекция реально живёт в space SD. Разрешены только: (1) вынос уже действующих приёмок в детерминированные гейты (`verify-mirror-faithfulness-gate`), (2) типизация того, что сейчас free-text (`typed-source-loss-modes`), (3) witness-проверки существующего поведения (`reverse-edge-conservativity-witness`, `idempotence-determinism-property-check`). Любое изменение, меняющее байтовый выход зеркала, RENAME-словарь, порядок стадий или семантику маскирования, — не берём без явной необходимости и обязательного gt-re-test. Английский граф остаётся source of truth; зеркало никогда не авторствуется вручную.

---

## ⚖️ Что скорректировала адверсариальная проверка

Отдельный проход-критик оценил весь набор на обоснованность, перекрытия и риск. Ниже —
поправки, которые нужно учесть **до** внедрения. Это не отменяет предложения, но меняет
их основание, объём или порядок.

### Неверно-обоснованное (исправить ссылку, не суть)

- **`unidirectional-traceability-lint` («драйвер не должен зависеть от решения», тема
  «Онтология», P1).** Правило полезное, но основание `E.5.3` (GR-3) выбрано неверно:
  `E.5.3` регулирует зависимость **изданий/страт FPF-семейства** (Core → Tooling →
  Pedagogy как DAG импортов), а не направление трассируемости `driver → ADR` на уровне
  страниц. Корректное основание — **`C.2.P` (разделение problem-side / solution-side)** и
  **`C.32.PAD`** (решение цитирует свои драйверы, а не наоборот). Сохранить правило,
  заменить id. Смежное `notational-independence-invariant` на `E.5.2` (GR-2) — обосновано
  верно, менять не нужно.

### Низкая маржинальная ценность (реализовать дёшево или отложить)

- **`primaryEntityOfConcern shift-guard` (тема «Мульти-виды», `E.17.AUD.OOTD`, P2).**
  *Название* зеркала как MVPK PlainView PublicationUnit — обосновано твёрдо и стоит взять.
  Сам **guard** срабатывает только при in-place ретаргете типа с переиспользованием пути —
  случай почти недостижимый (ретаргет = переименование файла → новый ledger-ключ → новая
  страница). Защищает пустое множество и рискует false-refuse на легитимной эволюции
  контента → **отложить**, взять только именование.
- **`reverse-edge-conservativity-witness` (тема «Проекция», `A.6.3.CR:4.5.f`, P2).**
  Инвариант уже выполняется по построению; assert «никогда не срабатывает на корректном
  выводе». Ценность близка к нулю — это регрессионный тест на будущее, не закрытие
  открытого пробела faithfulness. Брать только как дешёвый property-тест внутри общего
  гейта (см. слияние ниже), не как отдельную CLI-команду.

### Слить до реализации (перекрытия)

Пять пар предложений трогают одну и ту же машинерию под разными FPF-рамками — их нужно
свести в одно изменение, иначе получите дублирующие конфиг-словари и CLI-входы:

1. **C4-соответствие.** `c4-relationship-to-wiki` (`C.34`, тема «Адекватность») и
   `correspondence-missing` / `correspondence-orphan-view` (`E.17.0`, тема «Мульти-виды») —
   один и тот же проход по расширенной `C4Model` в `C4Consistency.ts`. **Один
   relationship/correspondence-pass**, две FPF-рамки в комментарии.
2. **Конфиг-словарь видов.** `requiredViewKinds` (адекватность) + `viewpoint bundle Σ` +
   `arc42↔C4 correspondence map` (мульти-виды) описывают одну карту
   `arc42-section ↔ C4-view ↔ viewpoint ↔ hub`. Сама тема «Мульти-виды» предупреждает про
   «третий избыточный словарь» — **свести к ОДНОЙ конфиг-поверхности** до внедрения любого.
3. **Гейты зеркала.** `verify-mirror-faithfulness-gate` (§1) + `reverse-edge-witness` (§3) +
   `idempotence-determinism-check` (§4) — **один гейт `verify-mirror` с несколькими видами
   check**, а не три verify-входа.
4. **Шаблон ADR.** `Confirmation + Reopen Triggers`-секции и `supersession-reason` — **одно**
   изменение `templates/adr.md` + `madr-format/SKILL.md`.
5. **Доктрина «C4 — одна нотация».** Kind-таблица §1 и GR-2 §4 темы «Онтология»
   повторяют один тезис и правят один регион `schema/CLAUDE.md` + `likec4-dsl/SKILL.md` —
   **свести к одному месту**.

### Топ-риски внедрения (обязательная дисциплина при выкатке)

1. **Массовый baseline-churn.** Четыре новых lint-правила темы «Записи решений»
   (`driver-covered-only-by-nonaccepted`, `adr-consequences-unbalanced`, `adr-options-thin`,
   `supersede-no-reason`) сработают по всему корпусу gt разом. Даже при low-severity —
   это скоординированный mass-baseline. **Выкатывать по одному правилу, за конфиг-флагом,
   с ре-baseline.** Подсчёт Good/Bad-буллетов рискует false-positive на прозаических
   Consequences — сначала на LLM-слое, промоушен в Core после стабилизации.
2. **Шаблон ADR × нейтрализатор зеркала — highest mirror-regression risk.** Новые
   секции/формулировки супересессии (`trigger: RMG discontinued by [[ADR-0049]]`) — прямые
   мишени для DELETE→RENAME/supersede-нейтрализации v0.8.5/0.8.6. **Обязательный
   gt-re-test зеркала** перед релизом любого изменения ADR-шаблона.
3. **Расширение `C4Model` (relationships/views) хрупко** к форме `export json` и к
   fallback `--source regex`. При ином shape правила либо молча пропускают (маскируя
   реальный drift), либо роняют путь `validate-c4`, от которого зависят `trace`/`gap-analysis`.
   **Skip-safely + явный warning**, не throw.
4. **`verify-mirror`-гейт намеренно блокирует ранее опубликованные страницы.** Слишком
   широкий предикат (напр. новая `REGISTER_PHRASE` вне allowlist) = false-positive
   hard-stop на живой RU-публикации. **Держать allowlist узким, дать `--force`-override**
   с логированием.
5. **Английский граф остаётся source of truth; зеркало никогда не авторствуется вручную.**
   Любое изменение, меняющее байтовый выход зеркала, RENAME-словарь, порядок стадий или
   семантику маскирования, — только с явной необходимостью и gt-re-test.

---

## 📚 Детальные предложения по темам

Ниже — 10 тем в порядке от фундаментальных (онтология/мета-каркас) к замыкающей само-оценке. Каждое предложение несёт FPF-основание (id паттерна + почему), конкретное изменение (файлы), пример before/after и строку «Приоритет · Трудоёмкость · Риск». Учитывайте поправки из раздела «Что скорректировала адверсариальная проверка» (исправление ссылки, слияния, риски).

---

## 🧭 Онтология и мета-каркас: arch-wiki как FPF Domain Principle Framework

FPF строго различает *способ делания* и его *описание* от *намеченной* и *выполненной работы* (A.3.1/A.3.2, A.15.1/A.15.2) и требует от любого доменного фреймворка (DPF) явной записи архитектурного решения (E.4.PFAD), самооценки пакета (E.4.DPF.DA) и соблюдения guard-rails GR-2/GR-3 (E.5). arch-wiki уже реализует эти различия механически (entities как канон, `validate-c4` как correspondence-проверка, разделение `iterations/` и `kanban.md`), но нигде их не *называет* — онтология коллапсирует в рыхлый английский, а сам claim «мы FPF-conformant» живёт как фольклор в `MEMORY.md`. Тема делает онтологию и мета-каркас инспектируемыми: единый FPF-именованный словарь + запись PFAD-решения + рубрика адекватности + доктринальное закрепление двух guard-rails.

### 1. FPF-каркас онтологии в явных kinds (Method / MethodDescription / Work / WorkPlan / notation)

**FPF-основание.** A.3.1 (`U.Method`) / A.3.2 (`U.MethodDescription`) разводят «способ делать» и «episteme, описывающую способ»; A.15.1 (`U.Work`) / A.15.2 (`U.WorkPlan`) разводят датированное выполнение и намеченную работу. Каскад категориальных ошибок A.15:2 — *Specification-as-Execution* (recipe как доказательство работы) и *plan-as-performed-work* (карточка как «сделано») — ровно те провалы, которые нынешняя рыхлая формулировка `## Methodology roles (the ontology)` допускает.

**Что менять.** Переписать секцию `schema/CLAUDE.md` (строки 38–45) как FPF-kind-таблицу и добавить строку-заголовок `FPF kind:` в каждый из четырёх `skills/{add-method,arc42-map,likec4-dsl,madr-format}/SKILL.md`. Только additive-проза; ID-схема, папки и операции не трогаются. Коррекция к исходному предложению: `C4/LikeC4` — это **notation/View над entities** (E.5.2, GR-2), *не* `U.MethodDescription`; `U.MethodDescription` для C4 — это сама `likec4-dsl` skill (описание метода авторинга), а не `.c4`-модель.

**Пример.**
```
BEFORE (schema/CLAUDE.md):
- **ADD 3.0** = design process.
- **arc42** = documentation container.
- **C4 / LikeC4** = visual notation. Source of truth = c4/src/*.c4.
- **ADR (MADR)** = decision ledger.

AFTER (FPF-kind table):
| ADD 3.0            -> U.Method (A.3.1): reusable way-of-doing; described by the add-method skill; NOT the work.
| add-method skill   -> U.MethodDescription (A.3.2): the recipe/episteme; existing ≠ enacted.
| ITER-NN            -> U.Work (A.15.1): dated enactment of the ADD method; records what actually happened.
| kanban.md card /
| iteration goal     -> U.WorkPlan (A.15.2): intended work — a card is NOT performed work.
| arc42 hub          -> publication/access carrier (E.4.DPF): exposes artifacts, does no work, is not a Method.
| C4 / LikeC4        -> notation / View over entities/ (E.5.2 GR-2): the semantics live in entities/, not in .c4.
| ADR (MADR)         -> decision-episteme ledger, append-only.

AFTER (add-method/SKILL.md header):
FPF kind: this skill is the U.MethodDescription (A.3.2) of the ADD U.Method (A.3.1).
An ITER-NN log is the U.Work (A.15.1) that enacts it — not the method, and not evidence the design is done.
```

**Эффект.** Блокирует category-error каскад (recipe-as-evidence / plan-as-performed-work) на уровне доктрины; даёт каждой команде/агенту/skill один стабильный FPF-именованный словарь; это спина, на которую ссылаются все остальные предложения темы (Method vs Work vs WorkPlan теперь называются точно).

Приоритет: P0 · Трудоёмкость: M · Риск: нет — `CLAUDE.md` исключён из Confluence целиком (v0.8.2 убирает весь git-source-of-truth), skills plugin-internal и не зеркалятся; адоптация в target-репо идёт через human-gated `adopt`/`migrate`, additive.

### 2. Запись PFAD-решения: arch-wiki как FPF Domain Principle Framework

**FPF-основание.** E.4.PFAD требует заполненную реляцию `PrincipleFrameworkArchitectureDecision@Context` *до того*, как решение считается settled (CC-PFAD.1); E.4.DPF:1 прямо предписывает держать developer-carrier решения (`SUBSTANTIVE-DRR.md`/`DPF-DRR.md`) **отдельно** от user-facing schema; E.4.PFR + E.5.3 фиксируют направление зависимости (arch-wiki → FPF Core, без обратной). Сейчас claim «specializes FPF» не имеет инспектируемого носителя.

**Что менять.** Добавить `FRAMEWORK.md` в корень репозитория плагина как заполненную E.4.PFAD-реляцию (developer-carrier по E.4.DPF), и одну строку-указатель в `README.md`. Имена слотов — канонические из спеки (`frameworkDecisionId`, `governedFrameworkRef`, `boundedContextRef`, `fpfCoreEditionRef`, `decisionQuestion`, `selectedPatternSetRefs`, `selectedPatternRelationRefs`, `dependencyAndEditionRefs`, `accessCarrierRefs`, `rejectedAlternatives`, `refreshOrSupersessionConditions`).

**Пример.**
```
FRAMEWORK.md (core slice):
frameworkDecisionId:        PFAD-AW-001
governedFrameworkRef:       arch-wiki (Solution-Architecture DPF)
boundedContextRef:          LLM-maintained docs/architecture wiki (Karpathy LLM-Wiki)
fpfCoreEditionRef:          FPF-Spec.md @ current
decisionQuestion:           which pattern set carries FPF-grounded solution-architecture guidance?
selectedPatternSetRefs:     ADD 3.0 (U.Method), arc42 (carrier), MADR (decision ledger), C4/LikeC4 (notation)
selectedPatternRelationRefs: ADD produces ADRs + C4; outputs land in arc42 hubs; ITER-NN logs the U.Work
dependencyAndEditionRefs:   depends on FPF Core; NO Core reverse dependency (E.5.3 / E.4.PFR)
accessCarrierRefs:          the plugin (commands/agents/skills/CLI) — an ACCESS carrier, not the framework itself
rejectedAlternatives:       land the guidance into FPF-Spec.md; ship only a checklist
refreshOrSupersessionConditions: G.11 refresh when the FPF edition or arc42/ADD/C4/MADR SoTA changes
```

**Эффект.** Делает FPF-conformance claim инспектируемым и durable вместо tribal; фиксирует направление зависимости как письменное решение, на которое опирается lint (см. §3) и рубрика (см. §5); даёт каждому предложению единую decision-record для ссылки на family-membership и scope.

Приоритет: P0 · Трудоёмкость: M · Риск: нет — developer-only doc в корне плагина; не входит в `schema/CLAUDE.md`, не шиппится в target-репо, не зеркалится. E.4.DPF явно одобряет отделение developer-carrier от user-schema.

### 3. Детерминированный lint unidirectional-dependency: driver не должен зависеть от decision

**FPF-основание.** E.5.3 (GR-3, Unidirectional Dependency) требует, чтобы граф зависимостей был ацикличен и указывал в сторону стабильности. В arch-wiki порядок стабильности ясен: drivers (UC/QA/CON/CONC) — медленные, стабильные PROBLEM-входы; ADR/iterations — быстрая SOLUTION. Scope-note E.5:4 прямо разрешает automation вне Core как opt-in/informative — то есть место такому правилу в Tooling-Core плагина, не в FPF Core. Это адаптация *духа* GR-3 (partial order по стабильности), а не буквальных family-страт Core/Tooling/Pedagogy.

**Что менять.** Новое Core-правило `driver-depends-on-decision` в `src/domain/services/LintRuleSet.ts`: любая страница `type = use-case|quality-attribute|constraint|concern` с исходящим `[[wikilink]]`/md-link в `adrs/` (вне явной history/superseded-by-заметки) — finding. Config-gated, warn-tier (как существующий candidate-блок `superseded-citations`). Это дуал к уже существующему `uncovered-driver` (нет входящего): §3 ловит *нелегальный исходящий*.

**Пример.**
```
Driver drivers/quality-attributes/QA-001-api-response-time.md:
  "Rationale: target chosen per [[0027-adopt-graphql|ADR-0027]]"
-> finding (warn): 'QA-001 (driver) depends on ADR-0027 (decision): reverse dependency (E.5.3 GR-3).
   A driver states the problem; the ADR cites the driver, not the other way round.'

Correct direction (untouched, still encouraged):
  ADR-0027 lists QA-001 under ## Decision Drivers.
```

**Эффект.** Двигает FPF guard-rail (GR-3) в детерминированный Core, где живут verdict-ы; держит слои requirement→solution ацикличными; замыкает картину traceability, спаривая `uncovered-driver` (missing inbound) с его дуалом (illegal outbound).

Приоритет: P1 · Трудоёмкость: S · Риск: низкий — additive, config-gated, warn-tier, off по умолчанию; mirror-пайплайн не затрагивается (lint не рендерит Confluence). Может вскрыть реальные findings на существующих gt-графах — это и есть цель; config-gate даёт target-репо включиться, когда готово.

### 4. Notational Independence (GR-2) как явный schema-инвариант: entities — семантический канон, C4 — одна нотация

**FPF-основание.** E.5.2 (GR-2, Notational Independence) требует, чтобы семантика определялась независимо от любой одной нотации. arch-wiki уже реализует триаду Viewpoint/View/Correspondence: `entities/` несёт семантику, C4 — нотация, `validate-c4` — correspondence-проверка. **Адверсариальная находка:** механическая часть уже есть — `checkC4Consistency` (`src/domain/services/C4Consistency.ts:106`) уже эмитит `c4-element-without-wiki-entity` (Direction 1), gated по `policy.requireDocumentation` + `.arch-wiki/c4-baseline.json`. Значит новый drift-класс НЕ нужен; пробел — чисто доктринальный: schema нигде не называет инвариант, а `likec4-dsl` skill называет C4 «source of truth», что читается как notation-primacy и противоречит entities-as-canon.

**Что менять.** (a) Добавить в `schema/CLAUDE.md` (секция Invariants) строку GR-2. (b) Переформулировать `skills/likec4-dsl/SKILL.md`: «source of truth» скоупить к ДИАГРАММЕ, не к архитектурному смыслу. (c) *Опционально:* обогатить message существующего `c4-element-without-wiki-entity`, процитировав GR-2 — новую логику не добавлять.

**Пример.**
```
(a) schema/CLAUDE.md (new Invariant):
+ Wiki entities are the semantic source of truth; C4/LikeC4 is one notation (a View, E.5.2 GR-2).
+ Every C4 element that carries architectural meaning has a corresponding entities/ page;
+ C4 must never be the sole home of an element's semantics. (Enforced by validate-c4
+ rule `c4-element-without-wiki-entity`, gated via requireDocumentation + c4-baseline.)

(b) likec4-dsl/SKILL.md:
- Source of truth: docs/architecture/c4/src/
+ Source of truth for the DIAGRAM; the architectural meaning lives in entities/ — C4 is one notation over it.
```

**Эффект.** Называет guard-rail, который плагин уже почти соблюдает, и закрывает *доктринальный* зазор без нового кода; защищает корпус от notation lock-in; устраняет противоречивую формулировку «C4 as source of truth», подрывавшую entities-as-canon.

Приоритет: P1 · Трудоёмкость: S · Риск: нет — только doc-правки; механическая проверка (Direction 1) уже существует и уже gated через `c4-baseline`, поэтому adoption-репо с C4-only элементами не флудятся. Mirror не затрагивается (`validate-c4` — pre-publish).

### 5. Рубрика самооценки адекватности DPF-пакета (E.4.DPF.DA) как quality-спина фреймворка

**FPF-основание.** E.4.DPF.DA — узкий (не E.2.DA) инструмент: «достаточно ли хорош arch-wiki КАК DPF для заявленного использования?». 11 координат D1–D11 + package-form-проверки PFM1–PFM11, floor `4` для reliance-use. Без него claim «FPF-conformant» не несёт evidence-таблицы; в частности ничто не проверяет PFM5 (плагин — ACCESS-carrier, не сам фреймворк) и PFM4 (нет обратной зависимости в FPF Core).

**Что менять.** Добавить `FRAMEWORK-EVAL.md` как `DPFPackageAdequacyEvaluation` над arch-wiki (`packageKind = local-practice-framework` / skill-pack access carrier), оценивая каждую из 11 координат `0..5` с short rationale + evidence locus + repair, при floor `4`. Опционально — команда-скаффолд `arch-wiki self-eval`, эмитящая ПУСТУЮ coordinate-таблицу (Core эмитит только структуру; scoring — LLM/human-суждение, не Core-verdict → уважает deterministic-Core-first). Канонические имена координат из спеки (суффикс `...Adequacy`).

**Пример.**
```
FRAMEWORK-EVAL.md (result rows):
| D4CoreDependencyAndDomainBoundaryAdequacy | 4 | depends on FPF Core via PFAD-AW-001; no reverse dep (PFM4 pass)
|   EvidenceLocus: FRAMEWORK.md dependencyAndEditionRefs | Repair: none |
| D5PackageFormLayeringAndRelationAdequacy  | 2 | PFAD relation + DPF-adequacy doc not yet present -> repairBeforeDPFUse
|   EvidenceLocus: absent FRAMEWORK.md | Repair: land §2 (pfad-fpf-conformance-spine) first |
| D6DomainLexiconAndKindSettlementAdequacy  | gates on §1 (fpf-kind-ontology-map: Method/Work/WorkPlan settled) |
```

**Эффект.** Превращает FPF-conformance claim в инспектируемую, повторяемую evidence-таблицу; даёт всем предложениям общий scoring-rubric и floor; PFM-проверки ловят access-carrier-as-framework и reverse-dependency (плагин *экспонирует* DPF, он не *есть* DPF).

Приоритет: P2 · Трудоёмкость: M · Риск: нет — developer-only evaluation doc; не шиппится в target-репо, не зеркалится. Downstream: зависит от §2 (PFAD) и §1 (ontology-map), не конфликтует с ними.

## 🧭 Записи решений: DRR, проекция ADR и адекватность решения

FPF разводит три разных объекта, которые arch-wiki сегодня смешивает в одном `.md`-файле: `ArchitectureDecisionRelation@Project` (само решение, `C.32.PAD`), его публикационную проекцию `ArchitectureDecisionRecordProjection@Project` (`C.32.ADR`) и оценку адекватности `ArchitectureDecisionAdequacyEvaluation@Project` (`C.32.ADA`, DRR-аналог — `E.9.DA`). Ключевой тезис `C.32.ADA`: читаемая, полностью заполненная запись ещё не означает адекватного решения — оценивать надо покоординатно, под объявленное использование, без усреднения. Текущий `arch-wiki` проверяет только целостность графа (резолвятся ли wikilinks), но не имеет ни метода суждения «готово ли решение к accepted», ни авторской поверхности для координат `ConfirmationExit`/`EvolutionAndReopenCondition`. Ниже — правки, закрывающие этот разрыв: суждение уходит в LLM-скилл, проверяемые структурные инварианты — в детерминированный Core.

### ADR-adequacy rubric skill (C.32.ADA как рубрика перед accepted)

**FPF-основание.** `C.32.ADA` — прямой первоисточник: объявить use (`readyForDeveloperWork` / `readyForADRPublication`), оценить полный набор координат по шкале `0..5` с метками `E.21` (`absent..exceptionallyExpressedForDeclaredUse`), `noAveragePolicy: true`, каждую слабую координату вернуть в её repair-паттерн. `C.32.ADR` даёт секционные функции проекции. (Метки — из `E.21`; `E.9.DA` — сестринская шкала для DRR, не для ADR, поэтому цитируется как аналог, а не как источник координат.)

**Что менять.** Добавить `skills/adr-adequacy/SKILL.md`, специализирующий `C.32.ADA` под поверхность arch-wiki. Отображение координат на реальные разделы MADR-шаблона: `BoundedDecisionQuestionRecoverability`→«Context and Problem Statement содержит вопрос»; `CandidateBasisAndSelectionTraceability`→«≥2 Considered Options»; `ArchitectureCharacteristicTradeoffAdequacy`→«Consequences содержат Good И Bad»; `EvolutionAndReopenConditionAdequacy`→«есть Confirmation + Reopen Triggers»; `PublicationProjectionAdequacy`→«More Information ссылается на реализованные C4-элементы»; `NonOverreadAndReceivingPatternAdequacy`→«нет выдуманных опций». Вывод — advisory, human-gated (не Core-вердикт): именованные `strongestBlockingCoordinates` + `repairInstruction`, без единой оценки. Провязать шагом 4 в `commands/adr.md` («перед промоушеном в accepted — прогони adr-adequacy») и сослаться на скилл из `agents/architecture-linter.md` как на ADR-triage рубрику.

**Пример.** Прогон против gt `ADR-0038`:
```text
declaredUse: readyForDeveloperWork
CandidateBasisAndSelectionTraceability: 4  (3 опции: deploy-time const / runtime flag / fork)
ArchitectureCharacteristicTradeoffAdequacy: 4  (5 Good / 3 Bad)
EvolutionAndReopenConditionAdequacy(Confirmation): 2 partiallyExpressed
  → ADR не говорит, КАК обнаружить, что RMG-деплой протёк sweepstakes-кодом;
    "zero runtime cross-type surface" непроверяемо.
result: repairBeforeUse; strongestBlockingCoordinates: [ConfirmationExit]
repair: добавить build-time check + reopen-trigger  (не единая «проходная» оценка)
```

**Эффект.** Превращает вопрос «готов ли ADR?» из глазомерного чтения в воспроизводимую покоординатную инспекцию с конкретной repair-целью — ровно цель self-evaluation-rubric пользователя, оставаясь на LLM-стороне (суждение, которое Core сделать не может).

Приоритет: P0 · Трудоёмкость: M · Риск: нет — аддитивный скилл + один шаг команды; ни Core, ни шаблона, ни mirror не трогает.

### Секции Confirmation и Reopen Triggers в шаблоне ADR

**FPF-основание.** `C.32.ADR` требует восстановимости confirmation/eval-выхода И условия supersession/обновления; `C.32.ADA` делает `EvolutionAndReopenConditionAdequacy` отдельной координатой, а строка 2026-исследования по violation-detection — первоклассным «как узнать, что решение нарушено». Сейчас `templates/adr.md` имеет только `Status` + `More Information` — обе координаты структурно отсутствуют по умолчанию, поэтому и скиллу, и любому Core-правилу нечего инспектировать.

**Что менять.** Добавить в `templates/adr.md` (и синхронизируемый `0000-template.md` целевого репо) после `### Consequences` два заголовка: `## Confirmation` (как решение проверяется/мониторится/признаётся нарушенным) и `## Reopen Triggers` (guardrail/условие суперсессии). Задокументировать их в `skills/madr-format/SKILL.md` (Required structure). Рекомендуемый блок `requiredSections['adr']` НЕ вшивать в уже выпущенную миграцию `0002` (она идемпотентна и на мигрированных репозиториях не пере-исполнится — это no-op и нарушение неизменности миграций); вместо этого дать его как закомментированный opt-in пример в `schema/CLAUDE.md` + скилле, чтобы агностичный дефолт остался «no required sections» (fail-fast-no-defaults, additive).

**Пример.** Логика reopen у gt `ADR-0038` уже существует, но как разрозненная blockquote-проза. С секциями она становится явной:
```markdown
## Confirmation
Build asserts an RMG deployment bundles no sweepstakes BC; CI check `no-cross-type-surface`.

## Reopen Triggers
A third `CASINO_TYPE` value is proposed, OR Q-003 (real-money fork) resolves.
```
Будущий читатель восстанавливает путь нарушения, не реверс-инжиниря blockquotes.

**Эффект.** Делает две сегодня невидимые координаты (`ConfirmationExit`, `ReopenCondition`) авторскими по умолчанию — появляется реальная поверхность и для `adr-adequacy`, и для детерминированных проверок.

Приоритет: P1 · Трудоёмкость: M · Риск: шаблон one-way и аддитивен, существующие ADR не трогаются; новые заголовки mirror рендерит как обычную прозу (уже поддержано). Опасность flood от `missing-required-section` снята тем, что блок остаётся закомментированным + baseline-precedent миграции `0001`.

### Core-правило adr-consequences-unbalanced: выгоды без принятой потери

**FPF-основание.** `C.32.PAD` CC-PAD-5 делает принятые потери обязательным содержимым решения; `C.32.ADR` требует «rationale, accepted losses, and consequences… not only benefits»; `C.32.ADA` `ArchitectureCharacteristicTradeoffAdequacy` называет скрытый trade-off провалом. Конвенция `Good/Bad` уже задокументирована в `madr-format` (`### Consequences (Good/Bad)`), т.е. это проверяемый структурный инвариант — место ему в Core (deterministic-Core-first), а семантика «реальна ли потеря» остаётся скиллу.

**Что менять.** В `runLint()` (`src/domain/services/LintRuleSet.ts`) добавить правило `adr-consequences-unbalanced`: для ADR со `status ∈ {proposed, accepted}` сканировать регион `### Consequences`, считать буллеты с префиксом `**Good**` vs `**Bad**`. Если `Good ≥ 1` и `Bad == 0` — medium-finding «ADR states benefits but records no accepted loss (hidden trade-off)». Строго по префиксу буллета; если Consequences написаны прозой без bold-конвенции (нет и Good-буллетов), правило не срабатывает (применимо только когда конвенция используется). Сослаться из `agents/architecture-linter.md`.

**Пример.** gt `ADR-0038` проходит (есть `**Bad**, because it requires one deployment per casino type`). Заглушка `ADR-0051` только с `**Good**, because it is simpler` → срабатывает `adr-consequences-unbalanced at adrs/0051-*.md`; куратор дописывает принятую потерю вместо отгрузки оптимизма.

**Эффект.** Загоняет FPF-нормативное правило (видимость accepted-loss) в воспроизводимый Core — честность trade-off проверяется на каждом lint, а не когда рецензент вспомнит посмотреть.

Приоритет: P1 · Трудоёмкость: S · Риск: новый rule id ретроактивно сработает на всех односторонних ADR сразу — гасится вводом на `low`-severity + ре-baseline (как миграция `0001` для required-section). Mirror не затронут (только lint-вывод).

### Core-правило adr-options-thin: accepted ADR с <2 Considered Options

**FPF-основание.** `C.32.PAD` CC-PAD-2 требует восстановимого candidate basis, анти-паттерны `CandidateWinnerByMetric`/`MethodOnlyDecision`; `C.32.ADA` `CandidateBasisAndSelectionTraceability`. Важная оговорка FPF: CC-PAD-2 допускает единственную опцию, ЕСЛИ явно указано, почему «no candidate-set question is live» — поэтому правило должно быть advisory-подсказкой, а не жёстким гейтом.

**Что менять.** В `LintRuleSet.ts` добавить `adr-options-thin`: для ADR со `status == accepted` посчитать перечисленные опции в `## Considered Options` (top-level ordered-list или bold-lead буллеты). При `<2` — medium-finding «accepted ADR records fewer than two considered options — candidate basis not recoverable; record the rejected alternatives OR state why no candidate set is live». Только подсчёт списка; материальность альтернатив (`C.32.ADR OptionsInventedInRecord`) остаётся LLM-стороне (скилл `adr-adequacy`).

**Пример.** gt `ADR-0038` перечисляет три (deploy-time constant / runtime flag / fork) → проходит. ADR, прыгающий сразу к `Chosen: use Kafka` с пустым/одноэлементным списком → срабатывает `adr-options-thin`, побуждая зафиксировать отвергнутые альтернативы (или причину их отсутствия) до флипа в accepted.

**Эффект.** Детерминированно ловит rubber-stamp ADR в момент accept, сохраняя память об отвергнутых альтернативах — ради чего и существуют `C.32.PAD` и традиция DRR.

Приоритет: P2 · Трудоёмкость: S · Риск: та же ретроактивная сработка, что у consequences-правила; гейт `status=accepted` не трогает proposed-черновики; low-severity + ре-baseline. Возможный false-positive на легитимных «no-candidate» решениях снимается формулировкой escape-hatch в сообщении. Без изменений шаблона/mirror.

### Status-aware покрытие драйверов

**FPF-основание.** `C.32.ADA` привязывает адекватность к declared use и статусу готовности («adequate for discussion ≠ ready for developer work»), а семантика статусов решений различает proposed и accepted. Текущий `uncovered-driver` (`LintRuleSet.ts` ~строка 138) считает inbound-ссылки от ЛЮБОГО ADR/iteration независимо от статуса — драйвер, покрытый только ещё-proposed или уже-rejected/superseded ADR, числится «covered». Это дыра адекватности: у драйвера нет живого решения.

**Что менять.** Разделить покрытие по статусу. Ввести НОВЫЙ отдельный rule id `driver-covered-only-by-nonaccepted` (не менять семантику `uncovered-driver`, чтобы существующие baselines и маппинги `UpdateGapAnalysis` остались валидны): для драйвера, чьи все покрывающие ADR имеют статус `proposed|deprecated|superseded` (и нет ни одного `accepted` + iterations считаются покрывающими), — medium-finding «driver X is addressed only by non-accepted decisions». Читает `status` из frontmatter, уже парсимый для `superseded-no-successor` — новых входов не требуется.

**Пример.** Если бы gt `QA-013-code-structure` был связан только с ещё-proposed ADR, сегодня он числится покрытым и не всплывает в gap-analysis; после правки срабатывает `driver-covered-only-by-nonaccepted`, подпитывая driver-gap questionnaire loop, который потребляет `render-issue`.

**Эффект.** Приводит детерминированный вердикт покрытия в соответствие с FPF-семантикой статусов — gap-analysis отражает адекватность ЖИВЫХ решений, а не наличие ссылки.

Приоритет: P1 · Трудоёмкость: M · Риск: меняет lint-вывод на gt (драйверы, ранее «covered» не-accepted ADR, зафлагаются). Изоляция через отдельный rule id + low-severity первый релиз + ре-baseline; `UpdateGapAnalysis` продолжает потреблять неизменённый `uncovered-driver`. Mirror не затронут.

### Суперсессия как событие адекватности: причина + supersede-no-reason

**FPF-основание.** `C.32.ADA` `EvolutionAndReopenConditionAdequacy` и `C.32.PAD` (reopen «when a stronger source changes the accepted loss») трактуют суперсессию как сработавшее событие — перейдённый guardrail, распад обоснования, — а не голый флип статуса. `C.32.FAIL` даёт случай, где решение СТОИТ, но его обоснование стало не-несущим. Текущий `superseded-no-successor` проверяет лишь наличие ссылки-преемника и ничего не фиксирует про ПОЧЕМУ/какой триггер сработал.

**Что менять.** Две части, намеренно суженные (без изобретения нового статуса — arch-wiki не плодит схемы). (1) Скилл/шаблон (`madr-format`, `templates/adr.md`): для `status ∈ {superseded, deprecated}` требовать одну строку-причину, называющую сработавший reopen-триггер (какой guardrail/источник). Случай `C.32.FAIL` («решение стоит, обоснование распалось») фиксируется НЕ новым статусом, а аннотацией в `## Confirmation`/`### Consequences`, цитирующей триггерный ADR. (2) Core (`LintRuleSet.ts`): расширить проход `superseded-no-successor` сестринским finding `supersede-no-reason` — если у superseded/deprecated ADR есть ссылка-преемник, но нет строки-причины, событие распада фиксируется как аудируемое, а не просто связанное.

**Пример.** gt `ADR-0038` — ровно этот случай: `ADR-0049` прекращает real-money, поэтому обоснование «lowest RMG-regression risk» перестаёт быть несущим, но «the deploy-time CASINO_TYPE decision stands». Сегодня это живёт только как свободная blockquote-проза. Структурировано (без смены статуса на superseded):
```markdown
## Confirmation
Context-changed: rationale "lowest RMG-regression risk" no longer load-bearing —
trigger: RMG discontinued by [[ADR-0049]] (Q-003 real-money fork pending).
Decision (deploy-time CASINO_TYPE) still stands.
```
Детерминированное правило подтверждает наличие строки-причины, а не трактует это как сломанную суперсессию.

**Эффект.** Ухватывает различие «решение заменено» vs «обоснование распалось, решение держится», центральное для FPF-эволюции решений, и заставляет каждое событие суперсессии нести свой reopen-триггер для будущих аудиторов.

Приоритет: P2 · Трудоёмкость: M · Риск: `supersede-no-reason` — новый rule id → ретроактивная сработка на существующих superseded ADR без строки-причины; low-severity + ре-baseline. Строки-причины и context-changed-аннотации — обычная проза, которую покрывает mirror supersede-neutralisation (v0.8.5); ПЕРЕД релизом проверить, что RENAME/нейтрализатор не калечит новую формулировку. Область намеренно сужена (без нового lifecycle-статуса), чтобы удержать риск на mirror.

## 🗺️ Адекватность архитектурного описания и структурные виды

FPF отделяет *структуру* от её *носителя*: диаграмма, C4-модель или ADR — это публикационная форма, а не сама архитектура (C.30.ASV), и «то же самое достаточно» между двумя описаниями — это заявленное сохранение отношений с явной потерей, а не совпадение меток (C.34). Сегодня `validate-c4` сравнивает только **узлы** (`C4Model` в `src/domain/services/C4Consistency.ts` несёт лишь `elements`, без `relationships` и без `views`), поэтому центральный вопрос темы — «C4-вид есть проекция модели; верна ли она и полна ли?» — деттерминированно неотвечаем. Ниже — правила Core, превращающие «верность проекции» из глазомерного утверждения картографа в вердикт CLI.

### c4-relationship-correspondence — детерминированная проверка морфизма C4-отношение → wiki (верность проекции)

**FPF-основание:** `C.34` (StructuralPreservationAdequacyNote центрирован на `preservedRelationsOrConstraints` vs `lostStructure`; CC-C34-2 «mapping mode not stronger than the use needs») + `C.30.ASV` CC-ASV-6 («cross-view relations carried by correspondence records, not prose») и CC-ASV-10 («relation named by value»). C4-ребро — это заявление о сохранённом отношении; без wiki-следа это `nearSameness`, выдающая себя за `correspondence`.

**Что менять:** расширить нейтральный `C4Model` полем `relationships: { source: string; target: string }[]` (LikeC4 `read-project-summary` / `export json` уже отдают отношения — заполняет `LikeC4ModelReader`). Добавить одно **forward-only** детерминированное правило `c4-relationship-without-wiki-trace` в `C4Consistency.ts`: для каждого C4-отношения, у которого **оба** конца резолвятся в wiki-сущности имеющимся матчером, если ни одна страница не даёт `[[wikilink]]` на другую (первичный сигнал) **и** ни один общий ADR/iteration не реализует обе (вторичный сигнал через `realized_by`/входящие рёбра графа) — эмитить drift на `policy.severity`. Обратное направление (wiki→C4) вне области: wiki легитимно несёт много неструктурных ссылок. Переиспользовать существующее подавление baseline (`.arch-wiki/c4-baseline.json`, `--establish-baseline`). **Fail-fast, без тихого прохода:** при `--source regex` (где `parseC4Sources` заведомо не восстанавливает отношения) правило SKIPPED WITH AN EXPLICIT NOTE в отчёте, а не считается «чистым». Файлы: `src/domain/services/C4Consistency.ts`, `src/adapters/c4/LikeC4ModelReader.ts`, `src/application/usecases/ValidateC4.ts`, `commands/validate-c4.md`, `schema/CLAUDE.md`.

**Пример:**
```
c4/src/model.c4:  api -> orders_db
wiki:  api-gateway.md (c4: cloud.backend.api),  orders-db.md (c4: cloud.data.orders_db)
       — но ни одна страница не линкует другую, общего ADR нет.
Before:  PASS (оба элемента задокументированы).
After:   c4-relationship-without-wiki-trace:
         C4 relationship cloud.backend.api -> cloud.data.orders_db
         has no wiki trace between entity api-gateway and orders-db
Fix:     [[orders-db]] на странице api-gateway ИЛИ ADR, реализующий оба конца.
```

**Эффект:** самый частый вид C4-дрейфа — рёбра диаграммы, обгоняющие заземлённую wiki — ловится ровно там, где C.34 требует сделать заявление о сохранении явным; «faithful projection» становится вердиктом Core.

Приоритет: P0 · Трудоёмкость: M · Риск: none для зеркала (пайплайн `validate-c4` отделён от publish/translation); изменение аддитивно — одно опциональное поле + одно правило, существующие правила элементов и name-matching не тронуты, baseline глушит легаси, regex-режим деградирует явным skip-note.

### arc42-structural-view-coverage — возврат отсутствующего структурного вида + элемент-вне-вида

**FPF-основание:** `C.30.ASV` — первично: CC-ASV-8 («No single-view architecture») и bias-mitigation «Module-view bias»/«Multi-view correspondence vs single-view shortcut»: один объявленный вид не может стоять за всю архитектуру. `C.33` — вторично: отсутствующий обязательный вид есть *missing structure*, чей `missingStructureReturnCondition` должен быть предъявлен, а не молча принят. `C.34` даёт половину «полноты». `arc42-map` связывает §3→context, §5→containers/component, §6→dynamic/runtime, §7→deployment, но существование этих видов сейчас никак не проверяется.

**Что менять:** добавить `views: { id: string; kind: string }[]` в `C4Model` (из `read-project-summary`). Добавить fail-fast поле политики `c4.requiredViewKinds` (должно быть объявлено явно, напр. `["context","containers","dynamic","deployment"]`; отсутствие ключа — fail-stop, а не тихое пустое множество). Два детерминированных правила: (a) `missing-structural-view` — требуемый вид без объявленного C4-view → finding с именем секции arc42 и структурного вида; нужен лишь список kind'ов видов (дёшево и надёжно). (b) `c4-element-in-no-view` — элемент требуемого C4-kind (по `requireDocumentation`), спроецированный в ноль объявленных видов = captured-but-hidden structure (`C.33`; ближе к CC-ASV-5 lost-structure, **не** CC-ASV-7). Правило (b) фаэрит только когда доступна принадлежность view→element в источнике модели, иначе skipped-with-note. Оба baseline-suppressible. Файлы: `src/domain/services/C4Consistency.ts`, `src/application/usecases/ValidateC4.ts`, `commands/validate-c4.md`, `skills/arc42-map/SKILL.md`, `schema/CLAUDE.md`.

**Пример:**
```
views.c4:  index, context, containers
policy:    requiredViewKinds = [context, containers, dynamic, deployment]
After:
  missing-structural-view: arc42 §6 Runtime View  — no C4 `dynamic` view declared
  missing-structural-view: arc42 §7 Deployment View — no C4 `deployment` view declared
  c4-element-in-no-view:   cloud.backend.worker is captured but projected into no view
```

**Эффект:** многовидовая адекватность становится проверяемым гейтом — wiki больше не может выглядеть полной, пока её runtime/deployment-структура не описана, а arc42-хабы не могут указывать на несуществующие виды. Конкретное приземление C.33 missing-structure return в Core.

Приоритет: P0 · Трудоёмкость: M · Риск: none для зеркала; аддитивно (одно поле + два правила + один ключ политики). `requiredViewKinds` fail-fast, значит поведение не меняется, пока проект не подключится явно; baseline защищает легаси-модели на время адаптации.

### cartographer-c4-admission-note — нота допуска C.35 на каждый предлагаемый .c4-дифф

**FPF-основание:** `C.35` (Structural Synthesis and Discovery Adequacy) — картограф ПРЕДЛАГАЕТ `.c4`-правки (`architecture-cartographer.md`: «You **PROPOSE** `*.c4` diffs; a human/PR applies them»), т.е. порождённый носитель. C.35 требует отделить produced-carrier от described-structure и назвать `preservedStructure`, `lostStructure`, `admissibleUse`, `carrierAdmissionReturnCondition` до того, как другой паттерн (здесь — решение человека в PR) на него обопрётся. `C.33` — для captured/lost половины.

**Что менять:** добавить обязательный под-контракт в раздел `## Output` файла `agents/architecture-cartographer.md`: каждый предлагаемый `.c4`-дифф сопровождается компактной `StructuralSynthesisDiscoveryAdequacyNote` — `{ describedHolon, structureKind, addedElements/relationships, correspondingWikiArtifacts (ADR/entity/QA ids), preservedStructure, lostOrDeferredStructure, admissibleUse: 'propose-only; human/PR applies', carrierAdmissionReturn }`. `commands/validate-c4.md` нарративит ноту рядом с findings. Чисто оркестраторная markdown-правка; изменений Core нет; human-gating и аддитивность сохранены.

**Пример:**
```
Proposal: add `container worker` realizing ADR-0007
Note:
  describedHolon:          OrdersService
  structureKind:           module-interface
  added:                   [element cloud.backend.worker,
                            relationship cloud.backend.api -> cloud.backend.worker]
  correspondingWikiArtifacts: [ADR-0007, entity order-worker]
  preservedStructure:      async-processing decomposition from ADR-0007
  lostOrDeferredStructure: deployment placement (no deployment node yet)
  admissibleUse:           propose-only; human/PR applies
  carrierAdmissionReturn:  re-run validate-c4 after merge to confirm the new
                           relationship gains a wiki trace
```

**Эффект:** каждое предложение модели становится самоописуемым и рецензируемым в терминах FPF, замыкая петлю с `c4-relationship-without-wiki-trace` (нота заранее называет wiki-след, который потребует новое ребро) и не давая порождённой структуре тихо обрести авторитет.

Приоритет: P1 · Трудоёмкость: S · Риск: none — только документация/контракт; ни Core, ни зеркала, ни шаблонов; строго усиливает существующую дисциплину propose-not-apply.

### c4-name-only-match-hardening — пометка совпадений «только по имени» как непроверенного соответствия

**FPF-основание:** `C.34` — слабейшее адекватное отображение: совпадение формы/метки ≠ эквивалентность (CC-C34-2; анти-паттерн «Edge-isomorphism overread / label overread»). `C.30.ASV` CC-ASV-10 требует соответствие как отношение, названное по значению, а не по случайности. Сегодня `matchElement` (`C4Consistency.ts:89-95`) трактует попадание по нормализованному имени (`byName`) наравне с явным `c4:`, так что коллизия слага или переименование могут молча связать не ту пару.

**Что менять:** добавить info/low-severity правило `c4-name-only-match`: когда элемент совпал с сущностью ТОЛЬКО по нормализованному имени (нет `c4:` на сущности и нет общего явного id), эмитить finding с рекомендацией закрепить `c4: <ElementId>`, повысив случайный `nearSameness` до объявленного `correspondence`. Вердикт documented/undocumented НЕ меняется — это сигнал силы соответствия. Suppressible через baseline и существующий per-rule ignore. Файлы: `src/domain/services/C4Consistency.ts`, `commands/validate-c4.md`, `schema/CLAUDE.md`.

**Пример:**
```
C4 element cloud.backend.gateway (title 'Gateway')  name-matches  entity gateway.md
                                                    (у gateway.md нет поля c4:)
Before:  молча засчитано как documented.
After:   c4-name-only-match (low): entity gateway matched cloud.backend.gateway
         by name only — pin `c4: cloud.backend.gateway` to record the correspondence
Fix:     добавить c4: cloud.backend.gateway во frontmatter → finding уходит.
```

**Эффект:** дисциплина слабейшего адекватного отображения C.34 приземляется в Core — соответствия становятся явными записями, а не совпадениями меток, укрепляя все зависящие от корректности карты element↔entity проверки (relationship-trace, view-coverage).

Приоритет: P2 · Трудоёмкость: S · Риск: none для зеркала; low/info severity, не меняет вердикты documented/undocumented, поэтому не может сломать проходящие прогоны; полностью подавляемо через baseline и ignore.

## 🔭 Мульти-видовая публикация, viewpoints и correspondences

FPF (`E.17.0 U.MultiViewDescribing`) требует, чтобы каждое описание внутри мульти-видового семейства несло явный `ViewpointRef` из конечного объявленного набора `Σ` (totality + locality, MVD-1), чтобы виды прослеживались к тому, что они описывают (MVD-2), и чтобы кросс-видовая согласованность жила в `CorrespondenceModel` (MVD-4). У arch-wiki есть неявная мульти-видовость (arc42-секции, C4-виды, шесть viewpoints Rozanski в одноразовом RU-опроснике), но нет ни первоклассного `Σ`, ни привязки страницы-описания к её viewpoint, ни детерминированной проверки соответствия hub↔C4. Ниже — переиспользуемый TEVB-заземлённый набор viewpoints, протянутый через элицитацию → arc42/C4 view-hub → lint, плюс именование зеркала своим настоящим паттерном (MVPK).

### Объявить arch-бандл viewpoints (импорт TEVB) + детерминированный `viewpoint:`-lint

**FPF-основание.** `E.17.0` MVD-1 запрещает «view-from-nowhere» описания и требует `ViewpointRef ∈ конечное Σ` (viewpoint-totality + viewpoint-locality); `E.17.1` даёт `Σ` как переиспользуемый `U.ViewpointBundle`; `E.17.2` guard-7 — arch-специфичный бандл это **отдельный вид, который импортирует TEVB**, а не мутирует `VF.TEVB.ENG`.

**Что менять.**
- `src/domain/model/ProjectConfigSchema.ts`: добавить `viewpointBundle { id, imports[], viewpoints[] }` (`.strict()`, optional, как `requiredSections`). Инвариант: четыре TEVB-viewpoint приходят из `imports: ["VF.TEVB.ENG"]`, а `viewpoints[]` содержит **только** arch-only добавки (`VP.Context/Deployment/Operational/Information`) — не дублировать четвёрку TEVB. `Σ = resolve(imports) ∪ viewpoints[]`.
- Привязку задать двумя полями: `viewpointBoundKinds` (например `["entity"]`) **и** `viewpointBoundHubs` (явный список arc42 view-hub путей). НЕ биндить весь kind `arc42`: §1/§2/§9–12 это контейнеры-концернов/решений/регистров, а не виды (см. следующее предложение), иначе они ложно флагаются. Драйверы (UC/QA/CON/CONC) не биндятся — это `ConcernEntries`, которые viewpoint выдвигает на первый план (`E.17.0:4.2.2`), а не виды холона.
- `src/domain/services/LintRuleSet.ts`: два Core-правила — `viewpoint-unbound` (страница bound-типа без `viewpoint:` → fail-fast, **без инъекции дефолта**, по принципу no-silent-defaults) и `viewpoint-not-in-bundle` (значение ∉ Σ, переиспользовать существующий `Levenshtein`≤2 near-name hint). `viewpoint:` уже лежит в `WikiPage.frontmatter` — правило просто читает его.

**Пример.**
```
// .arch-wiki/config.json
"viewpointBundle": { "id": "VF.ARC42.SA", "imports": ["VF.TEVB.ENG"],
  "viewpoints": ["VP.Context","VP.Deployment","VP.Operational","VP.Information"] },
"viewpointBoundKinds": ["entity"],
"viewpointBoundHubs": ["arc42/03-context-and-scope.md","arc42/05-building-block-view.md",
  "arc42/06-runtime-view.md","arc42/07-deployment-view.md","arc42/08-crosscutting-concepts.md"]
```
```
entities/payment-gateway.md  (after)
---
type: entity
viewpoint: VP.ModuleInterface   # DescriptionContext.ViewpointRef ∈ Σ
---
```
```
viewpoint-unbound        entities/payment-gateway.md  entity page has no `viewpoint:` (Σ = VF.ARC42.SA)
viewpoint-not-in-bundle  arc42/06-runtime-view.md     viewpoint "VP.Procdural" ∉ Σ — did you mean "VP.Procedural"?
```

**Эффект.** Viewpoints превращаются из размытых ярлыков в проверяемый, переиспользуемый, TEVB-заземлённый набор; `DescriptionContext` становится явным; инвариант totality/locality MVD-1 уезжает в детерминированный Core (config-agnostic, как `requiredSections`). Фундамент для остальных предложений темы.

Приоритет: P0 · Трудоёмкость: M · Риск: нет — при отсутствии `viewpointBundle` правила спят, целевые вики линтуются как раньше до opt-in; frontmatter-добавка неразрушающая.

### arc42/C4-карта как таблица соответствия viewpoint↔view

**FPF-основание.** `E.17.2` CC-TEVB-6 требует, чтобы именованные инженерные семейства («Functional», «Procedural», «Module-Interface»…) были **привязаны к `VP.*`**; `E.17.0` различает виды (под viewpoint) и контейнеры-концернов. Сегодня карта плоская — только «где это лежит».

**Что менять (только документация, ноль кода).**
- `skills/arc42-map/SKILL.md` и `schema/CLAUDE.md`: добавить колонку `Viewpoint` и разбить таблицу на (a) view-секции с `viewpoint:` ∈ Σ и реализующим C4-видом и (b) контейнер-секции (goals/constraints/decisions/quality/risks/glossary), явно помеченные как НЕ виды. Проговорить правило `E.17.2`: arc42-бандл импортирует TEVB; `VP.Context/Deployment/Operational` — arch-only, поверх, никогда не в ядре TEVB. Дать crosswalk Rozanski→VP (Functional→`VP.Functional`, Concurrency→`VP.Procedural`, Development→`VP.ModuleInterface`, Information→`VP.Information`, Deployment→`VP.Deployment`, Operational→`VP.Operational`), чтобы опросник, arc42, C4 и TEVB делили ОДИН словарь. Список view-hub из этой таблицы = ровно `viewpointBoundHubs` из P0.

**Пример.**
```
| § | Section          | Viewpoint (∈ VF.ARC42.SA) | Realizing C4 view      | Hub |
| 3 | Context & Scope  | VP.Context         | context               | arc42/03-context-and-scope.md |
| 5 | Building Block   | VP.ModuleInterface | containers/components | arc42/05-building-block-view.md |
| 6 | Runtime          | VP.Procedural      | dynamic               | arc42/06-runtime-view.md |
| 7 | Deployment       | VP.Deployment      | deployment.c4         | arc42/07-deployment-view.md |
| 8 | Crosscutting     | VP.Information     | —                     | arc42/08-crosscutting-concepts.md |
+ §1,2,9,10,11,12 — concern/decision/register containers, NOT views (no viewpoint).
```

**Эффект.** Даёт LLM-оркестратору FPF-корректное соответствие для размещения контента и поставляет точный `viewpoint` id для каждого view-hub, которого требует P0; чистая методология-текст, разблокирующая детерминированные проверки.

Приоритет: P1 · Трудоёмкость: S · Риск: нет — правки только в skill и schema-контракте; mirror-пайплайн и Core не тронуты. Ставить парно с P0 (поставляет ему `viewpointBoundHubs` и per-hub viewpoint).

### Core-проверка соответствия видов: `correspondence-missing` / `correspondence-orphan-view`

**FPF-основание.** `E.17.0` MVD-2 (каждый вид прослеживается к тому, что описывает) и MVD-4 (`CorrespondenceModel` держит кросс-виды согласованными и флагает change-impact). У arch-wiki есть обе стороны — arc42 view-hub и C4-модель JSON, уже подаваемая в `validate-c4`, — но ничто не проверяет, что §5 линкует container-вид, §6 dynamic, §7 deployment.

**Что менять.**
- `src/domain/model/ProjectConfigSchema.ts`: optional `viewCorrespondence: [{viewpoint, c4View}]` — только пара viewpoint↔c4View (hub НЕ дублировать: страница-hub уже несёт `viewpoint:` из P0, оттуда и берётся).
- `src/domain/services/C4Consistency.ts` + `commands/validate-c4.md`: правило `correspondence-missing` — для каждой пары найти hub-страницу с `frontmatter.viewpoint == viewpoint` и проверить, что она ссылается на сущности `c4View`; и `correspondence-orphan-view` — каждый `c4View` в модели должен иметь ровно один такой hub. Детерминированный вердикт (Core); семантическую адекватность вида оставить LLM-линтеру — как уже делит труд `validate-c4`.

**Пример.**
```
"viewCorrespondence": [
  {"viewpoint":"VP.ModuleInterface","c4View":"containers"},
  {"viewpoint":"VP.Procedural","c4View":"checkout-dynamic"}
]
```
```
correspondence-missing     arc42/06-runtime-view.md  hub for VP.Procedural does not link C4 view "checkout-dynamic" (present in model)
correspondence-orphan-view —                         C4 view "admin-containers" has no arc42 hub referencing it
```

**Эффект.** Реализует проверяемую половину «держать виды в соответствии» как воспроизводимый чек: новый/изменённый C4-вид, который не отражён ни одним view-hub, ловится на lint, а не дрейфует. Композируется с P0/P2, не заводя третий избыточный конфиг-словарь.

Приоритет: P1 · Трудоёмкость: M · Риск: нет для зеркала — переиспользует существующий канал model-JSON и снапшот графа `validate-c4`; спит при незаданном `viewCorrespondence`.

### Назвать зеркало MVPK PlainView PublicationUnit + узко-заскоупленный guard сдвига primary EntityOfConcern

**FPF-основание.** `E.17` MVPK: одна исходная эпистема нуждается в нескольких читательских лицах без добавления claim — зеркало сегодня уже строго MVPK-образно (`## Sources` срезаны, git-пути нейтрализованы, content-hash над английским источником = snapshot-identity, destination-drift guard), но это нигде не **названо**. `E.17.AUD.OOTD`: одна `PublicationUnit` остаётся про один primary EntityOfConcern; `E.17.AUD:4.4` (snapshot-identity) требует перезапуска интерпретации при refresh/translation, меняющем субъект юнита.

**Что менять.**
- `schema/CLAUDE.md` (несущая, дешёвая, корректная часть — делать сразу): явно назвать mirror-страницу `U.View` (MVPK PlainView face) и `PublicationUnit`, чей primary EntityOfConcern — субъект исходной страницы; `E.17:5.1` «публикация не добавляет claim читаемой формой».
- `src/application/usecases/RecordPage.ts` + `LedgerStorePort` (а не только `ConfluenceTree.ts`/`publish.md` — строка ledger живёт здесь): добавить `primaryEntityOfConcern` = **стабильный** сигнал субъекта (frontmatter `type` + slug).
- `commands/publish.md`: guard параллельно destination-drift — перед update, если при **переиспользованном source-path** записанный `type` ретаргетирован (тип страницы сменился, но путь тот же), REFUSE как `publication-unit-eoc-shift`; override только `--force`. Это `E.17.AUD:4.4` snapshot-identity rerun, сделанный механическим.

**Пример.**
```
ledger row (after):
  { pageId:"98461", source:"entities/payment-gateway.md", primaryEntityOfConcern:"entity:payment-gateway", version:7, hash:"a1b2…" }

publish guard:
  publication-unit-eoc-shift  entities/payment-gateway.md → page 98461
    ledger primary EntityOfConcern "entity:payment-gateway" ≠ current "concept:billing-orchestrator";
    refusing to republish (silent readable-unit repoint). Re-run with --force to confirm the retarget.
```

**Эффект.** Заземляет зеркало в его настоящем паттерне (MVPK) — дешёвый, корректный и высокоценный вклад именования; и закрывает единственный пробел стабильности PublicationUnit, который называет `E.17.AUD.OOTD`, машинерией ledger/guard, которая уже есть.

Приоритет: P2 · Трудоёмкость: M · Риск: **низкий, но honest-caveat** — триггер узкий (обычно ретаргет = переименование файла → новый ledger-ключ → новая страница, guard не срабатывает), поэтому EoC-сигнал обязан быть стабильным, иначе возможны ложные refuse на легитимную in-place эволюцию контента; отсюда `--force` escape и P2. Именующая часть в `schema/CLAUDE.md` может уехать отдельно как S-задача без всякого риска.

### Опросник Rozanski элицитирует над объявленным Σ, а не над зашитой шестёркой

**FPF-основание.** `E.17.1` — про **переиспользуемые** бандлы: бандл, над которым элицитируешь, но не можешь переиспользовать в графе, обесценивает паттерн. `E.17.2` — общий словарь.

**Что менять.**
- `commands/questionnaire.md` + `templates/payloads/questionnaire-rozanski.md`: ветка `rozanski` рендерит по одному блоку на viewpoint из `viewpointBundle.viewpoints` (из P0), с fallback на классическую шестёрку Rozanski при отсутствии бандла (graceful degradation, не тихая подмена). Id-ы viewpoints оставить английскими (`VP.*`), проза вопросов — RU по raw-language-конвенции. Crosswalk Rozanski→VP (из карты выше) добавить комментарием, чтобы ответы позже втягивались с тегом `viewpoint:`/`closes:`, попадающим на нужный view-hub.

**Пример.**
```
rozanski step (after): read viewpointBundle.viewpoints from .arch-wiki/config.json;
emit one question block per VP.* in Σ (fallback: classic Rozanski six if no bundle).

## Вопросы по viewpoints (Σ = VF.ARC42.SA)
- **VP.Functional** — какие возможности и требуемые преобразования для «{{topic}}»?
- **VP.Procedural** — какая последовательность и контроль поведения?
- **VP.ModuleInterface** — какие модули, интерфейсы, зависимости?
- **VP.Information** … **VP.Deployment** … **VP.Operational** …
```

**Эффект.** Один словарь viewpoints от элицитации → arc42/C4 view-hub → lint, замыкая петлю `E.17.1`/`E.17.2`; опросник становится настоящим переиспользованием бандла, а не параллельным списком, который дрейфует.

Приоритет: P2 · Трудоёмкость: S · Риск: нет для зеркала — правка команды/шаблона с явным fallback, цели без бандла сохраняют текущее поведение. Зависит от P0 (конфиг бандла).

## 🪞 Дисциплина проекции/морфизмов (конвейер зеркала Confluence)

Зеркало Confluence — это цепочка **effect-free морфизмов эпистем** (FPF A.6.2 EFEM): каждый шаг обязан оставаться `entityOfConcernChangeMode = preserve` (A.6.3, никогда A.6.4-retarget), консервативным (P2) и идемпотентным (P4), а огрубляющие шаги суть Controlled Semantic Coarsening (A.6.3.CSC). Пробел arch-wiki в том, что эти гарантии живут только прозой в `commands/publish.md` (строки 53-59: «Acceptance has two tiers…») и **проверяются глазами LLM** в момент публикации — прямое нарушение принципа deterministic-Core-first. Ниже — как превратить каждую гарантию в машинный вердикт Core, не трогая работающий пайплайн (все предложения аддитивны).

### verify-mirror-faithfulness-gate — детерминированный вентиль верности проекции

**FPF-основание.** `A.6.2:4.3.3 (P2)` + `CC-EFEM.4` (консервативность как admissibility-предикат, а не редакторское усмотрение); `A.6.3.CSC` + `CC-CSC-2` (coarsened rendering держится отдельно от source-bearing side — здесь: git source-of-truth не просачивается в проекцию); `E.17.EFP` (faithfulness — это review-вопрос к рендерингу, который надо уметь ответить, а не задекларировать). Сегодня «two-tier acceptance» — это прозаический критерий, который eyeball-ит LLM; FPF требует, чтобы conservativity была проверяемым предикатом.

**Что менять.** В `src/domain/services/ConfluenceTree.ts` добавить чистую функцию `verifyMirrorEnvelope(env: PageEnvelope): { preserved: boolean; violations: Violation[] }`, которая переиспользует уже существующий строгий `REPO_PATH_CONTAINS_RE` и прогоняет его по `env.body` **И** по каждому `env.restore[].original`, а также флагует: остаточный синтаксис `[[…]]`/`![[…]]`, остаточные repo-relative markdown-href `](…)`, не прошедшие `KEEP_LINK_URL`, и замкнутый набор seam-мусора (`the the`, `a the`, пустые `()`). В `src/application/usecases/RenderConfluencePayload.ts` прикрепить `acceptance` к каждому `PageEnvelope` и plan-level roll-up. В `src/cli/main.ts` добавить `arch-wiki verify-mirror --plan /tmp/aw-mirror.json` (exit 2 при любой непрошедшей странице) — по образцу уже существующего `finalize-confluence`, который так же читает plan-файл. В `commands/publish.md` шаг 4 гейтит на нём и прогоняет проверку **повторно после `finalize-confluence`** (по восстановленному RU-body). Внешние POC-git-URL (`bitbucket.org/…`) `REPO_PATH_RE` не матчит, поэтому tier (ii) сохраняется автоматически.

**Пример.**
```
# Сегодня: план несёт только warnings[], но НЕ несёт вердикта preserved.
# Регрессия-ловушка: в REGISTER_PHRASES добавили новый register basename, но
# забыли внести его в REPO_PATH_SRC allowlist → путь не нейтрализуется и утекает,
# страница публикуется, ловит только человек.
PageEnvelope: { body: "…tracked in the.", restore: [{ token:"%%AWP4%%", original:"`raw/go-live.csv`" }] }
# После:
acceptance: { preserved: false,
  violations: [{ where:"restore[4].original", kind:"repo-path", value:"raw/go-live.csv" }] }
# → `verify-mirror` exit 2, publish.md STOPS на этой странице.
```

**Эффект.** Правило, которое `publish.md` лишь описывает («absent from the body AND from the restore values»), становится вердиктом Core (A.6.2 P2 + CC-CSC-2), пригодным для CI. Ловит named-остатки темы (`[[risks]]`, выживший repo-path, seam-litter) детерминированно, вместо LLM-усмотрения. Функция read-only, поэтому чистые страницы не затрагиваются.

Приоритет: P0 · Трудоёмкость: M · Риск: низкий — чисто аддитивно (новая fn/поле/команда/один гейт); единственное изменение поведения — страница, которая РАНЬШЕ утекала молча, теперь блокируется (это и есть намеренная коррекция, не регрессия корректного вывода).

### typed-source-loss-modes — типизировать огрубление словарём CSC source-loss-mode

**FPF-основание.** `A.6.3.CSC:4.5` даёт ЗАМКНУТЫЙ словарь source-loss-mode (redaction / recoverability-loss / representation-factor-loss / omitted-detail / …); `CC-CSC-9` требует назвать source-loss-mode до того, как rendering считается admissible. Свободные строки в `warnings[]` не diffable, не агрегируемы и смешивают разные режимы потери (редакция provenance vs потеря восстановимости git-ref vs потеря representation-factor на диаграмме).

**Что менять.** В `src/application/usecases/RenderConfluencePayload.ts` добавить в `PageEnvelope` поле `sourceLoss: { mode: SourceLossMode; refs: string[] }[]`, где `SourceLossMode` — CSC-энум. Заполнять из тех же булевых флагов, что уже возвращают `stripSourcesSection` / `stripSourceProvenanceLines` / `neutralizeRepoRelativeLinks` / `neutralizeRepoPaths` / `stubLocalImages`. Отображение (выверено по A.6.3.CSC:4.5): `## Sources`-strip + `**Source:**`-cut → `redaction`; git-ref → человеко-фраза (`humanizeRepoRef`) → `recoverability-loss` (читатель не восстановит путь); C4-image → text-stub → `representation-factor-loss`; repo-relative link → plain text → `recoverability-loss` (мёртвый href, цель невосстановима). `warnings[]` сохранить дословно на один релиз для back-compat.

**Пример.**
```
# Было (arc42 hub):
warnings: [ "stripped the `## Sources` provenance section …",
            "neutralized repo-internal path reference(s) …",
            "stubbed 1 local image(s) …: ../c4/context.png" ]
# Стало (рядом с warnings):
sourceLoss: [ { mode:"redaction",                refs:["## Sources"] },
              { mode:"recoverability-loss",      refs:["risks.md","raw/TODO.md"] },
              { mode:"representation-factor-loss",refs:["../c4/context.png"] } ]
```

**Эффект.** Зеркало становится инспектируемой CSC-карточкой (CC-CSC-9): `publish.md` и любой аудит могут детерминированно сказать «эта проекция редактирует N provenance-секций и огрубляет M git-ref». Каждая запись неявно называет CSC-вид шага — это и есть корректная замена выброшенному манифесту EFEM-species. Никакого изменения `body`/`contentHash` → без drift.

Приоритет: P1 · Трудоёмкость: S · Риск: нет — аддитивное поле, значения энума берутся из уже вычисляемых булевых флагов, `warnings[]` сохранён.

### reverse-edge-conservativity-witness — свидетель консервативности единственного добавляющего шага

**FPF-основание.** `A.6.2:4.3.3 (P2)` явно РАЗРЕШАЕТ добавлять meta-claims об эпистеме (edition/source/status/witness), и trace-строка `**Realized by:**` — именно такой meta-claim, поэтому она admissible; но `A.6.3.CR:4.5.f` (пункт «added linkage») требует, чтобы rewrite не вносил новую связь, отсутствующую в источнике. Свидетель фиксирует: добавленные ключи ДЕРИВИРОВАНЫ из `realized_by` frontmatter, а не изобретены (никакого нового atomic-claim об EntityOfConcern).

**Что менять.** В `src/application/usecases/RenderConfluencePayload.ts` `realizedKeys` уже строится прямым `.map` по `frontmatter.realized_by` (строки 230-244), так что инвариант держится **по построению** — но незасвидетельствован. Свернуть проверку в `verifyMirrorEnvelope` (предложение 1) как ещё один `kind`: пере-извлечь ключи из отрендеренного `body` и упасть, если хоть один `**Realized by:**` ключ отсутствует в `realized_by` исходной страницы.

**Пример.**
```
const declared = new Set(realizedKeys);                       // из frontmatter.realized_by
const emitted  = [...reverseEdge.matchAll(/\[`([^`]+)`\]/g)].map(m => m[1]);
const invented = emitted.filter(k => !declared.has(k));
if (invented.length) violations.push({ where:'reverse-edge', kind:'non-conservative-claim', value: invented.join(',') });
// Рефакторинг, тянущий ключи из ledger/другой страницы, либо ручная правка
// `**Realized by:** GRMTCH-9` при frontmatter только `GRMTCH-5` → acceptance FAIL,
// вместо публикации сфабрикованного trace-edge.
```

**Эффект.** Единственный не-огрубляющий (добавляющий) шаг привязан к A.6.2 P2: проекция доказуемо не вносит связь сверх источника. Дёшево и future-proof-ит reverse-trace против рефакторинга, ломающего консервативность.

Приоритет: P2 · Трудоёмкость: S · Риск: нет — сегодня инвариант истинен по построению, ассерт не срабатывает на корректном выводе; охраняет только будущие изменения. Реализуется внутри вентиля предложения 1.

### idempotence-determinism-property-check — машинная проверка P4 (идемпотентность/бездрейфовость)

**FPF-основание.** `A.6.2:4.3.5 (P4)` (`apply(f, apply(f,X)) ≅ apply(f,X)` + детерминизм) и `CC-EFEM.5` (порядко-чувствительное/недетерминированное поведение сверх заявленной эквивалентности — non-conformant). Весь no-false-drift-задел (content-hash stability, гейты `renamed`/`neutralized`, `s === chunk` байт-идентичность, `tidyRenamedPhrases`) — это неформальный аргумент об идемпотентности в комментариях; исполняемого ассерта нет.

**Что менять.** В `src/domain/services/ConfluenceTree.ts` добавить чистую `assertMirrorIdempotent(body)`, прогоняющую **огрубляющую под-цепь** `stripSourcesSection → stripSourceProvenanceLines → neutralizeRepoRelativeLinks → neutralizeRepoPaths → stubLocalImages` дважды и утверждающую, что второе применение — no-op, плюс что leak-free вход возвращается байт-в-байт. **Важно:** `resolveCrossLinks` в цепь НЕ входит — он намеренно 2-pass и ledger-зависим (`pending`→resolved), то есть НЕ байт-идемпотентен между проходами by design. Провод: `arch-wiki render-confluence --check-idempotent` (exit 2 на любой не-fixpoint) + property-тест по фикстур-корпусу.

**Пример.**
```
for (const b of bodies) {
  const once  = coarsen(b);      // под-цепь БЕЗ resolveCrossLinks
  const twice = coarsen(once);
  assert(once === twice, `non-idempotent coarsening on ${source}`);
}
// Ловит регрессию вида REGISTER_PHRASE / humanizeRepoRef, где фраза 2-го прохода
// содержит матчируемый токен → вечный drift на живом зеркале.
```

**Эффект.** Делает контракт «повторный прогон — no-op» (принцип 4) и тяжёлую v0.8.5/v0.8.6 seam-tidy-работу машинно-проверяемыми (A.6.2 P4). Охраняет каждую будущую правку `humanizeRepoRef` / `REGISTER_PHRASES` / `tidyRenamedPhrases`.

Приоритет: P2 · Трудоёмкость: M · Риск: нет в рантайме (проверка opt-in/тестовая); может вскрыть уже существующий не-fixpoint край — это находка латентного бага, а не регрессия.

## 🔬 Граф свидетельств, провенанс и исчисление доверия

FPF отделяет *наличие* свидетельства от его *силы*, *свежести* и *типа* — design-time verification (`verifiedBy`) против run-time validation (`validatedBy`), — и требует, чтобы уровень зрелости *вычислялся* из привязанных свидетельств, а не назначался автором (B.3.3), и чтобы свидетельство *старело* (B.3.4). arch-wiki сегодня сводит покрытие драйвера к бинарному флагу `uncovered-driver` (любая одна inbound-ссылка от ADR/iteration переводит драйвер из gap в covered, `LintRuleSet.ts` §4, строки 130-134) и держит провенанс в свободной прозе `## Sources`. Три взаимоусиливающих предложения превращают это в вычислимый, фальсифицируемый и стареющий сигнал зрелости, оставляя вердикт в детерминированном Core: типизированные рёбра (#3) → вычисленные уровни (#1) → бюджетированный регистр распада (#2).

### AssuranceLevel L0/L1/L2 вместо бинарного covered/uncovered

**FPF-основание.** B.3.3: `AssuranceLevel` вычисляется из привязанных свидетельств, не назначается автором — ровно мишень «paper compliance», и CC-B3.3.5 требует строгого разделения design-time/run-time свидетельств. A.10 §4.2 даёт две нормативные связи: `verifiedBy` (формальное/design-time) и `validatedBy` (эмпирическое/run-time), а CC-A10.4 (Resolution) — требование резолвимости узла. A.2.4 (`EvidencePolaritySlot`, `UnsupportedOverread`): статус ADR задаёт *полярность* ребра, а `NotCarried` фиксирует более сильную претензию, которую ссылка не несёт. *Честная оговорка о названиях:* FPF L2 — это «Axiomatic» (`verifiedBy` proof + `FV ≥ threshold`); формальных доказательств у arch-wiki нет, поэтому ladder B.3.3 берётся как доменная проекция — `verifiedBy` ← accepted ADR (VA/design-time), `validatedBy` ← нестарелая ledger-issue/showcase (LA/run-time), — а не как воспроизведение имён.

**Что менять.**
- `src/application/usecases/ComputeAssurance.ts` (new) — вычислить `AssuranceLevel` per driver из уже загруженных данных (граф inbound-ссылок + ledger rows), почти без нового I/O.
- `src/domain/services/LintRuleSet.ts` — заменить бинарный `uncovered-driver` (§4) правилом `assurance-level`; `covered`-set фильтруется по `frontmatter.status` ADR (`proposed`/`superseded`/`deprecated` больше не выводят из gap).
- `src/application/usecases/Trace.ts` — добавить `assuranceLevel` + `notCarried` в Trace JSON, чтобы LLM их нарративизировал.
- `commands/trace.md`, `schema/CLAUDE.md` — задокументировать уровни и правило.

Уровни: **L0 Unsubstantiated** = нет inbound `accepted`-ADR/iteration (сегодняшний `uncovered-driver`); `proposed` ADR = orientation only, не выводит из gap (A.2.4: status-display ≠ authority). **L1 Substantiated** = ≥1 `verifiedBy`/`validatedBy` к ADR со `status: accepted` (или iteration), чей wikilink резолвится (A.10 CC-A10.4 — существующий `broken-wikilink` lint). **L2 Realized** = дополнительно трассируется на нестарелую ledger-issue (`realized_by`) или showcase row (`validatedBy`/run-time). Design-time и run-time держатся раздельно (CC-B3.3.5), никогда не сворачиваются в один балл. *Инкремент:* сначала можно отфильтровать `covered`-set по status прямо в `uncovered-driver` (S), затем добавить полный usecase L0/L1/L2 (M).

**Пример.**
```
Before: QA-007 линтуется как 'covered', потому что ADR-0012 (status: proposed) ссылается на него.
After:  L0 — reason 'sole inbound ADR-0012 is proposed → decision NotCarried'.
        status: accepted            → L1 Substantiated.
        realized_by: [GRM-431] (row не stale) → L2 Realized.
Trace:  'QA-007 … decided by ADR-0012 [accepted], realized by GRM-431 → AssuranceLevel L2'.
```

**Эффект.** Бинарный флаг → аудируемый, фальсифицируемый сигнал зрелости, разделяющий VA (design-time) и LA (run-time); убивает paper-coverage; вердикт остаётся в детерминированном Core (инвариант 1); переиспользует граф + ledger, уже загружаемые Trace.

Приоритет: P0 · Трудоёмкость: M · Риск: нет для Confluence-mirror (publish-путь не трогается); правило additive рядом с прежним; findings baseline-suppressible → поэтапное внедрение на gt. Ужесточение может вскрыть НОВЫЕ правдивые gaps — это корректность, не регресс.

### Регистр эпистемического долга (epistemic-debt) из valid_until и существующих сигналов распада

**FPF-основание.** B.3.4: «свидетельство скоропортящееся» — `valid_until` (4.2), `ED_t(i) = k · max(0, t − valid_until)` (4.5), `epistemic_debt_budget` (CC-ED.2), governance-петля `Refresh/Deprecate/Waive` (4.4; `Waive` аудируем по CC-ED.5), провизорное понижение на один уровень при `ED > budget` (CC-ED.4) — питает правило `assurance-level` (B.3.3). A.10 CC-A10.8 — датированные carriers, без которых старить нечего.

**Что менять.**
- `src/application/usecases/UpdateEpistemicDebt.ts` (new, по образцу `UpdateGapAnalysis.ts`) — детерминированно пишет managed-region регистр `epistemic-debt.md` (те же START/END-маркеры `<!-- arch-wiki:… -->`, что и `gap-analysis.md`; заметки вне региона сохраняются).
- `src/application/usecases/Waive.ts` + новая ledger-строка (по образцу `RecordRisk`, идемпотентно; CC-ED.5).
- `src/domain/services/ProjectConfig.ts` — `epistemic_debt_budget` (required-when-used, fail-fast throw как `taskPrefix`/`language`).
- `src/domain/services/LintRuleSet.ts` — правило `stale-evidence`.
- `templates/quality-attribute.md`, `templates/constraint.md` — optional `valid_until`; `schema/CLAUDE.md`.
- `valid_until: ISO-8601-date | null`; present-but-unparseable → `exit 2` (no silent default, принцип §5).

Регистр консолидирует уже вычисляемые, но разрозненные сигналы: `exists:false` (Trace.ts), `stale` issue (Trace.ts), `superseded-no-successor` / superseded-citations (LintRuleSet.ts) плюс carriers за `valid_until`. Агрегирует `ED_t(A) = Σ_i ED_t(evidence_i)` per driver; driver над budget помечается для понижения, которое читает правило `assurance-level`.

**Пример.**
```
raw/notes-2026.md несёт valid_until: 2026-01-01; на 2026-07-12 → ED=192d при budget 90.
epistemic-debt.md (managed region):
  - [[QA-007]] — evidence raw/notes-2026.md overdue 192d (budget 90) → downgrade L2→L1
  - [[QA-007]] — cites superseded ADR-0009 with no successor
$ arch-wiki waive-debt --id QA-007 --until 2026-09-01 --by @lead
  - [[QA-007]] — WAIVED until 2026-09-01 by @lead (auditable)
```

**Эффект.** Разрозненная бинарная staleness → один бюджетированный, аудируемый, детерминированный регистр; вскрывает тихий риск (B.3.4 anti-patterns) и движет планирование ре-валидации. В основном проводка сигналов, которые Core уже вычисляет, а не новое суждение.

Приоритет: P0 · Трудоёмкость: M (тяжелее из двух P0: новый usecase + ledger + config) · Риск: нет для mirror — `valid_until` optional-но-валидируется; publish уже исключает register-файлы и стрипает `## Sources`, debt не утекает в Confluence; регистр additive точно как `gap-analysis.md`.

### Типизированные verifiedBy/validatedBy в ## Sources с датой и хэшем carrier

**FPF-основание.** A.10 §4.2 (две нормативные связи `verifiedBy`/`validatedBy`), §4.3 + CC-A10.8 (carrier identity + currentness: carrier ref, date/relevance window, checksum, новый revision-id при обновлении). A.2.4 §4.6 (граница work/source/publication) + guard *status-display-as-authority*: carrier используется как evidence-use, а не как authority. Даёт Core типизированные датированные рёбра, на которые смогут опереться #1 (различить VA/LA) и #2 (старить отдельные carriers).

**Что менять.**
- `templates/quality-attribute.md` (line ~22), `templates/constraint.md` (line ~14) — заменить свободный `**Source:**` на A.10 evidence-provenance entry.
- `src/domain/services/WikilinkScanner.ts` или новый `SourcesParser` — детерминированно извлекать типизированные рёбра для `ComputeAssurance`/`UpdateEpistemicDebt`.
- `schema/CLAUDE.md` (Sources convention), `commands/ingest.md`.
- optional `verifiedBy:` (формальные carriers — spec, accepted ADR, proof) и `validatedBy:` (эмпирические — POC, measurement, delivered issue), каждый — список `carrier — date [— hash]`. Legacy `**Source:** raw/…` остаётся parseable (additive).

**Пример.**
```
Before:
## Sources
<!-- raw/<file> -->
**Source:** raw/notes-2026.md

After:
## Sources
**validatedBy:** raw/measurements/latency-run-2026.csv — 2026-05-01 — sha256:ab12…
**verifiedBy:** [[ADR-0012]] — 2026-06-01
```

**Эффект.** Core получает типизированные датированные рёбра, которых требует A.10: правило `assurance-level` различает VA и LA, а регистр стареет отдельные carriers, а не целые страницы. Enabler обоих P0 — при этом они деградируют gracefully на голое присутствие ссылки, если entry нет, так что жёсткой зависимости нет.

Приоритет: P1 · Трудоёмкость: M · Риск: нет для mirror — publish стрипает `## Sources` ДО контент-хэша и RU-маски (`RenderConfluencePayload.ts` §197-202), обогащение не влияет на проекцию и drift-стабильность; additive; `sync-templates` не перезаписывает hand-authored.

## 🔤 Лексикон, глоссарий и меж-контекстная тождественность (Unification Suite)

FPF трактует глоссарий не как плоскую таблицу «термин–определение», а как **Unified Term Sheet** (F.17): каждая строка публикует одно управляемое значение со ссылкой на управляющий паттерн (`DirectGoverningPatternRef`), с локальными смыслами, привязанными к bounded context, и с **явными мостами** (F.9 / A.6.9) для меж-контекстной «тождественности» — вместо того чтобы протаскивать её прилагательными («analogue of», «mirrors»). Сегодня в arch-wiki: `glossary.md` — авторский файл (в отличие от `risks.md` / `gap-analysis.md` / `kanban.md` / `utility-tree.md` его **не** генерирует CLI, команды `update-glossary` нет), покрытие проверяется «на глаз» LLM-линтером (`agents/architecture-linter.md`, шаг «Terminology drift»), а denylist перевода в зеркале забирает **каждый** `**bold**`-спан подряд. Ниже — стек из пяти изменений; четыре из них опираются на один переиспользуемый **детерминированный парсер строки глоссария** (Term-колонка → каноническое имя; wikilinks строки → управляющие ссылки; `Status:`-маркер), который стоит вынести в Core один раз (`src/domain/services/ConfluenceTree.ts` или соседний модуль) и дёргать из всех правил. Порядок внедрения — сверху вниз: P4 чинит denylist и разблокирует остальные.

### Проекция Term-колонки в preserveTerms (не каждый bold-span) — `preserveterms-from-term-sheet`

**FPF-основание.** F.17: защищаемое — это `UnifiedTechName` / `UnifiedPlainName` строки (SenseCell-label), а «extra aliases belong in the name-card, not as rival unified names in the row»; произвольное выделение внутри ячейки-определения именем **не** является. A.6.9 (multilingual caveat + AP-XCTX-15): сохранение английского ярлыка в RU — это `Naming-only` соответствие для настоящего термина, а не для случайного `**silo**`. F.13: задекларированные alias/deprecated-формы должны оставаться замаскированными, т.к. встречаются в старых страницах.

**Что менять.** Переписать `extractGlossaryTerms` в `src/domain/services/ConfluenceTree.ts` (сейчас `for (const m of glossaryMarkdown.matchAll(/\*\*(.+?)\*\*/g))` — берёт всё жирное). Парсить `glossary.md` как таблицу и брать **только первый bold-span в Term-колонке** как канонический защищаемый термин; опционально — скобочную аббревиатуру (`Real Money Gaming (RMG)` → и `Real Money Gaming`, и `RMG`); плюс собирать alias/deprecated-формы из `Status:` (P3). Выделение в ячейках Definition / Context / Bridge игнорируется. Чистая функция; golden-тесты фиксируют точный извлечённый набор для gt-глоссария. `src/application/usecases/RenderConfluencePayload.ts` (сборка denylist) и `commands/publish.md` — без структурных изменений, только следствие.

**Пример.**
```
Before: | **Multi-tenancy** | Tenant isolation model: **silo** … vs **pool** … |
  preserveTerms = ['Multi-tenancy','silo','pool', … 98 spans incl. 'brownfield base',
                   'Discontinued as a supported type ([[0049-…]], [[ITER-06]])']
After:  preserveTerms = ['Multi-tenancy']            // 'silo'/'pool' переводятся в RU
        | **Real Money Gaming (RMG)** | … |  →  ['Real Money Gaming','RMG']
```

**Эффект.** Устраняется живой дефект переизбыточной маскировки в RU-зеркале (английские обрывки и целые `[[ссылки]]`, застрявшие в русской прозе), denylist детерминированно привязывается к именам term-sheet (F.17), а любая будущая правка форматирования глоссария перестаёт быть угрозой зеркалу. Разблокирует P2/P3 (жирное в новых колонках больше не утекает).

Приоритет: P0 · Трудоёмкость: S · Риск: единственное изменение, которое **сдвинет** зеркало — ранее замаскированные `silo`/`pool`/… начнут переводиться, затронутые RU-страницы один раз перерисуются. Это улучшение корректности; защищено content-hash-идемпотентностью и destination-drift-guard (чистый разовый re-render, не тихий clobber). Golden-тесты делают diff ревьюабельным.

### Проверка покрытия глоссария в Core — `glossary-coverage-lint`

**FPF-основание.** F.17: term-row обязана нести `DirectGoverningPatternRef` (UTS-SCR-01) — строка-описание не становится авторитетом сама по себе. E.10.D2: Description-episteme (строка) должна ссылаться на управляющую страницу `EntityOfConcern`, а не подменять её. F.8: покрытие/переиспользование — предмет проверяемого решения, а не догадки. (Оговорка F.17:6 — «Do not create a row only because a word was noticed» — здесь снята тем, что arch-wiki `entity`/`concept`-страницы **уже** являются durable управляемыми значениями, и schema-инвариант «Add a term whenever a new entity/concept page is created; link entity pages here» их обязывает.)

**Что менять.** Два детерминированных правила в `src/domain/services/LintRuleSet.ts` (рядом с `superseded-no-successor`, поверх `GraphSnapshot`/`pagesOfKind`, без нового I/O). (1) `entity-without-glossary-term` (medium): для каждой страницы `pagesOfKind(g,['entity','concept'])` проверить, что её basename — цель какого-либо `[[wikilink]]` на странице `glossary` (дёшево: `glossaryPage.links`, case-insensitive по basename). (2) `glossary-term-without-source` (medium): для каждой строки таблицы (общий парсер строки) — в строке есть ≥1 `[[wikilink]]` на управляющую страницу; определение без source-of-truth-ссылки падает. Переформулировать `agents/architecture-linter.md` шаг 2 так, чтобы LLM **не** пересчитывал покрытие (теперь это Core-вердикт), а судил только настоящий семантический drift (синоним в прозе для уже определённого термина). Добавить имена правил в `schema/CLAUDE.md` §Deterministic lint и `commands/lint.md`.

**Пример.**
```
concepts/CONC-009-foo.md ингестирован, но ни одна строка glossary не ссылается на него:
  { rule:'entity-without-glossary-term', severity:'medium', file:'concepts/CONC-009-foo.md',
    message:'concept has no glossary term row (F.17: reusable governed value needs a term row)' }
| **Netcode** | prose with no link |  →
  { rule:'glossary-term-without-source', file:'glossary.md',
    message:'term "Netcode" cites no governing page (E.10.D2: term row must reference the EntityOfConcern that owns it)' }
```

**Эффект.** Покрытие терминологии переходит из LLM-eyeballing в воспроизводимый Core-вердикт, прямо форсируя существующий schema-инвариант; LLM-линтер освобождается для суждения, которое умеет только он (реальный synonym-drift). Правило (1) практически бесплатно (существующие `links`); правило (2) требует общего парсера строки (см. framing).

Приоритет: P0 · Трудоёмкость: M · Риск: зеркала не касается (render/publish не тронуты). Отправлять как `medium`, чтобы LLM-триаж мог понизить; матчить basename строки case-insensitive во избежание ложняков на существующих вики.

### Context-колонка + явные Bridge-строки + Core-детектор umbrella-предикатов — `uts-context-and-bridge-rows`

**FPF-основание.** A.6.9: предикаты «analogue of» / «mirrors» / «same as» — это umbrella cross-context sameness, требующая явного Bridge (direction / CL / loss / counter-example), а не прозы («mirrors» прямо в списке reuse-intent shorthands A.6.9:4.0; RU-эквиваленты — в multilingual caveat, что важно для зеркала). F.9: мост как единица меж-контекстного перевода. F.7: одно понятие через контексты — это Concept-Set-строка, суммирующая задекларированные мосты. F.17:9 Layout A (context-first) легитимизирует колонку Context.

**Что менять.** Аддитивно расширить контракт в `schema/CLAUDE.md` и целевом `glossary.md`: (1) необязательная колонка `Context` над малым контролируемым набором (`Operator / Gaming / Sweepstakes / RMG / Platform`). (2) Подраздел `## Bridges`, где каждая cross-context sameness — одна строка: `<term A>@<CtxA> ↔ <term B>@<CtxB> — scope: Naming-only, kind: ⋂ (или ⊑), dir, loss, counter-example` (обратите внимание: `Naming-only` — это **scope**, не kind; kind по умолчанию `⋂` per A.6.9). Всё авторское (LLM нарратор). (3) **Усиление к Core-first:** добавить в `LintRuleSet.ts` детерминированный candidate-block `cross-context-umbrella-in-glossary` (по образцу `gatherSupersededCitations`, advisory, не hard-finding): grep ячеек-определений на umbrella-токены A.6.9 без соседней ссылки на Bridge-строку → кандидат на суждение. Новые ячейки/лейблы — **не** жирным (см. риск).

**Пример.**
```
Before: | **Purchase** | … the sweepstakes analogue of the RMG deposit. See [[UC-003-deposit]] … |
  Core → { rule:'cross-context-umbrella-in-glossary', file:'glossary.md',
           message:'"analogue of" (A.6.9): needs an explicit Bridge, not adjective prose' }
After (## Bridges):
  Purchase@Sweepstakes ↔ Deposit@RMG — scope: Naming-only; kind: ⋂; dir Sweepstakes→RMG (didactic);
    loss: Purchase buys non-cash coins, no cash-in/withdrawal duality;
    counter-example: a Redemption is NOT the inverse of a Purchase (wagering x1 gates it).
```
Аналогично `Redemption@Sweepstakes ↔ Withdrawal@RMG` и `Balance@RMG` vs `Sweep`/`Bonus` balances.

**Эффект.** Скрытая «analogue-of»-проза превращается в аудируемые, locality-preserving мосты (F.9 / A.6.9); RU-зеркало и читатель перестают выводить тождество из общего слова, а ингестор получает место для фиксации cross-context loss вместо перезаписи смысла одного термина другим. Detector двигает часть работы в Core (context-pack §Prefer Core).

Приоритет: P1 · Трудоёмкость: M · Риск: **реальный, секвенировать после P4** — `extractGlossaryTerms` greps всё жирное, поэтому bold в новых Context/Bridge-ячейках утёк бы в RU-denylist (утечка уже есть: `**silo**`, `**pool**`, `**Withdrawable**`). Внедрять после P4 или держать новые поля не жирными. ID страниц, разрешение кросс-ссылок и content-hash не меняются.

### Status-маркер лексической непрерывности — `lexical-continuity-fields`

**FPF-основание.** F.13: пять типизированных continuity-отношений с двумя инвариантами, которых нет в arch-wiki — alias-parsimony (≤1 legacy alias на register) и non-retroactivity (старые ADR сохраняют своё написание; глоссарий лишь добавляет read-path). Ключевое уточнение: F.13:6.1 **различает** `renames`/`merges` (deprecate **с** преемником) и `retires` (изъятие **без** единственного преемника — легитимный исход, указывающий на Bridges/несколько контекстов). F.17/F.8: alias — meaning-preserving, ≤1 на register.

**Что менять.** В `schema/CLAUDE.md` — необязательный маркер строки: `Status: active` (по умолчанию) | `alias-of: <term>` | `deprecated → <successor term/page>` | `retired (see <ctx/rows>)`. Зафиксировать инварианты F.13 (deprecated-термины остаются read-path — не вычищать старые ADR; ≤1 alias). В `src/domain/services/LintRuleSet.ts` — одно правило `deprecated-term-without-successor` (medium, зеркалит `superseded-no-successor`): строка `deprecated → …` **обязана** назвать преемника; строка `retired` — **освобождена** (нужен pointer-note, а не единственный преемник) — иначе Core ошибочно ловил бы легитимный F.13 `retires`. Alias/deprecated-формы подхватываются P4 в denylist (встречаются в старых UC-страницах), но помечаются, а не молча теряются.

**Пример.**
```
RMG row before: | … **Discontinued as a supported type** ([[0049-…]], [[ITER-06]]) — retained as brownfield base … |
after:          Status: deprecated → Sweepstakes ([[0049-discontinue-real-money-as-supported-type]])   // Core: ok
alias:          'Withdrawable'  →  Status: alias-of: Redemption-Eligible Balance   // вместо голого «a.k.a.»
retire:         Status: retired (see [[F9-bridges]])   // без стрелки — Core НЕ падает (F.13 retires)
| **X** | Status: deprecated |  →  { rule:'deprecated-term-without-successor', file:'glossary.md',
                                     message:'deprecated term "X" names no successor (F.13 retires needs a pointer note or use retired)' }
```

**Эффект.** История rename/retire становится first-class и проверяемой (F.13 continuity + non-retroactivity), предотвращая тихую перемаркировку, которая портит provenance ADR; переиспользует проверенный паттерн `superseded-no-successor`. Основная ценность — schema-поле `Status`, фиксирующее уже существующую прозу; Core-правило — тонкий бонус.

Приоритет: P2 · Трудоёмкость: S (парсер строки общий с P1/P4) · Риск: тот же bold-leak — держать маркер не жирным или внедрять после P4. Правило срабатывает только на opt-in строках `deprecated →`, поэтому на существующих вики findings нет до принятия. Рендер зеркала не затронут.

### Mint-or-Reuse при ingest + детектор near-duplicate — `mint-or-reuse-ingest-gate`

**FPF-основание.** F.8 (minting-bias, F.8:8.0): перед минтингом durable-имени — восстановить kind, попытаться local reuse → alias → reuse существующей Concept-Set-строки → и лишь затем mint. F.7/F.13-A9: дублирующие строки «by style». Корпус gt уже показывает симптомы: `Redemption-Eligible Balance` vs `Withdrawable`, `AMOE` vs `Award Promotional Currencies`. Ни `commands/ingest.md`, ни `agents/architecture-ingestor.md` этот гейт не запускают.

**Что менять.** (1) F.8-чеклист в `agents/architecture-ingestor.md` (и релевантных `skills/*/SKILL.md`): для каждого кандидата-термина восстановить kind/governing page, проверить reuse существующей строки/entity → wording-вариант (alias → P3) → cross-context sibling (Bridge → P2) до создания новой строки. (2) Детерминированный candidate-block `glossary-near-duplicate` в `LintRuleSet.ts`, переиспользующий существующий `src/domain/services/Levenshtein.ts`: пары имён Term-колонки в edit-distance ≤2 **или** где одно — подстрока другого. Emit как candidate-block (как `supersededCitations`), не hard-finding — судит LLM.

**Пример.**
```
'ChallengeTake' vs 'Challenge Take' (distance 1)  → Levenshtein-правило
'Balance' ⊂ 'Sweep Balance' / 'Bonus Balance'     → substring-правило
  → { pair, message:'possible alias/merge — apply F.8 mint-or-reuse (reuse/alias) before a second row' }
```
(Честная граница: семантические синонимы вроде `Coin Package` vs `ShopItem` детектор **не** ловит — у них нет ни малого edit-distance, ни подстроки; это неизбежно работа LLM-чеклиста, а не Core.)

**Эффект.** F.8-гейт встаёт между «заметили слово» и «завели термин», сдерживая раздувание глоссария и дубли-by-style (F.13 A9). Основная ценность — методологический чеклист (F.8); Core-детектор ловит лишь лексически близкие дубли, но детерминирован и бесплатно переиспользует Levenshtein.

Приоритет: P2 · Трудоёмкость: M · Риск: зеркала не касается. Candidate-block advisory (без авто-правок, human-gated), как `supersededCitations`; over-eager Levenshtein-пары отсеивает LLM-триаж, не Core.

## 📐 Атрибуты качества как структурированные quality-bundles

FPF требует, чтобы каждое измеримое утверждение о качестве было читаемым только внутри своего базиса измерения: **одна Characteristic — одна Scale — Coordinate — Unit — Polarity — Evidence** (A.18/C.16), а составные «-ility» (reliability, security, resilience) публиковались как **Q-Bundle**, а не сворачивались в один скаляр (C.25/C.16.Q). Сегодня `templates/quality-attribute.md` сворачивает всё testable-утверждение в одну свободную строку `- **Measure:**`, а вердикт «Measure is testable» выносит на глаз LLM. Тема переносит структуру и проверки качества в детерминированное Ядро.

### CSLC / Q-Bundle блок вместо свободной строки Measure

**FPF-основание.** `A.18` (CSLC: ровно одна Characteristic на одну Scale; A.18:7 #2 polarity, #3 unit, #5 «no bare numbers»), `C.16` (U.Measure = Coordinate на объявленной Scale; A-5 multi-characteristic stuffing), `C.25` (Q-Bundle shape `<Name, QualityBearer, ClaimScope?, Measures[CHR], QualificationWindow?, Mechanisms?, Status?, Evidence?>`), `C.16.Q:4.6` (-ility становится admissible только как Characteristic или Bundle). ADD-6-part отображается на Q-Bundle: Artifact=QualityBearer, Source/Stimulus/Environment=ClaimScope, Response=Mechanisms/Status, Measure=Measures[CHR]+QualificationWindow.

**Что менять.** В `templates/quality-attribute.md` под `- **Measure:**` добавить таблицу «одна строка на Characteristic» с колонками `Characteristic | Scale | Polarity | Target | Current | Window`. `Polarity` — фиксированный enum `{higher-is-better, lower-is-better, target-is-best}` (A.18:7 #2). Составные claim'ы расщепляются на строки (QA-001 → `ResponseTime-p95`, `ResponseTime-p99`, `TimeoutErrorRate`). Те же поля — в промпт `templates/payloads/questionnaire-qaw.md`; документировать блок в `schema/CLAUDE.md` §10 и `skills/add-method/SKILL.md`. Чисто аддитивно: legacy free-text Measure ещё парсится, блок — предпочтительная форма. Метки `Characteristic/Scale/Polarity/Target/Current/Window` внести в English-structural-label set (`schema/CLAUDE.md:203`), рядом с 6-part-метками, чтобы RU-нейтрализатор их не переводил.

**Пример.**
```text
Before (QA-001):
| **Measure** | 95th percentile response time < 200ms; 99th percentile < 500ms; zero timeout errors under normal load |

After:
| Characteristic     | Scale             | Polarity                 | Target | Current      | Window                                |
|--------------------|-------------------|--------------------------|--------|--------------|---------------------------------------|
| ResponseTime (p95) | ratio, ms         | lower-is-better          | ≤ 200  | (unmeasured) | rolling 5-min, per-cluster, peak load |
| ResponseTime (p99) | ratio, ms         | lower-is-better          | ≤ 500  | —            | rolling 5-min, per-cluster, peak load |
| TimeoutErrorRate   | ratio, errors/req | target-is-best, target 0 | 0      | —            | normal load                           |
```

**Эффект.** Каждый Measure становится интерпретируемым и сравнимым по A.18 и машинно-парсимым — это предусловие для детерминированных проверок из остальных пунктов темы. Расщепление bundle'ов убирает scale-ошибки типа «twice-as-hot» (C.16:6) и даёт utility-tree/gap-analysis ссылаться на реальную Coordinate, а не на предложение.

Приоритет: P0 · Трудоёмкость: M · Риск: низкий — фундамент темы; аддитивно, старые QA-страницы сохраняют free-text Measure до переавторинга; единственный mirror-эффект — расширение English-label-set (при пропуске метки лишь косметически переведутся в проекции, не ломая контент-хеш).

### Детерминированный lint well-formedness Measure в Ядре

**FPF-основание.** `A.18:7` (#2 polarity, #3 unit, #5 no bare numbers) и `C.16` (CC-MCHR-1 CSLC-binding, CC-MCHR-2 polarity declared, R-MT-3 polarity-enum, R-ME-1 «value valid for the scale»). Это набор thought-level acceptance-проверок, механически проверяемых, как только блок из предыдущего пункта даёт структуру — то есть прямой перенос «is the Measure testable?» из глаза LLM в вердикт Ядра (deterministic-Core-first).

**Что менять.** Новое правило `qa-measure-illformed` в `runLint()` (`src/domain/services/LintRuleSet.ts`), срабатывающее только при `kind==='quality-attribute'`. Парсит таблицу Measure и по каждой строке проверяет: (a) ровно один Characteristic-токен; (b) Scale с Unit, когда Target числовой (A.18 #3, R-UN-1); (c) Polarity из фиксированного enum (fail-fast на любом другом значении, R-MT-3); (d) Target type-valid для Scale (нет категории там, где нужно число, и наоборот, R-ME-1). Severity `medium`, сообщения цитируют клаузу A.18/C.16. Ввести опциональный флаг `checks.qaMeasure: true` в `src/domain/model/ProjectConfigSchema.ts` (fail-fast: при включённом флаге и отсутствии блока — `qa-measure-missing-block`, не тихий default). Переиспользовать существующий `baselineKey()` для baseline legacy-Measure. Задокументировать в `schema/CLAUDE.md`.

**Пример.**
```text
| Throughput | ratio | higher-is-better | 5000 | ... |   (нет Unit)
→ qa-measure-illformed: Characteristic "Throughput" declares a numeric target 5000
  with no Unit on its ratio Scale (A.18 #3)

Polarity: more
→ qa-measure-illformed: polarity "more" not in {higher-is-better,lower-is-better,target-is-best} (C.16 R-MT-3)
```

**Эффект.** Самый частый LLM-вердикт («тестируем ли Measure?») становится воспроизводимым вердиктом Ядра; каждый finding учит, цитируя клаузу. Config-gated + baseline-suppressible ⇒ приземляется без flag-day.

Приоритет: P0 · Трудоёмкость: M · Риск: низкий — зависит от структуры блока (пункт 1); нет влияния на mirror (lint pre-publish, English-only); шум на legacy free-text Measure гасится флагом `checks.qaMeasure` и baseline.

### Детерминированная проверка временного окна для rate/percentile-мер

**FPF-основание.** Нормативный якорь — `C.16` R-ME-4 (каждый Measure SHALL нести **time stance**) и `C.25` QualificationWindow (для availability/resilience/security окно load-bearing, C.25:14.3, C.25:15). `C.27.TA` даёт словарь слота (`validityOrCurrentnessCondition`, CC-C27TA-4). *Уточнение к исходной формулировке:* сравнимость (R-CMP-1) в C.16 определяется тождеством template, а не окна напрямую, — нормативная обязанность окна идёт от R-ME-4/QualificationWindow, поэтому цитату на R-CMP-1 понижаем до пояснительной.

**Что менять.** Правило `qa-measure-missing-window` (`src/domain/services/LintRuleSet.ts`, тот же gate `checks.qaMeasure`): если значение/токен строки матчит window-несущий паттерн — percentile (`p\d{2,3}`, `95th`), ratio/uptime (`%`, `uptime`, `availability`), throughput (`/s`, `rps`), restoration timing (`MTTR`, `RTO`, `RPO`) — поле `Window` SHALL быть непустым, иначе `medium`. Точечные цели (`RPO/RTO = 0`, single-shot latency) исключены (вырожденное окно). Колонка `Window` общая с пунктом 1; строка-документация в `schema/CLAUDE.md` §10.

**Пример.**
```text
| Availability | ratio, % | higher-is-better | ≥ 99.95 | — | (missing) |
→ qa-measure-missing-window: Availability target 99.95% has no observation window
  (C.16 R-ME-4 / C.25 QualificationWindow); e.g. 'rolling 30-day, per-cluster'

| RPO | ratio, seconds | target-is-best, target 0 | 0 | — | n/a |   → silent (point target)
```

**Эффект.** Неоднозначные SLA превращаются в сравнимые auditable-показания; ловит частый дефект — percentile/uptime-цель с подразумеваемым, но не объявленным окном. Высокий рычаг на регулируемой gambling-платформе, где «99.95% за год» ≠ «за месяц».

Приоритет: P1 · Трудоёмкость: S · Риск: низкий — расширение того же qaMeasure-семейства правил; список rate-токенов — маленькая аддитивная константа, false-positives низкой severity и baselineable; mirror не затрагивается.

### Utility-tree как Evaluation CharacteristicSpace с детерминированным ScoringMethod

**FPF-основание.** `A.19.ECS` (конструкция evaluation-CharacteristicSpace для object-kind «the architecture», use-scope «design prioritisation»: CharacteristicSlotSet, ScaleBindingSet, PolarityAndPreferredMovement, ProtectedTradeoffSet, StopOrReopenCondition). Отображение `(Business,Architectural)→Priority` — это ScoringMethod 𝒢 над 2-характеристичным ординальным пространством; `A.18:7 #6` и `C.16` R-G𝒢-1 требуют, чтобы такая 𝒢 была **объявленной, монотонной, с ограниченным codomain**. Это и есть санкционированное исключение к запрету скаляризации (A.19.ECS CC-A19ECS-7: скаляризация допустима только когда governing pattern явно объявляет операцию).

**Что менять.** (1) `src/application/usecases/UpdateUtilityTree.ts`: `UpdateUtilityTreeInput` принимает ординальные координаты `business` и `architectural` (enum `H|M|L`) вместо/наряду со свободным `priority`; Priority вычисляется детерминированной монотонной таблицей 𝒢:`{H,M,L}²→{Critical,High,Medium,Low}`, принадлежащей Ядру (LLM даёт координаты — Ядро выносит вердикт). Хранить все три колонки; keyed-row idempotency на `[[id]]` без изменений; fail-fast при одной из двух координат (без default). (2) Заголовок utility-tree получает A.19.ECS-scaffold: object-kind, use-scope, две характеристики с ординальными шкалами и polarity (higher=more-critical), заметка `protected trade-offs` и stop condition. Легенда 𝒢 в concept-странице регенерируется из таблицы Ядра, не пишется руками (follow-up для RU-mirror).

**Пример.**
```text
Before: update-utility-tree --from QA-001 --scenario '...' --priority '(H,H)'
        | [[QA-001]] | ... | (H,H) |         (+ человек вписал 'Critical' в concept)

After:  update-utility-tree --from QA-001 --business H --architectural H
        → Core computes Priority=Critical
        | [[QA-001]] | Performance/ResponseTime | H | H | Critical |
        --business H --architectural L  → deterministically High (never Critical)
Header: Evaluated object: the architecture · Use: design prioritisation ·
        Characteristics: BusinessImpact {H>M>L, higher=more-critical} × ArchitecturalImpact {H>M>L} ·
        ScoringMethod owned by CLI (monotone)
```

**Эффект.** Убирает реальный eyeballed scoring-шаг и его класс дрейфа (`(H,L)→Critical` становится невозможным); priority-колонка воспроизводима и монотонна (A.18 #6). Рамка A.19.ECS даёт дом для protected trade-offs (CC-A19ECS-6, напр. «оптимизация Performance не должна регрессировать Security») и stop condition, чего плоская таблица не выражала.

Приоритет: P1 · Трудоёмкость: M · Риск: умеренный — utility-tree CLI-owned, не редактируется руками, смена колонок безопасна; legacy 3-колоночный файл мигрируется через adopt/migrate (idempotent, трогает только регистр); прозаическую 𝒢-легенду mirror регенерировать из Ядра, не держать руками.

### Классификация endpoint «-ility» — single-Characteristic vs Q-Bundle на этапе scaffold

**FPF-основание.** `C.16.Q:4.6` (в engineering-контексте `-ility` — quality-family label, а не автоматически Characteristic; становится admissible как один Characteristic или Bundle) и `C.25` (:13 decision-test «что сделало бы claim ложным?»; :15 — resilience почти никогда не скаляр: MTTR+RTO+RPO+scenario-scope; security: patch-latency+control-coverage+cert-state; :8 anti-pattern «one-number -ility»). *Уточнение:* C.25:13.3 явно легитимирует узкий single-characteristic slice составного семейства — поэтому Core-правило держим advisory.

**Что менять.** Шаг классификации в `skills/add-method/SKILL.md` и `commands/driver.md`: при scaffold `qa` определить, семейство — (a) один admissible Characteristic или (b) Q-Bundle (несколько Measures[CHR] + scope + Mechanisms/QualificationWindow); для (b) записать несколько Measure-строк (таблица пункта 1 это уже поддерживает) плюс Mechanisms/Status из Response. Config-список `compositeQualityFamilies` (default: reliability, resilience, security, availability, maintainability, evolvability — C.25:15) в `src/domain/model/ProjectConfigSchema.ts`. Мягкое Core-правило `qa-composite-single-measure` (severity **low**, opt-in) в `LintRuleSet.ts`: QA с Quality Attribute из этого множества и ровно одной Measure-строкой — совет, не блок.

**Пример.**
```text
QA-004 Disaster Recovery, family=Reliability(composite), одна мера `ZERO RPO`
→ Q-Bundle: rows {RPO=0 (seconds), RTO≤X (minutes), RestoreDrillPassRate},
  Mechanisms: [[0003-secrets-management]], Window: per-instance
Soft rule on the single-row version:
→ qa-composite-single-measure (low): Reliability is a C.25 composite family but QA-004
  declares one measure — decompose, or state the single-characteristic slice explicitly (C.25:13.3)
```

**Эффект.** Предотвращает анти-паттерн «one-number -ility» (C.25:8) на этапе авторинга именно для тех семейств, что gt over-collapse'ит, и даёт Security/Reliability QA структуру bundle, которой требуют их truth-conditions. Классификация заодно разрешает bearer-lane C.16.Q (system-side EngineeringQualityFamily vs description-side) до затвердевания метки.

Приоритет: P2 · Трудоёмкость: M · Риск: почти нулевой — в основном LLM-guidance + low-severity opt-in правило; список семейств — config (agnostic, overridable), не хардкод; mirror не затрагивается. Честная оговорка: пометит несколько существующих gt Reliability/Security QA как low-findings — держим low и baselineable (советует, не блокирует), т.к. C.25:13.3 допускает узкий slice.

### Evidence-якорь для каждого Measure через существующую minWikilinks-машину

**FPF-основание.** `C.16` §7 / R-ME-3 / R-EV-1 / CC-MCHR-5: Measure, чей template требует grounds, несёт **EvidenceStub** — концептуальный указатель на test/monitor/benchmark-основания (R-EV-1 минимальная достаточность = type-of-ground + identifier, что и даёт wikilink). Без него p95<200ms — «number-as-fact» (C.16:9 bias-таблица) без auditable-цепочки. *Оговорка:* R-ME-3 условно («where the template requires it»), поэтому это advisory-подсказка, а не жёсткий gate.

**Что менять.** Секция `## Evidence` в `templates/quality-attribute.md`: один-несколько `[[wikilink]]` на верифицирующий артефакт (test-концепт, monitoring/dashboard-сущность, benchmark, или ADR, реализующий tactic). Требование — через уже существующую детерминированную машину: запись `RequiredSection` для kind `quality-attribute` в `schema/CLAUDE.md` / `src/domain/model/ProjectConfigSchema.ts` c `marker: 'Evidence'`, `minWikilinks: 1`, `severity: low`. Нового кода в Ядре нет — правила `missing-required-section` и `required-section-underlinked` (`LintRuleSet.ts:166-193`) уже проверяют presence + link count.

**Пример.**
```text
## Evidence
- Load test: [[concept-load-test-gaming-core]]
- Dashboard:  [[grafana-api-latency]]

Пропуск → missing-required-section (low): quality-attribute page is missing required section "Evidence"
Пустой заголовок → required-section-underlinked (low)
```

**Эффект.** Закрывает C.16 auditable-chain gap (bearer→Characteristic→grounds) для QA-мер машиной, которая уже существует; цена — строка шаблона + строка config. Превращает меры из свободных чисел в показания с прослеживаемым warrant и питает reverse-trace `**Realized by:**`, который mirror уже строит.

Приоритет: P2 · Трудоёмкость: S · Риск: очень низкий — переиспользует боевые required-section-правила, новых путей кода нет; аддитивно (severity low ⇒ advisory-findings, baselineable); `## Evidence` — обычная секция; при желании держать её English добавить marker в structural-label-set рядом с 6-part-метками, иначе переводится как любой heading (безвредно в проекции).

## 🔄 Процесс проектирования как канонические циклы рассуждения и эволюции

FPF даёт проектированию два вложенных канонических цикла: внутренний **Canonical Reasoning Cycle** (B.5: Абдукция→Дедукция→Индукция поверх машины состояний B.5.1 Explore→Shape→Evidence→Operate) и внешний **Canonical Evolution Loop** (B.4: Operate→Observe→Refine→Deploy). Сегодня arch-wiki реализует пайплайн `hypothesis → questionnaire → ingest → render-issue → trace` как плоскую процедуру: гипотеза входит в граф без зафиксированной проблемной стороны и без критерия опровержения, итерация фиксирует `Drivers Impact` без наблюдённого основания, а человеческий гейт публикации не отделяет «шаг внутренне валиден» от «человек одобрил переход». Ниже — предложения, привязывающие каждую фазу к проверяемому правилу, с предпочтением детерминированного Core там, где FPF даёт checkable-инвариант.

### ProblemCard для `/hypothesis` до выбора метода/драйвера

**FPF-основание.** `C.22.2` (ProblemCard@Context, Thin-форма) прямо задаёт пять полей полноты: (1) почему сигнал важен сейчас, (2) какая проблемная репрезентация под каким контекстом/scope, (3) почему это не просто wish/ticket/slogan/preselected-work, (4) что считать улучшением / acceptance probe, (5) честный next use — это и есть анти-паттерн «problem remains a paragraph», который пattern существует чтобы предотвратить. `B.5.2:12.1` даёт типизацию prompt-вида (`AnomalyStatement`/`ProblemCuePrompt`/`OpportunityCuePrompt`/`ProbeCuePrompt`); `C.22` — родительская проблемная типизация.

**Что менять.** (Core, детерминированно) В `src/application/usecases/ScaffoldHypothesis.ts` вместо generic `concept`-шаблона эмитить выделенный hypothesis-скелет с заголовками `## Prompt` / `## Scope cut` / `## Why not just a wish` / `## Acceptance probe` / `## Next use` (+ сохранить `## Sources`). Зарегистрировать этот набор как required-section, **но**: `LintRuleSet.ts:13` (`requiredSections: ReadonlyMap<ArtifactKind, …>`) ключуется по `ArtifactKind` (`concept`), а не по `status` — гипотезы это `type: concept`, поэтому чистое переиспользование `missing-required-section` пометит **все** concept-страницы. Нужно либо (a) расширить `requiredSections` до status-aware ключа, либо (b) выделить hypothesis в отдельный `ArtifactKind`. (Command) Переписать `commands/hypothesis.md` шаг 5 — заполнять ровно эти пять полей на английском (English-canon). (Schema) Документировать ProblemCard в `schema/CLAUDE.md` как обязательную форму `status: hypothesis`. Правило отсутствия (`C.22.2:2.5`): неиспользуемое поле опускается, никогда не пишется `unknown`.

**Пример.**
```
Before: hypothesis-token-refresh.md
--- status: hypothesis / source: raw/security-brief.md / realizes_driver: [QA-007] ---
# Token refresh
## Sources                       ← пусто

After (та же frontmatter, тело):
## Prompt
ProbeCuePrompt: sessions silently drop at ~1h in the evening window; current
design assumes fixed 60-min access tokens with no refresh — why are users logged out despite activity?
## Scope cut
In: access/refresh token lifetimes for the web SPA. Out: mobile, SSO federation.
## Why not just a wish
Not "add refresh tokens" (a solution); the reviewable problem is the session-continuity gap under QA-007 + CON-003 (stateless backend).
## Acceptance probe
Refuted if p95 forced re-auths within an 8h active session > 0; validated if = 0 with no server-side session store.
## Next use
P2W-ready → ingest to draft ADR + link QA-007.
```

**Эффект.** Каждая гипотеза несёт аудируемый проблемный фрейм до выбора метода/драйвера (C.22.2 «остановись до выбора метода»). Ingest и авторинг issue наследуют реальный acceptance probe вместо выдуманного. Пять заголовков проверяются существующей машинерией required-section (после status-scoping), т.е. дисциплина — детерминированный вердикт, а не глазами LLM.

Приоритет: P0 · Трудоёмкость: M · Риск: низкий/аддитивный; единственная тонкость — status-vs-kind scoping правила и ретро-флаг старых hypothesis-страниц (гейтить на новосозданных или выдавать `medium`, не hard exit-2). `raw/…` внутри `## Prompt` уже RENAME-ится `humanizeRepoRef` → зеркало не затрагивается.

### Гейт абдуктивной рефутации: критерий опровержения + названный соперник до промоушена

**FPF-основание.** `B.5.2` держит абдукцию аудируемой через `CC-B.5.2-2` (записать хотя бы одного соперника), `CC-B.5.2-3` (≥2 явных фильтра правдоподобия) и `CC-B.5.2-6` (гипотеза, не открывающая ни одной downstream deduction/probe/evidence-связи, НЕ конформна). `B.5` даёт первичность абдукции с обязательным L0. Анти-паттерны `B.5.2:8` «Authority candidate» и «Untestable grand conjecture» — ровно то, что предотвращается. Совпадает с принципом fail-fast-no-defaults: гипотеза без критерия опровержения должна fail-stop, а не молча промоутиться.

**Что менять.** (Core) Добавить в `src/domain/services/LintRuleSet.ts` два правила, scoped на `status: hypothesis`: `hypothesis-unfalsifiable` (секция `## Acceptance probe` из предложения 1 пуста или без refute-клаузы — Core проверяет **наличие** текста/пункта, качество критерия остаётся LLM-линтеру) и `hypothesis-no-rivals` (medium: нет строки `## Alternatives considered` с ≥1 отклонённым кандидатом; при желании покрыть и `CC-B.5.2-3` — ≥2 фильтра). (Command) В `commands/ingest.md` перед scaffold драйвера/ADR из гипотезы требовать чистый `arch-wiki lint --json` по `hypothesis-unfalsifiable`; при срабатывании — fail-stop, зеркалируя существующий exit-2 гейт `validate-graph`.

**Пример.**
```
arch-wiki lint --json (пустой ## Acceptance probe):
{ "rule": "hypothesis-unfalsifiable", "severity": "high",
  "file": "concepts/hypothesis-token-refresh.md",
  "message": "status:hypothesis has no refutation criterion (Acceptance probe empty) — cannot promote (CC-B.5.2-6)" }

ingest: "STOP: token-refresh hypothesis is unfalsifiable; add an Acceptance probe
(what would validate/refute) before I draft ADR-0012."
После добавления "Refuted if p95 forced re-auths > 0" — lint чист, ingest продолжает.
```

**Эффект.** Превращает конформанс-чеклист B.5.2 в Core-вердикт ровно на границе промоушена; неопровержимые конъектуры не компаундируются в граф. Комплементарно предложению 1 (оно поставляет секцию, которую читает правило).

Приоритет: P0 · Трудоёмкость: M · Риск: низкий; два аддитивных правила по frontmatter-status, который несут только hypothesis-страницы; зеркала не касается (lint по английскому графу). Блокирующим (`high`) делать только ingest-гейт; standalone lint-находку держать non-fatal, чтобы не ломать существующие вики. Зависит от предложения 1 (`## Acceptance probe`); при отдельной поставке — ключевать по любому refute/validate-cue в теле.

### Назвать стадии цикла в терминах FPF и сделать зрелость явной

**FPF-основание.** `B.5.1` требует State Explicitness (`CC-B5.1.1`: каждый state-bearing episteme помечен фазой) и Sequential Progression (`CC-B5.1.2`: не перескакивать Shape). `B.5`/`B.5.2` дают соответствие фаз: Abduction↔Explore, Deduction↔Shape, Induction↔Evidence. Сегодня `status:` используется ad hoc без документированной лестницы и без связи с циклом рассуждения.

**Что менять.** (Skill) В `skills/add-method/SKILL.md` — таблица соответствия шагов пайплайна фазам FPF **без введения новых значений status** (это ключевое отличие от исходной версии): `shaped`/`evidenced` конфликтовали бы с MADR-каноном, зашитым в `ArtifactType.ts`/`ConfluenceTree.ts`. Маппить **существующие** статусы: `hypothesis` = Abduction/Explore (L0); `proposed` ADR = Deduction/Shape; `accepted` после `trace`/`realized_by` = Induction→Operate (фаза Evidence несётся trace-связью, а не отдельным статусом). (Schema) В `schema/CLAUDE.md` зафиксировать инвариант `CC-B5.1.2`: ADR НЕ должен становиться `accepted` напрямую из `hypothesis` — обязателен промежуточный `proposed` (shaped), выводящий тестируемые следствия.

**Пример.**
```
| Pipeline step                          | FPF phase (B.5/B.5.1)         | Existing status  |
| /hypothesis                            | Abduction / Exploration       | status: hypothesis (L0) |
| /ingest → driver + ADR                 | Deduction / Shaping           | status: proposed |
| /render-issue + build + /trace         | Induction / Evidence→Operate  | status: accepted |
Schema note: "ADR-0012 SHALL NOT be `accepted` directly from a `hypothesis`;
a `proposed` intermediate deriving its testable consequences is required (CC-B5.1.2)."
```

**Эффект.** Общий FPF-словарь для всего процесса и checkable-лестница зрелости на существующих статусах; gap-analysis сможет отчитываться, какой драйвер сдвинул какую фазу. Готовит будущее Core-правило «no Explore→Operate skip» без изобретения машинерии сейчас. Координировать правки `SKILL.md` с предложением 5 (одна таблица аннотаций на обе оси: внутренний B.5 и внешний B.4).

Приоритет: P1 · Трудоёмкость: S · Риск: низкий (в основном документация). После отказа от новых статусов Core-код не трогается; проверить, что ни одно lint-правило не перечисляет status исчерпывающе. Зеркала не касается (frontmatter не публикуется).

### Замкнуть ADD-итерацию как Evolution Loop: Observe-триггер и Transformer

**FPF-основание.** ADD-итерация — это `B.4` Canonical Evolution Loop (Operate→Observe→Refine→Deploy). `CC-B4.1` (Loop Integrity: любое изменение стартует с документированного Observe), `CC-B4.3` (Transformer Mandate: назвать внешнего агента, выполнившего observe/refine). `templates/iteration.md` (проверено) фиксирует сторону Refine (`## Drivers Impact`, `## Decisions Made`), но опускает Observe и Transformer — это анти-паттерн `B.4:8` «Immaculate Conception» (изменение «просто появляется» без записи проблемы, которую оно решило). `B.5.2` — вторично: замкнутый Observe питает следующий абдуктивный цикл.

**Что менять.** (Template) Добавить в `templates/iteration.md` две аддитивные секции ПЕРЕД Drivers Impact: `## Observation / Trigger` (аномалия/возможность/фидбек/сигнал gap-analysis, открывший итерацию; может ссылаться на строку `risks.md`, гипотезу или пробитый QA-сценарий) и `## Transformer` (кто/что выполнил refine — SA, review, инцидент). (Command) Обновить `commands/iteration.md` — запрашивать эти поля. (Skill) В `skills/add-method/SKILL.md` переразметить 7-шаговый цикл против Operate→Observe→Refine→Deploy и зафиксировать `CC-B4.1`: итерация с пустым Observation — процессное нарушение.

**Пример.**
```
ITER-02 сейчас: только  ## Drivers Impact | QA-007 | partial | complete |

После:
## Observation / Trigger
Evening session-drop anomaly ([[risks#^R-004|R-004]]) surfaced by pull-stories feedback;
QA-007 usability scenario measure was breached.
## Transformer
SA (design review 2026-07-10), refining the design-time ADR set (not a run-time hotfix).
## Drivers Impact
| QA-007 | partial | complete |   ← теперь трассируется к наблюдению выше
```

**Эффект.** Каждая итерация становится полным аудируемым проходом цикла эволюции; gap-analysis отвечает «почему драйвер сдвинулся», а замкнутый Observe питает следующий абдуктивный цикл реальным evidence-основанием.

Приоритет: P1 · Трудоёмкость: S · Риск: низкий, но учесть governance шаблонов: templates синкаются one-way, «never overwrite curated templates» — поставлять через `arch-wiki sync-templates` drift-report (не `--force`), секции аддитивны к скелету. `risks.md`/`raw/` внутри `## Observation` уже RENAME-ится `humanizeRepoRef`; frontmatter не меняется.

### Эйлеров гейт: CV.Status перед GateFit на публикации и создании issue

**FPF-основание.** `A.20` (Flow Constraint Validity, Eulerian) задаёт точную дисциплину: Constraint Validity привязана к каждому шагу трансформации и оценивается ДО любого GateFit, с активационным предикатом **CV⇒GF** — пока `CV.Status != pass`, гейт воздерживается (`abstain`). `CV.Status ∈ {abstain, pass, degrade, block}`. Анти-Goodhart-guard A.20: «зелёный preflight — не одобрение». Человеческий гейт arch-wiki (create/update/DELETE approval) — ровно такой гейт над `E.18`-переходом (repo→Confluence, English→RU). Сегодня preflight (`lint --severity high`, `data.warnings` STOP, human gate) — рассыпанная проза в `commands/publish.md`, а не именованный машинный контракт; ничто структурно не мешает LLM показать гейт при блокирующем провале.

**Что менять.** Фазировать (снижает риск для самого инвестированного mirror-пути до нуля на фазе 1). **Фаза 1 (команды, без изменения Core-shape):** переписать гейт-шаги в `publish.md`, `render-issue.md`, `issue.md` так, чтобы человеческий гейт предлагался ТОЛЬКО когда аггрегатный `CV.Status == pass` (LLM вычисляет его из уже выдаваемых Core-полей: наличие numeric `spaceId`/`cloudId`, отсутствие broken cross-link, отсутствие repo-ref-leak, наличие content-hash, для issue — resolvable trace-links); на `block` — fail-stop с печатью `cvWitness`; на `degrade` (orphan-delete) — отдельное подтверждение. Формулировка: «CV before GF — внутренняя валидность шага не есть проход гейта». **Фаза 2 (Core, позже, отдельный приоритет):** `render-confluence`/`render-issue` эмитят `cvStatus` + `cvWitness[]` как новые **опциональные** поля, строго аддитивно (сохранить все поля, exit-коды, 2-pass; CV читает план, не переписывает тело зеркала).

**Пример.**
```
render-confluence (per page):
{ "source": "adrs/0011-keycloak.md", "cvStatus": "block",
  "cvWitness": ["spaceId-present:block(numeric spaceId missing)",
                "no-broken-crosslink:pass", "no-repo-ref-leak:pass"] }
Команда: "CV=block — GateFit abstains (A.20 CV=>GF). Cannot present the publish gate:
getConfluenceSpaces(keys:['SD']) and set integrations.confluence.spaceId, then re-run."
Только когда каждая страница pass — SA видит список create/update/DELETE approval.
```

**Эффект.** Поднимает рассыпанный preflight до единого именованного детерминированного контракта, который структурно нельзя обойти, кодируя pipeline-order-инвариант фикса v0.8.3. Разделяет «шаг внутренне валиден» (Core) и «человек одобрил переход» (gate) — ровно CV/GF-разделение A.20, оно же принципы deterministic-Core-first + human-gated в терминах FPF.

Приоритет: P1 (фаза 1, команды) · Трудоёмкость: L (фаза 2 Core — отдельный P2) · Риск: фаза 1 — почти нулевой (только оркестрационная проза, зеркало не трогается); фаза 2 — средний, т.к. затрагивает output-shape самого инвестированного mirror-пути → строго аддитивно, не менять что публикуется и content-hash. `A.20` — несущая ссылка; `E.18` — контекст (публикация как crossing).

### Типизировать вход questionnaire/raw как pre-абдуктивный RoutedCueSet

**FPF-основание.** `B.4.1` (Observe→Notice→Stabilize→Route) — pre-абдуктивный шов между низко-артикулированным cue и типизированным endpoint. `CC-B.4.1-2` (назвать `candidateRouteSet`), `CC-B.4.1-3` (при выборе — явные `routeDecision`/`selectedRoute`/`routeRationale`). Стартовое семейство маршрутов (`B.4.1:4.2`): `ProblemAbductionRoute`, `RequirementCommitmentRoute`, `EvaluativeRoute`. Сегодня `/ingest` прыгает из ответа questionnaire/raw-брифа прямо в типизированные драйверы/ADR — `B.4.1:2` предупреждает, что это форсирует ранние cue в поздние формы (`AnomalyStatement`, requirement-язык). `B.5.2` — вторично: корректный routed prompt питает ProblemCard предложения 1.

**Что менять.** (Command/Schema, легко) В `commands/ingest.md` и `commands/questionnaire.md` добавить шаг «route»: когда ответ/cue не достигает порога артикуляции для драйвера, LLM записывает RoutedCueSet — видимые кандидат-маршруты и, при выборе, route rationale — вместо молчаливого коммита. Переиспользовать существующую обработку `contradictions`/`unanswered` в ingest-questionnaire: для `unanswered` драйвера с неоднозначным ответом эмитить routed-cue-заметку в follow-up вместо форсирования scaffold драйвера. Никакого нового Core-kind; это оркестрационная guidance в двух командах плюс абзац в `schema/CLAUDE.md`. Жёстко ограничить: только когда cue допускает >1 живого маршрута (`B.4.1:14` — оставаться в RoutedCueSet лишь когда публикация маршрута стоит того).

**Пример.**
```
Answer: "we sometimes lose sessions but also users complain the login page is slow."
Вместо scaffold одного драйвера, ingest пишет:
RoutedCueSet (unarticulated): candidateRouteSet =
  [ProblemAbductionRoute → /hypothesis session-drop,
   RequirementCommitmentRoute → QA login-latency,
   EvaluativeRoute → risks.md].
selectedRoute: split — session-drop is a probe (hypothesis), latency is a measurable QA.
routeRationale: two distinct questions (B.4.1 split).
→ SA runs /hypothesis для одного и /driver для другого, каждый со своим ProblemCard.
```

**Эффект.** Останавливает преждевременный/over-eager mint драйверов из неоднозначных cue, держит плюрализм маршрутов легибельным (`CC-B.4.1-3`) и питает ProblemCard предложения 1 правильно типизированным prompt. Формализует «fuzzy front-end» процесса, у которого сейчас нет дома.

Приоритет: P2 (самое лёгкое, наименьший приоритет — без Core-зубов, риск деградации в игнорируемую LLM-прозу) · Трудоёмкость: S · Риск: низкий/аддитивный и обратимый (чистая оркестрационная проза + абзац schema; нет Core, frontmatter, зеркала). Единственный риск — over-ceremony; митигируется строгим правилом «только при >1 живом маршруте».

## 🧪 Само-оценка каркаса и quality-gates (как продолжать улучшать arch-wiki)

FPF даёт целое семейство измерительных инструментов над «объектом под улучшением»: **A.19.ECS** конструирует характеристическое пространство оценки над *любым* объектом (E.11.PUA:5.1a прямо показывает A.19.ECS, строящий `EvaluationCharacteristicSpaceSpec` для инженерного сравнения — объекта-не-FPF-паттерна); **E.21** (качество паттерна) и **E.2.DA** (адекватность Столпам) — его образцовые специализации; **E.22** типизирует вопрос оценки, **E.23** гоняет цикл улучшения, **E.13** ловит подмену ценности прокси-метрикой. У arch-wiki есть `lint` (целостность графа), но нет инструмента адекватности *артефакта* и *плагина*: пригодность «достаточно хорош, чтобы на него опираться» решается вкусом рецензента — ровно провал, названный в E.21:2 («ready, потому что есть заголовки») и E.19:0.1. Ниже — порт этого семейства в arch-wiki с сохранением уже проверенного разделения «детерминированное ядро + LLM-триаж», как в линте.

> Дисциплинарная правка ко всей теме: arch-wiki-артефакты и сам плагин — **не** FPF-паттерны, поэтому E.21/E.2.DA цитируются как *образцы дисциплины*, а порождающий паттерн — **A.19.ECS**. E.22/E.23/E.13/E.11.PUA применимы напрямую (они агностичны к виду объекта).

### 1. `/arch-wiki:review` + порядковая рубрика адекватности по видам артефактов (ADR/QA/driver)

**FPF-основание.** A.19.ECS — конструирование характеристического пространства оценки над артефактом (ADR/QA/driver — объект-не-паттерн). Образец дисциплины — E.21: порядковая шкала 0–5 (`0 absent … 4 wellExpressedForDeclaredUse` = дефолтный floor … `5 exceptional`), обязательный `ShortRationale` с обоснованием соседних значений (CC-E21-3: двухколоночная таблица «coordinate|value» — не результат), статусы `admissibleForDeclaredUse | repairBeforeUse | holdForArchitectureDecision | refreshNeeded` (E.21:4.5), запрет агрегатного балла (anti-pattern «Score illusion 87/100»). E.22 — рамка цели. Форма findings-first / impact-first run record заимствуется из E.19:4.1 и E.19:4.2.1.

**Что менять.** `commands/review.md` (новая read-only команда), `agents/architecture-reviewer.md` (новый субагент), `skills/adequacy-rubric/SKILL.md` (определения координат по видам), `schema/CLAUDE.md` (раздел `### /arch-wiki:review` под Operations). Разделить, как в линте: детерминированные *структурные* координаты из ядра (см. предложение 2) + *семантические* координаты от LLM. Координаты `QA-NNN`: `scenario-6-parts-present` (Source/Stimulus/Artifact/Environment/Response/Measure — их mirror уже распознаёт), `measure-quantified`, `driver→decision-coverage`, `c4-linkage`, `utility-tree-placement`, `sources-provenance`. Для `ADR-NNNN`: `decision-drivers-wired`, `considered-options-present`, `consequences-non-decorative`, `successor-if-superseded`, `sota-of-decision`. Для драйверов: `single-concern`, `measurable`, `covered-by-decision`. Review **никогда не редактирует** (human-gated, как шаг линта), выдаёт findings-first run record, упорядоченный impact-first; максимум предлагает строки в `risks.md`, как линт.

**Пример.**
```
/arch-wiki:review QA-001            # purpose=floorEvaluation (default), floor=4
→ QA-001 · API Response Time · status=repairBeforeUse
| coordinate               | value | ShortRationale                                             |
| scenario-6-parts-present | 5     | все 6 меток S/S/A/E/R/M; 4 занизило бы полный сценарий      |
| measure-quantified       | 2     | Measure = "responds fast": есть поле (не 1), но нет p95/    |
|                          |       | порога (не 3) — добавить "p95 < 300 ms @ 100 rps" → 4       |
| driver→decision-coverage | 0     | нет входящих ссылок из adrs/|iterations/ (uncovered-driver)|
| c4-linkage               | 3     | линкует [[api-gateway]], но нет c4 dynamic view; пределы    |
|                          |       | видны                                                      |
First repair: quantify Measure + wire an ADR.  Reopen if: QA-текст или входящие рёбра изменились.
```

**Эффект.** Переводит «хорош ли артефакт?» из вкуса в воспроизводимый, привязанный к доказательствам вердикт — ядро запроса темы. Порядковое значение-на-координату + обоснование соседних значений блокируют одновременно vanity-score и штамповку. Переиспользует проверенную архитектуру линта (факты ядра + триаж LLM).

Приоритет: P0 · Трудоёмкость: M · Риск: нет — read-only команда, пишет только предлагаемые строки risks (как линт); тракты publish/CLI-verdict не затрагиваются.

### 2. Структурная половина рубрики — в детерминированное ядро: `arch-wiki adequacy <file> --json`

**FPF-основание.** A.19.ECS + принцип «предпочитай проверяемое правило в ядре». E.21 CC-E21-5 («значения — из проверенного контента, не из вкуса») и CC-E21-6 («отсутствующее/непроверенное доказательство *понижает* координату»). **Осторожно с E.21:4.3**: порядковое значение — это *содержательная оценка*, а не `U.Measure` и **не «шаг лестницы зрелости»**. Поэтому ядро не должно «назначать значение по счётчику»: детерминированная лестница `count→5` — ровно тот maturity-ladder-шаг, который шкала запрещает.

**Что менять.** `src/adapters` — новый CLI-глагол `adequacy`; `src/domain/services/AdequacyRuleSet.ts`; `commands/review.md` потребляет вывод. Ядро эмитит **не финальное значение**, а: (а) детерминированные `basis`-строки (`EvaluationEvidenceBasis` в терминах CC-E21-6 — «какие локусы проверены»: наличие меток, счётчики входящих рёбер, C4-линковка, superseded-successor) и (б) *структурный floor-сигнал* с потолком (`structurally-absent`=0 / `structurally-present`≤3–4). Финальное порядковое значение + `ShortRationale` до 5 присваивает LLM-слой (предложение 1) на семантических доказательствах. Переиспользует уже имеющиеся сигналы ядра (required-section/underlinked, uncovered-driver, superseded-no-successor, 6-частный набор меток QA). Никогда не суммировать (страховка от Score-illusion в ядре).

**Пример.**
```
arch-wiki adequacy drivers/quality-attributes/QA-001-api-response-time.md --json →
{"artifact":"QA-001","kind":"quality-attribute","evidence":[
  {"coordinate":"qa-6part-labels","basis":"6/6 SSAERM labels present","structuralFloor":3,"cap":5},
  {"coordinate":"qa-inbound-decision","basis":"0 inbound from adrs/|iterations/","structuralFloor":0,"cap":0},
  {"coordinate":"qa-c4-linkage","basis":"1 entity link, 0 dynamic views","structuralFloor":2,"cap":3}]}
# reviewer-agent затем присваивает {"coordinate":"qa-measure-quantified","value":2,"ShortRationale":…}
```
До правки формулировка была «ядро назначает value детерминированной лестницей 0→0, ≥1→3, ≥1+C4→5»; после — ядро даёт `basis`+`structuralFloor`+`cap`, а value+обоснование соседних значений остаётся судимым (снимает конфликт с E.21:4.3).

**Эффект.** Честно реализует deterministic-Core-first: воспроизводимая, байт-стабильная, CI-проверяемая доказательная база из CLI; LLM судит только то, что обязан. Тот же контракт «Core→LLM», что плагин уже доверяет линту. Делает рубрику аудируемой.

Приоритет: P1 (после 1) · Трудоёмкость: L · Риск: низкий, изолированный — новый CLI-глагол + модуль правил; читает существующий `GraphSnapshot`, не трогает вывод линта, рендер mirror, ledger. Обязательны юнит-тесты (fixtures на вид) в набор из 285 тестов.

### 3. Формализовать цикл RELEASE-*/gt-retest как запись улучшения по E.23

**FPF-основание.** E.23 — метод повторяемого улучшения версии объекта под объявленной оценкой. Здесь: объект = плагин `vX.Y.Z`; переоценка = рубрика (1/2) + gt-ретест; `ImprovementAim`; `TradeoffProtectionSet`; «что стало хуже»; `loopDecision ∈ {stop|continue|switchMethodFamily|openNewFrame|holdUntilInformationBasisSufficient}`. E.23:2 прямо предупреждает: недисциплинированные циклы «закрывают строки discharge вместо улучшения качества» и «останавливаются навсегда после локального all-5». E.22 — рамка. E.11.PUA:2 (и профили E.11.PUA:4.2 `ordinaryBounded`) — держать запись лёгкой, чтобы «бумага не стала результатом».

**Что менять.** `docs/dev/release-loop.md` (новый append-only ledger), ссылка из `TODO.md`, опционально тривиальный `arch-wiki record-release`. Фиксированный E.23-шаблон на релиз: объект-версия; переоценка (рубрика + gt-ретест); `ImprovementAim` (**названный содержательный выигрыш, не «больше тестов»** — E.23:2 запрещает ловушку «значение как цель»); protected trade-offs (**обязательно** «Confluence mirror не должен регрессировать» и «идемпотентность сохранена»); improved / stayed-floor / **got-worse** (E.23 шаг 8); loopDecision. Состояние «ждём gt-ретест» ложится на `holdUntilInformationBasisSufficient`.

**Пример.**
```
## v0.8.6 — RENAME polish
- Object: arch-wiki v0.8.6 (commit f784c46)
- Aim: excluded-register wikilinks keep their record-id in the mirror (content gain, not a metric)
- Protected trade-offs: mirror byte-drift stability; DELETE→RENAME neutraliser (v0.8.5) unchanged; idempotency
- Improved: record-id retention; seam de-dup.  Floor-only: n/a.  **Got worse: none** (285 tests, 4-agent review)
- Re-evaluation: local ✓ / gt marketplace: PENDING → loopDecision = holdUntilInformationBasisSufficient
```

**Эффект.** Делает цикл, который пользователь уже гоняет (RELEASE-vX + 4-agent review + gt-ретест, живущий только в MEMORY.md/коммитах), явным, дешёвым и регресс-осознанным. Обязательные строки «protected trade-offs» + «что стало хуже» — постоянный страж тяжёлой инвестиции в mirror: каждый релиз обязан позитивно утвердить, что mirror не регрессировал.

Приоритет: P1 (самый дешёвый выигрыш, независим) · Трудоёмкость: S · Риск: нет — docs-only additive ledger (+ опциональный тривиальный writer).

### 4. Инструмент Principle-Adequacy для всего плагина (7 принципов) — определение, которое переоценивает цикл (3)

**FPF-основание.** A.19.ECS — конструирование характеристического пространства над *целым* объектом (edition плагина), где локального качества артефакта недостаточно. Образец — E.2.DA: его мотив (E.2.DA:2) — «локально отполировано, но глобально хуже»; ключевая дисциплина — **полный набор координат**: оценивать ВСЕ координаты каждый релиз-кандидат, даже те, что «кажутся незатронутыми» (E.2.DA:1 «дай значение и краткое обоснование, что именно сохранено»), плюс CC-E2DA-8 «назови, что стало хуже, когда видимая координата выросла». Именно это ловит тихую регрессию, которую свободный «got worse» из (3) может пропустить (E.2.DA:10 — блокирует лазейку «это же только локальная правка»). E.13 — прокси-подмена. Без агрегатного балла.

> Правка грундинга: не «специализация E.2.DA к 7 принципам» (E.2.DA сам уже — специализация A.19.ECS под *11 Столпов E.2*, её нельзя переспециализировать под другой набор). Верно: A.19.ECS-конструкция, E.2.DA-образец.

**Что менять.** `docs/dev/principle-adequacy.md` — определение инструмента: 7 arch-wiki-принципов как координаты (deterministic-Core-first, English-canon, human-gated, idempotent, fail-fast-no-defaults, additive/non-destructive, MCP-for-side-effects), плюс производная `mirror-projection-integrity`; шкала 0–5, `ShortRationale` соседних значений, `EvidenceLocus`, статус `admissibleForRelease | repairBeforeRelease | holdForArchitectureDecision`. Роль строго: это **определение инструмента**, а его *результирующие строки на релиз живут в ledger из (3)* — не второй параллельный чеклист (иначе E.11.PUA:2 «аппарат становится результатом»).

**Пример.**
```
docs/dev/principle-adequacy.md — v0.8.6:
| principle                  | value | ShortRationale                                   | evidence            |
| deterministic-Core-first   | 5     | все rename/seam-вердикты в ядре; LLM лишь нарратив| mirror render+tests |
| additive/non-destructive   | 4     | neutraliser только добавляет; 5 нужен replay      | v0.8.5/0.8.6 diffs  |
|                            |       | supersede-кейса                                  |                     |
| idempotent                 | 5     | re-publish = no-op при неизм. content-hash        | ledger contentHash  |
| mirror-projection-integrity| 3     | код зелёный, но gt-ретест PENDING — не 4          | release-loop v0.8.6 |
Status: repairBeforeRelease (mirror-coord < 4 до gt-ретеста).  What got worse: none.
```

**Эффект.** Одностраничный полный честный гейт против «локальный выигрыш — глобальная регрессия», прежде всего для Confluence mirror и идемпотентности. Дополняет артефактный уровень (1/2) уровнем каркаса — двухъярусный инструмент, которого просит тема.

Приоритет: P2 (после 1/2/3; ценность зависит от прогона — привязать к 3 и запускать только relianceBearing через 5) · Трудоёмкость: S · Риск: нет — docs-only.

### 5. Объявлять цель оценки заранее и масштабировать церемонию по опоре (страж от бюрократии)

**FPF-основание.** E.22:2 — незаданное «review this» скрывает, что нужно (дешёвый floor-проход vs исключительное улучшение vs поглощение находок) и рождает правдоподобно-неверные ответы; E.22:4.2 даёт цели `floorEvaluation | exceptionalImprovementEvaluation | absorptionEvaluation`. E.11.PUA:2 — противоположный провал: грузить каждый ограниченный случай полным аппаратом, пока «бумага не станет результатом»; E.11.PUA:4.2 — профили опоры `ordinaryBounded | relianceBearing`. E.21 — floor по умолчанию = 4.

**Что менять.** `commands/review.md`, `commands/lint.md`, `agents/architecture-reviewer.md`: явный аргумент `--purpose {floor|exceptional|absorption}` (default `floor`). Правило: `floor` гоняет таблицу до floor-4 и останавливается; `exceptional` дополнительно возвращает недоминируемые предложения; `absorption` переоценивает после правок и сообщает improved/got-worse. Глубину масштабировать по опоре: рутинный review — `ordinaryBounded` (быстрый floor, разговорно); полная рубрика (1/2) + Principle-Adequacy (4) обязательны только `relianceBearing` — перед `/arch-wiki:publish` или релизом. Это и есть управляющий контур, делающий инструменты 1/2/4 доступными в будни и строгими там, где на кону mirror/релиз.

**Пример.**
```
/arch-wiki:review ADR-0007                          # default: floor, стоп на первом repairBeforeUse
/arch-wiki:review ADR-0007 --purpose exceptional    # + предложения worked-slice / SoTA carry-through
/arch-wiki:review --changed <files> --purpose absorption  # "measure 2→4, driver-coverage всё ещё 0, хуже не стало"
# предусловие publish (relianceBearing): полная рубрика + principle-adequacy перед finalize-confluence
```

**Эффект.** Держит инструменты само-оценки лёгкими по умолчанию (нет бюрократического налога на рутинный линт), гарантируя срабатывание полного гейта перед высоко-опорным шагом publish/release — дисциплина FPF «first useful result». Делает запрос типизированным: рецензент отвечает на заданный вопрос.

Приоритет: P2 · Трудоёмкость: S · Риск: нет — additive опциональный аргумент с floor-дефолтом (это дефолт для *рамки*, а не для required input — принцип fail-fast-no-defaults не нарушен); прежние вызовы без `--purpose` работают как дешёвый floor.

---

## 🌊 Вторая волна: пробелы, которые этот проход не закрыл

Критик полноты выделил FPF-обоснованные возможности, которых нет (или которые лишь
затронуты) в 10 темах выше. Это осознанный, приоритизированный бэклог для следующей
итерации — не «упущено», а «намечено».

| FPF-паттерн(ы) | Возможность в arch-wiki | Почему стоит |
|---|---|---|
| **C.25 Q-Bundle + A.2.6 USM** | Углубить тему «Атрибуты качества»: QA-мера должна нести не только `Characteristic·Scale·Target`, но и **ClaimScope/WorkScope** (к какому bounded-context/срезу системы применим порог), слоты `mechanism / failure-mode / proxy-metric`. | Делает «G» в F-G-R (grounding) проверяемым; сегодня scope QA — неявная проза. Самый крупный недобранный выигрыш. |
| **A.21 GateProfilization / OperationalGate** | `lint`, `validate-c4`, `publish` — это pass/fail-**гейты**, но ни один не оформлен как `OperationalGate(profile)` с `GateChecks` (join-semilattice), `GateProfile` и логируемым `GateDecision`. | Единая семантика гейтов + аудируемый журнал решений; `c4-baseline` и «clean»-вердикт — это register-backed публикация (A.6), которую стоит так и назвать. |
| **A.6.B Boundary Norm Square** | Классифицировать `CON-NNN` по четырём видам граничных норм: **Laws / Admissibility / Deontics / Work-effects**. | Сегодня юридическое ограничение, правило допустимости и проектная политика читаются одинаково; `must/shall`-инварианты схемы — тоже деонтика. |
| **C.28 CausalUse-CAL** | LLM-lint на каузальный язык в ADR (`## Decision Outcome`, `### Consequences`) и QA-прозе: связать «X снижает latency» / «регресс вызван Y» с поддерживаемой ступенью каузальной лестницы. | Ловит необоснованные каузальные претензии — естественная проверка для `architecture-linter`. |
| **E.4.PFR** | Дисциплина изданий: deprecation / supersession / refresh-условия, управляющие версионированием `schema/CLAUDE.md` и условиями `migrate`/`adopt` (+`G.11`). | Тема «Онтология» взяла `E.4.PFAD` (решение) и `E.4.DPF.DA` (адекватность), но не `E.4.PFR` (издания) — а именно он должен управлять schema-версиями. |
| **B.5.3 Domain-Concept Bridge / A.1.1** | Управлять `glossary.md` как **словарём bounded-context** (локальный смысл + мост между контекстами), а не как плоским списком. Питает preserveTerms/glossary-bold зеркала. | Тема «Лексикон» подняла Unified Term Sheet, но не связала его с bounded-context-семантикой A.1.1. |
| **D.5 Bias Audit / E.5.4** | Аудит **самого синтеза** (ingestor подчёркивает/опускает то, что попадает в драйверы/ADR) на предвзятость LLM. | `E.5.4` «ограничивает все Core-паттерны»; `E.4.DPF.DA` мерит адекватность, но не нейтральность — это отдельный пробел. |

### Непокрытые поверхности плагина

- **`pull-stories` (входящая проекция).** PO-лог Confluence → `raw/_synced/` — это **зеркало
  наоборот** (probe-coupled boundary read, `C.26.1`). Исходящее зеркало получило 5
  предложений; входящий снимок — ноль дисциплины faithfulness/scope. Применить те же
  морфизм-проверки в обратную сторону.
- **`migrate` / `adopt`.** Schema-refresh без единого предложения об адекватности миграции
  и условиях refresh-издания (`E.4.PFR` / `G.11`) — упомянуто только как риск.
- **`query` + персистентность `concepts/`.** Ответ из графа и его сохранение как concept —
  это `EpistemicViewing` / DESCRIPTION-USE-морфизм (`A.6.2`) без дисциплины provenance и
  faithfulness на сохранённом ответе.

---

## 🗺️ Быстрый справочник: FPF ↔ arch-wiki

Однострочная «розетта» — как ключевые FPF-сущности проецируются на то, что плагин уже
делает. Это карта для чтения `FPF-Spec.md` под углом arch-wiki и общий словарь для всех
предложений выше.

| FPF-концепт | Паттерн | Что это в arch-wiki | Где живёт |
|---|---|---|---|
| **Domain Principle Framework (DPF)** | `E.4.DPF`, `E.4.PFAD` | Сам плагин: доменная специализация FPF для solution architecture | весь плагин; предлагается `FRAMEWORK.md` |
| **Access carrier** | `E.4.DPF:1` | Схема + skills + команды + CLI как «доступ», а не сам фреймворк | `schema/CLAUDE.md`, `skills/`, `commands/` |
| **Developer decision carrier (DRR)** | `E.9`, `E.4.DPF` | Заметки `RELEASE-*.md` / `gt-retest` — решения об эволюции плагина | `RELEASE-*.md` |
| **U.Method / U.MethodDescription** | `A.3.1` / `A.3.2` | ADD 3.0 (способ) / skill `add-method` (его описание) | `skills/add-method` |
| **U.Work / U.WorkPlan** | `A.15.1` / `A.15.2` | `ITER-NN` (датированное выполнение) / карточка `kanban.md` (намерение) | `iterations/`, `kanban.md` |
| **Episteme / EntityOfConcern** | `C.2.1`, `E.10.D2` | Wiki-страница как знание-объект «о» конкретном предмете | Layer-2 граф |
| **Effect-free morphism** | `A.6.2` | Рендер зеркала: преобразование без изменения предмета | `RenderConfluencePayload.ts` |
| **ConservativeRetextualization** | `A.6.3.CR` | DELETE→RENAME (`risks.md`→«the risk register») | `humanizeRepoRef` |
| **Controlled Semantic Coarsening** | `A.6.3.CSC` | Стрип `## Sources`, исключение `CLAUDE.md`, git-refs | mirror-пайплайн |
| **RepresentationSchemeTransition** | `A.6.3.RT` | md-граф → Confluence-страницы; RU-перевод с маскированием | `publish`, `finalize-confluence` |
| **Evidence Graph / verifiedBy·validatedBy** | `A.10` | Секции `## Sources`, `trace`, ledger | `trace`, `FileLedgerStore` |
| **F-G-R / AssuranceLevel** | `B.3`, `B.3.3` | (предлагается) L0/L1/L2 вместо бинарного covered/uncovered | `LintRuleSet.ts` §4 |
| **Evidence Decay / Epistemic Debt** | `B.3.4` | superseded ADR, stale issue, `exists:false` raw | (предлагается) `epistemic-debt.md` |
| **CharacteristicSpace / CSLC** | `A.18`, `A.19.ECS`, `C.16` | QA-мера (6 частей); `utility-tree.md` как пространство оценки | `templates/quality-attribute.md`, `utility-tree.md` |
| **Q-Bundle («-ility»)** | `C.25`, `C.16.Q` | QA-атрибут, распакованный в характеристику+шкалу+уровень | QA-страницы |
| **Viewpoint / View / Correspondence** | `E.17.0`, `E.17.2` | arc42-хабы + C4-виды + зеркало как многовидовая публикация | `arc42/`, `c4/`, Confluence |
| **DRR / Decision Adequacy** | `E.9`, `C.32.ADA`, `C.32.ADR` | ADR/MADR: рассмотренные варианты, драйверы, последствия | `adrs/`, `skills/madr-format` |
| **Cross-Context Sameness / Bridge** | `A.6.9`, `F.9` | Один термин в разных bounded-context; preserveTerms | `glossary.md`, `preserveTerms` |
| **Unified Term Sheet** | `F.17` | Глоссарий как Ubiquitous Language | `glossary.md` |
| **Problem Typing / ProblemCard** | `C.22`, `C.22.2` | (предлагается) карточка проблемы у `hypothesis` | `commands/hypothesis.md` |
| **Abductive Loop** | `B.5.2` | Гипотеза = абдукция; критерий опровержения | `commands/hypothesis.md` |
| **Reasoning / Evolution Loop** | `B.5.1`, `B.4` | Процесс `hypothesis→…→trace`; ADD-итерация | design-процесс |
| **Flow Constraint Validity** | `A.20`, `E.18` | Порядок стадий пайплайна (фикс v0.8.3) | `publish`/`ingest` пайплайны |
| **OperationalGate** | `A.21` | (вторая волна) `lint`/`validate-c4`/`publish` как гейты | Core-вердикты |
| **Guard-rails (Notational Indep. / Unidirectional dep.)** | `E.5.2` / `E.5.3` | Entities-канон vs C4-нотация; направление зависимостей | `schema/CLAUDE.md` |
| **Quality Improvement Loop / Pattern-Quality** | `E.23`, `E.21` | Ритм `RELEASE-*/gt-retest`; рубрики адекватности | (предлагается) `/arch-wiki:review` |

---

### Метод и оговорки

- Доклад произведён 22 субагентами (2.5M токенов проработки FPF и кода) с адверсариальной
  верификацией; полный машинный вывод и per-agent journal сохранены в рабочей директории
  сессии. Все FPF-основания даны с конкретными id паттернов и, где возможно, номерами
  CC-клауз; названия уровней (напр. `AssuranceLevel L2` = FPF «Axiomatic») берутся как
  **доменные проекции**, а не буквальное воспроизведение — это отмечено по месту.
- Приоритеты и трудоёмкости — оценки для планирования, не измерительная программа
  (в духе `E.22`: сначала объявить цель оценки, затем масштабировать церемонию под
  ответственность).
- Ни одно предложение не требует переписывания плагина и не меняет байтовый выход рабочего
  зеркала без явной пометки и обязательного gt-re-test. Английский Layer-2 граф остаётся
  единственным source of truth.
