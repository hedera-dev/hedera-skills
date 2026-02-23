---
name: Hedera Hackathon Submission Validator
description: This skill should be used when the user wants to validate, review, or score their Hedera hackathon submission before submitting. Triggered by phrases like "validate hackathon submission", "review my hackathon project", "hackathon scorecard", "check submission readiness", "score my hackathon", "submission review", "judge my project", "hackathon submission quality", or "improve hackathon score".
---

# Hedera Hackathon Submission Validator

Review a Hedera hackathon submission's codebase and score it against the official judging criteria. Focus on what is observable from the code, README, and documentation in the repository.

## Step 1: Discover the Project

Scan the codebase to understand what was built:

1. Read the README.md (or equivalent) for project overview
2. Identify the tech stack:
   - `package.json`, `Cargo.toml`, `go.mod`, `requirements.txt`, etc.
   - Look for Hedera SDK dependencies (`@hiero-ledger/sdk`, `@hashgraph/sdk`, `hedera-sdk-*`, etc.)
3. Find Hedera integration points:
   - Search for Hedera SDK imports and usage
   - Search for HTS precompile addresses (`0x167`)
   - Search for Hedera service calls (token create, consensus submit, etc.)
   - Search for mirror node API calls
   - Search for ecosystem integrations (wallet connect, DEX, etc.)
4. Assess project structure and code quality
5. Look for documentation: architecture docs, design decisions, business model, pitch materials
6. Check for tests and CI/CD configuration

## Step 2: Score Against Each Criterion

Evaluate the submission against each of the 7 judging criteria. For each, provide a score (1-5), evidence from the codebase, and specific improvement suggestions. Refer to `references/judging-criteria.md` for the complete rubric with guiding questions and 1/3/5 score descriptors.

### Innovation (10% weight)

Review for:

- Is this a novel solution or a clone of existing platforms?
- Does it introduce new capabilities to the Hedera ecosystem?
- Does the README explain what makes it unique?
- Check if similar projects exist (based on what you can infer from the code)

### Feasibility (10% weight)

Review for:

- Is the solution technically sound?
- Does it genuinely require Web3/blockchain? Or could this work on Web2?
- Is there a business model documented? (Lean Canvas, monetization strategy)
- Does the code demonstrate domain understanding?

### Execution (20% weight) - HIGHEST PRIORITY

Review for:

- **Completeness**: Is this a working MVP, PoC, or just scaffolding?
- **Code quality**: Clean architecture, error handling, testing?
- **UI/UX**: If there's a frontend, is it polished or rough?
- **Documentation**: README completeness, setup instructions, architecture docs
- **Design decisions**: Are key technical choices documented and justified?
- **Strategy**: Is there a roadmap or post-hackathon plan?
- **GTM**: Is there a go-to-market strategy documented?

### Integration (15% weight) - HIGH PRIORITY

Review for:

- **Services used**: Which Hedera services are actually integrated? (HTS, HCS, Smart Contracts, HFS, Scheduled Transactions)
- **Integration depth**: Is it meaningful usage or superficial? (e.g., just mirror node queries = shallow)
- **Ecosystem partners**: Are any ecosystem platforms integrated? (SaucerSwap, HashPack, etc.)
- **Creativity**: Is any Hedera service used in a non-obvious way?
- **Multiple services**: Are multiple Hedera services combined?

Rate integration depth:

- Mirror node queries only = 1 point
- Single service, obvious usage = 2-3 points
- Multiple services, meaningful usage = 3-4 points
- Multiple services + ecosystem partners + creative usage = 5 points

### Validation (15% weight)

Review for:

- Is there evidence of external user testing? (feedback docs, user survey results, analytics)
- Are market feedback cycles documented?
- Is there any traction data? (user counts, sign-ups, etc.)
- Note: This is hard to assess from code alone. Flag if no evidence is found.

### Success (20% weight) - HIGHEST PRIORITY

Review for:

- Does the solution architecture drive Hedera account creation?
- Would usage generate meaningful TPS on the network?
- Does it expose Hedera to new audiences?
- Is the potential network impact documented or estimable from the code?

### Pitch (10% weight)

Review for:

- README quality as a proxy for pitch quality
- Is the problem/solution clearly explained?
- Are metrics and market data cited?
- Is Hedera's role clearly articulated?
- Is there a pitch deck or demo script in the repo?

## Step 3: Generate the Scorecard

Output a comprehensive report:

```markdown
# Hackathon Submission Review

## Project Summary

- **Name**: [from README]
- **Description**: [1-2 sentences]
- **Tech Stack**: [languages, frameworks, Hedera SDK version]
- **Hedera Services Used**: [list]

## Scorecard

| Section     | Score    | Weight | Weighted | Key Finding        |
| ----------- | -------- | ------ | -------- | ------------------ |
| Innovation  | X/5      | 10%    | X.X      | [one-line summary] |
| Feasibility | X/5      | 10%    | X.X      | [one-line summary] |
| Execution   | X/5      | 20%    | X.X      | [one-line summary] |
| Integration | X/5      | 15%    | X.X      | [one-line summary] |
| Validation  | X/5      | 15%    | X.X      | [one-line summary] |
| Success     | X/5      | 20%    | X.X      | [one-line summary] |
| Pitch       | X/5      | 10%    | X.X      | [one-line summary] |
| **Total**   | **X/35** |        | **X.X**  |                    |

**Estimated Final Grade: X%**

## Detailed Findings

### [Section Name] - X/5

**Evidence**: [What was found in the code]
**Gaps**: [What's missing]
**Quick Wins**: [Specific, actionable improvements]

[Repeat for each section]

## Top 5 Improvements (Ranked by Score Impact)

1. [Highest impact improvement] - affects [criteria] ([weight]%)
2. ...
3. ...
4. ...
5. ...

## Hedera Integration Depth Analysis

- Services detected: [list with evidence]
- Ecosystem integrations: [list or "none detected"]
- Creative usage: [describe or "none detected"]
- Recommendation: [specific services or integrations to add]
```

## Step 4: Prioritized Action Items

After the scorecard, provide a prioritized list of improvements ordered by impact on the final weighted score. Focus on:

1. **Execution improvements** (20% weight) - code quality, testing, documentation
2. **Success improvements** (20% weight) - network impact, account creation flows
3. **Integration improvements** (15% weight) - add more Hedera services, ecosystem partners
4. **Validation improvements** (15% weight) - add user feedback mechanisms

For each improvement, estimate the effort (quick fix, moderate, significant) and the potential score increase.

## Scoring Formula Reference

```
Weighted Score = (Score / 5) * (Section Weighting / 100 * 35)
Final Grade = (Sum of Weighted Scores / 35) * 100
```

## Important Notes

- Be constructive, not discouraging. Frame gaps as opportunities.
- Base scores on evidence found in the codebase, not assumptions.
- If you can't assess a criterion from the code (e.g., Validation, Pitch), say so explicitly and suggest how the team can document evidence.
- Refer to `references/judging-criteria.md` for the complete rubric with detailed 1/3/5 descriptors per criterion.
