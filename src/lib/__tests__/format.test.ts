import { describe, it, expect } from "vitest";
import { formatMoney, formatCOP, CURRENCIES } from "../format";

describe("formatMoney", () => {
  it("formatea un valor como string de moneda", () => {
    const result = formatMoney(123456, "COP");
    expect(typeof result).toBe("string");
    expect(result.length).toBeGreaterThan(0);
  });

  it("cae a COP para una moneda desconocida", () => {
    expect(formatMoney(1000, "XXX")).toBe(formatMoney(1000, "COP"));
  });

  it("usa el símbolo de euro", () => {
    expect(formatMoney(1000, "EUR")).toContain("€");
  });

  it("mantiene compatibilidad con formatCOP", () => {
    expect(formatCOP(5000)).toBe(formatMoney(5000, "COP"));
  });
});

describe("CURRENCIES", () => {
  it("incluye monedas comunes", () => {
    const codes = CURRENCIES.map((c) => c.code);
    expect(codes).toContain("COP");
    expect(codes).toContain("USD");
    expect(codes).toContain("EUR");
    expect(codes).toContain("MXN");
  });
});
