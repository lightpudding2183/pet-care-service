// Assumes amounts arrive in major units (e.g. 25.5). If the backend returns the
// smallest unit (cents), divide by 100 here once and everything else follows.
export function formatMoney(amount: number | string | null | undefined, currency?: string | null) {
  if (amount == null || amount === '') return null;
  const n = Number(amount);
  if (currency) {
    try {
      return new Intl.NumberFormat(undefined, { style: 'currency', currency: String(currency).toUpperCase() }).format(n);
    } catch { /* unknown currency code: fall through */ }
  }
  return n.toLocaleString();
}