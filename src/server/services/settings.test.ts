import { beforeEach, describe, expect, it, vi } from "vitest";

const { db } = vi.hoisted(() => ({
  db: { setting: { findUnique: vi.fn(), upsert: vi.fn() } },
}));
vi.mock("@/server/db", () => ({ db }));

import { getSetting, getVatRatePercent, isPaymentsEnabled, setSetting } from "./settings";

beforeEach(() => vi.clearAllMocks());

describe("settings service", () => {
  it("getSetting returns the stored value", async () => {
    db.setting.findUnique.mockResolvedValue({ value: 42 });
    expect(await getSetting("k", 0)).toBe(42);
  });

  it("getSetting returns the fallback when missing", async () => {
    db.setting.findUnique.mockResolvedValue(null);
    expect(await getSetting("k", "fallback")).toBe("fallback");
  });

  it("setSetting upserts", async () => {
    db.setting.upsert.mockResolvedValue({});
    await setSetting("payments.enabled", true);
    expect(db.setting.upsert).toHaveBeenCalledWith(
      expect.objectContaining({ where: { key: "payments.enabled" } }),
    );
  });

  it("isPaymentsEnabled defaults to false", async () => {
    db.setting.findUnique.mockResolvedValue(null);
    expect(await isPaymentsEnabled()).toBe(false);
  });

  it("getVatRatePercent clamps and defaults", async () => {
    db.setting.findUnique.mockResolvedValue(null);
    expect(await getVatRatePercent()).toBe(0);
    db.setting.findUnique.mockResolvedValue({ value: 150 });
    expect(await getVatRatePercent()).toBe(100);
    db.setting.findUnique.mockResolvedValue({ value: 20 });
    expect(await getVatRatePercent()).toBe(20);
    db.setting.findUnique.mockResolvedValue({ value: -5 });
    expect(await getVatRatePercent()).toBe(0);
  });
});
