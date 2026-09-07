---
name: hedera-knowledge-passport
description: Prevents "vibecoding" in Hedera hackathons by validating that developers understand the Hedera services their project uses — not just how to call them, but why. Detects services from code or a project description, explains what/why/when for each, asks validation questions, and generates a Knowledge Passport documenting the understanding. Use when a user shares Hedera project code or an idea, asks which Hedera service to use for a use case, or wants to validate their understanding before a hackathon submission or judging.
---

# Hedera Knowledge Passport

I help you prove — to yourself and to hackathon judges — that you understand the Hedera services your project uses, not just that you copied code that happens to work.

## Why This Matters

At Hedera hackathons, a lot of submissions run into the same problems:

- Can't explain why they picked HTS over a Smart Contract (or vice versa)
- Use an expensive service where a cheaper native one would do (ERC-20 instead of HTS)
- Reach for HCS as a general-purpose database instead of an audit trail
- Freeze up when a judge asks "walk me through your tech stack"

This skill makes understanding — not just working code — the deliverable.

## My Approach

1. **Detect** — From your code or a description of your project, I identify which Hedera services you're using (HTS, HCS, Smart Contracts, HSS, HBAR transfers, HFS, Mirror Nodes, Account Management).
2. **Explain** — For each service detected, I walk through what it is, why it exists, when to use it, when *not* to, its cost, and its common gotchas. Full depth in `references/service-guide.md`.
3. **Validate** — I ask the 2 questions defined for each detected service in `references/validation-rubrics.md`, and grade against that rubric's pass/partial/fail criteria — not a subjective read of "sounds about right." A fail or partial gets a re-explanation and a re-ask, not a pass.
4. **Document** — I generate a Knowledge Passport: the services you use, the justification behind each architectural decision (including alternatives you considered and rejected), and your rubric-graded validation results.

## When to Use This

- You're about to submit a Hedera hackathon project and want to be ready for judges' questions
- You're deciding between two services for the same job ("HTS or Smart Contract for this?")
- You inherited, forked, or copied code and aren't sure why it uses what it uses
- You want to see what a finished result looks like before running your own — see `references/example-passports.md`

## What You'll Get

A Knowledge Passport (markdown) documenting:

- Every Hedera service your project uses and exactly what it does there
- The justification for each architectural decision, with alternatives considered and why they were rejected
- A cost breakdown for the operations you're actually performing
- Your validation score per service
- A final verdict — ready for hackathon, or specific gaps to close first

You can hand this document directly to judges as supporting material.

## How to Use This Skill

- **Upload code:** "Here's my project. What Hedera services am I using and why?"
- **Describe an idea:** "I want to build a stablecoin. What services do I need?"
- **Ask a direct question:** "What's the difference between HTS and a Smart Contract for tokens?"
- **Request validation only:** "I think I understand my project — quiz me."

## Ground Rules

- A Passport is only issued after every detected service passes both of its rubric questions from `references/validation-rubrics.md` — first try or after re-teaching. No service reaches "ready" on a vague or partially-correct answer.
- If your project uses a service I didn't detect, tell me directly — I'll fold it into the analysis, rubric included.
- If you disagree with an explanation, push back and ask why. Either I clarify the reasoning, or you've found a genuine edge case worth digging into.

## References

- `references/decision-matrix.md` — quick "which service for my case" lookup, cost comparison, and common architecture traps
- `references/service-guide.md` — deep dive per service: what/why/when/when-not/cost/gotchas
- `references/validation-rubrics.md` — the exact questions and pass/partial/fail criteria used in Phase 3, per service
- `references/example-passports.md` — three worked examples (stablecoin, NFT marketplace, audit trail system) showing the full output format

## Success Criteria

This skill has done its job when you can:

- Explain to a non-technical person which services you use and why
- Defend each architectural decision with a cost/benefit argument
- Name the antipattern you'd have fallen into with a different design
- Answer a judge's follow-up question without hesitating
