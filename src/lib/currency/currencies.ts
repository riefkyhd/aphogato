export interface CurrencyInfo {
  code: string;
  name: string;
  symbol: string;
  decimals: number;
  locale: string;
}

export const SUPPORTED_CURRENCIES: CurrencyInfo[] = [
  {
    code: "IDR",
    name: "Indonesian Rupiah",
    symbol: "Rp",
    decimals: 0,
    locale: "id-ID",
  },
  {
    code: "SGD",
    name: "Singapore Dollar",
    symbol: "S$",
    decimals: 2,
    locale: "en-SG",
  },
  {
    code: "USD",
    name: "US Dollar",
    symbol: "$",
    decimals: 2,
    locale: "en-US",
  },
  {
    code: "MYR",
    name: "Malaysian Ringgit",
    symbol: "RM",
    decimals: 2,
    locale: "ms-MY",
  },
  {
    code: "AUD",
    name: "Australian Dollar",
    symbol: "A$",
    decimals: 2,
    locale: "en-AU",
  },
  {
    code: "EUR",
    name: "Euro",
    symbol: "€",
    decimals: 2,
    locale: "de-DE",
  },
  {
    code: "GBP",
    name: "British Pound",
    symbol: "£",
    decimals: 2,
    locale: "en-GB",
  },
  {
    code: "JPY",
    name: "Japanese Yen",
    symbol: "¥",
    decimals: 0,
    locale: "ja-JP",
  },
];

export function getCurrencyInfo(code?: string | null): CurrencyInfo {
  const normalized = (code || "IDR").trim().toUpperCase();
  const match = SUPPORTED_CURRENCIES.find((c) => c.code === normalized);
  if (match) return match;

  return {
    code: normalized,
    name: normalized,
    symbol: normalized,
    decimals: 2,
    locale: "en-US",
  };
}

export function formatCurrency(
  amount: number,
  currencyCode: string = "IDR"
): string {
  const info = getCurrencyInfo(currencyCode);
  const safeAmount = Number.isFinite(amount) ? amount : 0;
  return new Intl.NumberFormat(info.locale, {
    style: "currency",
    currency: info.code,
    maximumFractionDigits: info.decimals,
    minimumFractionDigits: info.decimals,
  }).format(safeAmount);
}
