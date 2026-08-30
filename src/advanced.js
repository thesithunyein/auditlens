/**
 * AuditLens Advanced — Multi-Agent Orchestrator
 * 
 * Four specialized agents + verification layer:
 * 1. Static Analysis Agent — AST-level vulnerability pattern detection
 * 2. Economic Modeling Agent — Attack simulation (flash loans, oracles)
 * 3. Historical Patterns Agent — Cross-reference known exploits
 * 4. Verification Agent — Cross-check findings, resolve contradictions
 */

import OpenAI from 'openai';

const client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

// ─── AGENT 1: Static Analysis ───
const STATIC_ANALYSIS_PROMPT = `You are a specialized static analysis agent for Solidity smart contracts.
Your ONLY job is to detect code-level vulnerability patterns by analyzing the AST structure.

Focus on:
- Reentrancy (external calls before state updates)
- Integer overflow/underflow (unchecked arithmetic)
- Unchecked return values (low-level calls)
- Access control gaps (missing modifiers)
- Timestamp dependence
- Front-running vulnerabilities
- Uninitialized storage pointers
- Delegatecall to untrusted contracts
- Self-destruct abuse
- tx.origin authentication

For each finding, output:
{
  "vulnerability": "name",
  "severity": "critical|high|medium|low",
  "line_range": "start-end",
  "pattern": "what code pattern triggered this",
  "precondition": "what must be true for this to be exploitable",
  "confidence": 0-100
}

Be SPECIFIC about line ranges and patterns. Do NOT flag patterns that have proper guards.`;

// ─── AGENT 2: Economic Modeling ───
const ECONOMIC_MODELING_PROMPT = `You are a specialized economic attack simulation agent.
Your ONLY job is to identify financial attack vectors on DeFi smart contracts.

Analyze for:
- Flash loan attack vectors (price manipulation, reentrancy via flash loans)
- Oracle manipulation (single-source oracles, stale prices, TWAP bypass)
- MEV extraction (sandwich attacks, frontrunning)
- Governance attacks (flash loan voting, proposals)
- Liquidity manipulation (just-in-time liquidity, pool draining)
- Cross-contract composability risks (protocol A + protocol B = exploit)
- Economic invariant violations (total supply > reserves, etc.)

For each attack vector:
{
  "attack_type": "flash_loan|oracle|mev|governance|composability",
  "scenario": "step-by-step description of the attack",
  "impact": "estimated financial loss or mechanism failure",
  "requires": ["what conditions must be true"],
  "confidence": 0-100
}

Think like an attacker. What would you exploit?`;

// ─── AGENT 3: Historical Patterns ───
const HISTORICAL_PROMPT = `You are a historical exploit pattern matching agent.
Your ONLY job is to cross-reference contract code against known DeFi exploits.

Known exploit patterns to check:
- The DAO (2016): reentrancy via recursive calls
- Parity Wallet (2017): uninitialized library delegatecall
- Bancor (2018): price oracle manipulation
- bZx (2020): flash loan price manipulation
- Harvest Finance (2020): flash loan + price oracle
- Cream Finance (2021): reentrancy + flash loans
- Mango Markets (2022): oracle manipulation + position manipulation
- Curve (2023): Vyper compiler reentrancy bug
- Euler Finance (2023): donation attack + flash loans
- Mango Max (2023): oracle manipulation
- Socket Gateway (2024): approval exploit
- Various bridge exploits: signature validation failures

For each matching pattern:
{
  "historical_exploit": "name and year",
  "similarity": "what's similar in this contract",
  "difference": "what's different",
  "risk_level": "high|medium|low",
  "confidence": 0-100
}

Also note if the contract uses patterns from protocols that HAVE been exploited.`;

// ─── AGENT 4: Verification ───
const VERIFICATION_PROMPT = `You are a verification agent. You receive findings from three specialized agents.
Your job is to:
1. Cross-check findings for contradictions
2. Resolve conflicting severity ratings
3. Deduplicate findings that describe the same issue differently
4. Assign final confidence scores based on agreement across agents
5. Identify the TOP 5 most critical findings

Input: JSON with three arrays (static_analysis, economic_modeling, historical_patterns).

Output:
{
  "verified_findings": [
    {
      "vulnerability": "name",
      "severity": "critical|high|medium|low",
      "description": "unified description",
      "evidence": ["which agents found this"],
      "confidence": 0-100,
      "agents_agree": true|false
    }
  ],
  "contradictions": [
    {
      "finding": "what's disputed",
      "agent_a": "position",
      "agent_b": "position",
      "resolution": "which is correct and why"
    }
  ],
  "top_5_critical": ["vulnerability names"],
  "overall_risk_score": 0-100
}`;

// ─── ORCHESTRATOR ───
async function runAgent(name, systemPrompt, content) {
  console.log(`  Running ${name}...`);
  const start = Date.now();
  
  const response = await client.chat.completions.create({
    model: 'gpt-4',
    messages: [
      { role: 'system', content: systemPrompt },
      { role: 'user', content }
    ],
    temperature: 0.1,
    max_tokens: 4000
  });

  const text = response.choices[0].message.content;
  const elapsed = Date.now() - start;
  console.log(`  ${name} completed in ${elapsed}ms`);
  
  try {
    return JSON.parse(text);
  } catch {
    const match = text.match(/```json?\s*([\s\S]*?)```/);
    if (match) return JSON.parse(match[1]);
    return { raw: text, parse_error: true };
  }
}

export async function advancedAnalysis(contractCode, auditReport) {
  const context = `## Contract Code\n\`\`\`solidity\n${contractCode}\n\`\`\`\n\n## Audit Report\n${auditReport}`;
  
  console.log('=== AuditLens Advanced: Multi-Agent Analysis ===\n');
  const totalStart = Date.now();

  // Run agents in parallel (they're independent)
  console.log('Phase 1: Specialist Agents');
  const [staticResult, economicResult, historicalResult] = await Promise.all([
    runAgent('Static Analysis Agent', STATIC_ANALYSIS_PROMPT, context),
    runAgent('Economic Modeling Agent', ECONOMIC_MODELING_PROMPT, context),
    runAgent('Historical Patterns Agent', HISTORICAL_PROMPT, context)
  ]);

  console.log('\nPhase 2: Verification Agent');
  const verificationInput = JSON.stringify({
    static_analysis: staticResult,
    economic_modeling: economicResult,
    historical_patterns: historicalResult
  }, null, 2);

  const verified = await runAgent('Verification Agent', VERIFICATION_PROMPT, verificationInput);

  const totalTime = Date.now() - totalStart;
  console.log(`\nTotal analysis time: ${totalTime}ms`);

  return {
    agents: {
      static_analysis: staticResult,
      economic_modeling: economicResult,
      historical_patterns: historicalResult,
      verification: verified
    },
    metadata: {
      total_time_ms: totalTime,
      agents_used: 4,
      model: 'gpt-4'
    }
  };
}

if (process.argv[1] && process.argv[1].endsWith('advanced.js')) {
  console.log('=== AuditLens Advanced ===');
  console.log('Usage: import { advancedAnalysis } from "./advanced.js"');
  console.log('Or run evaluate.js for full comparison');
}
