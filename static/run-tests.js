import { runAllCLI } from './test-harness.js';
import { cliSuites } from './test-suites.js';

await runAllCLI(cliSuites);
