import type { Facts } from './types';

export class WorkingMemory {
  private facts: Facts;

  constructor(initial: Facts) {
    this.facts = { ...initial };
  }

  assert(newFacts: Partial<Facts>): void {
    // Merge arrays rather than replace them
    const merged: Partial<Facts> = { ...newFacts };

    if (newFacts.blacklisted_foods && this.facts.blacklisted_foods) {
      merged.blacklisted_foods = [
        ...this.facts.blacklisted_foods,
        ...newFacts.blacklisted_foods,
      ];
    }
    if (newFacts.recommended_foods && this.facts.recommended_foods) {
      merged.recommended_foods = [
        ...this.facts.recommended_foods,
        ...newFacts.recommended_foods,
      ];
    }

    this.facts = { ...this.facts, ...merged };
  }

  getAll(): Facts {
    return { ...this.facts };
  }
}
