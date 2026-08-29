export type CurrencyInfo = {
  code: string;
  label: string;
  symbol: string;
  locale: string;
};

export const CURRENCIES: CurrencyInfo[] = [
  { code: "COP", label: "Peso colombiano", symbol: "$", locale: "es-CO" },
  { code: "USD", label: "Dólar estadounidense", symbol: "$", locale: "en-US" },
  { code: "EUR", label: "Euro", symbol: "€", locale: "es-ES" },
  { code: "MXN", label: "Peso mexicano", symbol: "$", locale: "es-MX" },
  { code: "ARS", label: "Peso argentino", symbol: "$", locale: "es-AR" },
  { code: "CLP", label: "Peso chileno", symbol: "$", locale: "es-CL" },
  { code: "PEN", label: "Sol peruano", symbol: "S/", locale: "es-PE" },
  { code: "BRL", label: "Real brasileño", symbol: "R$", locale: "pt-BR" },
];

const CURRENCY_MAP = new Map(CURRENCIES.map((c) => [c.code, c]));

export function formatMoney(value: number, currency: string): string {
  const meta = CURRENCY_MAP.get(currency) ?? CURRENCY_MAP.get("COP")!;
  return new Intl.NumberFormat(meta.locale, {
    style: "currency",
    currency: meta.code,
    maximumFractionDigits: 0,
  }).format(value);
}

export function formatCOP(value: number): string {
  return formatMoney(value, "COP");
}

export function formatDate(date: Date): string {
  return new Intl.DateTimeFormat("es-CO", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  }).format(date);
}

export function toInputDate(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

export function parseInputDate(value: string): Date {
  return new Date(`${value}T12:00:00`);
}

export function monthKey(date: Date): string {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;
}

export function formatMonth(month: string): string {
  const [year, monthIndex] = month.split("-").map(Number);
  return new Intl.DateTimeFormat("es-CO", {
    month: "long",
    year: "numeric",
  }).format(new Date(year, monthIndex - 1, 1));
}
