/**
 * Koko BNPL surcharge: +12% on the cash price, then split over 3 months.
 * Display-only for now — actual Koko checkout processing is a separate
 * integration; keep this the single source of the math either way.
 */
export const KOKO_SURCHARGE_RATE = 0.12;
export const KOKO_MONTHS = 3;

export function kokoMonthlyInstallment(price: number): number {
  return Math.round((price * (1 + KOKO_SURCHARGE_RATE)) / KOKO_MONTHS);
}
