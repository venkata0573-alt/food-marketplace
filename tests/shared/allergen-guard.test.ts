import { describe, expect, it } from 'vitest';

import { findAllergenConflicts } from '../../packages/shared/allergen-guard';

describe('findAllergenConflicts', () => {
  it('returns empty when customer has no allergens', () => {
    const map = new Map([['d1', ['peanuts']]]);
    expect(findAllergenConflicts(map, [])).toEqual([]);
  });

  it('detects overlapping allergen codes case-insensitively', () => {
    const map = new Map([
      ['d1', ['Peanuts']],
      ['d2', ['milk']],
    ]);
    expect(findAllergenConflicts(map, ['peanuts'])).toEqual([
      { dishId: 'd1', allergenCode: 'Peanuts' },
    ]);
  });
});
