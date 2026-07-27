/** Returns allergen codes present on dishes that conflict with the customer's profile. */
export function findAllergenConflicts(
  dishAllergensByDishId: Map<string, readonly string[]>,
  customerAllergenCodes: readonly string[],
): { dishId: string; allergenCode: string }[] {
  if (customerAllergenCodes.length === 0) {
    return [];
  }
  const blocked = new Set(customerAllergenCodes.map((c) => c.toLowerCase()));
  const conflicts: { dishId: string; allergenCode: string }[] = [];
  for (const [dishId, codes] of dishAllergensByDishId) {
    for (const code of codes) {
      if (blocked.has(code.toLowerCase())) {
        conflicts.push({ dishId, allergenCode: code });
      }
    }
  }
  return conflicts;
}
