/**
 * AuditLens Evaluation Suite
 * 
 * Runs baseline and advanced analysis on 15 test cases,
 * compares results, and generates measured metrics.
 * 
 * Usage: FEATHERLESS_API_KEY=your_key node src/evaluate.js
 */

import { baselineAnalysis } from './baseline.js';
import { advancedAnalysis } from './advanced.js';
import { readFileSync, writeFileSync, mkdirSync, existsSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const TEST_CASES_DIR = join(__dirname, '..', 'test-cases');
const RESULTS_DIR = join(__dirname, '..', 'results');

// Create results dir
if (!existsSync(RESULTS_DIR)) mkdirSync(RESULTS_DIR, { recursive: true });

// ─── 15 Test Cases with Ground Truth ───
const TEST_CASES = [
  {
    name: 'reentrancy-basic',
    description: 'Classic reentrancy — external call before state update',
    known_vulnerabilities: [
      { vulnerability: 'Reentrancy', severity: 'critical' }
    ],
    audit_said: 'Contract passes all security checks. No critical vulnerabilities found.'
  },
  {
    name: 'oracle-manipulation',
    description: 'Single-source price oracle susceptible to flash loan manipulation',
    known_vulnerabilities: [
      { vulnerability: 'Oracle Manipulation', severity: 'critical' }
    ],
    audit_said: 'Price feeds are integrated correctly. Oracle usage follows best practices.'
  },
  {
    name: 'access-control',
    description: 'Admin function callable by anyone',
    known_vulnerabilities: [
      { vulnerability: 'Missing Access Control', severity: 'high' }
    ],
    audit_said: 'Function visibility is appropriately restricted.'
  },
  {
    name: 'flash-loan-vector',
    description: 'Flash loan attack vector — price manipulation within single tx',
    known_vulnerabilities: [
      { vulnerability: 'Flash Loan Attack', severity: 'critical' }
    ],
    audit_said: 'Lending pool implements standard security patterns.'
  },
  {
    name: 'front-running',
    description: 'MEV frontrunning — pending txs observable and exploitable',
    known_vulnerabilities: [
      { vulnerability: 'Frontrunning', severity: 'medium' }
    ],
    audit_said: 'Swap function follows standard AMM patterns.'
  },
  {
    name: 'donation-attack',
    description: 'Euler-style donation attack — inflate share via direct transfer',
    known_vulnerabilities: [
      { vulnerability: 'Donation Attack', severity: 'critical' },
      { vulnerability: 'Share Manipulation', severity: 'high' }
    ],
    audit_said: 'Share calculation follows standard formula. Deposit/withdraw is safe.'
  },
  {
    name: 'price-oracle-single',
    description: 'AMM with single price oracle, no TWAP, no access control on setPrice',
    known_vulnerabilities: [
      { vulnerability: 'Oracle Manipulation', severity: 'critical' },
      { vulnerability: 'Missing Access Control', severity: 'high' }
    ],
    audit_said: 'Price oracle integration is functional. Swap logic is correct.'
  },
  {
    name: 'delegatecall-abuse',
    description: 'delegatecall to user-provided address — storage overwrite',
    known_vulnerabilities: [
      { vulnerability: 'Delegatecall Abuse', severity: 'critical' }
    ],
    audit_said: 'Proxy pattern is correctly implemented.'
  },
  {
    name: 'uninitialized-storage',
    description: 'Uninitialized storage pointer overwrites owner slot',
    known_vulnerabilities: [
      { vulnerability: 'Uninitialized Storage', severity: 'critical' }
    ],
    audit_said: 'Migration function follows standard pattern.'
  },
  {
    name: 'selfdestruct-abuse',
    description: 'Force-sent ETH via selfdestruct manipulates this.balance',
    known_vulnerabilities: [
      { vulnerability: 'Force Send ETH', severity: 'high' },
      { vulnerability: 'Balance Manipulation', severity: 'medium' }
    ],
    audit_said: 'Prize distribution is fair. Balance checks are correct.'
  },
  {
    name: 'signature-replay',
    description: 'Off-chain signature without nonce — replay attack',
    known_vulnerabilities: [
      { vulnerability: 'Signature Replay', severity: 'critical' }
    ],
    audit_said: 'Signature verification is implemented correctly.'
  },
  {
    name: 'governance-flash-vote',
    description: 'Flash loan governance voting — no snapshot, current balance used',
    known_vulnerabilities: [
      { vulnerability: 'Flash Loan Governance', severity: 'critical' },
      { vulnerability: 'Missing Vote Snapshot', severity: 'high' }
    ],
    audit_said: 'Governance voting uses token balance. Standard implementation.'
  },
  {
    name: 'batch-call-reentrancy',
    description: 'Cross-function reentrancy via deposit/collateral interaction',
    known_vulnerabilities: [
      { vulnerability: 'Cross-Function Reentrancy', severity: 'critical' }
    ],
    audit_said: 'Liquidation logic is correct. Collateral checks are proper.'
  },
  {
    name: 'timelock-bypass',
    description: 'Timelock bypass via nested calls and admin change without delay',
    known_vulnerabilities: [
      { vulnerability: 'Timelock Bypass', severity: 'high' },
      { vulnerability: 'Missing Reentrancy Guard', severity: 'medium' }
    ],
    audit_said: 'Timelock implementation follows standard pattern.'
  },
  {
    name: 'cross-chain-replay',
    description: 'Bridge signature without chain ID — cross-chain replay',
    known_vulnerabilities: [
      { vulnerability: 'Cross-Chain Replay', severity: 'critical' },
      { vulnerability: 'Missing Chain ID', severity: 'high' }
    ],
    audit_said: 'Bridge message verification is secure.'
  }
];

// ─── Scoring ───
function scoreFindings(findings, groundTruth) {
  let detected = 0;
  let falsePositives = 0;
  let correctSeverity = 0;

  for (const gt of groundTruth) {
    const match = findings.find(f =>
      f.vulnerability?.toLowerCase().includes(gt.vulnerability.toLowerCase()) ||
      gt.vulnerability.toLowerCase().includes(f.vulnerability?.toLowerCase() || '')
    );
    if (match) {
      detected++;
      if (match.severity?.toLowerCase() === gt.severity?.toLowerCase()) correctSeverity++;
    }
  }

  for (const f of findings) {
    const isTruePositive = groundTruth.some(gt =>
      f.vulnerability?.toLowerCase().includes(gt.vulnerability.toLowerCase()) ||
      gt.vulnerability.toLowerCase().includes(f.vulnerability?.toLowerCase() || '')
    );
    if (!isTruePositive && f.severity !== 'informational') falsePositives++;
  }

  return {
    detected,
    total: groundTruth.length,
    accuracy: groundTruth.length > 0 ? detected / groundTruth.length : 1,
    false_positives: falsePositives,
    severity_accuracy: detected > 0 ? correctSeverity / detected : 0
  };
}

function aggregateMetrics(results) {
  const valid = results.filter(r => !r.error);
  const totalGT = valid.reduce((s, r) => s + (r.score?.total || 0), 0);
  const totalDetected = valid.reduce((s, r) => s + (r.score?.detected || 0), 0);
  const totalFP = valid.reduce((s, r) => s + (r.score?.false_positives || 0), 0);
  const totalSev = valid.reduce((s, r) => s + (r.score?.detected || 0) * (r.score?.severity_accuracy || 0), 0);

  return {
    test_cases: valid.length,
    total_ground_truth: totalGT,
    total_detected: totalDetected,
    accuracy: totalGT > 0 ? totalDetected / totalGT : 0,
    avg_false_positives: valid.length > 0 ? totalFP / valid.length : 0,
    severity_accuracy: totalDetected > 0 ? totalSev / totalDetected : 0
  };
}

// ─── Main ───
async function runEvaluation() {
  console.log('╔══════════════════════════════════════════╗');
  console.log('║     AuditLens Evaluation Suite           ║');
  console.log('║     15 Test Cases × 2 Approaches         ║');
  console.log('╚══════════════════════════════════════════╝\n');

  const results = { baseline: [], advanced: [] };

  for (const tc of TEST_CASES) {
    console.log(`\n━━━ Test: ${tc.name} ━━━`);
    console.log(`  ${tc.description}`);
    console.log(`  Audit said: "${tc.audit_said}"`);

    const contractPath = join(TEST_CASES_DIR, `${tc.name}.sol`);
    let contractCode;
    if (existsSync(contractPath)) {
      contractCode = readFileSync(contractPath, 'utf-8');
    } else {
      console.log(`  ⚠️  No contract file found`);
      continue;
    }

    // Baseline
    console.log('  [Baseline] Single-prompt...');
    try {
      const bResult = await baselineAnalysis(contractCode, tc.audit_said);
      const bScore = scoreFindings(Array.isArray(bResult) ? bResult : [], tc.known_vulnerabilities);
      results.baseline.push({ test_case: tc.name, findings: bResult, score: bScore });
      console.log(`  Baseline: ${bScore.detected}/${bScore.total} detected, ${bScore.false_positives} FP`);
    } catch (e) {
      console.log(`  Baseline error: ${e.message}`);
      results.baseline.push({ test_case: tc.name, error: e.message });
    }

    // Advanced
    console.log('  [Advanced] Multi-agent...');
    try {
      const aResult = await advancedAnalysis(contractCode, tc.audit_said);
      const aFindings = aResult.agents?.verification?.verified_findings || [];
      const aScore = scoreFindings(aFindings, tc.known_vulnerabilities);
      results.advanced.push({ test_case: tc.name, findings: aResult, score: aScore });
      console.log(`  Advanced: ${aScore.detected}/${aScore.total} detected, ${aScore.false_positives} FP`);
    } catch (e) {
      console.log(`  Advanced error: ${e.message}`);
      results.advanced.push({ test_case: tc.name, error: e.message });
    }
  }

  // Aggregate
  console.log('\n\n╔══════════════════════════════════════════╗');
  console.log('║           AGGREGATE METRICS              ║');
  console.log('╚══════════════════════════════════════════╝\n');

  const bMetrics = aggregateMetrics(results.baseline);
  const aMetrics = aggregateMetrics(results.advanced);

  const pctChange = (a, b) => b > 0 ? ((a - b) / b * 100).toFixed(0) : 'N/A';

  console.log(`| Metric                          | Baseline           | Advanced           | Change      |`);
  console.log(`|---------------------------------|--------------------|--------------------|-------------|`);
  console.log(`| Vulnerabilities detected        | ${bMetrics.total_detected}/${bMetrics.total_ground_truth} (${(bMetrics.accuracy*100).toFixed(0)}%)       | ${aMetrics.total_detected}/${aMetrics.total_ground_truth} (${(aMetrics.accuracy*100).toFixed(0)}%)       | +${pctChange(aMetrics.accuracy, bMetrics.accuracy)}%     |`);
  console.log(`| False positives per test        | ${bMetrics.avg_false_positives.toFixed(1)}               | ${aMetrics.avg_false_positives.toFixed(1)}               | -${pctChange(bMetrics.avg_false_positives, aMetrics.avg_false_positives)}%     |`);
  console.log(`| Severity accuracy               | ${(bMetrics.severity_accuracy*100).toFixed(0)}%               | ${(aMetrics.severity_accuracy*100).toFixed(0)}%               | +${pctChange(aMetrics.severity_accuracy, bMetrics.severity_accuracy)}%     |`);

  // Save
  const report = {
    timestamp: new Date().toISOString(),
    model: 'Qwen/Qwen2.5-7B-Instruct (Featherless AI)',
    test_cases: TEST_CASES.length,
    baseline: bMetrics,
    advanced: aMetrics,
    detailed_results: results
  };

  writeFileSync(join(RESULTS_DIR, 'evaluation-report.json'), JSON.stringify(report, null, 2));
  console.log('\nResults saved to results/evaluation-report.json');
}

runEvaluation().catch(console.error);
