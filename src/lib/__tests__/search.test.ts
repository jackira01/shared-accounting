import { describe, it, expect } from "vitest";
import { similarityScore, rankProducts } from "../search";

describe("similarityScore", () => {
  it("valora más la coincidencia exacta", () => {
    expect(similarityScore("papa", "papa")).toBe(3);
  });

  it("valora el prefijo por encima de la coincidencia interna", () => {
    const prefix = similarityScore("papa", "papa capira");
    const inner = similarityScore("capira", "papa capira");
    expect(prefix).toBeGreaterThan(inner);
  });

  it("detecta coincidencia interna", () => {
    expect(similarityScore("capira", "papa capira")).toBe(2);
  });

  it("ignora mayúsculas y espacios sobrantes", () => {
    expect(similarityScore("  PAPA ", "Papa Capira")).toBe(2.5);
  });

  it("acepta coincidencias difusas por distancia de edición", () => {
    expect(similarityScore("papel", "pape")).toBeGreaterThan(0);
  });

  it("descarta consultas sin relación", () => {
    expect(similarityScore("arroz", "shampoo")).toBe(0);
  });
});

describe("rankProducts", () => {
  const products = [
    { description: "ARROZ" },
    { description: "PAPA CAPIRA" },
    { description: "PAPEL HIGIENICO" },
    { description: "SHAMPOO" },
    { description: "PAPAS FOSFORITO" },
    { description: "PLATANO MADURO" },
    { description: "TOMATE" },
    { description: "PAN CAIMAN" },
  ];

  it("devuelve como máximo 7 resultados", () => {
    const many = Array.from({ length: 10 }, (_, i) => ({
      description: `PAPAS ${i}`,
    }));
    expect(rankProducts("papa", many)).toHaveLength(7);
  });

  it("respeta el límite personalizado", () => {
    expect(rankProducts("p", products, 3)).toHaveLength(3);
  });

  it("ordena por similitud poniendo primero la coincidencia más fuerte", () => {
    const results = rankProducts("papa", products);
    expect(results[0].description).toBe("PAPA CAPIRA");
  });

  it("no devuelve resultados sin relación", () => {
    expect(rankProducts("zzz", products)).toHaveLength(0);
  });
});
