---
type: quality-attribute
tags: [qa]
---

# {{id}}: {{title}}

## Quality Attribute
<!-- Performance | Availability | Security | Modifiability | ... -->

## Scenario
- **Source:**
- **Stimulus:**
- **Artifact:**
- **Environment:**
- **Response:**
- **Measure:**
<!-- The Measure MUST be testable — a threshold with a number/unit (e.g. p95 < 200ms).
     `lint` flags qa-measure-untestable if a stated Measure carries no numeric threshold. -->

## Quality Bundle
<!-- FPF C.25 (Q-Bundle) / A.18 (CSLC): unpack the "-ility" into a checkable characteristic. -->
- **Characteristic:** <!-- the quality, e.g. latency -->
- **Scale:** <!-- unit/scale, e.g. milliseconds -->
- **Polarity:** <!-- lower-is-better | higher-is-better -->
- **Target:** <!-- threshold, e.g. p95 < 200ms -->
- **Current:** <!-- baseline if known -->
- **Window:** <!-- measurement window, e.g. rolling 5m / peak hour (FPF C.27.TA) -->
- **Scope:** <!-- ClaimScope: the bounded-context/C4 element the target applies to (FPF A.2.6 USM) -->

## Decision Drivers
{{drivers}}

## Sources
<!-- Provenance (FPF A.10). Optional frontmatter, machine-read, mirror-stripped:
     source: raw/<file>             where this came from
     verified_by: [<ADR>, <spec>]   design-time verification carriers
     validated_by: [<measurement>]  run-time validation carriers
     valid_until: YYYY-MM-DD         evidence expiry → epistemic-debt (FPF B.3.4) -->
