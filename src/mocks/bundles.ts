import type { Bundle } from "@/types";

const thumb = (seed: string) => `https://picsum.photos/seed/${seed}/640/360`;

export const mockBundles: Bundle[] = [
  {
    id: "bnd_nuke_pro",
    title: "Nuke Compositing Pro Pack",
    slug: "nuke-compositing-pro-pack",
    description: "Five in-depth Nuke courses covering keying, tracking, CG integration and more.",
    thumbnailUrl: thumb("nuke-pro-pack"),
    videoIds: ["vid_001", "vid_002", "vid_003", "vid_004", "vid_005"],
    videoCount: 5,
    price: 14900,
    salePrice: 11900,
    valuePrice: 16500,
  },
  {
    id: "bnd_houdini",
    title: "Houdini FX Complete",
    slug: "houdini-fx-complete",
    description: "Master simulations with pyro, destruction and procedural workflows.",
    thumbnailUrl: thumb("houdini-complete"),
    videoIds: ["vid_008", "vid_009"],
    videoCount: 2,
    price: 11900,
    valuePrice: 13300,
  },
  {
    id: "bnd_color",
    title: "Color & Finishing Bundle",
    slug: "color-and-finishing-bundle",
    description: "Everything you need for cinematic grades and creative looks in Resolve.",
    thumbnailUrl: thumb("color-finishing"),
    videoIds: ["vid_006", "vid_007"],
    videoCount: 2,
    price: 7900,
    salePrice: 6400,
    valuePrice: 9100,
  },
];

export function getBundleBySlug(slug: string): Bundle | undefined {
  return mockBundles.find((b) => b.slug === slug);
}
