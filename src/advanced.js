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

// ─── AGENT 1: Static Analysis ───
const STATIC_ANALYSIS_PROMPT = `You are a specialized static analysis agent for Solidity smart contracts.
Your ONLY job is to detect code-level vulnerability patterns.

Focus on:
- Reentrancy (external calls before state updates)
- Integer overflow/underflow (unchecked arithmetic)
- Unchecked return values (low-level calls)
- Access control gaps (missing modifiers)
- Timestamp dependence
- Front-running vulnerabilities

For each finding, output JSON:
{ "vulnerability": "name", "severity": "critical|high|medium|low", "line_range": "approximate", "pattern": "what triggered this", "precondition": "what must be true", "confidence": 0-100 }

Be SPECIFIC. Do NOT flag patterns that have proper guards.`;

// ─── AGENT 2: Economic Modeling ───
const ECONOMIC_MODELING_PROMPT = `You are a specialized economic attack simulation agent.
Analyze for: flash loan attacks, oracle manipulation, MEV extraction, governance attacks, liquidity manipulation, cross-contract composability risks.

For each attack vector output JSON:
{ "vulnerability": "name", "attack_type": "flash_loan|oracle|mev|governance|composability", "scenario": "step-by-step attack", "impact": "estimated loss", "confidence": 0-100 }

Think like an attacker.`;

// ─── AGENT 3: Historical Patterns ───
const HISTORICAL_PROMPT = `You are a historical exploit pattern matching agent.
Cross-reference against: The DAO (2016), Parity (2017), bZx (2020), Harvest (2020), Cream (2021), Mango (2022), Curve (2023), Euler (2023).

For each match output JSON:
{ "vulnerability": "name", "historical_exploit": "name and year", "similarity": "what's similar", "risk_level": "high|medium|low", "confidence": 0-100 }`;

// ─── AGENT 4: Verification ───
const VERIFICATION_PROMPT = `You are a verification agent. Your ONLY job is to combine findings from three specialist agents into a single verified list.

CRITICAL RULES:
1. You MUST include EVERY finding from EVERY specialist agent in your output
2. If two agents found the same thing, keep it as ONE finding and note both agents
3. If agents disagree on severity, use the HIGHEST severity
4. NEVER drop a finding. NEVER discard. NEVER skip. The output COUNT must equal or exceed the input COUNT.
5. Add any additional vulnerabilities YOU notice from cross-referencing

The specialist agents are: static_analysis, economic_modeling, historical_patterns.

Output JSON with this EXACT structure:
{
  "verified_findings": [
    {
      "vulnerability": "name",
      "severity": "critical|high|medium|low",
      "description": "description",
      "evidence": ["static_analysis" or "economic_modeling" or "historical_patterns" or combinations],
      "confidence": 0-100
    }
  ],
  "overall_risk_score": 0-100
}

REMINDER: Output at least as many findings as were provided. Count them before submitting.";

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

  const totalTime = Date.now() - totalStart;
  console.log(`Total analysis time: ${totalTime}ms`);

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
      model: MODEL
    }
  };
}

if (process.argv[1] && process.argv[1].endsWith('advanced.js')) {
  console.log('=== AuditLens Advanced ===');
  console.log('Usage: import { advancedAnalysis } from "./advanced.js"');
  console.log('Or run: node src/evaluate.js');
}
