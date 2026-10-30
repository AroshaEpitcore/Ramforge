import { beforeEach, describe, expect, it, vi } from "vitest";

const { db, getCurrentUser, getPlaybackUrl } = vi.hoisted(() => ({
  db: {
    video: { findUnique: vi.fn() },
    purchase: { findMany: vi.fn() },
    watchSession: { count: vi.fn(), create: vi.fn() },
  },
  getCurrentUser: vi.fn(),
  getPlaybackUrl: vi.fn(),
}));
vi.mock("@/server/db", () => ({ db }));
vi.mock("@/server/current-user", () => ({ getCurrentUser }));
vi.mock("@/lib/video", () => ({ getVideoProvider: () => ({ getPlaybackUrl }) }));

import { GET } from "./route";

const params = (id: string) => ({ params: Promise.resolve({ id }) });
const freeYt = {
  id: "v1",
  accessMode: "FREE",
  courseId: null,
  source: "YOUTUBE",
  youtubeId: "yt",
  fullAssetId: null,
  status: "PUBLISHED",
};
const paidMux = {
  id: "v2",
  accessMode: "PAID",
  courseId: null,
  source: "MUX",
  youtubeId: null,
  fullAssetId: "pb_1",
  status: "PUBLISHED",
};

beforeEach(() => {
  vi.clearAllMocks();
  db.watchSession.count.mockResolvedValue(0);
  db.watchSession.create.mockResolvedValue({});
  getPlaybackUrl.mockResolvedValue({ url: "https://stream.mux/x.m3u8", expiresAt: new Date() });
});

describe("GET playback", () => {
  it("404 for an unknown / unpublished video", async () => {
    db.video.findUnique.mockResolvedValue(null);
    expect((await GET(new Request("http://x"), params("v0"))).status).toBe(404);
  });

  it("free YouTube video returns the embed id without auth", async () => {
    db.video.findUnique.mockResolvedValue(freeYt);
    const res = await GET(new Request("http://x"), params("v1"));
    expect(res.status).toBe(200);
    await expect(res.json()).resolves.toEqual({ source: "youtube", youtubeId: "yt" });
  });

  it("401 for a paid video when not signed in", async () => {
    db.video.findUnique.mockResolvedValue(paidMux);
    getCurrentUser.mockResolvedValue(null);
    expect((await GET(new Request("http://x"), params("v2"))).status).toBe(401);
  });

  it("403 for a paid video the user doesn't own", async () => {
    db.video.findUnique.mockResolvedValue(paidMux);
    getCurrentUser.mockResolvedValue({ id: "u1" });
    db.purchase.findMany.mockResolvedValue([]);
    expect((await GET(new Request("http://x"), params("v2"))).status).toBe(403);
  });

  it("429 when the concurrent-device limit is reached", async () => {
    db.video.findUnique.mockResolvedValue(paidMux);
    getCurrentUser.mockResolvedValue({ id: "u1" });
    db.purchase.findMany.mockResolvedValue([
      { videoId: "v2", type: "STREAM", expiresAt: null, revokedAt: null },
    ]);
    db.watchSession.count.mockResolvedValue(99);
    expect((await GET(new Request("http://x"), params("v2"))).status).toBe(429);
  });

  it("returns a signed Mux URL for an owned paid video", async () => {
    db.video.findUnique.mockResolvedValue(paidMux);
    getCurrentUser.mockResolvedValue({ id: "u1" });
    db.purchase.findMany.mockResolvedValue([
      { videoId: "v2", type: "STREAM", expiresAt: null, revokedAt: null },
    ]);
    const res = await GET(new Request("http://x"), params("v2"));
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.source).toBe("mux");
    expect(db.watchSession.create).toHaveBeenCalled();
  });

  it("409 when the Mux asset isn't ready", async () => {
    db.video.findUnique.mockResolvedValue({ ...paidMux, fullAssetId: null });
    getCurrentUser.mockResolvedValue({ id: "u1" });
    db.purchase.findMany.mockResolvedValue([
      { videoId: "v2", type: "STREAM", expiresAt: null, revokedAt: null },
    ]);
    expect((await GET(new Request("http://x"), params("v2"))).status).toBe(409);
  });
});
