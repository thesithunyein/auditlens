/**
 * AuditLens Baseline — Single-prompt LLM audit verification
 * 
 * This is the "before" — a single LLM call analyzing a smart contract
 * against an audit report. It catches obvious issues but misses
 * economic attacks and cross-contract interactions.
 * 
 * Uses Featherless AI (free tier) with Qwen 2.5 7B.
 */

const FEATHERLESS_BASE_URL = 'https://api.featherless.ai/v1';
const MODEL = 'deepseek-ai/DeepSeek-V4-Flash';

const SYSTEM_PROMPT = `You are a smart contract security auditor. 
Analyze the provided Solidity contract code and audit report. 
Identify any vulnerabilities the audit may have missed.
Return a JSON array of findings, each with:
- vulnerability: string (name of the vulnerability)
- severity: "critical" | "high" | "medium" | "low" | "informational"
- description: string (what the issue is)
- recommendation: string (how to fix it)
- confidence: number (0-100)
Return only valid JSON.`;

export async function baselineAnalysis(contractCode, auditReport, apiKey) {
  const key = apiKey || process.env.FEATHERLESS_API_KEY;
  if (!key) throw new Error('FEATHERLESS_API_KEY not set');

  const response = await fetch(`${FEATHERLESS_BASE_URL}/chat/completions`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${key}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      model: MODEL,
      messages: [
        { role: 'system', content: SYSTEM_PROMPT },
        { 
          role: 'user', 
          content: `## Contract Code\n\`\`\`solidity\n${contractCode}\n\`\`\`\n\n## Audit Report\n${auditReport}\n\nAnalyze this contract and identify any vulnerabilities the audit may have missed.`
        }
      ],
      temperature: 0.1,
      max_tokens: 4000
    })
  });

  const data = await response.json();
  if (data.error) throw new Error(data.error.message);

  const content = data.choices?.[0]?.message?.content || '[]';
  
  try {
    return JSON.parse(content);
  } catch (e) {
    // Try extracting from markdown code block
    const match = content.match(/```json?\s*([\s\S]*?)```/);
    if (match) return JSON.parse(match[1]);
    // Try removing 'json\n' prefix
    const cleaned = content.replace(/^json\s*\n/, '').trim();
    try { return JSON.parse(cleaned); } catch {}
    // Try finding array in content
    const arrMatch = content.match(/\[\s*\{[\s\S]*\}\s*\]/);
    if (arrMatch) return JSON.parse(arrMatch[0]);
    return [];
  }
}

// Run if called directly
if (process.argv[1] && process.argv[1].endsWith('baseline.js')) {
  console.log('=== AuditLens Baseline ===');
  console.log('Usage: import { baselineAnalysis } from "./baseline.js"');
  console.log('Or run: node src/evaluate.js');
}
