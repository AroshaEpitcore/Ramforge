/**
 * VAT / sales-tax helpers for digital goods. All amounts are integer minor units.
 *
 * This is a simple flat-rate helper for the scaffold. In production, resolve the
 * rate from the customer's location (and consider Stripe Tax) — digital goods
 * are generally taxed where the customer is located.
 */

export const DEFAULT_TAX_RATE = 0.2; // 20% VAT (example)

export interface TaxBreakdown {
  subtotal: number;
  taxRate: number;
  tax: number;
  total: number;
}

/** Add tax on top of a tax-exclusive subtotal (minor units). */
export function addTax(subtotalMinor: number, rate: number = DEFAULT_TAX_RATE): TaxBreakdown {
  const tax = Math.round(subtotalMinor * rate);
  return { subtotal: subtotalMinor, taxRate: rate, tax, total: subtotalMinor + tax };
}

/** Extract tax from a tax-inclusive gross amount (minor units). */
export function extractTax(grossMinor: number, rate: number = DEFAULT_TAX_RATE): TaxBreakdown {
  const subtotal = Math.round(grossMinor / (1 + rate));
  return { subtotal, taxRate: rate, tax: grossMinor - subtotal, total: grossMinor };
}
