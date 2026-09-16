export const centsToUnits = (cents: number) => cents / 100;
export const unitsToCents = (units: number) => Math.round(units * 100);

export function formatMoney(cents: number, currency = "KES", locale = "en-KE"): string {
  return new Intl.NumberFormat(locale, { style: "currency", currency }).format(centsToUnits(cents));
}
