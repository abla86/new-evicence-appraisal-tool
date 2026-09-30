import { runFullValidationTestSuite } from './testRunner';

async function main() {
  console.log('================================================================');
  console.log('🧪 EVIDENCE APPRAISAL & SCIENTIFIC VALIDATION TEST RUNNER');
  console.log('================================================================');
  console.log('Executing Level 1 Unit, Level 2 Integration, and Level 3 Gold Standard Tests...\n');

  const summary = await runFullValidationTestSuite();

  summary.testResults.forEach((test, idx) => {
    const icon = test.passed ? '✅ PASS' : '❌ FAIL';
    console.log(`[${idx + 1}/${summary.totalTests}] ${icon} - [${test.category}] ${test.name} (${test.executionTimeMs} ms)`);
    if (test.referenceSource) {
      console.log(`   📚 Source: ${test.referenceSource}`);
    }
    test.assertions.forEach((assertion) => {
      const aIcon = assertion.passed ? '  ✓' : '  ✗';
      console.log(`   ${aIcon} ${assertion.name}: Expected [${assertion.expected}], Got [${assertion.actual}]`);
      if (assertion.details) {
        console.log(`     Note: ${assertion.details}`);
      }
    });
    console.log('');
  });

  console.log('================================================================');
  console.log(`📊 SUMMARY: ${summary.passedCount}/${summary.totalTests} Tests Passed (${summary.passedAssertions}/${summary.totalAssertions} Assertions) in ${summary.durationMs}ms`);
  console.log(`STATUS: ${summary.overallStatus}`);
  console.log('================================================================');

  if (summary.overallStatus !== 'ALL_PASS') {
    process.exit(1);
  }
}

main().catch(err => {
  console.error('Test execution crashed:', err);
  process.exit(1);
});
