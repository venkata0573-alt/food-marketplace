/** Shared domain types — expanded in later layers. */
export type MarketplaceId = string & { readonly __brand: 'MarketplaceId' };

export function marketplaceId(value: string): MarketplaceId {
  return value as MarketplaceId;
}
