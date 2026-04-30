export type CurrencyCode =
  | "USD"
  | "EUR"
  | "GBP"
  | "JPY"
  | "CAD"
  | "AUD"
  | "CHF"
  | "CNY"
  | "KRW"
  | "INR"
  | "SGD"
  | "HKD"
  | "TWD"
  | "THB"
  | "MXN"
  | "BRL";

export const CURRENCIES: { code: CurrencyCode; label: string; symbol: string }[] = [
  { code: "USD", label: "US Dollar", symbol: "$" },
  { code: "EUR", label: "Euro", symbol: "€" },
  { code: "GBP", label: "British Pound", symbol: "£" },
  { code: "JPY", label: "Japanese Yen", symbol: "¥" },
  { code: "CAD", label: "Canadian Dollar", symbol: "CA$" },
  { code: "AUD", label: "Australian Dollar", symbol: "A$" },
  { code: "CHF", label: "Swiss Franc", symbol: "CHF" },
  { code: "CNY", label: "Chinese Yuan", symbol: "CN¥" },
  { code: "KRW", label: "Korean Won", symbol: "₩" },
  { code: "INR", label: "Indian Rupee", symbol: "₹" },
  { code: "SGD", label: "Singapore Dollar", symbol: "S$" },
  { code: "HKD", label: "Hong Kong Dollar", symbol: "HK$" },
  { code: "TWD", label: "Taiwan Dollar", symbol: "NT$" },
  { code: "THB", label: "Thai Baht", symbol: "฿" },
  { code: "MXN", label: "Mexican Peso", symbol: "MX$" },
  { code: "BRL", label: "Brazilian Real", symbol: "R$" },
];

export function currencySymbol(code: string): string {
  return CURRENCIES.find((c) => c.code === code)?.symbol ?? code;
}

export function formatMoney(amount: number, code: string): string {
  const symbol = currencySymbol(code);
  const value = Math.abs(amount).toLocaleString("en-US");
  return `${amount < 0 ? "-" : ""}${symbol}${value}`;
}
