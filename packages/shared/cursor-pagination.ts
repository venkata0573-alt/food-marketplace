import { z } from 'zod';

export const cursorPageSizeSchema = z.number().int().min(1).max(50).default(24);

export const dishBrowseCursorSchema = z.object({
  createdAt: z.string().datetime(),
  id: z.string().uuid(),
});

export type DishBrowseCursor = z.infer<typeof dishBrowseCursorSchema>;

export interface CursorPage<T, C> {
  items: T[];
  nextCursor: C | null;
}

export function encodeCursor(cursor: DishBrowseCursor): string {
  return Buffer.from(JSON.stringify(cursor), 'utf8').toString('base64url');
}

export function decodeDishBrowseCursor(raw: string | null | undefined): DishBrowseCursor | null {
  if (!raw) {
    return null;
  }
  try {
    const json = Buffer.from(raw, 'base64url').toString('utf8');
    const parsed = dishBrowseCursorSchema.safeParse(JSON.parse(json));
    return parsed.success ? parsed.data : null;
  } catch {
    return null;
  }
}
