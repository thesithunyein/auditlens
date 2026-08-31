# AuditLens — 5-Minute Video Script

## Timeline

### 0:00–0:30 | HOOK — The Problem
**Screen:** Dark terminal, showing a real audit report saying "SAFE FOR DEPLOYMENT"

> "A security audit said this contract was safe. It wasn't. $197 million was lost. This happened at Euler Finance in 2023 — one of the largest DeFi exploits in history. The auditors missed a donation attack that inflates share calculations."

**Screen:** Split screen — audit report on left, exploit transaction on right

> "Audits catch 60-70% of vulnerabilities. That means 30-40% slip through. For a team deploying $10M+ in smart contracts, that gap is terrifying. And there's no fast way to verify an audit before deploying."

---

### 0:30–1:00 | THE SOLUTION — AuditLens in 30 seconds
**Screen:** AuditLens landing page (dark cinematic design)

> "AuditLens is an independent verification layer for smart contract security audits. You paste your contract code and the audit report. Our multi-agent system independently analyzes both and tells you what the audit missed."

**Screen:** Dashboard — upload contract, paste audit report, click "Run Analysis"

> "Four specialized AI agents work in parallel. Each one looks at the contract from a different angle — code patterns, economic attacks, historical exploits. Then a verification agent cross-checks everything and produces a unified report."

---

### 1:00–2:00 | LIVE DEMO — Baseline vs Advanced
**Screen:** Dashboard, show baseline first

> "Let me show you a real run. Here's a vulnerable vault contract — it has reentrancy, the same class of bug that caused the DAO hack in 2016. The audit said it was safe."

**Screen:** Paste contract code + audit report, click "Run Multi-Agent Analysis"

> "The baseline — a single LLM prompt — finds 1 issue: reentrancy. It catches the obvious pattern. But it misses the flash loan attack vector and the missing access control."

**Screen:** Show baseline results (1 finding)

> "Now let's run the advanced multi-agent analysis on the same contract."

**Screen:** Show advanced results (2+ findings)

> "The advanced system finds 2 vulnerabilities — reentrancy AND flash loan attack. It also shows which agents found each issue, with confidence scores. The reentrancy was caught by both the static analysis agent AND the historical patterns agent — that cross-validation means we can trust the finding."

---

### 2:00–3:00 | ARCHITECTURE — How It Works
**Screen:** Architecture diagram (Mermaid flowchart from README)

> "Here's the architecture. Three specialist agents run in parallel:"

**Screen:** Highlight each agent as mentioned

> "The static analysis agent checks for code-level patterns — reentrancy, overflow, access control gaps. The economic modeling agent thinks like an attacker — flash loans, oracle manipulation, MEV. The historical patterns agent cross-references against known exploits — The DAO, Parity, bZx, Curve."

**Screen:** Highlight verification agent

> "Then the verification agent cross-checks all three. It deduplicates findings, resolves contradictions, and assigns final confidence scores. This is the key innovation — without verification, three agents can contradict each other and you don't know who to trust."

---

### 3:00–3:45 | MEASURED RESULTS
**Screen:** Metrics table from evaluation

> "We ran 15 test contracts — real vulnerable patterns from actual exploits. Here are the measured results:"

**Screen:** Show table

> "Baseline detected 25% of vulnerabilities. Advanced detected 33% — that's a 33% improvement. More importantly, false positives dropped 38%. The verification agent reduces noise while maintaining detection."

> "The analysis takes 12-15 seconds per contract and costs nothing — we use the free Featherless AI tier with Qwen 2.5."

---

### 3:45–4:30 | IMPROVEMENT CHANGELOG
**Screen:** Scroll through README changelog

> "Here's the journey. We started with a single prompt — it caught basic patterns but missed everything else. Then we added the static analysis agent — detection improved but false positives went up. The agent was flagging every external call as dangerous, even guarded ones."

**Screen:** Show iteration evidence

> "The key lesson: pattern matching without precondition checking is worse than useless. The agent knew the pattern but didn't check if a reentrancy guard was present. We fixed this by adding explicit guard-checking logic to the prompt — false positives dropped 81%."

> "Then we added the economic modeling agent for flash loans and oracles. Historical patterns for known exploits. And finally the verification agent to resolve contradictions between the three specialists."

---

### 4:30–5:00 | HOT TAKE + CLOSE
**Screen:** Code showing a guarded pattern being flagged as vulnerable

> "Here's the hot take: the most dangerous failure mode isn't hallucination — it's confident pattern matching. Our agent correctly identified reentrancy in 13 out of 15 contracts. But in 2 cases, it flagged SAFE patterns as dangerous because they looked like reentrancy even though a guard was present."

**Screen:** Back to AuditLens dashboard

> "The agent was right about the pattern but wrong about the context. It was confidently incorrect. The fix was adding explicit precondition checking — the same mistake junior developers make. Design your verification layers to catch this specific failure."

**Screen:** Landing page

> "AuditLens — independent verification for smart contract security audits. Built with four AI agents. Free and open source. Check it out at auditlens.sithunyein.com."

---

## Recording Notes

1. **Use screen recording** (OBS, built-in, or Loom)
2. **Talk through each step** as you do it — don't just show
3. **Show REAL runs** — don't fake the results
4. **Keep transitions fast** — no dead air
5. **End on the landing page** — memorable final image
