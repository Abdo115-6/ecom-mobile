import type { ProductKind } from '../types/ecommerce';

/**
 * The type chosen in the product editor wins; the category only decides for old products saved without a type.
 * (A physical cable filed under "Produits Digitaux" must still get the COD form with city and address.)
 */
export function productKindOf(p: { productKind?: ProductKind; categoryId?: string } | null | undefined): ProductKind {
  if (p?.productKind) return p.productKind;
  if (p?.categoryId === 'cat-digital') return 'DIGITAL';
  if (p?.categoryId === 'cat-services') return 'SERVICE';
  return 'PHYSICAL';
}

/** Same rule for categories: their own type, else the two built-in digital / service categories */
export function categoryKindOf(c: { productKind?: ProductKind; id?: string } | null | undefined): ProductKind {
  if (c?.productKind) return c.productKind;
  if (c?.id === 'cat-digital') return 'DIGITAL';
  if (c?.id === 'cat-services') return 'SERVICE';
  return 'PHYSICAL';
}
