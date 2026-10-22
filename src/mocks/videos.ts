import { DEFAULT_DOWNLOAD_LIMIT, DEFAULT_RENTAL_DAYS } from "@/config/constants";
import type { PurchaseOption, Video, VideoQuality } from "@/types";
import { mockCategories } from "./categories";

const thumb = (seed: string) => `https://picsum.photos/seed/${seed}/640/360`;

function options(price: number, salePrice?: number, rentable = true): PurchaseOption[] {
  const opts: PurchaseOption[] = [{ type: "STREAM", price, salePrice }];
  opts.push({
    type: "DOWNLOAD",
    price: price + 500,
    salePrice: salePrice ? salePrice + 500 : null,
  });
  if (rentable) {
    opts.push({ type: "RENTAL", price: Math.round(price * 0.4), rentalDays: DEFAULT_RENTAL_DAYS });
  }
  return opts;
}

interface Seed {
  title: string;
  slug: string;
  cat: number;
  tags: string[];
  durationSec: number;
  quality: VideoQuality;
  price: number;
  salePrice?: number;
  rating: number;
  reviewCount: number;
  viewCount: number;
  accessMode?: Video["accessMode"];
  isNew?: boolean;
  fileSizeBytes?: number;
}

const seeds: Seed[] = [
  {
    title: "Complete Car Compositing in Nuke",
    slug: "complete-car-compositing-in-nuke",
    cat: 0,
    tags: ["nuke", "compositing", "roto", "cg integration"],
    durationSec: 1695,
    quality: "UHD_4K",
    price: 4900,
    salePrice: 3900,
    rating: 4.8,
    reviewCount: 342,
    viewCount: 12400,
    fileSizeBytes: 3_900_000_000,
  },
  {
    title: "Keying & Spill Suppression in Nuke",
    slug: "keying-and-spill-suppression-in-nuke",
    cat: 0,
    tags: ["nuke", "keying", "green screen"],
    durationSec: 1102,
    quality: "HD",
    price: 2900,
    rating: 4.6,
    reviewCount: 120,
    viewCount: 8600,
    isNew: true,
  },
  {
    title: "3D Camera Tracking Masterclass",
    slug: "3d-camera-tracking-masterclass",
    cat: 0,
    tags: ["tracking", "matchmove", "nuke"],
    durationSec: 1330,
    quality: "UHD_4K",
    price: 3900,
    rating: 4.7,
    reviewCount: 218,
    viewCount: 11200,
  },
  {
    title: "Compositing Volumetric FX",
    slug: "compositing-volumetric-fx",
    cat: 0,
    tags: ["volumetrics", "smoke", "deep"],
    durationSec: 1005,
    quality: "HD",
    price: 3400,
    salePrice: 2400,
    rating: 4.5,
    reviewCount: 154,
    viewCount: 9100,
  },
  {
    title: "Cryptomatte Workflow Deep Dive",
    slug: "cryptomatte-workflow-deep-dive",
    cat: 0,
    tags: ["cryptomatte", "aov", "mattes"],
    durationSec: 1148,
    quality: "HD",
    price: 2400,
    rating: 4.9,
    reviewCount: 301,
    viewCount: 14600,
    isNew: true,
  },
  {
    title: "Cinematic Color Grading in Resolve",
    slug: "cinematic-color-grading-in-resolve",
    cat: 1,
    tags: ["resolve", "color", "grade"],
    durationSec: 2210,
    quality: "UHD_4K",
    price: 5900,
    salePrice: 4400,
    rating: 4.9,
    reviewCount: 410,
    viewCount: 20100,
  },
  {
    title: "Building Looks with Color Warper",
    slug: "building-looks-with-color-warper",
    cat: 1,
    tags: ["resolve", "looks", "warper"],
    durationSec: 1440,
    quality: "HD",
    price: 3200,
    rating: 4.4,
    reviewCount: 88,
    viewCount: 5400,
  },
  {
    title: "Houdini Pyro FX from Scratch",
    slug: "houdini-pyro-fx-from-scratch",
    cat: 2,
    tags: ["houdini", "pyro", "simulation"],
    durationSec: 3025,
    quality: "UHD_4K",
    price: 6900,
    rating: 4.8,
    reviewCount: 265,
    viewCount: 16800,
    fileSizeBytes: 7_200_000_000,
  },
  {
    title: "Procedural Destruction in Houdini",
    slug: "procedural-destruction-in-houdini",
    cat: 2,
    tags: ["houdini", "rbd", "destruction"],
    durationSec: 2680,
    quality: "UHD_4K",
    price: 6400,
    salePrice: 4900,
    rating: 4.7,
    reviewCount: 193,
    viewCount: 13200,
    isNew: true,
  },
  {
    title: "Stylised Rendering in Blender",
    slug: "stylised-rendering-in-blender",
    cat: 2,
    tags: ["blender", "npr", "eevee"],
    durationSec: 1760,
    quality: "HD",
    price: 2900,
    rating: 4.3,
    reviewCount: 76,
    viewCount: 6900,
  },
  {
    title: "Kinetic Typography Essentials",
    slug: "kinetic-typography-essentials",
    cat: 3,
    tags: ["after effects", "typography", "motion"],
    durationSec: 980,
    quality: "HD",
    price: 0,
    rating: 4.6,
    reviewCount: 142,
    viewCount: 22300,
    accessMode: "FREE",
  },
  {
    title: "Lighting for Mood & Atmosphere",
    slug: "lighting-for-mood-and-atmosphere",
    cat: 2,
    tags: ["lighting", "cinematography", "set"],
    durationSec: 1512,
    quality: "UHD_4K",
    price: 4200,
    rating: 4.8,
    reviewCount: 177,
    viewCount: 10400,
  },
];

export const mockVideos: Video[] = seeds.map((s, i) => {
  const category = mockCategories[s.cat];
  const accessMode = s.accessMode ?? "PAID";
  return {
    id: `vid_${String(i + 1).padStart(3, "0")}`,
    title: s.title,
    slug: s.slug,
    description:
      "A step-by-step, production-grade walkthrough with project files included. Follow along with real shots and learn the techniques used on professional VFX and film work.",
    tags: s.tags,
    category: { id: category.id, name: category.name, slug: category.slug },
    thumbnailUrl: thumb(s.slug),
    previewAssetId: `preview_${i + 1}`,
    fullAssetId: `full_${i + 1}`,
    durationSec: s.durationSec,
    quality: s.quality,
    fileSizeBytes: s.fileSizeBytes ?? 1_200_000_000,
    price: s.price,
    salePrice: s.salePrice ?? null,
    accessMode,
    allowDownload: accessMode !== "FREE",
    rentalDays: accessMode === "PAID" ? DEFAULT_RENTAL_DAYS : null,
    status: "PUBLISHED",
    purchaseOptions:
      accessMode === "FREE" ? [{ type: "STREAM", price: 0 }] : options(s.price, s.salePrice),
    rating: s.rating,
    reviewCount: s.reviewCount,
    viewCount: s.viewCount,
    publishedAt: new Date(2026, 8, 28 - i).toISOString(),
    isNew: s.isNew,
  } satisfies Video;
});

export const DEFAULT_DOWNLOAD_LIMIT_PER_PURCHASE = DEFAULT_DOWNLOAD_LIMIT;

export function getVideoBySlug(slug: string): Video | undefined {
  return mockVideos.find((v) => v.slug === slug);
}

export function getFeaturedVideo(): Video {
  return mockVideos[0];
}

export function getRelatedVideos(video: Video, limit = 4): Video[] {
  return mockVideos
    .filter((v) => v.id !== video.id && v.category.id === video.category.id)
    .slice(0, limit);
}
