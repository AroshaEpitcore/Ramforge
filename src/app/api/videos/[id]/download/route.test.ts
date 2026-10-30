import { beforeEach, describe, expect, it, vi } from "vitest";

const { db, getCurrentUser, getDownloadUrl } = vi.hoisted(() => ({
  db: { video: { findUnique: vi.fn() }, purchase: { findMany: vi.fn(), update: vi.fn() } },
  getCurrentUser: vi.fn(),
  getDownloadUrl: vi.fn(),
}));
vi.mock("@/server/db", () => ({ db }));
vi.mock("@/server/current-user", () => ({ getCurrentUser }));
vi.mock("@/lib/video", () => ({ getVideoProvider: () => ({ getDownloadUrl }) }));

import { GET } from "./route";

const params = (id: string) => ({ params: Promise.resolve({ id }) });
const dl = {
  id: "v1",
  accessMode: "PAID",
  courseId: null,
  fullAssetId: "a1",
  status: "PUBLISHED",
  allowDownload: true,
};
const owned = {
  id: "p1",
  videoId: "v1",
  courseId: null,
  type: "DOWNLOAD",
  expiresAt: null,
  revokedAt: null,
  downloadCount: 0,
  downloadLimit: 3,
};

beforeEach(() => {
  vi.clearAllMocks();
  getDownloadUrl.mockResolvedValue({ url: "https://r2/file.mp4", expiresAt: new Date() });
  db.purchase.update.mockResolvedValue({});
});

describe("GET download", () => {
  it("404 for an unknown video", async () => {
    db.video.findUnique.mockResolvedValue(null);
    expect((await GET(new Request("http://x"), params("v0"))).status).toBe(404);
  });

  it("403 when downloads aren't allowed", async () => {
    db.video.findUnique.mockResolvedValue({ ...dl, allowDownload: false });
    expect((await GET(new Request("http://x"), params("v1"))).status).toBe(403);
  });

  it("401 when not signed in", async () => {
    db.video.findUnique.mockResolvedValue(dl);
    getCurrentUser.mockResolvedValue(null);
    expect((await GET(new Request("http://x"), params("v1"))).status).toBe(401);
  });

  it("403 when the user doesn't own it", async () => {
    db.video.findUnique.mockResolvedValue(dl);
    getCurrentUser.mockResolvedValue({ id: "u1" });
    db.purchase.findMany.mockResolvedValue([]);
    expect((await GET(new Request("http://x"), params("v1"))).status).toBe(403);
  });

  it("403 when the download limit is reached", async () => {
    db.video.findUnique.mockResolvedValue(dl);
    getCurrentUser.mockResolvedValue({ id: "u1" });
    db.purchase.findMany.mockResolvedValue([{ ...owned, downloadCount: 3, downloadLimit: 3 }]);
    expect((await GET(new Request("http://x"), params("v1"))).status).toBe(403);
  });

  it("issues a signed URL and increments the counter", async () => {
    db.video.findUnique.mockResolvedValue(dl);
    getCurrentUser.mockResolvedValue({ id: "u1" });
    db.purchase.findMany.mockResolvedValue([owned]);
    const res = await GET(new Request("http://x"), params("v1"));
    expect(res.status).toBe(200);
    await expect(res.json()).resolves.toMatchObject({ url: "https://r2/file.mp4" });
    expect(db.purchase.update).toHaveBeenCalledWith(
      expect.objectContaining({ where: { id: "p1" }, data: { downloadCount: { increment: 1 } } }),
    );
  });

  it("409 when the asset isn't ready", async () => {
    db.video.findUnique.mockResolvedValue({ ...dl, fullAssetId: null });
    getCurrentUser.mockResolvedValue({ id: "u1" });
    db.purchase.findMany.mockResolvedValue([owned]);
    expect((await GET(new Request("http://x"), params("v1"))).status).toBe(409);
  });
});
