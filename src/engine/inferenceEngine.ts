import type { Facts, InferenceResult, TraceEntry } from './types';
import { RULES } from './knowledgeBase';
import { WorkingMemory } from './workingMemory';

export function runInference(initialFacts: Facts): InferenceResult {
  const wm = new WorkingMemory(initialFacts);
  const trace: TraceEntry[] = [];
  const fired = new Set<string>();
  let iteration = 0;

  while (true) {
    iteration++;
    const facts = wm.getAll();

    // MATCH: collect all rules whose conditions are met and haven't been fired
    const conflictSet = RULES.filter(
      (rule) => !fired.has(rule.id) && rule.condition(facts)
    );

    if (conflictSet.length === 0) break; // quiescence — no more rules match

    // RESOLVE: sort by salience descending; break ties by rule position in array
    conflictSet.sort((a, b) => b.salience - a.salience);
    const selected = conflictSet[0];

    // ACT: execute rule and assert results into working memory
    const newFacts = selected.action(facts);
    wm.assert(newFacts);
    fired.add(selected.id);

    trace.push({
      iteration,
      conflict_set: conflictSet.map((r) => `${r.id} (sal:${r.salience})`),
      rule_fired: selected.id,
      rule_description: selected.description,
      new_facts: newFacts as Record<string, unknown>,
    });
  }

  return { facts: wm.getAll(), trace };
}
