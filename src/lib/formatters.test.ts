import { describe, expect, it } from "vitest";
import {
  discountPercent,
  formatCompactNumber,
  formatCurrency,
  formatDuration,
  formatFileSize,
} from "./formatters";

describe("formatCurrency", () => {
  it("formats integer minor units as currency", () => {
    expect(formatCurrency(3900)).toBe("$39.00");
    expect(formatCurrency(0)).toBe("$0.00");
  });
});

describe("discountPercent", () => {
  it("rounds the percentage saved", () => {
    expect(discountPercent(4900, 3900)).toBe(20);
    expect(discountPercent(100, 50)).toBe(50);
  });
  it("returns 0 when there is no discount", () => {
    expect(discountPercent(1000, 1000)).toBe(0);
    expect(discountPercent(1000, 1200)).toBe(0);
  });
});

describe("formatDuration", () => {
  it("formats clock style", () => {
    expect(formatDuration(75)).toBe("1:15");
    expect(formatDuration(3725)).toBe("1:02:05");
  });
  it("formats long style", () => {
    expect(formatDuration(3725, "long")).toBe("1h 2m");
    expect(formatDuration(75, "long")).toBe("1m 15s");
  });
});

describe("formatFileSize", () => {
  it("formats bytes into human units", () => {
    expect(formatFileSize(0)).toBe("0 B");
    expect(formatFileSize(15 * 1024 * 1024)).toBe("15 MB");
    expect(formatFileSize(1536)).toBe("1.5 KB");
  });
});

describe("formatCompactNumber", () => {
  it("formats large numbers compactly", () => {
    expect(formatCompactNumber(12400)).toBe("12.4K");
  });
});
