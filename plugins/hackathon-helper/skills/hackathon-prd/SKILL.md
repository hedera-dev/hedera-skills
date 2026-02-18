---
name: Hedera Hackathon PRD
description: This skill should be used when the user wants to plan a Hedera hackathon project, create a PRD, write a project spec, brainstorm a hackathon idea, or structure their hackathon submission. Triggered by phrases like "hackathon project plan", "hackathon PRD", "plan my hackathon project", "hedera hackathon idea", "write a hackathon spec", "hackathon project structure", "prepare for hackathon", or "build for hackathon".
---

# Hedera Hackathon PRD Generator

Generate a comprehensive PRD for a Hedera hackathon project, structured to maximize scores across all 7 judging criteria: Innovation (10%), Feasibility (10%), Execution (20%), Integration (15%), Validation (15%), Success (20%), and Pitch (10%).

## Step 1: Gather Bounty / Track Context

Before asking any other questions, ask the participant to paste the bounty or track description they are targeting. This is critical for tailoring the PRD to what judges are specifically looking for.

Prompt them with:

> **Before we start, please paste the full description of the bounty or track you're submitting to.** This includes the track name, description, requirements, prize details, and any specific evaluation criteria. The more context you share, the better I can tailor your PRD to what the judges are looking for.
>
> If you're targeting multiple tracks, paste all of them.

Once the participant provides the bounty/track context:
- Identify specific requirements, themes, or technologies mentioned in the track
- Note any track-specific evaluation criteria beyond the standard judging rubric
- Look for preferred Hedera services, partner integrations, or use cases called out in the track
- Use this context to inform all subsequent questions and the generated PRD

If the participant doesn't have the track description handy, proceed with the general questions below but remind them that track alignment is scored under Innovation (10%) and that pasting the track details later will help refine the PRD.

## Step 2: Gather Project Information

Ask the participant the following questions interactively. Ask them in batches of 2-3 to avoid overwhelming them. Start with the essentials, then go deeper. Adapt questions based on what was already covered in the bounty/track context.

**Batch 1 - The Basics:**

1. What problem are you solving? (1-2 sentences)
2. Who experiences this problem? (target users)
3. Which hackathon track(s) are you targeting? (if not already clear from the bounty context)

**Batch 2 - The Solution:**

4. What is your proposed solution? (high level)
5. Why does this need to be a Web3/blockchain solution? (Why can't Web2 solve this?)
6. Does anything like this exist on Hedera or other blockchains?

**Batch 3 - Hedera Integration:**

7. Which Hedera services do you plan to use? (HTS, HCS, Smart Contracts, Scheduled Transactions, etc.)
8. Are you planning to integrate with any Hedera ecosystem platforms? (SaucerSwap, HashPack, Kabila, etc.)
9. How will your solution drive new Hedera accounts and transactions?

**Batch 4 - Team & Execution:**

10. What is your team composition? (roles and skills)
11. What are your MVP features for the hackathon? (top 3-5)
12. Do you have any market validation or user feedback already?

If the user provided a problem statement or idea upfront, use that to skip or pre-fill relevant questions. Still ask about Hedera integration, team, and validation details.

## Step 3: Generate the PRD

Once you have sufficient information, generate a comprehensive PRD following the template in `references/prd-template.md`. Write it to a file called `HACKATHON-PRD.md` in the project root.

Key requirements for the generated PRD:

- If bounty/track context was provided, weave track-specific requirements throughout the PRD (especially in Solution Overview, Hedera Integration, and Innovation sections)
- Every section must be filled with specific, actionable content based on the participant's answers
- The Hedera Integration section must detail specific services and how they're used
- The Network Impact section must include realistic estimates for accounts, MAA, and TPS
- Include a Lean Canvas business model based on their answers
- Design decisions should reference Hedera-specific trade-offs (e.g., HTS native vs ERC-20)
- The Pitch Outline should be a ready-to-use framework for their presentation
- Include explicit non-goals to prevent scope creep during the hackathon

## Step 4: Score Prediction

After generating the PRD, provide a predicted score assessment against the judging criteria. Refer to `references/judging-criteria.md` for the complete rubric.

```
## Predicted Score Assessment

| Section | Predicted Score | Rationale | How to Improve |
|---------|----------------|-----------|----------------|
| Innovation (10%) | X/5 | [why] | [actionable tip] |
| Feasibility (10%) | X/5 | [why] | [actionable tip] |
| Execution (20%) | X/5 | [why] | [actionable tip] |
| Integration (15%) | X/5 | [why] | [actionable tip] |
| Validation (15%) | X/5 | [why] | [actionable tip] |
| Success (20%) | X/5 | [why] | [actionable tip] |
| Pitch (10%) | X/5 | [why] | [actionable tip] |
```

Focus improvement tips on the highest-weighted criteria (Execution 20%, Success 20%) first.

## Step 5: Next Steps

After generating the PRD, suggest concrete next steps:

1. Which MVP features to build first based on judging criteria impact
2. Quick wins for improving Integration score (additional Hedera services to consider)
3. Validation actions the team can take during the hackathon
4. Pitch preparation tips

## Judging Criteria Quick Reference

| Section | Weight | What Judges Look For |
|---------|--------|---------------------|
| **Execution** | 20% | MVP quality, UI/UX, team strategy, GTM plan |
| **Success** | 20% | Impact on Hedera accounts, active accounts, TPS, exposure |
| **Integration** | 15% | Depth of Hedera network usage, ecosystem partner leverage, creative service usage |
| **Validation** | 15% | Market feedback cycles, early adopters, traction metrics |
| **Innovation** | 10% | Novelty in Hedera ecosystem, new capabilities, track alignment |
| **Feasibility** | 10% | Web3 necessity, domain knowledge, business model viability |
| **Pitch** | 10% | Problem/solution clarity, opportunity size, Hedera representation |

**Key insight**: Execution + Success = 40% of the total score. Integration + Validation = 30%. Focus effort accordingly.

## Hedera Network Services Reference

Use these services to maximize Integration scores:

| Service | Use Case | Integration Depth |
|---------|----------|-------------------|
| **Hedera Token Service (HTS)** | Fungible/non-fungible tokens, custom fees, compliance controls | High |
| **Hedera Consensus Service (HCS)** | Ordered, timestamped messages, audit trails, event logs | High |
| **Smart Contracts (EVM)** | Solidity contracts with HTS precompiles, DeFi logic | High |
| **Hedera File Service (HFS)** | On-chain file storage, immutable documents | Medium |
| **Scheduled Transactions** | Deferred execution, multi-sig workflows | Medium |
| **Mirror Nodes** | Historical data queries, analytics, indexing | Low (alone) |
| **SDK (JavaScript/Java/Go/Swift)** | Client-side integration with any service | Depends on usage |

### Ecosystem Platforms

Integrating with ecosystem partners increases Integration and Success scores:

- **SaucerSwap** - DEX, liquidity pools
- **HashPack / Kabila** - Wallet providers
- **Hedera NFT Studio** - NFT tooling
- **Arkhia / Validation Cloud** - Infrastructure, mirror nodes
- **HashScan** - Block explorer

## Important Notes

- Be encouraging but honest about gaps. The goal is to help them score higher, not to give false confidence.
- Always explain WHY something matters in terms of the judging criteria and their weightings.
- Emphasize that Execution (20%) and Success (20%) together account for 40% of the total score.
- Remind participants that Integration (15%) rewards creative, non-obvious use of Hedera services.
- Reference specific Hedera services by name and explain how they could be used.

Refer to `references/judging-criteria.md` for complete rubric details per section.
Refer to `references/prd-template.md` for the PRD document structure.
