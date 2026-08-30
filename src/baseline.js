/**
 * AuditLens Baseline — Single-prompt LLM audit verification
 * 
 * This is the "before" — a single LLM call analyzing a smart contract
 * against an audit report. It catches obvious issues but misses
 * economic attacks and cross-contract interactions.
 */

import OpenAI from 'openai';

const client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

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

export async function baselineAnalysis(contractCode, auditReport) {
  const response = await client.chat.completions.create({
    model: 'gpt-4',
    messages: [
      { role: 'system', content: SYSTEM_PROMPT },
      { 
        role: 'user', 
        content: `## Contract Code\n\`\`\`solidity\n${contractCode}\n\`\`\`\n\n## Audit Report\n${auditReport}\n\nAnalyze this contract and identify any vulnerabilities the audit may have missed.`
      }
    ],
    temperature: 0.1,
    max_tokens: 4000
  });

  const content = response.choices[0].message.content;
  
  try {
    return JSON.parse(content);
  } catch (e) {
    // Try to extract JSON from markdown code block
    const match = content.match(/```json?\s*([\s\S]*?)```/);
    if (match) return JSON.parse(match[1]);
    throw new Error('Failed to parse LLM response as JSON');
  }
}

// Run if called directly
if (process.argv[1] && process.argv[1].endsWith('baseline.js')) {
  console.log('=== AuditLens Baseline ===');
  console.log('Usage: import { baselineAnalysis } from "./baseline.js"');
  console.log('Or run evaluate.js for full comparison');
}
