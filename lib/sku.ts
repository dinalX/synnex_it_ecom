const CATEGORY_CODES: Record<string, string> = {
  "pos-solution": "POS",
  "barcode-solution": "BAR",
  "biometrics-security-solution": "SEC",
  "pc-printer-solution": "PCP",
};

export function generateSku(mainCategorySlug: string, sequence: number): string {
  const code = CATEGORY_CODES[mainCategorySlug] ?? "GEN";
  return `${code}-${String(sequence).padStart(3, "0")}`;
}
