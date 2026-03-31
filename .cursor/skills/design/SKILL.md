---
name: design
description: Brainstorm system and architecture designs with a focus on context gathering, tradeoffs, risks, and decision logs. Use when the user asks for system design (e.g., `/design`) or when planning an implementation without wanting code or file-by-file changes.
---

# /design (System Design, Not Coding)

## Goal
Help the user make good long-term system design decisions by:
- Gathering the minimum necessary context first
- Framing the architecture at a high level (boundaries, data flow, abstractions)
- Comparing 2-3 viable alternatives with pros/cons
- Challenging weak assumptions and identifying hidden coupling/operational gaps
- Producing a phased implementation plan and a compact decision log

## Hard Guardrails
- Do not output code, diffs, or file-by-file implementation instructions.
- Do not produce a “6-page essay”. Default to short answers using the templates below.
- Ask clarifying questions only when they block a meaningful design choice.
- If the user wants deeper detail, ask permission: “Expand data flow” / “Expand tradeoffs” / “Expand risks”.

## Default Interaction Style (keep it tight)
1. Ask up to 3 clarifying questions.
2. If unanswered, proceed with explicit assumptions.
3. Provide a short architecture proposal + alternatives.
4. End with: `Decision(s)`, `Risks`, and a `Phased Plan`.

## Step-by-step Workflow
1. **Intake (what we’re designing)**
   - What is the feature/system?
   - What does “success” look like (functional + non-functional)?
   - What constraints matter most (latency, cost, deployment model, compliance, time-to-market)?
2. **Context gathering (ops + change management)**
   - How will it run (runtime shape, scheduling/queueing, deployment)?
   - What are the data sources/sinks (DB tables, external APIs, events)?
   - How will it fail and what is the acceptable blast radius?
   - What observability is required (logs/metrics/traces, dashboards, alerts)?
3. **Architecture framing (big picture)**
   - Define boundaries: domain vs application vs adapters.
   - Describe the main flow (request/command entry → services → persistence/clients → response).
   - Identify key abstractions (services vs repositories vs adapters; request/command objects for multi-step work).
   - For TypeScript projects, default to patterns in `AGENTS.md`:
     - interface + factory, constructor-injected dependencies
     - repositories for aggregates returning typed `Result`
     - adapters per external system
     - request/command objects for multi-step operations
4. **Alternatives (force tradeoffs)**
   - Provide 2-3 alternatives. For each:
     - When it’s the best choice
     - Pros
     - Cons (including long-term maintenance and operational concerns)
5. **Challenge mode (make “bad ideas” uncomfortable)**
   - Actively look for:
     - tight coupling
     - missing operational concerns (deploys, migrations, rollback)
     - incorrect boundary placement (e.g., domain depending on external API shapes)
     - “easy now, painful later” choices
     - designs that assume legacy behavior, backward compatibility, or patching instead of foundation work
   - If you find a likely wrong turn, say so directly and propose a safer alternative.
6. **Decision log + phased plan**
   - Record the decisions you made and the rationale.
   - Provide a phased plan (3 phases max) that focuses on conceptual steps.
   - Include a brief verification/rollback note per phase (high level).

## Output Template (use this order)
### 1) Goal
### 2) Known Constraints
### 3) Assumptions (explicit)
### 4) Proposed Architecture (high level)
### 5) Alternatives (2-3) with Pros/Cons
### 6) Decision(s) + Why
### 7) Risks / Open Questions
### 8) Phased Plan (no code, no file-by-file steps)

## Quick “Design Thinking” Defaults
- Prefer making illegal states unrepresentable (use discriminated unions/typed errors) rather than relying on runtime checks.
- Prefer composition over deep inheritance.
- Treat external inputs as untrusted and validate at boundaries.

