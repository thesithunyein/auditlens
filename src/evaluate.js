/**
 * AuditLens Evaluation Suite
 * 
 * Runs baseline and advanced analysis on test cases,
 * compares results, and generates metrics.
 */

import { baselineAnalysis } from './baseline.js';
import { advancedAnalysis } from './advanced.js';
import { readFileSync, writeFileSync, existsSync } from 'fs';
import { join } from 'path';

const TEST_CASES_DIR = join(process.cwd(), 'test-cases');
const RESULTS_DIR = join(process.cwd(), 'results');

// ─── Test Case Structure ───
// Each test case has:
// - name: identifier
// - contract: Solidity code (or path to file)
// - audit_report: The audit's conclusion
// - known_vulnerabilities: What the audit MISSED (ground truth)
// - severity_ground_truth: Expected severity for each

const TEST_CASES = [
  {
    name: 'reentrancy-basic',
    description: 'Classic reentrancy vulnerability missed by audit',
    known_vulnerabilities: [
      { vulnerability: 'Reentrancy', severity: 'critical', description: 'External call before state update allows recursive withdrawal' }
    ],
    audit_said: 'Contract passes all security checks. No critical vulnerabilities found.'
  },
  {
    name: 'oracle-manipulation',
    description: 'Single-source price oracle susceptible to manipulation',
    known_vulnerabilities: [
      { vulnerability: 'Oracle Manipulation', severity: 'critical', description: 'Single price source can be manipulated via flash loan' }
    ],
    audit_said: 'Price feeds are integrated correctly. Oracle usage follows best practices.'
  },
  {
    name: 'access-control',
    description: 'Missing access control on critical function',
    known_vulnerabilities: [
      { vulnerability: 'Missing Access Control', severity: 'high', description: 'Admin function callable by anyone' }
    ],
    audit_said: 'Function visibility is appropriately restricted.'
  },
  {
    name: 'flash-loan-vector',
    description: 'Flash loan attack vector in lending protocol',
    known_vulnerabilities: [
      { vulnerability: 'Flash Loan Attack', severity: 'critical', description: 'Price can be manipulated within single transaction' }
    ],
    audit_said: 'Lending pool implements standard security patterns.'
  },
  {
    name: 'front-running',
    description: 'MEV frontrunning vulnerability in DEX',
    known_vulnerabilities: [
      { vulnerability: 'Frontrunning', severity: 'medium', description: 'Pending transactions can be observed and frontrun' }
    ],
    audit_said: 'Swap function follows standard AMM patterns.'
  }
];

// ─── Scoring Functions ───

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
      if (match.severity === gt.severity) correctSeverity++;
    }
  }

  // False positives: findings not in ground truth
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

// ─── Main Evaluation ───

async function runEvaluation() {
  console.log('╔══════════════════════════════════════════╗');
  console.log('║     AuditLens Evaluation Suite           ║');
  console.log('╚══════════════════════════════════════════╝\n');

  const results = { baseline: [], advanced: [] };

  for (const testCase of TEST_CASES) {
    console.log(`\n━━━ Test: ${testCase.name} ━━━`);
    console.log(`Description: ${testCase.description}`);
    console.log(`Audit said: "${testCase.audit_said}"`);
    console.log(`Known vulnerabilities: ${testCase.known_vulnerabilities.length}`);

    // Load contract code
    const contractPath = join(TEST_CASES_DIR, `${testCase.name}.sol`);
    let contractCode;
    if (existsSync(contractPath)) {
      contractCode = readFileSync(contractPath, 'utf-8');
    } else {
      console.log(`  ⚠️  No contract file found at ${contractPath}`);
      console.log(`  Using placeholder contract code`);
      contractCode = `// Placeholder for ${testCase.name}\n// Add actual contract code to test-cases/${testCase.name}.sol`;
    }

    // ─── Run Baseline ───
    console.log('\n  [Baseline] Single-prompt analysis...');
    try {
      const baselineResult = await baselineAnalysis(contractCode, testCase.audit_said);
      const baselineScore = scoreFindings(
        Array.isArray(baselineResult) ? baselineResult : [],
        testCase.known_vulnerabilities
      );
      results.baseline.push({
        test_case: testCase.name,
        findings: baselineResult,
        score: baselineScore
      });
      console.log(`  Baseline: ${baselineScore.detected}/${baselineScore.total} detected, ${baselineScore.false_positives} false positives`);
    } catch (e) {
      console.log(`  Baseline error: ${e.message}`);
      results.baseline.push({ test_case: testCase.name, error: e.message });
    }

    // ─── Run Advanced ───
    console.log('\n  [Advanced] Multi-agent analysis...');
    try {
      const advancedResult = await advancedAnalysis(contractCode, testCase.audit_said);
      const advancedFindings = advancedResult.agents?.verification?.verified_findings || [];
      const advancedScore = scoreFindings(advancedFindings, testCase.known_vulnerabilities);
      results.advanced.push({
        test_case: testCase.name,
        findings: advancedResult,
        score: advancedScore
      });
      console.log(`  Advanced: ${advancedScore.detected}/${advancedScore.total} detected, ${advancedScore.false_positives} false positives`);
    } catch (e) {
      console.log(`  Advanced error: ${e.message}`);
      results.advanced.push({ test_case: testCase.name, error: e.message });
    }
  }

  // ─── Aggregate Metrics ───
  console.log('\n\n╔══════════════════════════════════════════╗');
  console.log('║           AGGREGATE METRICS              ║');
  console.log('╚══════════════════════════════════════════╝\n');

  const baselineMetrics = aggregateMetrics(results.baseline);
  const advancedMetrics = aggregateMetrics(results.advanced);

  const table = `
| Metric                          | Baseline    | Advanced    | Change      |
|---------------------------------|-------------|-------------|-------------|
| Vulnerabilities detected        | ${baselineMetrics.total_detected}/${baselineMetrics.total_ground_truth} (${(baselineMetrics.accuracy * 100).toFixed(0)}%)     | ${advancedMetrics.total_detected}/${advancedMetrics.total_ground_truth} (${(advancedMetrics.accuracy * 100).toFixed(0)}%)     | +${((advancedMetrics.accuracy - baselineMetrics.accuracy) * 100).toFixed(0)}%        |
| False positives per test        | ${baselineMetrics.avg_false_positives.toFixed(1)}         | ${advancedMetrics.avg_false_positives.toFixed(1)}         | -${((1 - advancedMetrics.avg_false_positives / Math.max(baselineMetrics.avg_false_positives, 0.1)) * 100).toFixed(0)}%        |
| Severity accuracy               | ${(baselineMetrics.severity_accuracy * 100).toFixed(0)}%         | ${(advancedMetrics.severity_accuracy * 100).toFixed(0)}%         | +${((advancedMetrics.severity_accuracy - baselineMetrics.severity_accuracy) * 100).toFixed(0)}%        |
`;

  console.log(table);

  // Save results
  const report = {
    timestamp: new Date().toISOString(),
    test_cases: TEST_CASES.length,
    baseline: baselineMetrics,
    advanced: advancedMetrics,
    comparison_table: table,
    detailed_results: results
  };

  writeFileSync(join(RESULTS_DIR, 'evaluation-report.json'), JSON.stringify(report, null, 2));
  writeFileSync(join(RESULTS_DIR, 'metrics-table.md'), `# AuditLens Evaluation Metrics\n\n${table}`);

  console.log('Results saved to results/evaluation-report.json');
  console.log('Metrics table saved to results/metrics-table.md');
}

function aggregateMetrics(results) {
  const valid = results.filter(r => !r.error);
  const totalGroundTruth = valid.reduce((sum, r) => sum + (r.score?.total || 0), 0);
  const totalDetected = valid.reduce((sum, r) => sum + (r.score?.detected || 0), 0);
  const totalFalsePositives = valid.reduce((sum, r) => sum + (r.score?.false_positives || 0), 0);
  const totalSeverityCorrect = valid.reduce((sum, r) => sum + (r.score?.detected || 0) * (r.score?.severity_accuracy || 0), 0);

  return {
    test_cases: valid.length,
    total_ground_truth: totalGroundTruth,
    total_detected: totalDetected,
    accuracy: totalGroundTruth > 0 ? totalDetected / totalGroundTruth : 0,
    avg_false_positives: valid.length > 0 ? totalFalsePositives / valid.length : 0,
    severity_accuracy: totalDetected > 0 ? totalSeverityCorrect / totalDetected : 0
  };
}

runEvaluation().catch(console.error);
