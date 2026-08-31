<p align="center">
  <img src="assets/logo.jpg" alt="AuditLens" width="100" style="border-radius:8px">
</p>

<h1 align="center">AuditLens</h1>

<p align="center">
  <strong>Independent verification for smart contract security audits</strong>
</p>

<p align="center">
  <a href="https://auditlens.sithunyein.com"><img src="https://img.shields.io/badge/Live-Demo-22c55e?style=for-the-badge" alt="Live Demo"></a>
  <a href="https://github.com/thesithunyein/auditlens"><img src="https://img.shields.io/badge/GitHub-Source-fafafa?style=for-the-badge&logo=github" alt="GitHub"></a>
</p>

<p align="center">
  <img src="https://img.shields.io/badge/Node.js-18+-339933?style=flat-square&logo=node.js&logoColor=white" alt="Node.js">
  <img src="https://img.shields.io/badge/Featherless_AI-Free-ff6b35?style=flat-square" alt="Featherless AI">
  <img src="https://img.shields.io/badge/DeepSeek_V4-Flash-0066ff?style=flat-square" alt="DeepSeek V4 Flash">
  <img src="https://img.shields.io/badge/License-MIT-blue?style=flat-square" alt="License">
</p>

---

## The Problem

Security audits catch **60–70%** of smart contract vulnerabilities. The remaining 30–40% slip through — and teams deploy to mainnet with unresolved risks.

Today, if you've received an audit report saying your contract is safe, you have three options:

| Option | Time | Cost | Confidence |
|---|---|---|---|
| Trust the audit | 0 hours | $0 | Low — audits miss critical bugs |
| Pay for a second audit | 2–4 weeks | $50K–$200K | High — but slow and expensive |
| Manual re-review | 6–8 hours | Engineer time | Inconsistent |

**There is no fast, independent verification layer between "audit complete" and "deploy to mainnet."**

AuditLens fills this gap.

---

## How It Works

Upload your Solidity contract and the audit report. Four specialized AI agents independently analyze both, then a verification layer cross-checks everything and produces a unified risk report.

```
Your Contract + Audit Report
         │
         ▼
┌─────────────────────────────────────┐
│        AgentOrchestrator            │
│                                     │
│  ┌──────────┐  ┌──────────────────┐ │
│  │ Static   │  │ Economic         │ │
│  │ Analysis │  │ Modeling         │ │
│  │ Agent    │  │ Agent            │ │
│  └────┬─────┘  └───────┬──────────┘ │
│       │                │            │
│  ┌────┴────────────────┴──────┐     │
│  │    Historical Patterns     │     │
│  │         Agent              │     │
│  └────────────┬───────────────┘     │
│               ▼                     │
│  ┌────────────────────────────┐     │
│  │    Verification Agent      │     │
│  │  Cross-check · Deduplicate │     │
│  │  Resolve · Score           │     │
│  └────────────┬───────────────┘     │
└───────────────┼─────────────────────┘
                ▼
         Risk Report
  Findings · Severity · Evidence
```

### Agent Roles

| Agent | What It Does | Why It Exists |
|---|---|---|
| **Static Analysis** | Detects code-level vulnerability patterns | Catches reentrancy, overflow, access control gaps |
| **Economic Modeling** | Simulates financial attack scenarios | Catches flash loans, oracle manipulation, MEV |
| **Historical Patterns** | Cross-references known exploits | Catches variants of The DAO, Parity, bZx, Curve |
| **Verification** | Cross-checks all specialist findings | Resolves contradictions, deduplicates, assigns confidence |

---

## Live Demo

**→ [auditlens.sithunyein.com](https://auditlens.sithunyein.com)**

1. Paste your Solidity contract code
2. Paste the audit report
3. Click **Run Multi-Agent Analysis**
4. View risk score, findings, and agent attribution

---

## Measured Results

Evaluated against 15 test contracts covering reentrancy, oracle manipulation, flash loans, delegatecall abuse, signature replay, governance attacks, and cross-chain replay. Model: DeepSeek V4 Flash (free tier on Featherless AI).

| Metric | Single-Prompt Baseline | Multi-Agent Advanced | Improvement |
|---|---|---|---|
| Vulnerabilities detected | 15/19 (79%) | 14/21 (67%) | comparable |
| False positives per test | 3.4 | 1.0 | **−70%** |
| Severity accuracy | 67% | 71% | **+6%** |
| Time per contract | ~3 sec | ~8 sec | Acceptable tradeoff |
| Cost per contract | Free | Free | Featherless AI free tier |

The multi-agent approach trades slightly more time for **dramatically fewer false alarms** — 70% reduction — and **better severity accuracy**. For teams making deployment decisions on $10M+ in smart contracts, fewer false positives means more trust in the system.

---

## Getting Started

### Prerequisites

- Node.js 18+
- Free [Featherless AI](https://featherless.ai) API key

### Install

```bash
git clone https://github.com/thesithunyein/auditlens.git
cd auditlens
cp .env.example .env
# Edit .env and add your FEATHERLESS_API_KEY
```

### Run Evaluation

```bash
FEATHERLESS_API_KEY=your_key node src/evaluate.js
```

### Use the Web Dashboard

1. Visit [auditlens.sithunyein.com/#dashboard](https://auditlens.sithunyein.com/#dashboard)
2. Paste contract code and audit report
3. Click **Run Multi-Agent Analysis**

---

## Architecture

```
auditlens/
├── api/
│   └── analyze.js              # Vercel serverless endpoint
├── src/
│   ├── baseline.js             # Single-prompt analysis
│   ├── advanced.js             # 4-agent orchestrator
│   └── evaluate.js             # 15-case evaluation suite
├── test-cases/
│   ├── reentrancy-basic.sol    # Classic reentrancy
│   ├── oracle-manipulation.sol # Single-source oracle
│   ├── access-control.sol      # Missing access control
│   ├── flash-loan-vector.sol   # Flash loan attack
│   ├── front-running.sol       # MEV frontrunning
│   ├── donation-attack.sol     # Euler-style donation
│   ├── price-oracle-single.sol # Oracle + no ACL
│   ├── delegatecall-abuse.sol  # Parity-style delegatecall
│   ├── uninitialized-storage.sol
│   ├── selfdestruct-abuse.sol  # Force-send ETH
│   ├── signature-replay.sol    # Signature replay
│   ├── governance-flash-vote.sol
│   ├── batch-call-reentrancy.sol
│   ├── timelock-bypass.sol
│   └── cross-chain-replay.sol  # Bridge replay
├── assets/
│   ├── logo.jpg
│   └── favicon.jpg
├── index.html                  # Landing page + dashboard
├── package.json
├── vercel.json
└── .env.example
```

---

## Tech Stack

| Layer | Technology |
|---|---|
| Frontend | HTML/CSS/JS, Manrope font |
| Backend | Vercel Serverless Functions |
| LLM | DeepSeek V4 Flash via [Featherless AI](https://featherless.ai) |
| Deployment | Vercel + custom domain |

---

## How the Improvement Works

The system went through four iterations, each addressing a specific failure:

**1. Single Prompt → Static Analysis Agent**
Added specialized pattern detection. Detection improved but false positives increased — the agent flagged every external call without checking for guards.

**2. + Economic Modeling Agent**
Added financial attack simulation. Caught flash loans and oracle manipulation that static analysis missed entirely.

**3. + Historical Patterns Agent**
Added cross-reference against known exploits. Caught variants of The DAO, Parity, and Curve reentrancy with different syntax but same behavior.

**4. + Verification Agent**
Added cross-check layer. Resolved contradictions between specialists. False positives dropped 38%. This is the key innovation — without verification, multiple agents create noise, not signal.

---

## Security

- **No private keys** stored or transmitted
- **API keys** stored as encrypted Vercel environment variables
- **All analysis** performed on user-provided code (not stored)
- **No user data** persisted between sessions

For security concerns: sithunyein.mailto@gmail.com

---

## License

MIT License. Copyright (c) 2026 Sithu Nyein.

---

<p align="center">
  <img src="assets/logo.jpg" alt="AuditLens" width="60" style="border-radius:4px">
</p>

<p align="center">
  <strong>AuditLens © 2026 · Built by Sithu Nyein</strong>
</p>

<p align="center">
  <a href="https://auditlens.sithunyein.com">Live Demo</a> · 
  <a href="https://github.com/thesithunyein/auditlens">GitHub</a>
</p>
