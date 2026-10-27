import { describe, expect, it } from "vitest";
import { hashPassword, verifyPassword } from "./password";

describe("password service", () => {
  it("hashes to a bcrypt string that is not the plaintext", async () => {
    const hash = await hashPassword("correct horse battery");
    expect(hash).not.toBe("correct horse battery");
    expect(hash).toMatch(/^\$2[aby]\$/); // bcrypt prefix
  });

  it("verifies a correct password", async () => {
    const hash = await hashPassword("s3cret-password");
    await expect(verifyPassword("s3cret-password", hash)).resolves.toBe(true);
  });

  it("rejects an incorrect password", async () => {
    const hash = await hashPassword("s3cret-password");
    await expect(verifyPassword("wrong-password", hash)).resolves.toBe(false);
  });

  it("returns false for a missing hash (no user) without throwing", async () => {
    await expect(verifyPassword("anything", null)).resolves.toBe(false);
    await expect(verifyPassword("anything", undefined)).resolves.toBe(false);
  });
});
