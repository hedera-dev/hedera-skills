# Hackathon PRD Template

Use this template when generating PRDs for hackathon projects. Every section maps to one or more judging criteria sections. The PRD should be written to a markdown file in the project repository.

---

# [Project Name] - Hackathon PRD

## 1. Problem Statement
> What problem are you solving? Why does it matter?

[Clear articulation of the problem. Should be big enough for sustained growth.]

**Target Users**: [Who experiences this problem?]
**Current Solutions**: [What exists today? Why is it insufficient?]
**Why Web3?**: [Why can't this be solved with Web2? What does decentralization/tokenization/consensus add?]

---

## 2. Solution Overview
> How does your project solve this problem?

[1-2 paragraph description of the solution]

**Hackathon Track Alignment**: [Which track(s) does this align to and why?]

### Key Features (MVP)
1. [Feature 1] - [Why this feature for MVP?]
2. [Feature 2] - [Why this feature for MVP?]
3. [Feature 3] - [Why this feature for MVP?]

### Non-Goals (v1)
- [What you explicitly won't build]
- [Scope boundaries]

---

## 3. Hedera Integration Architecture
> How does your solution leverage the Hedera network?

### Network Services Used
| Service | Purpose | Why This Service? |
|---------|---------|-------------------|
| [e.g. HTS] | [e.g. Token creation for loyalty points] | [e.g. Native token with custom fees enables automatic royalty distribution] |
| [e.g. HCS] | [e.g. Audit trail for transactions] | [e.g. Ordered, timestamped consensus provides tamper-proof records] |

### Ecosystem Integrations
| Partner/Platform | Integration Type | Value Added |
|-----------------|------------------|-------------|
| [e.g. SaucerSwap] | [e.g. Liquidity pool for project token] | [e.g. Enables token trading from day 1] |
| [e.g. HashPack] | [e.g. Wallet connect for user auth] | [e.g. Frictionless onboarding for existing Hedera users] |

### Architecture Diagram
[Text-based or linked architecture diagram showing Hedera service interactions]

---

## 4. Hedera Network Impact
> How does your solution grow the Hedera ecosystem?

### Account Creation
- [How does your solution drive new Hedera account creation?]
- [Estimated accounts: ___]

### Active Accounts
- [How does your solution drive monthly active accounts?]
- [Estimated MAA: ___]

### Transactions Per Second (TPS)
- [What transactions does your solution generate?]
- [Estimated daily transactions: ___]

### Audience Exposure
- [What new audiences does this bring to Hedera?]
- [Target market size: ___]

---

## 5. Innovation & Differentiation
> What makes this solution unique?

### Ecosystem Gap
[What capability is missing from the Hedera ecosystem that this fills?]

### Cross-Chain Comparison
[Does this exist on other chains? If so, what's different about your approach?]

### Novel Hedera Usage
[Are you using any Hedera service in a creative or non-obvious way?]

---

## 6. Feasibility & Business Model
> Can this be built and sustained?

### Technical Feasibility
- **Hedera Services Required**: [List all services needed]
- **Team Capabilities**: [Skills the team brings]
- **Technical Risks**: [What could go wrong technically?]
- **Mitigation**: [How will you handle risks?]

### Business Model (Lean Canvas)
| Element | Description |
|---------|-------------|
| **Problem** | [Top 3 problems] |
| **Solution** | [Top 3 solutions] |
| **Key Metrics** | [What you'll measure] |
| **Unique Value Prop** | [Single clear message] |
| **Unfair Advantage** | [What can't be copied] |
| **Channels** | [Path to users] |
| **Customer Segments** | [Target users] |
| **Cost Structure** | [Fixed and variable costs] |
| **Revenue Streams** | [How you make money] |

### Why Web3 is Required
[Specific explanation of why this solution cannot exist on Web2]

---

## 7. Execution Plan
> How will you build and ship this?

### MVP Scope (Hackathon)
| Feature | Priority | Estimated Effort | Hedera Service |
|---------|----------|-----------------|----------------|
| [Feature 1] | P0 | [hours/days] | [service] |
| [Feature 2] | P0 | [hours/days] | [service] |
| [Feature 3] | P1 | [hours/days] | [service] |

### Team Roles
| Member | Role | Key Responsibilities |
|--------|------|---------------------|
| [Name] | [Role] | [What they own] |

### Design Decisions
| Decision | Options Considered | Choice | Rationale |
|----------|-------------------|--------|-----------|
| [e.g. Token standard] | [HTS native vs ERC-20] | [HTS native] | [Lower cost, native compliance controls] |

### Post-Hackathon Roadmap
- **Month 1-2**: [Immediate next steps]
- **Month 3-6**: [Growth phase]
- **Month 6-12**: [Scale phase]

---

## 8. Validation Strategy
> How will you prove market demand?

### Feedback Sources
- [Who will you get feedback from?]
- [How will you reach them?]

### Validation Milestones
| Milestone | Target | Timeline |
|-----------|--------|----------|
| Early adopter signups | [number] | [when] |
| First feedback cycle | [description] | [when] |
| Paid trials / revenue | [target] | [when] |

### Market Feedback Cycles
1. [Cycle 1: e.g. Deploy beta, collect feedback from X users]
2. [Cycle 2: e.g. Iterate on feedback, re-test with Y users]

---

## 9. Go-To-Market Strategy
> How will you reach users?

### Target Market
- **Total Addressable Market (TAM)**: [size]
- **Serviceable Addressable Market (SAM)**: [size]
- **Initial Target Segment**: [specific group]

### Distribution Channels
1. [Channel 1 and strategy]
2. [Channel 2 and strategy]

### Growth Strategy
- [How you plan to grow after launch]
- [Partnership opportunities]

---

## 10. Pitch Outline
> Key points for your presentation

1. **The Problem** (30 sec): [Hook + problem statement]
2. **The Solution** (60 sec): [What you built + demo highlights]
3. **Hedera Integration** (45 sec): [How/why Hedera is core to the solution]
4. **Traction** (30 sec): [Users, feedback, metrics to date]
5. **The Opportunity** (30 sec): [Market size, growth potential, revenue model]
6. **The Ask / Next Steps** (15 sec): [What you need, what's next]

### Key Metrics to Present
- [Metric 1 with data source]
- [Metric 2 with data source]
- [Metric 3 with data source]

---

## Parking Lot (Future Ideas)
> Good ideas that are not in scope for the hackathon

- [Idea 1]
- [Idea 2]

---

## Section-to-Criteria Mapping

| PRD Section | Judging Criteria Addressed |
|-------------|---------------------------|
| 1. Problem Statement | Feasibility, Pitch |
| 2. Solution Overview | Innovation, Pitch, Execution |
| 3. Hedera Integration | Integration (primary), Innovation |
| 4. Network Impact | Success (primary) |
| 5. Innovation | Innovation (primary) |
| 6. Feasibility & Business Model | Feasibility (primary) |
| 7. Execution Plan | Execution (primary) |
| 8. Validation Strategy | Validation (primary) |
| 9. Go-To-Market | Execution, Success |
| 10. Pitch Outline | Pitch (primary) |
