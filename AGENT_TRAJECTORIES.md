# AuditLens — Agent Trajectories

## Tool Used
**Codebuff (Freebuff Desktop)** — AI coding agent powered by LLM inference

## Trajectory Summary

This document records how the coding agent was used to build AuditLens from concept to deployment across the hackathon period.

---

## Trajectory 1: Project Inception & Architecture Design

### Agent Instructions
> "Deep research and give me the best project idea for this hackathon to win 1st"

### Agent Reasoning
The agent analyzed the micro1 hackathon rubric (Problem 15%, Engineering 30%, Quality 20%, Improvement 15%, Reproducibility 15%) and proposed three ideas:
1. **AuditLens** — Verify smart contract security audits with multi-agent AI
2. AgentTrust — AI agent verification platform  
3. Risk Intel — DeFi risk intelligence

The agent recommended AuditLens because:
- Directly relevant to micro1's domain (AI agent quality)
- Clear measurable improvement (baseline vs multi-agent)
- Unique angle no one else would think of
- Public data = easy reproducibility

### Human Decision
User selected AuditLens. Asked for detailed architecture.

### Agent Output
Detailed 4-agent architecture:
- Static Analysis Agent (code patterns)
- Economic Modeling Agent (attack simulation)
- Historical Patterns Agent (known exploits)
- Verification Agent (cross-check + resolution)

With policy schema, Rust evaluator pseudocode, and 6-phase build schedule.

---

## Trajectory 2: Project Setup & Deployment

### Agent Instructions
> "Build now and then create repo and live site (auditlens.sithunyein.com)"

### Agent Actions
1. Created project structure: `mkdir -p auditlens`
2. Built landing page (`index.html`) — dark cinematic design with video background
3. Created API endpoint (`api/analyze.js`) — Vercel serverless function
4. Created agent workflow files (`src/baseline.js`, `src/advanced.js`)
5. Created 5 test cases (`.sol` files)
6. Initialized git, created GitHub repo (`thesithunyein/auditlens`)
7. Deployed to Vercel with custom domain
8. Set up API key as encrypted environment variable

### Tool Responses
- `git init` → success
- `gh repo create` → https://github.com/thesithunyein/auditlens
- `vercel --yes` → deployed to auditlens-chi.vercel.app
- `curl /api/analyze` → 200 OK with findings

---

## Trajectory 3: API Key Integration

### Agent Instructions
> "Use this key rc_a055920a... and check credit first"

### Agent Actions
1. Researched Featherless AI API documentation
2. Tested the API key with curl → confirmed working
3. Updated API endpoint from OpenAI to Featherless
4. Set FEATHERLESS_API_KEY as Vercel env variable
5. Tested end-to-end → 200 OK with real findings

### Error Encountered
Key format `rc_` was not OpenAI format. Agent identified it as Featherless AI key and adapted the codebase.

---

## Trajectory 4: Logo Integration

### Agent Instructions
> "Use this logo exact for main app logo, web bar logo and readme center logo"

### Agent Actions
1. Copied logo file to `assets/logo.jpg`
2. Updated HTML topbar to use `<img>` instead of inline SVG
3. Added favicon (`assets/favicon.jpg`)
4. Updated README with centered logo at top
5. Verified all asset URLs return 200 OK

---

## Trajectory 5: UI/UX Refinement

### Agent Instructions
> "Make it look like a real product, not a demo"

### Agent Actions
1. Replaced pill buttons with sharp 4px corners (matching logo aesthetic)
2. Added green accent lines on cards and section headers
3. Added mouse cursor glow effect (green radial gradient following cursor)
4. Made all nav links functional with smooth scroll
5. Added mobile responsive breakpoints (900px, 480px)
6. Added staggered entrance animations
7. Changed footer to "© 2026 AuditLens · Built by Sithu Nyein"
8. Removed all "demo" and "example" placeholder text

### Tool Responses
- CSS changes verified via live site screenshots
- Mobile responsive tested via viewport changes

---

## Trajectory 6: Reproducibility Fix

### Agent Instructions
> "Fix everything — src/ files, README, test cases"

### Agent Actions
1. Rewrote `src/baseline.js` — replaced OpenAI with Featherless API
2. Rewrote `src/advanced.js` — replaced OpenAI with Featherless API, added parallel execution
3. Updated `src/evaluate.js` — expanded from 5 to 15 test cases with ground truth
4. Added 10 new test cases: donation attack, price oracle, delegatecall, uninitialized storage, selfdestruct, signature replay, governance flash vote, cross-function reentrancy, timelock bypass, cross-chain replay
5. Updated README reproduction guide for Featherless
6. Removed `openai` dependency from `package.json`
7. Verified syntax: `node -c src/*.js` → all pass

### Error Encountered
Template literal syntax error in VERIFICATION_PROMPT (`\";` instead of backtick). Agent found and fixed the broken closing quote.

---

## Trajectory 7: Full Evaluation Run

### Agent Instructions
> "Run the full evaluation on all 15 test cases"

### Agent Actions
1. Loaded API key from `.env`
2. Ran `node src/evaluate.js` — 15 test cases × 2 approaches
3. Each test case: baseline (1 LLM call) + advanced (4 agent calls)
4. Collected per-test detection rates, false positives, severity accuracy
5. Generated aggregate metrics table
6. Saved results to `results/evaluation-report.json`

### Measured Results
| Metric | Baseline | Advanced | Change |
|---|---|---|---|
| Detection | 4/16 (25%) | 7/21 (33%) | +33% |
| False Positives | 2.5/test | 1.5/test | -38% |

### Agent Analysis
The 7B model is the bottleneck — catches basic patterns but misses complex economic attacks. The architecture is sound but model ceiling limits improvement magnitude.

---

## Trajectory 8: Repository Configuration

### Agent Instructions
> "Fill in the GitHub repo description and topics"

### Agent Actions
1. Set description: "Independent multi-agent verification for smart contract security audits — catches what auditors miss"
2. Added 10 topics: smart-contract-security, solidity, ai-agents, multi-agent, defi, security-audit, llm, blockchain, web3, agent-verification
3. Verified via `gh repo view` → all set

---

## Key Learning: What Shaped the Next Step

| Feedback | Agent Action |
|---|---|
| "This looks like a demo" | Replaced pill buttons, added sharp corners, removed placeholder text |
| "Why 4 agents not 3 or 6?" | Explained: 3 specialists + 1 verification = minimum viable multi-agent system |
| "Can I use Featherless API?" | Researched API, tested key, rewrote all source files to use it |
| "The footer still shows hackathon" | Updated to "© 2026 AuditLens · Built by Sithu Nyein" |
| "Rate honestly" | Gave 72/100 with specific rubric breakdown and improvement roadmap |

---

## Retry/Checkpoint Log

| Attempt | Issue | Resolution |
|---|---|---|
| API deploy | OpenAI key format wrong (`rc_` not `sk-`) | Identified as Featherless, rewrote API |
| Template literal | Broken backtick in VERIFICATION_PROMPT | Fixed closing quote |
| Specialist merge | `specialistFindings` crashed Vercel function | Added try/catch defensive checks |
| Evaluation | `export` failed with comments in .env | Set env var inline on command line |
| Git push | `results/` in .gitignore | Used `git add -f` to force include |

---

*Trajectories captured from Codebuff (Freebuff Desktop) agent session during micro1 Frontier Engineering Challenge 2026.*
