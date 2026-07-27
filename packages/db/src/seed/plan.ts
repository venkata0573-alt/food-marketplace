/** Fixed seed for reproducible local and test data. */
export const DETERMINISTIC_SEED = 0x1a2e3;

export const SEED_COUNTS = {
  chefs: 20,
  dishes: 60,
  orders: 100,
} as const;

export const ORDER_STATUSES = [
  'draft',
  'pending_payment',
  'paid',
  'preparing',
  'ready',
  'out_for_delivery',
  'delivered',
  'cancelled',
  'refunded',
  'disputed',
] as const;

export type OrderStatus = (typeof ORDER_STATUSES)[number];

export const ALLERGEN_TAXONOMY = [
  { code: 'gluten', name: 'Gluten', description: 'Cereals containing gluten' },
  { code: 'crustaceans', name: 'Crustaceans', description: 'Crab, lobster, shrimp' },
  { code: 'eggs', name: 'Eggs', description: 'Eggs and egg products' },
  { code: 'fish', name: 'Fish', description: 'Fish and fish products' },
  { code: 'peanuts', name: 'Peanuts', description: 'Peanuts and peanut products' },
  { code: 'soybeans', name: 'Soybeans', description: 'Soy and soy products' },
  { code: 'milk', name: 'Milk', description: 'Milk and dairy including lactose' },
  {
    code: 'tree_nuts',
    name: 'Tree nuts',
    description: 'Almonds, hazelnuts, walnuts, cashews, etc.',
  },
  { code: 'celery', name: 'Celery', description: 'Celery and celeriac' },
  { code: 'mustard', name: 'Mustard', description: 'Mustard seeds and products' },
  { code: 'sesame', name: 'Sesame', description: 'Sesame seeds and products' },
  { code: 'sulphites', name: 'Sulphites', description: 'Sulphur dioxide > 10mg/kg' },
  { code: 'lupin', name: 'Lupin', description: 'Lupin seeds and flour' },
  { code: 'molluscs', name: 'Molluscs', description: 'Mussels, oysters, squid' },
] as const;

/**
 * Mulberry32 PRNG — deterministic for a given seed integer.
 */
export function createRng(seed: number): () => number {
  let state = seed >>> 0;
  return () => {
    state = (state + 0x6d2b79f5) >>> 0;
    let t = state;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export function pick<T>(rng: () => number, items: readonly T[]): T {
  const index = Math.floor(rng() * items.length);
  return items[index] as T;
}

export function uuidFromRng(rng: () => number, namespace: string, index: number): string {
  const bytes: number[] = [];
  for (let i = 0; i < 16; i += 1) {
    bytes.push(Math.floor(rng() * 256));
  }
  bytes[6] = (bytes[6]! & 0x0f) | 0x40;
  bytes[8] = (bytes[8]! & 0x3f) | 0x80;
  const hex = bytes.map((b) => b.toString(16).padStart(2, '0')).join('');
  void namespace;
  void index;
  return `${hex.slice(0, 8)}-${hex.slice(8, 12)}-${hex.slice(12, 16)}-${hex.slice(16, 20)}-${hex.slice(20)}`;
}

export interface SeedChef {
  id: string;
  slug: string;
  displayName: string;
  bio: string;
  city: string;
}

export interface SeedDish {
  id: string;
  chefId: string;
  slug: string;
  name: string;
  description: string;
  priceCents: number;
  allergenCodes: string[];
}

export interface SeedOrder {
  id: string;
  orderNumber: string;
  customerId: string;
  chefId: string;
  status: OrderStatus;
  subtotalCents: number;
  dishId: string;
  quantity: number;
  unitPriceCents: number;
}

export interface SeedPlan {
  chefs: SeedChef[];
  dishes: SeedDish[];
  orders: SeedOrder[];
}

export function buildSeedPlan(seed: number = DETERMINISTIC_SEED): SeedPlan {
  const rng = createRng(seed);
  const cities = ['Austin', 'Portland', 'Denver', 'Chicago', 'Seattle'] as const;
  const chefs: SeedChef[] = [];

  for (let i = 0; i < SEED_COUNTS.chefs; i += 1) {
    const slug = `chef-${String(i + 1).padStart(2, '0')}`;
    chefs.push({
      id: uuidFromRng(rng, 'chef', i),
      slug,
      displayName: `Chef ${pick(rng, ['Amara', 'Bao', 'Cruz', 'Dev', 'Elena', 'Finn'])} ${i + 1}`,
      bio: `Deterministic sandbox chef profile #${i + 1}.`,
      city: pick(rng, cities),
    });
  }

  const dishes: SeedDish[] = [];
  for (let i = 0; i < SEED_COUNTS.dishes; i += 1) {
    const chef = chefs[i % chefs.length]!;
    const slug = `dish-${String(i + 1).padStart(3, '0')}`;
    const allergenCount = 1 + Math.floor(rng() * 3);
    const allergenCodes: string[] = [];
    for (let a = 0; a < allergenCount; a += 1) {
      allergenCodes.push(pick(rng, ALLERGEN_TAXONOMY).code);
    }
    dishes.push({
      id: uuidFromRng(rng, 'dish', i),
      chefId: chef.id,
      slug,
      name: `Dish ${i + 1}`,
      description: `Seeded menu item ${i + 1} from ${chef.slug}.`,
      priceCents: 800 + Math.floor(rng() * 4200),
      allergenCodes: Array.from(new Set(allergenCodes)),
    });
  }

  const orders: SeedOrder[] = [];
  for (let i = 0; i < SEED_COUNTS.orders; i += 1) {
    const status = ORDER_STATUSES[i % ORDER_STATUSES.length]!;
    const dish = dishes[i % dishes.length]!;
    const chef = chefs.find((c) => c.id === dish.chefId)!;
    const quantity = 1 + Math.floor(rng() * 3);
    orders.push({
      id: uuidFromRng(rng, 'order', i),
      orderNumber: `ORD-${String(i + 1).padStart(5, '0')}`,
      customerId: uuidFromRng(rng, 'customer', i),
      chefId: chef.id,
      status,
      subtotalCents: dish.priceCents * quantity,
      dishId: dish.id,
      quantity,
      unitPriceCents: dish.priceCents,
    });
  }

  return { chefs, dishes, orders };
}

export function seedPlanFingerprint(plan: SeedPlan): string {
  const parts = [
    plan.chefs.map((c) => c.id).join(','),
    plan.dishes.map((d) => d.id).join(','),
    plan.orders.map((o) => `${o.orderNumber}:${o.status}`).join(','),
  ];
  return parts.join('|');
}
