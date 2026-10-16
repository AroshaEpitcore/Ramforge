import type { CartLine, LibraryEntry, SessionUser } from "@/types";
import { DEFAULT_DOWNLOAD_LIMIT } from "@/config/constants";

const thumb = (seed: string) => `https://picsum.photos/seed/${seed}/640/360`;

export const mockCartLines: CartLine[] = [
  {
    id: "line_1",
    kind: "video",
    refId: "vid_003",
    title: "3D Camera Tracking Masterclass",
    thumbnailUrl: thumb("3d-camera-tracking-masterclass"),
    option: "STREAM",
    unitPrice: 3900,
    quantity: 1,
  },
  {
    id: "line_2",
    kind: "video",
    refId: "vid_005",
    title: "Cryptomatte Workflow Deep Dive",
    thumbnailUrl: thumb("cryptomatte-workflow-deep-dive"),
    option: "DOWNLOAD",
    unitPrice: 2900,
    quantity: 1,
  },
  {
    id: "line_3",
    kind: "bundle",
    refId: "bnd_color",
    title: "Color & Finishing Bundle",
    thumbnailUrl: thumb("color-finishing"),
    unitPrice: 6400,
    quantity: 1,
  },
];

export const mockLibrary: LibraryEntry[] = [
  {
    id: "lib_1",
    video: {
      id: "vid_006",
      title: "Cinematic Color Grading in Resolve",
      slug: "cinematic-color-grading-in-resolve",
      thumbnailUrl: thumb("cinematic-color-grading-in-resolve"),
      durationSec: 2210,
      quality: "UHD_4K",
    },
    accessType: "DOWNLOAD",
    grantedAt: "2026-10-01",
    downloadCount: 1,
    downloadLimit: DEFAULT_DOWNLOAD_LIMIT,
    watchedSec: 640,
  },
  {
    id: "lib_2",
    video: {
      id: "vid_002",
      title: "Keying & Spill Suppression in Nuke",
      slug: "keying-and-spill-suppression-in-nuke",
      thumbnailUrl: thumb("keying-and-spill-suppression-in-nuke"),
      durationSec: 1102,
      quality: "HD",
    },
    accessType: "STREAM",
    grantedAt: "2026-09-18",
    watchedSec: 1102,
  },
  {
    id: "lib_3",
    video: {
      id: "vid_008",
      title: "Houdini Pyro FX from Scratch",
      slug: "houdini-pyro-fx-from-scratch",
      thumbnailUrl: thumb("houdini-pyro-fx-from-scratch"),
      durationSec: 3025,
      quality: "UHD_4K",
    },
    accessType: "RENTAL",
    grantedAt: "2026-10-12",
    expiresAt: "2026-10-19",
    watchedSec: 420,
  },
];

export const mockUser: SessionUser = {
  id: "usr_demo",
  name: "Alex Rivera",
  email: "alex@ramforge.test",
  image: null,
  role: "CUSTOMER",
};

/** A staff user for previewing the admin area. */
export const mockAdminUser: SessionUser = {
  id: "usr_admin",
  name: "Jordan Blake",
  email: "jordan@ramforge.test",
  image: null,
  role: "SUPER_ADMIN",
};
