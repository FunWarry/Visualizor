import { runAllSuites } from './harness/test-context';

declare const process: { exit(code?: number): never };

// Import Tier 1 Feature Coverage Suites
import './tier1-features/themes.test';
import './tier1-features/rail.test';
import './tier1-features/tuning.test';
import './tier1-features/camera.test';
import './tier1-features/overlay.test';
import './tier1-features/studio.test';
import './tier1-features/midi.test';
import './tier1-features/presets.test';
import './tier1-features/audio-dsp.test';

// Import Tier 2 Boundary & Corner Case Suites
import './tier2-boundaries/themes-boundary.test';
import './tier2-boundaries/rail-boundary.test';
import './tier2-boundaries/tuning-boundary.test';
import './tier2-boundaries/camera-boundary.test';
import './tier2-boundaries/overlay-boundary.test';
import './tier2-boundaries/studio-boundary.test';
import './tier2-boundaries/midi-boundary.test';
import './tier2-boundaries/presets-boundary.test';
import './tier2-boundaries/audio-boundary.test';

// Import Tier 3 Cross-Feature Combination Suites
import './tier3-combinations/combinations.test';

// Import Tier 4 Real-World Application Scenario Suites
import './tier4-scenarios/scenarios.test';

async function main(): Promise<void> {
  console.log('\n=============================================================');
  console.log('       VISUALIZOR OPAQUE-BOX E2E TEST SUITE RUNNER            ');
  console.log('=============================================================\n');

  const report = await runAllSuites();

  for (const suite of report.suites) {
    const symbol = suite.passed ? '✓' : '✗';
    const color = suite.passed ? '\x1b[32m' : '\x1b[31m';
    console.log(`${color}${symbol}\x1b[0m \x1b[1m${suite.name}\x1b[0m (${suite.durationMs}ms)`);

    for (const test of suite.tests) {
      const testSymbol = test.passed ? '  ✓' : '  ✗';
      const testColor = test.passed ? '\x1b[32m' : '\x1b[31m';
      console.log(`${testColor}${testSymbol}\x1b[0m ${test.name} (${test.durationMs}ms)`);

      if (!test.passed && test.error) {
        console.error(`\x1b[31m      Error: ${test.error.message}\x1b[0m`);
        if (test.error.stack) {
          console.error(`\x1b[90m${test.error.stack}\x1b[0m`);
        }
      }
    }
    console.log('');
  }

  console.log('-------------------------------------------------------------');
  console.log(`Suites:   ${report.totalSuites} total`);
  console.log(`Tests:    ${report.totalPassed} passed, ${report.totalFailed} failed, ${report.totalTests} total`);
  console.log(`Duration: ${(report.durationMs / 1000).toFixed(3)}s`);
  console.log('-------------------------------------------------------------\n');

  if (report.totalFailed > 0) {
    console.error('\x1b[31m✗ SOME TESTS FAILED!\x1b[0m\n');
    process.exit(1);
  } else {
    console.log('\x1b[32m✓ ALL TESTS PASSED SUCCESSFULLY!\x1b[0m\n');
    process.exit(0);
  }
}

void main();
