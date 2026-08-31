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

  const { contract, auditReport, model = 'deepseek-ai/DeepSeek-V4-Flash' } = req.body || {};
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
    const cleaned = content.replace(/^json\s*\n/, '').trim();
    try { return JSON.parse(cleaned); } catch {}
    const arrMatch = content.match(/\[\s*\{[\s\S]*\}\s*\]/);
    if (arrMatch) return JSON.parse(arrMatch[0]);
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

  // Phase 3: Synthesis — convert JSON to professional report
  const synthesisInput = JSON.stringify({
    verified_findings: verified?.verified_findings || [],
    overall_risk_score: verified?.overall_risk_score || 0,
    contract_summary: contractCode.slice(0, 500)
  }, null, 2);
  const synthesis = await runAgent(null, model, SYNTHESIS_PROMPT, synthesisInput);

  return {
    agents: { static_analysis: staticResult, economic_modeling: economicResult, historical_patterns: historicalResult, verification: verified, synthesis: synthesis }
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
        const cleaned = text.replace(/^json\s*\n/, '').trim();
        try { return JSON.parse(cleaned); } catch {}
        const objMatch = text.match(/\{[\s\S]*\}/);
        if (objMatch) try { return JSON.parse(objMatch[0]); } catch {}
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

Step 1: REASONING — For each function, analyze: external calls before/after state update, unchecked return values, access control, timestamp dependence, frontrunning risk.
Step 2: FINDINGS — For each vulnerability:
{ "vulnerability": "name", "severity": "critical|high|medium|low", "reasoning": "step-by-step analysis", "pattern": "what code pattern", "precondition": "what must be true", "confidence": 0-100 }
Do NOT flag patterns with proper guards.`;

const ECONOMIC_PROMPT = `You are a specialized economic attack simulation agent.

Step 1: ATTACK THINKING — For each function, ask: Can price be manipulated? Flash loans? MEV? Governance?
Step 2: ATTACK PATHS — For each vector:
{ "vulnerability": "name", "attack_type": "flash_loan|oracle|mev|governance|composability", "attack_path": [{"step": 1, "action": "...", "effect": "..."}], "scenario": "step-by-step", "impact": "estimated loss", "confidence": 0-100 }
Think like an attacker. Show the COMPLETE chain.`;

const HISTORICAL_PROMPT = `You are a historical exploit pattern matching agent.
Cross-reference against: The DAO (2016), Parity (2017), bZx (2020), Harvest (2020), Cream (2021), Mango (2022), Curve (2023), Euler (2023).
For each match:
{ "vulnerability": "name", "historical_exploit": "name and year", "similarity": "what's similar", "difference": "what's different", "risk_level": "high|medium|low", "confidence": 0-100 }`;

const VERIFICATION_PROMPT = `You are a verification agent. Combine findings from three specialist agents.

RULES: Include EVERY finding. If two agents found the same thing, combine into ONE with both listed. Use HIGHEST severity on disagreement. NEVER drop findings.

Output JSON:
{
  "verified_findings": [{ "vulnerability": "name", "severity": "critical|high|medium|low", "description": "...", "reasoning": "why this is real", "attack_path": [{"step": 1, "action": "...", "effect": "..."}] or null, "evidence": ["agent names"], "confidence": 0-100 }],
  "overall_risk_score": 0-100
}`;

const SYNTHESIS_PROMPT = `You are a senior security auditor. Convert JSON findings into a professional audit report.

FORMAT:
## Executive Summary
[2-3 sentences: overall risk, key findings, recommendation]
## Risk Assessment
[Score and justification]
## Findings
[For each: ### NAME — SEVERITY, Confidence, Evidence, Analysis (reasoning), Attack Scenario (step-by-step), Impact, Recommendation with code fix, Historical Reference]
## Remediation Priority
[Prioritized list]

Be specific. Use code examples. Reference real exploits.`;
