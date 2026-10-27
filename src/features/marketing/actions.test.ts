import { beforeEach, describe, expect, it, vi } from "vitest";

const { db } = vi.hoisted(() => ({
  db: { newsletterSubscriber: { upsert: vi.fn() } },
}));
vi.mock("@/server/db", () => ({ db }));

import { subscribeNewsletter } from "./actions";

beforeEach(() => vi.clearAllMocks());

describe("subscribeNewsletter", () => {
  it("upserts a normalised email", async () => {
    db.newsletterSubscriber.upsert.mockResolvedValue({});
    const res = await subscribeNewsletter({ email: "  Fan@X.com ", source: "footer" });
    expect(res.ok).toBe(true);
    expect(db.newsletterSubscriber.upsert).toHaveBeenCalledWith(
      expect.objectContaining({ where: { email: "fan@x.com" } }),
    );
  });

  it("rejects an invalid email with a field error", async () => {
    const res = await subscribeNewsletter({ email: "nope" });
    expect(res.ok).toBe(false);
    if (!res.ok) expect(res.fieldErrors?.email?.length).toBeGreaterThan(0);
    expect(db.newsletterSubscriber.upsert).not.toHaveBeenCalled();
  });
});
