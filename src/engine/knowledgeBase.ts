// Rules are now stored in src/rules.json and managed via ruleLoader.
// This module re-exports a snapshot for any code that imports RULES directly.
// The inference engine calls loadRules() directly so edits take effect immediately.
import { loadRules } from './ruleLoader';

export const RULES = loadRules();
