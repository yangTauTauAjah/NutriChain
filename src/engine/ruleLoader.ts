import type { Rule, Facts } from './types';
import { ALLERGEN_FOODS, DIET_FOODS } from './foods';
import defaultRulesJson from '../rules.json';
import defaultSchemaJson from '../facts-schema.json';

export const RULES_STORAGE_KEY = 'nutrichain_rules';
export const SCHEMA_STORAGE_KEY = 'nutrichain_facts_schema';

// Context variables injected into every evaluated condition/action string.
const ACTIVITY_MULTIPLIERS: Record<string, number> = {
  sedentary: 1.2,
  light: 1.375,
  moderate: 1.55,
  active: 1.725,
  very_active: 1.9,
};

export interface RuleJson {
  id: string;
  description: string;
  salience: number;
  /** Full JS arrow-function string, e.g. "(f) => f.bmi === undefined" */
  condition: string;
  /** Full JS arrow-function string, e.g. "(f) => ({ bmi: 22 })" */
  action: string;
}

export type FactFieldType = 'number' | 'string' | 'boolean' | 'enum' | 'enum[]' | 'string[]';

export interface FactFieldSchema {
  name: string;
  type: FactFieldType;
  description: string;
  values?: string[];
}

// ---------------------------------------------------------------------------
// Function evaluator
// The strategy: wrap the stored arrow-function string in an outer function
// that receives context variables as parameters.  The arrow function closes
// over those parameters, so ALLERGEN_FOODS / DIET_FOODS / ACTIVITY_MULTIPLIERS
// are all in scope when the inner function executes.
// ---------------------------------------------------------------------------

type ConditionFn = (facts: Facts) => boolean;
type ActionFn    = (facts: Facts) => Partial<Facts>;

// Body convention:
//   • Expression (no `return` keyword) → wrapped as `return (body);`
//   • Statement block (contains `return`) → used directly as function body
//
// Context variables ALLERGEN_FOODS, DIET_FOODS, ACTIVITY_MULTIPLIERS are
// injected as closure parameters and are available inside every body.

function buildFn<T>(body: string): (f: Facts) => T {
  const src = /\breturn\b/.test(body) ? body : `return (${body});`;
  // eslint-disable-next-line @typescript-eslint/no-implied-eval
  const factory = new Function(
    'ALLERGEN_FOODS', 'DIET_FOODS', 'ACTIVITY_MULTIPLIERS',
    `return function(f) { ${src} };`,
  ) as (
    a: typeof ALLERGEN_FOODS,
    d: typeof DIET_FOODS,
    m: typeof ACTIVITY_MULTIPLIERS,
  ) => (f: Facts) => T;
  return factory(ALLERGEN_FOODS, DIET_FOODS, ACTIVITY_MULTIPLIERS);
}

function buildCondition(body: string): ConditionFn {
  return buildFn<boolean>(body);
}

function buildAction(body: string): ActionFn {
  return buildFn<Partial<Facts>>(body);
}

export function ruleJsonToRule(r: RuleJson): Rule {
  return {
    id: r.id,
    description: r.description,
    salience: r.salience,
    condition: buildCondition(r.condition),
    action: buildAction(r.action),
  };
}

/** Try to compile condition + action; returns an error message or null. */
export function validateRuleJson(r: RuleJson): string | null {
  try {
    buildCondition(r.condition);
    buildAction(r.action);
    return null;
  } catch (e) {
    return e instanceof Error ? e.message : String(e);
  }
}

// ---------------------------------------------------------------------------
// Persistence helpers
// ---------------------------------------------------------------------------

export function getRulesJson(): RuleJson[] {
  try {
    const saved = localStorage.getItem(RULES_STORAGE_KEY);
    if (saved) return JSON.parse(saved) as RuleJson[];
  } catch { /* fall through to default */ }
  return defaultRulesJson as RuleJson[];
}

export function saveRulesJson(rules: RuleJson[]): void {
  localStorage.setItem(RULES_STORAGE_KEY, JSON.stringify(rules));
}

export function resetRulesJson(): void {
  localStorage.removeItem(RULES_STORAGE_KEY);
}

export function getFactsSchema(): FactFieldSchema[] {
  try {
    const saved = localStorage.getItem(SCHEMA_STORAGE_KEY);
    if (saved) return JSON.parse(saved) as FactFieldSchema[];
  } catch { /* fall through to default */ }
  return defaultSchemaJson as FactFieldSchema[];
}

export function saveFactsSchema(schema: FactFieldSchema[]): void {
  localStorage.setItem(SCHEMA_STORAGE_KEY, JSON.stringify(schema));
}

export function resetFactsSchema(): void {
  localStorage.removeItem(SCHEMA_STORAGE_KEY);
}

/** Convert stored JSON rules → live Rule objects ready for the engine. */
export function loadRules(): Rule[] {
  return getRulesJson().map(ruleJsonToRule);
}
