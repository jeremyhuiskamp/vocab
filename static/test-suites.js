import * as utils from './utils.test.js';
import * as practiseLogic from './practise-logic.test.js';
import * as createLogic from './create-logic.test.js';
import * as fragmentEditor from './fragment-highlight-editor.test.js';

// Suites that run in CLI (no DOM required)
export const cliSuites = [utils, practiseLogic, createLogic];

// Suites that require a DOM (browser only)
export const domSuites = [fragmentEditor];
