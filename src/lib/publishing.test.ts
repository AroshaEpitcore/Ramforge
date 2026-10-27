import { describe, expect, it } from "vitest";
import { isPublished } from "./publishing";

describe("isPublished (scheduled-publish visibility)", () => {
  const past = new Date("2020-01-01");
  const future = new Date("2999-01-01");

  it("hides DRAFT and ARCHIVED items", () => {
    expect(isPublished({ status: "DRAFT" })).toBe(false);
    expect(isPublished({ status: "ARCHIVED" })).toBe(false);
  });

  it("shows PUBLISHED items with no schedule", () => {
    expect(isPublished({ status: "PUBLISHED", publishAt: null })).toBe(true);
    expect(isPublished({ status: "PUBLISHED" })).toBe(true);
  });

  it("shows PUBLISHED items whose publishAt has passed", () => {
    expect(isPublished({ status: "PUBLISHED", publishAt: past })).toBe(true);
  });

  it("hides PUBLISHED items scheduled for the future", () => {
    expect(isPublished({ status: "PUBLISHED", publishAt: future })).toBe(false);
  });

  it("accepts ISO strings for publishAt", () => {
    expect(isPublished({ status: "PUBLISHED", publishAt: "2020-01-01T00:00:00.000Z" })).toBe(true);
  });
});
