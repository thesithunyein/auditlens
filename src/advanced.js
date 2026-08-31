/**
 * AuditLens Advanced — Multi-Agent Orchestrator
 * 
 * Four specialized agents + verification layer:
 * 1. Static Analysis Agent — AST-level vulnerability pattern detection
 * 2. Economic Modeling Agent — Attack simulation (flash loans, oracles)
 * 3. Historical Patterns Agent — Cross-reference known exploits
 * 4. Verification Agent — Cross-check findings, resolve contradictions
 * 
 * Uses Featherless AI (free tier) with Qwen 2.5 7B.
 */

const FEATHERLESS_BASE_URL = 'https://api.featherless.ai/v1';
const MODEL = 'deepseek-ai/DeepSeek-V4-Flash';

// ─── AGENT 1: Static Analysis (with chain-of-thought) ───
const STATIC_ANALYSIS_PROMPT = `You are a specialized static analysis agent for Solidity smart contracts.

Step 1: REASONING — For each function in the contract, analyze:
- Does it make external calls? If yes, is state updated before or after?
- Are there unchecked return values from low-level calls?
- Is access control present (onlyOwner, modifiers)?
- Are there timestamp-dependent conditions?
- Could pending transactions be frontrun?

Step 2: FINDINGS — For each vulnerability found, output:
{ "vulnerability": "name", "severity": "critical|high|medium|low", "reasoning": "step-by-step analysis of why this is vulnerable", "pattern": "what code pattern triggered this", "precondition": "what must be true for exploitation", "confidence": 0-100 }

IMPORTANT: Include your reasoning for EACH finding. Do NOT flag patterns that have proper guards (e.g., ReentrancyGuard, nonReentrant modifier).`;

// ─── AGENT 2: Economic Modeling (with attack paths) ───
const ECONOMIC_MODELING_PROMPT = `You are a specialized economic attack simulation agent.

Step 1: ATTACK THINKING — For each function, ask:
- Can the price be manipulated within a single transaction?
- Can flash loans amplify the attack?
- Are there MEV extraction opportunities?
- Can governance be manipulated?

Step 2: ATTACK PATHS — For each attack vector, describe the COMPLETE attack path:
{ "vulnerability": "name", "attack_type": "flash_loan|oracle|mev|governance|composability", "attack_path": [{"step": 1, "action": "what the attacker does", "effect": "what changes in state"}, ...], "scenario": "step-by-step attack", "impact": "estimated loss", "confidence": 0-100 }

Think like an attacker. Show the COMPLETE chain of actions.`;

// ─── AGENT 3: Historical Patterns ───
const HISTORICAL_PROMPT = `You are a historical exploit pattern matching agent.
Cross-reference against: The DAO (2016), Parity (2017), bZx (2020), Harvest (2020), Cream (2021), Mango (2022), Curve (2023), Euler (2023).

For each match output:
{ "vulnerability": "name", "historical_exploit": "name and year", "similarity": "what's similar", "difference": "what's different", "risk_level": "high|medium|low", "confidence": 0-100 }`;

// ─── AGENT 4: Verification ───
const VERIFICATION_PROMPT = `You are a verification agent. Combine findings from three specialist agents.

RULES:
1. Include EVERY finding from EVERY specialist agent
2. If two agents found the same thing, combine into ONE with both agents listed
3. If agents disagree on severity, use the HIGHEST
4. NEVER drop findings — output COUNT must >= input COUNT

Output JSON:
{
  "verified_findings": [
    {
      "vulnerability": "name",
      "severity": "critical|high|medium|low",
      "description": "description",
      "reasoning": "why this is a real vulnerability",
      "attack_path": [{"step": 1, "action": "...", "effect": "..."}] or null,
      "evidence": ["agent names"],
      "confidence": 0-100
    }
  ],
  "overall_risk_score": 0-100
}`;

// ─── AGENT 5: Synthesis (JSON → Professional Report) ───
const SYNTHESIS_PROMPT = `You are a senior security auditor. Convert the following JSON findings into a professional audit report.

FORMAT YOUR RESPONSE AS FOLLOWS:

## Executive Summary
[2-3 sentences: overall risk level, key findings, recommendation]

## Risk Assessment
[Overall risk score and justification]

## Findings
[For each finding:]
### [VULNERABILITY NAME] — [SEVERITY]
**Confidence:** [X]%
**Evidence:** [which agents found this]
**Analysis:** [step-by-step reasoning from the agent]
**Attack Scenario:** [how an attacker would exploit this, with step-by-step path if available]
**Impact:** [what could be lost/damaged]
**Recommendation:** [specific fix with code example if possible]
**Historical Reference:** [similar past exploit if applicable]

## Remediation Priority
[Prioritized list: fix critical first, then high, then medium]

Be specific. Use code examples. Reference real exploits. This report should be something a CTO could share with their team.`;

// ─── ORCHESTRATOR ───
async function callLLM(apiKey, systemPrompt, content) {
  const response = await fetch(`${FEATHERLESS_BASE_URL}/chat/completions`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${apiKey}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      model: MODEL,
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content }
      ],
      temperature: 0.1,
      max_tokens: 4000
    })
  });

  const data = await response.json();
  if (data.error) throw new Error(data.error.message);

  const text = data.choices?.[0]?.message?.content || '{}';
  try { return JSON.parse(text); }
  catch {
    const match = text.match(/```json?\s*([\s\S]*?)```/);
    if (match) return JSON.parse(match[1]);
    const cleaned = text.replace(/^json\s*\n/, '').trim();
    try { return JSON.parse(cleaned); } catch {}
    const objMatch = text.match(/\{[\s\S]*\}/);
    if (objMatch) try { return JSON.parse(objMatch[0]); } catch {}
    return { raw: text, parse_error: true };
  }
}

export async function advancedAnalysis(contractCode, auditReport, apiKey) {
  const key = apiKey || process.env.FEATHERLESS_API_KEY;
  if (!key) throw new Error('FEATHERLESS_API_KEY not set');

  const context = `## Contract Code\n\`\`\`solidity\n${contractCode}\n\`\`\`\n\n## Audit Report\n${auditReport}`;
  
  console.log('=== AuditLens Advanced: Multi-Agent Analysis ===\n');
  const totalStart = Date.now();

  // Phase 1: Run 3 specialist agents in parallel
  console.log('Phase 1: Specialist Agents');
  const [staticResult, economicResult, historicalResult] = await Promise.all([
    callLLM(key, STATIC_ANALYSIS_PROMPT, context),
    callLLM(key, ECONOMIC_MODELING_PROMPT, context),
    callLLM(key, HISTORICAL_PROMPT, context)
  ]);

  // Phase 2: Verification agent
  console.log('Phase 2: Verification Agent');
  const verificationInput = JSON.stringify({
    static_analysis: staticResult,
    economic_modeling: economicResult,
    historical_patterns: historicalResult
  }, null, 2);

  const verified = await callLLM(key, VERIFICATION_PROMPT, verificationInput);

  // Phase 3: Synthesis agent — convert JSON to professional report
  console.log('Phase 3: Synthesis Agent');
  const synthesisInput = JSON.stringify({
    verified_findings: verified.verified_findings || [],
    overall_risk_score: verified.overall_risk_score || 0,
    contract_summary: contractCode.slice(0, 500)
  }, null, 2);

  const synthesis = await callLLM(key, SYNTHESIS_PROMPT, synthesisInput);

  const totalTime = Date.now() - totalStart;
  console.log(`Total analysis time: ${totalTime}ms`);

  return {
    agents: {
      static_analysis: staticResult,
      economic_modeling: economicResult,
      historical_patterns: historicalResult,
      verification: verified,
      synthesis: synthesis
    },
    metadata: {
      total_time_ms: totalTime,
      agents_used: 5,
      model: MODEL
    }
  };
}

if (process.argv[1] && process.argv[1].endsWith('advanced.js')) {
  console.log('=== AuditLens Advanced ===');
  console.log('Usage: import { advancedAnalysis } from "./advanced.js"');
  console.log('Or run: node src/evaluate.js');
}
