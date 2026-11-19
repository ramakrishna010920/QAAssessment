import { spawnSync } from 'node:child_process';
import { mkdirSync, rmSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const resultsDir = path.join(root, 'artifacts', 'allure-results');
const reportDir = path.join(root, 'artifacts', 'allure-report');
const isWindows = process.platform === 'win32';
const npm = isWindows ? 'npm.cmd' : 'npm';
const allure = isWindows ? 'allure.cmd' : 'allure';

rmSync(resultsDir, { recursive: true, force: true });
mkdirSync(resultsDir, { recursive: true });
rmSync(reportDir, { recursive: true, force: true });

function run(label, command, args, env = process.env) {
  console.log(`\n=== ${label} ===`);
  const result = isWindows
    ? spawnSync(
        process.env.ComSpec ?? 'cmd.exe',
        ['/d', '/s', '/c', [command, ...args].join(' ')],
        { cwd: root, env, stdio: 'inherit' },
      )
    : spawnSync(command, args, {
        cwd: root,
        env,
        stdio: 'inherit',
      });

  if (result.error) {
    console.error(`${label} could not start: ${result.error.message}`);
    return 1;
  }

  return result.status ?? 1;
}

const suiteResults = [
  [
    'Playwright QA suite',
    run('Playwright QA suite', npm, ['run', 'qa:test'], {
      ...process.env,
      QA_ALLURE_REPORT: '1',
    }),
  ],
  [
    'Frontend component and unit tests',
    run('Frontend component and unit tests', npm, ['run', 'qa:test:components']),
  ],
];

const reportStatus = run('Generate Allure HTML report', allure, [
  'awesome',
  'artifacts/allure-results',
  '--output',
  'artifacts/allure-report',
  '--single-file',
]);

if (reportStatus !== 0) {
  process.exitCode = reportStatus;
} else if (suiteResults.some(([, status]) => status !== 0)) {
  console.error('Allure report was generated, but one or more test suites failed.');
  process.exitCode = 1;
}
