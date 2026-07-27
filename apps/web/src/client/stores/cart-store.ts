'use client';
// client-justification: Zustand cart spans header + checkout — genuine cross-tree client state.

import { create } from 'zustand';

export interface CartLine {
  dishId: string;
  name: string;
  priceCents: number;
  quantity: number;
}

interface CartState {
  lines: CartLine[];
  addLine: (line: Omit<CartLine, 'quantity'>, quantity?: number) => void;
  removeLine: (dishId: string) => void;
  optimisticRollback: (snapshot: CartLine[]) => void;
}

export const useCartStore = create<CartState>((set, get) => ({
  lines: [],
  addLine(line, quantity = 1) {
    set((state) => {
      const existing = state.lines.find((l) => l.dishId === line.dishId);
      if (existing) {
        return {
          lines: state.lines.map((l) =>
            l.dishId === line.dishId ? { ...l, quantity: l.quantity + quantity } : l,
          ),
        };
      }
      return { lines: [...state.lines, { ...line, quantity }] };
    });
  },
  removeLine(dishId) {
    set({ lines: get().lines.filter((l) => l.dishId !== dishId) });
  },
  optimisticRollback(snapshot) {
    set({ lines: snapshot });
  },
}));

export async function persistCartOptimistic(
  mutate: () => Promise<void>,
  rollback: () => void,
): Promise<boolean> {
  try {
    await mutate();
    return true;
  } catch {
    rollback();
    return false;
  }
}
