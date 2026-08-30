/**
 * AuditLens API — Multi-Agent Contract Analysis
 * POST /api/analyze
 * Body: { contract: string, auditReport: string, model?: string }
 * Returns: { baseline, advanced, comparison }
 */

// Support multiple API keys for parallel requests
const apiKeys = [
  process.env.FEATHERLESS_API_KEY,
  process.env.FEATHERLESS_API_KEY_2,
  process.env.FEATHERLESS_API_KEY_3
].filter(Boolean);

let keyIndex = 0;
function getNextKey() {
  const key = apiKeys[keyIndex % apiKeys.length];
  keyIndex++;
  return key;
}

export default async function handler(req, res) {
  // CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const { contract, auditReport, model = 'Qwen/Qwen2.5-7B-Instruct' } = req.body || {};
  if (!contract || !auditReport) {
    return res.status(400).json({ error: 'contract and auditReport are required' });
  }
  
  if (apiKeys.length === 0) {
    return res.status(500).json({ error: 'FEATHERLESS_API_KEY not configured' });
  }

  try {
    const startTime = Date.now();

    // Run baseline and advanced in parallel
    const [baseline, advanced] = await Promise.all([
      runBaseline(apiKeys[0], model, contract, auditReport),
      runAdvanced(apiKeys[0], model, contract, auditReport)
    ]);

    const totalTime = Date.now() - startTime;

    // Compute comparison
    const baselineFindings = Array.isArray(baseline) ? baseline : [];
    let advancedFindings = [];
    try { advancedFindings = advanced?.agents?.verification?.verified_findings || []; } catch(e) {}
    if (!Array.isArray(advancedFindings)) advancedFindings = [];
    // Merge specialist findings not in verified
    try {
      const verifiedNames = new Set(advancedFindings.map(f => (f.vulnerability || '').toLowerCase()));
      const staticAgent = advanced?.agents?.static_analysis;
      const economicAgent = advanced?.agents?.economic_modeling;
      const historicalAgent = advanced?.agents?.historical_patterns;
      if (staticAgent && !Array.isArray(staticAgent) && staticAgent.vulnerability && !verifiedNames.has(staticAgent.vulnerability.toLowerCase())) advancedFindings.push({ vulnerability: staticAgent.vulnerability, severity: staticAgent.severity || 'medium', description: staticAgent.description || '', confidence: staticAgent.confidence || 50, evidence: ['static_analysis'] });
      if (Array.isArray(economicAgent)) economicAgent.forEach(f => { if (f && f.vulnerability && !verifiedNames.has(f.vulnerability.toLowerCase())) advancedFindings.push({ vulnerability: f.vulnerability, severity: f.severity || 'medium', description: f.scenario || f.description || '', confidence: f.confidence || 30, evidence: ['economic_modeling'] }); });
      if (Array.isArray(historicalAgent)) historicalAgent.forEach(f => { if (f && f.vulnerability && !verifiedNames.has(f.vulnerability.toLowerCase())) advancedFindings.push({ vulnerability: f.vulnerability, severity: f.risk_level || 'medium', description: f.similarity || f.description || '', confidence: f.confidence || 50, evidence: ['historical_patterns'] }); });
    } catch(e) { /* specialist merge failed, use verified findings only */ }

    const comparison = {
      baseline_count: baselineFindings.length,
      advanced_count: advancedFindings.length,
      detection_change: advancedFindings.length > 0 && baselineFindings.length > 0
        ? `+${Math.round(((advancedFindings.length - baselineFindings.length) / baselineFindings.length) * 100)}%`
        : 'N/A',
      total_time_ms: totalTime
    };

    return res.status(200).json({
      success: true,
      baseline: baselineFindings,
      advanced: advanced,
      comparison,
      metadata: { model, time_ms: totalTime }
    });

  } catch (err) {
    console.error('Analysis error:', err);
    return res.status(500).json({ error: err.message || 'Analysis failed' });
  }
}

// ─── BASELINE: Single-prompt analysis ───
async function runBaseline(apiKey, model, contract, auditReport) {
  const response = await fetch('https://api.featherless.ai/v1/chat/completions', {
    method: 'POST',
    headers: { 'Authorization': `Bearer ${apiKey}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({
      model,
      messages: [
        {
          role: 'system',
          content: `You are a smart contract security auditor. Analyze the provided Solidity contract code and audit report. Identify any vulnerabilities the audit may have missed. Return a JSON array of findings, each with: vulnerability (string), severity ("critical"|"high"|"medium"|"low"|"informational"), description (string), recommendation (string), confidence (0-100). Return only valid JSON.`
        },
        {
          role: 'user',
          content: `## Contract Code\n\`\`\`solidity\n${contract}\n\`\`\`\n\n## Audit Report\n${auditReport}\n\nIdentify vulnerabilities the audit may have missed.`
        }
      ],
      temperature: 0.1,
      max_tokens: 4000
    })
  });

  const data = await response.json();
  if (data.error) throw new Error(data.error.message);

  const content = data.choices?.[0]?.message?.content || '[]';
  try { return JSON.parse(content); }
  catch {
    const match = content.match(/```json?\s*([\s\S]*?)```/);
    if (match) return JSON.parse(match[1]);
    return [];
  }
}

// ─── ADVANCED: Multi-agent orchestrator ───
async function runAdvanced(apiKey, model, contract, auditReport) {
  const context = `## Contract Code\n\`\`\`solidity\n${contract}\n\`\`\`\n\n## Audit Report\n${auditReport}`;

  // Phase 1: Run 3 specialist agents in parallel (each uses different key via round-robin)
  const [staticResult, economicResult, historicalResult] = await Promise.all([
    runAgent(null, model, STATIC_PROMPT, context),
    runAgent(null, model, ECONOMIC_PROMPT, context),
    runAgent(null, model, HISTORICAL_PROMPT, context)
  ]);

  // Phase 2: Verification agent
  const verificationInput = JSON.stringify({
    static_analysis: staticResult,
    economic_modeling: economicResult,
    historical_patterns: historicalResult
  }, null, 2);

  const verified = await runAgent(null, model, VERIFICATION_PROMPT, verificationInput);

  return {
    agents: { static_analysis: staticResult, economic_modeling: economicResult, historical_patterns: historicalResult, verification: verified }
  };
}

async function runAgent(apiKey, model, systemPrompt, content, retries = 2) {
  for (let attempt = 0; attempt <= retries; attempt++) {
    try {
      const key = getNextKey();
      const response = await fetch('https://api.featherless.ai/v1/chat/completions', {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${key}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({
          model,
          messages: [
            { role: 'system', content: systemPrompt },
            { role: 'user', content }
          ],
          temperature: 0.1,
          max_tokens: 4000
        })
      });

      const data = await response.json();
      if (data.error) {
        if (attempt < retries) continue;
        throw new Error(data.error.message);
      }

      const text = data.choices?.[0]?.message?.content || '{}';
      try { return JSON.parse(text); }
      catch {
        const match = text.match(/```json?\s*([\s\S]*?)```/);
        if (match) return JSON.parse(match[1]);
        return { raw: text, parse_error: true };
      }
    } catch (err) {
      if (attempt < retries) continue;
      throw err;
    }
  }
}

// ─── AGENT PROMPTS ───

const STATIC_PROMPT = `You are a specialized static analysis agent for Solidity smart contracts.
Focus on: reentrancy, integer overflow/underflow, unchecked return values, access control gaps, timestamp dependence, front-running, uninitialized storage, delegatecall abuse.
For each finding output JSON: { "vulnerability": "name", "severity": "critical|high|medium|low", "description": "what the issue is", "line_hint": "approximate location", "precondition": "what must be true", "confidence": 0-100 }
Be SPECIFIC. Do NOT flag patterns that have proper guards.`;

const ECONOMIC_PROMPT = `You are a specialized economic attack simulation agent.
Analyze for: flash loan attacks, oracle manipulation, MEV extraction, governance attacks, liquidity manipulation, cross-contract composability risks.
For each attack vector output JSON: { "vulnerability": "name", "attack_type": "flash_loan|oracle|mev|governance|composability", "scenario": "step-by-step attack", "impact": "estimated loss", "confidence": 0-100 }
Think like an attacker.`;

const HISTORICAL_PROMPT = `You are a historical exploit pattern matching agent.
Cross-reference against: The DAO (2016), Parity (2017), bZx (2020), Harvest (2020), Cream (2021), Mango (2022), Curve (2023), Euler (2023).
For each match output JSON: { "vulnerability": "name", "historical_exploit": "name and year", "similarity": "what's similar", "risk_level": "high|medium|low", "confidence": 0-100 }`;

const VERIFICATION_PROMPT = `You are a verification agent. PRESERVE all findings while cross-checking quality.

Rules:
1. DO NOT discard or merge findings - keep every unique vulnerability from every agent
2. If multiple agents found the same issue, combine into ONE finding but note all agents
3. If agents disagree on severity, pick the HIGHEST severity
4. Add any NEW vulnerabilities you identify from cross-referencing
5. Assign overall risk score based on the HIGHEST severity finding

Input: JSON with static_analysis, economic_modeling, historical_patterns.
Output JSON: {
  "verified_findings": [{ "vulnerability": "name", "severity": "critical|high|medium|low", "description": "clear description", "evidence": ["agent names"], "confidence": 0-100, "agents_agree": true|false, "impact": "potential damage" }],
  "contradictions": [],
  "overall_risk_score": 0-100
}

IMPORTANT: Include ALL vulnerabilities. Do not reduce the count.";
