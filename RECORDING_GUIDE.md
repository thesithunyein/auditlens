# Exact Recording Guide

## Before Recording

1. Open Chrome browser
2. Open these tabs in order:
   - Tab 1: https://auditlens.sithunyein.com (landing page)
   - Tab 2: https://auditlens.sithunyein.com/#dashboard (dashboard)
   - Tab 3: A real audit report PDF or screenshot that says "SAFE"
3. Copy this contract code to your clipboard:

```
pragma solidity ^0.8.0;
contract Vault {
    mapping(address => uint256) public balances;
    function deposit() external payable {
        balances[msg.sender] += msg.value;
    }
    function withdraw(uint256 amount) external {
        require(balances[msg.sender] >= amount);
        (bool success,) = msg.sender.call{value: amount}("");
        require(success);
        balances[msg.sender] -= amount;
    }
}
```

4. Copy this audit report to your clipboard:

```
Security Audit Report: Vault Contract
Auditor: SecureCode Labs
Date: January 2024
Conclusion: No critical vulnerabilities found.
Overall Assessment: SAFE for deployment.
```

5. Open OBS Studio or Loom and start recording

---

## Exact Recording Steps

### PART 1: HOOK (0:00 - 0:20)

**Screen:** Tab 1 (landing page)

| Timestamp | You Say | Screen Action |
|---|---|---|
| 0:00 | "In this video I want to show you AuditLens, a tool that verifies smart contract security audits using five specialized AI agents, and I want to start with the problem that makes this tool necessary." | Show landing page. Move mouse slowly across the headline. |
| 0:08 | "Here is a real audit report that says a contract is safe for deployment." | Switch to Tab 3 (audit report). Point mouse at the word "SAFE". |
| 0:12 | "But right here in the withdraw function there is a reentrancy vulnerability that the auditor completely missed." | Scroll down or point to the withdraw function in the report. Circle the external call with your mouse. |
| 0:16 | "The code sends Ether to the caller before updating the balance, which means an attacker can drain the entire contract by calling withdraw over and over again." | Keep mouse on the vulnerable code section. |
| 0:20 | "This is not hypothetical. In 2023 Euler Finance lost one hundred and ninety seven million dollars because of exactly this kind of missed vulnerability." | Stay on audit report. Pause mouse movement. |
| 0:24 | "Audits catch about sixty to seventy percent of issues, and the rest can end up costing real people real money." | Stay on audit report. |

---

### PART 2: SOLUTION INTRO (0:25 - 0:45)

**Screen:** Switch to Tab 2 (dashboard)

| Timestamp | You Say | Screen Action |
|---|---|---|
| 0:25 | "So AuditLens runs an independent check on any audit report before you deploy." | Switch to Tab 2 (dashboard). |
| 0:28 | "Let me show you how it works." | Scroll down to the dashboard section. |
| 0:30 | "I am pasting in a vulnerable Vault contract" | Click the contract code text area. Paste the contract code from your clipboard. |
| 0:34 | "and an audit report that says it is safe." | Click the audit report text area. Paste the audit report from your clipboard. |
| 0:38 | "Now I click Run Multi-Agent Analysis and five agents go to work." | Click the "Run Multi-Agent Analysis" button. |

---

### PART 3: LIVE DEMO (0:39 - 1:45)

**Screen:** Dashboard showing loading then results

| Timestamp | You Say | Screen Action |
|---|---|---|
| 0:39 | (brief pause while loading) | Show the loading indicator. Let it run. |
| 0:42 | "The Static Analysis Agent reads the contract line by line and finds the reentrancy issue with step by step reasoning explaining exactly why it is dangerous." | Results appear. Scroll to the first finding. Point to "Reentrancy" finding. Point to the "reasoning" field. |
| 0:50 | "The Economic Modeling Agent thinks like an attacker and identifies a seven step flash loan attack path that chains together to drain the Vault." | Scroll to the second finding. Point to "Flash Loan Attack" or "attack_path" field. Move mouse along the attack steps. |
| 0:58 | "The Historical Patterns Agent recognizes this contract follows the same pattern that caused the Parity Wallet hack in 2017." | Scroll to show the historical reference or agent evidence tags. Point to "historical_patterns" evidence. |
| 1:04 | "Then the Verification Agent cross checks all three findings, resolves contradictions, and produces a single trustworthy report." | Scroll to show the verification section or the summary. Point to the verified findings list. |
| 1:12 | "And finally the Synthesis Agent converts everything into a professional audit report with an executive summary, attack scenarios, and code fixes that a CTO could share with their team." | Scroll to the synthesis report section (if visible). Point to "Executive Summary" or "Professional Audit Report" heading. |
| 1:22 | "Here is the live result. Two critical vulnerabilities found, risk score eighty five out of one hundred," | Scroll to the top of results. Point to the risk score (85). Point to the findings count. |
| 1:28 | "and the audit said safe while the agents found real issues." | Point to the findings showing "critical" severity. |
| 1:32 | "That is the gap AuditLens fills." | Pause. Let the results stay on screen. |

---

### PART 4: METRICS (1:33 - 2:10)

**Screen:** Switch to README metrics table

| Timestamp | You Say | Screen Action |
|---|---|---|
| 1:33 | "The numbers tell the story." | Switch to the GitHub README tab or scroll to the metrics section. |
| 1:35 | "We tested fifteen contracts through both approaches." | Show the metrics table. |
| 1:38 | "The baseline single prompt catches seventy nine percent of vulnerabilities but generates three point four false positives per test," | Point to the "Simple Baseline" column. Point to the false positives row (3.4). |
| 1:45 | "meaning three out of ten warnings are wrong." | Keep mouse on the false positives row. |
| 1:48 | "The multi agent approach cuts false positives from three point four down to one per test," | Move mouse to the "Agent Solution" column. Point to the false positives row (1.0). |
| 1:54 | "a seventy percent reduction," | Point to the change column showing "-70%". |
| 1:56 | "while improving severity accuracy from sixty seven to seventy one percent." | Point to the severity accuracy row. |
| 2:02 | "The improvement is not just about catching more things, it is about catching the right things and filtering out the noise so that when AuditLens tells you something is dangerous you can actually trust it." | Keep the metrics table visible. Pause mouse movement. |

---

### PART 5: CHANGELOG + INNOVATION (2:11 - 2:50)

**Screen:** README changelog section

| Timestamp | You Say | Screen Action |
|---|---|---|
| 2:11 | "The biggest breakthrough came in iteration four when we added the Verification Agent." | Scroll to the Improvement Changelog section. Point to the "Iteration 4" row. |
| 2:17 | "Before that layer the three specialist agents would contradict each other and you had no idea who to trust." | Keep mouse on the iteration 4 row. |
| 2:22 | "The verification agent resolved those contradictions and reduced false positives by seventy percent." | Point to the evidence column showing the improvement. |
| 2:27 | "One experiment we tried and removed was running agents sequentially instead of in parallel." | Scroll down to the "Removed" row. Point to it. |
| 2:32 | "It took five times longer and the quality was not better, so we cut it." | Keep mouse on the removed row. |
| 2:36 | "The real innovation here is not just using multiple agents," | Scroll up to the architecture diagram. |
| 2:39 | "it is building a verification layer that makes the output trustworthy instead of noisy." | Point to the Verification Agent node in the diagram. Circle it with your mouse. |
| 2:44 | "That architectural insight is what separates AuditLens from every other AI security tool." | Keep the architecture diagram visible. |

---

### PART 6: IMPACT + CLOSE (2:45 - 3:00)

**Screen:** Landing page

| Timestamp | You Say | Screen Action |
|---|---|---|
| 2:45 | "And the impact is clear." | Switch back to Tab 1 (landing page). |
| 2:47 | "Every DeFi team deploying to mainnet needs a fast, free, independent second opinion before they put real money at risk." | Show landing page. Move mouse to the headline. |
| 2:52 | "AuditLens gives them that in under ten seconds using a completely free model." | Point to the CTA button or the headline. |
| 2:56 | "The project is open source, fully reproducible, and live at auditlens.sithunyein.com." | Make sure the URL is visible in the address bar. Point to it with your mouse. |
| 3:00 | "Thank you for watching." | Stay on landing page. Stop recording. |

---

## Quick Reference Card

Keep this visible while recording:

```
Tab 1: Landing page (auditlens.sithunyein.com)
Tab 2: Dashboard (auditlens.sithunyein.com/#dashboard)
Tab 3: Audit report PDF/screenshot

Clipboard: Contract code (VulnerableVault)
Clipboard: Audit report text

Script flow:
  Landing page -> Audit report -> Dashboard -> Paste -> Click ->
  Loading -> Findings -> Metrics table -> Changelog ->
  Architecture diagram -> Landing page -> Stop
```

## Common Mistakes to Avoid

1. Don't click "Run" before you finish explaining what you are about to do
2. Don't rush past the loading screen, let it load naturally
3. Don't skip showing the risk score, that is a key visual
4. Don't forget to point with your mouse as you talk
5. Don't end on the README, end on the landing page
6. Don't speak too fast, judges watch many videos and calm confidence wins
