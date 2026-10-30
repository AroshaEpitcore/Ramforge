import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const { env } = vi.hoisted(() => ({
  env: {
    RESEND_API_KEY: undefined as string | undefined,
    EMAIL_FROM: undefined as string | undefined,
  },
}));
vi.mock("@/lib/env", () => ({ env }));

import { sendEmail } from "./mailer";

const msg = { to: "a@x.com", subject: "Hi", html: "<p>Hi</p>" };

beforeEach(() => {
  env.RESEND_API_KEY = undefined;
  env.EMAIL_FROM = undefined;
  vi.restoreAllMocks();
});
afterEach(() => vi.unstubAllGlobals());

describe("sendEmail", () => {
  it("logs and returns ok when no API key is set (dev)", async () => {
    const fetchSpy = vi.fn();
    vi.stubGlobal("fetch", fetchSpy);
    const res = await sendEmail(msg);
    expect(res.ok).toBe(true);
    expect(fetchSpy).not.toHaveBeenCalled();
  });

  it("POSTs to Resend when a key is configured", async () => {
    env.RESEND_API_KEY = "re_test";
    env.EMAIL_FROM = "no-reply@x.com";
    const fetchSpy = vi.fn(async () => ({ ok: true }) as Response);
    vi.stubGlobal("fetch", fetchSpy);
    const res = await sendEmail(msg);
    expect(res.ok).toBe(true);
    expect(fetchSpy).toHaveBeenCalledWith(
      "https://api.resend.com/emails",
      expect.objectContaining({ method: "POST" }),
    );
  });

  it("returns not-ok when the request throws", async () => {
    env.RESEND_API_KEY = "re_test";
    vi.stubGlobal(
      "fetch",
      vi.fn(async () => {
        throw new Error("network");
      }),
    );
    const res = await sendEmail(msg);
    expect(res.ok).toBe(false);
  });
});
