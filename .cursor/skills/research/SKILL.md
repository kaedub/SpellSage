---
name: research
description: Research best practices, standards, and recommended approaches with evidence and tradeoff analysis. Use when the user asks what the right way is, requests best practices, wants option comparison, asks for guidance before implementation, or invokes `/research`.
---

# /research (Evidence-First Guidance, Not Building)

## Goal
Help the user answer questions like "What is the right way to do this?" by:
- Clarifying the decision question and context
- Gathering evidence from authoritative sources and project constraints
- Comparing viable approaches and when each is appropriate
- Recommending a default with explicit confidence and caveats

## Hard Guardrails
- Do not implement code, produce diffs, or give file-by-file change instructions.
- Do not provide architecture/design proposals unless the user explicitly asks to pivot from research to design.
- Do not hide uncertainty. Call out unknowns and assumptions directly.
- Do not present one "best" answer without context; include when alternatives are better.
- Keep responses concise and practical; avoid long essays.

## Default Interaction Style
1. Ask up to 3 high-value clarifying questions if needed.
2. If answers are unavailable, proceed with explicit assumptions.
3. Provide findings first, then recommendation, then alternatives.
4. Include confidence level, evidence quality, and open questions.

## Research Workflow
1. **Define the question**
   - What exact decision is being made?
   - Which constraints matter most (team skill, runtime, scale, compliance, timeline)?
2. **Set evaluation criteria**
   - Choose 3-5 criteria before comparing options (for example: correctness, maintainability, performance, complexity, operability).
3. **Gather evidence**
   - Prefer standards/specs, official docs, maintainers' guidance, production-proven patterns, and relevant repo conventions.
   - Distinguish hard evidence from opinion.
4. **Compare options**
   - Evaluate at least 2 realistic options when feasible.
   - State when each option is the best fit and where it fails.
5. **Recommend**
   - Give a default recommendation tied to constraints.
   - Include confidence (`high`, `medium`, `low`) and why.
6. **Document uncertainty**
   - List unknowns, risks, and what information would change the recommendation.

## Evidence Quality Ladder
Use this order of trust when available:
1. Standards/specifications and official documentation
2. Maintainer or vendor guidance for the exact technology/version
3. Widely adopted industry patterns with clear rationale
4. Team/repo conventions and past internal decisions
5. Anecdotal opinions

If evidence conflicts, explain the conflict and why one source is weighted more heavily.

## Output Template (Default)
### 1) Question
### 2) Constraints and Assumptions
### 3) Key Findings (evidence-first)
### 4) Recommendation (default + why)
### 5) Alternatives (when to choose them)
### 6) Confidence and Risks
### 7) Open Questions / Next Research

## Quick Response Template (for short asks)
- **Best practice:** [single sentence]
- **Why:** [1-2 evidence-backed bullets]
- **Use this when:** [context]
- **Avoid when:** [context]
- **Confidence:** [high/medium/low]

## Escalation and Handoff
If the user asks to move from research to planning/building:
1. Confirm the pivot explicitly.
2. Summarize the selected recommendation and assumptions.
3. Then switch to design or implementation mode as requested.

## Anti-Patterns
- "It depends" without giving a default recommendation.
- Recommendation with no evidence or criteria.
- Conflating "common" with "correct for this context."
- Jumping straight to code before answering the question.
- Presenting deprecated patterns as current best practice.
