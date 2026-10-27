import { beforeEach, describe, expect, it, vi } from "vitest";
import { NextRequest } from "next/server";

const { getCurrentUser, createUpload } = vi.hoisted(() => ({
  getCurrentUser: vi.fn(),
  createUpload: vi.fn(),
}));

vi.mock("@/server/current-user", () => ({ getCurrentUser }));
vi.mock("@/lib/video", () => ({ getVideoProvider: () => ({ createUpload }) }));

import { POST } from "./route";

function req(body: unknown) {
  return new NextRequest("http://localhost/api/upload", {
    method: "POST",
    body: JSON.stringify(body),
    headers: { "content-type": "application/json" },
  });
}

const validBody = { filename: "clip.mp4", sizeBytes: 1024, contentType: "video/mp4" };

beforeEach(() => {
  vi.clearAllMocks();
  createUpload.mockResolvedValue({ uploadUrl: "https://up", assetId: "asset_1" });
});

describe("POST /api/upload (authz + validation)", () => {
  it("401 when not signed in", async () => {
    getCurrentUser.mockResolvedValue(null);
    const res = await POST(req(validBody));
    expect(res.status).toBe(401);
    expect(createUpload).not.toHaveBeenCalled();
  });

  it("403 for a CUSTOMER (no videos:upload permission)", async () => {
    getCurrentUser.mockResolvedValue({ id: "u1", role: "CUSTOMER", name: "C", email: "c@x.com" });
    const res = await POST(req(validBody));
    expect(res.status).toBe(403);
    expect(createUpload).not.toHaveBeenCalled();
  });

  it("400 for an invalid payload (missing filename)", async () => {
    getCurrentUser.mockResolvedValue({ id: "a", role: "SUPER_ADMIN", name: "A", email: "a@x.com" });
    const res = await POST(req({ sizeBytes: 10 }));
    expect(res.status).toBe(400);
    expect(createUpload).not.toHaveBeenCalled();
  });

  it("400 for a non-video content type", async () => {
    getCurrentUser.mockResolvedValue({ id: "a", role: "SUPER_ADMIN", name: "A", email: "a@x.com" });
    const res = await POST(req({ ...validBody, contentType: "image/png" }));
    expect(res.status).toBe(400);
  });

  it("201 + upload target for an authorised uploader", async () => {
    getCurrentUser.mockResolvedValue({
      id: "a",
      role: "CONTENT_UPLOADER",
      name: "A",
      email: "a@x.com",
    });
    const res = await POST(req(validBody));
    expect(res.status).toBe(201);
    await expect(res.json()).resolves.toEqual({ uploadUrl: "https://up", assetId: "asset_1" });
    expect(createUpload).toHaveBeenCalledWith(validBody);
  });
});
