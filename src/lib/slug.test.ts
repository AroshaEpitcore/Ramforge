import { describe, expect, it } from "vitest";
import { slugify } from "./slug";

describe("slugify", () => {
  it("lowercases and hyphenates", () => {
    expect(slugify("Hello World")).toBe("hello-world");
  });
  it("collapses non-alphanumerics and trims hyphens", () => {
    expect(slugify("  3D & VFX!!  ")).toBe("3d-vfx");
    expect(slugify("A---B__C")).toBe("a-b-c");
  });
  it("strips diacritics", () => {
    expect(slugify("Café Déjà")).toBe("cafe-deja");
  });
  it("caps length at 80 chars", () => {
    expect(slugify("x".repeat(200)).length).toBeLessThanOrEqual(80);
  });
  it("handles empty / symbol-only input", () => {
    expect(slugify("")).toBe("");
    expect(slugify("!!!")).toBe("");
  });
});
