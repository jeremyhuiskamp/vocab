import { cliSuites } from './cli-suites.js';
import * as fragmentEditor from '../fragment-highlight-editor.test.js';
import * as practiseCard from '../practise-card.test.js';

export { cliSuites };
export const domSuites = [fragmentEditor, practiseCard];
