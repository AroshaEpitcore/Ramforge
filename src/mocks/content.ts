import type { Banner, BlogPost, Review } from "@/types";

const img = (seed: string, w = 1280, h = 720) => `https://picsum.photos/seed/${seed}/${w}/${h}`;

export const mockBanners: Banner[] = [
  {
    id: "ban_nuke",
    eyebrow: "Featured series",
    title: "Foundry Nuke",
    subtitle: "Step-by-step tutorials, real-world projects, tools and assets for VFX artists.",
    imageUrl: "https://images2.alphacoders.com/139/thumb-1920-1398993.jpg",
    ctaLabel: "Start learning",
    ctaHref: "/shop?category=compositing",
    active: true,
  },
  {
    id: "ban_houdini",
    eyebrow: "New this month",
    title: "Houdini FX Complete",
    subtitle: "From first principles to production-ready pyro and destruction.",
    imageUrl:
      "https://w0.peakpx.com/wallpaper/758/551/HD-wallpaper-warface-breakout-2020-warface-breakout-warface-2020-games-games-ps-games-xbox-one-games-ps4-games.jpg",
    ctaLabel: "Explore the bundle",
    ctaHref: "/bundles/houdini-fx-complete",
    active: true,
  },
  {
    id: "ban_color",
    eyebrow: "Staff pick",
    title: "Cinematic Color",
    subtitle: "Grade like the pros with our DaVinci Resolve collection.",
    imageUrl: "https://4kwallpapers.com/images/wallpapers/deathstroke-suicide-1920x1080-20151.jpg",
    ctaLabel: "Browse color grading",
    ctaHref: "/shop?category=color-grading",
    active: true,
  },
];

export const mockBlogPosts: BlogPost[] = [
  {
    id: "post_1",
    title: "What's New in Nuke 16?",
    excerpt: "New features, performance improvements and workflow upgrades.",
    slug: "whats-new-in-nuke-16",
    thumbnailUrl: img("blog-nuke16", 400, 300),
    publishedAt: "2026-10-10",
  },
  {
    id: "post_2",
    title: "10 Essential Nuke Nodes Every Artist Should Know",
    excerpt: "Build faster, cleaner scripts with these core nodes.",
    slug: "10-essential-nuke-nodes",
    thumbnailUrl: img("blog-nodes", 400, 300),
    publishedAt: "2026-10-05",
  },
  {
    id: "post_3",
    title: "Compositing Workflow Tips for Better Results",
    excerpt: "Small habits that make a big difference to your shots.",
    slug: "compositing-workflow-tips",
    thumbnailUrl: img("blog-workflow", 400, 300),
    publishedAt: "2026-09-28",
  },
  {
    id: "post_4",
    title: "Free EXR Practice Footage for Compositing",
    excerpt: "Download multi-pass EXR plates to practise with.",
    slug: "free-exr-practice-footage",
    thumbnailUrl: img("blog-exr", 400, 300),
    publishedAt: "2026-09-20",
  },
];

export const mockReviews: Review[] = [
  {
    id: "rev_1",
    videoId: "vid_001",
    author: { name: "Mara Jensen" },
    rating: 5,
    title: "Exactly what I needed",
    body: "The CG integration section alone was worth it. Clear, practical and production-focused.",
    createdAt: "2026-09-30",
    verifiedPurchase: true,
  },
  {
    id: "rev_2",
    videoId: "vid_001",
    author: { name: "Dev Patel" },
    rating: 4,
    title: "Great depth",
    body: "Loved the pace. Would have liked a little more on despill, but excellent overall.",
    createdAt: "2026-09-22",
    verifiedPurchase: true,
  },
  {
    id: "rev_3",
    videoId: "vid_001",
    author: { name: "Sofia Romano" },
    rating: 5,
    body: "Best compositing tutorial I've bought. The project files are a huge bonus.",
    createdAt: "2026-09-15",
    verifiedPurchase: true,
  },
];
