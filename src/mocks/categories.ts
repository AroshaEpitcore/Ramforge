import type { Category } from "@/types";

/**
 * Mock category tree (with sub-categories). UI/showcase only.
 */
export const mockCategories: Category[] = [
  {
    id: "cat_compositing",
    name: "Compositing",
    slug: "compositing",
    icon: "Layers",
    description: "Nuke, After Effects and node-based compositing.",
    videoCount: 48,
    children: [
      { id: "cat_comp_beginner", name: "Beginner", slug: "compositing-beginner", parentId: "cat_compositing", videoCount: 14 },
      { id: "cat_comp_intermediate", name: "Intermediate", slug: "compositing-intermediate", parentId: "cat_compositing", videoCount: 20 },
      { id: "cat_comp_advanced", name: "Advanced", slug: "compositing-advanced", parentId: "cat_compositing", videoCount: 9 },
      { id: "cat_comp_projects", name: "Project Based", slug: "compositing-projects", parentId: "cat_compositing", videoCount: 5 },
    ],
  },
  {
    id: "cat_color",
    name: "Color Grading",
    slug: "color-grading",
    icon: "Palette",
    description: "DaVinci Resolve and cinematic color.",
    videoCount: 32,
    children: [
      { id: "cat_color_resolve", name: "DaVinci Resolve", slug: "davinci-resolve", parentId: "cat_color", videoCount: 18 },
      { id: "cat_color_looks", name: "Creative Looks", slug: "creative-looks", parentId: "cat_color", videoCount: 14 },
    ],
  },
  {
    id: "cat_3d",
    name: "3D & CGI",
    slug: "3d-cgi",
    icon: "Boxes",
    description: "Houdini, Blender and Cinema 4D.",
    videoCount: 56,
    children: [
      { id: "cat_3d_houdini", name: "Houdini FX", slug: "houdini-fx", parentId: "cat_3d", videoCount: 22 },
      { id: "cat_3d_blender", name: "Blender", slug: "blender", parentId: "cat_3d", videoCount: 20 },
      { id: "cat_3d_lighting", name: "Lighting & Render", slug: "lighting-render", parentId: "cat_3d", videoCount: 14 },
    ],
  },
  {
    id: "cat_motion",
    name: "Motion Graphics",
    slug: "motion-graphics",
    icon: "Shapes",
    description: "Animation, titles and design in motion.",
    videoCount: 27,
  },
  {
    id: "cat_editing",
    name: "Editing",
    slug: "editing",
    icon: "Scissors",
    description: "Premiere, Resolve and the craft of the cut.",
    videoCount: 19,
  },
  {
    id: "cat_cinematography",
    name: "Cinematography",
    slug: "cinematography",
    icon: "Camera",
    description: "Lighting, lenses and camera technique.",
    videoCount: 23,
  },
  {
    id: "cat_sound",
    name: "Sound Design",
    slug: "sound-design",
    icon: "AudioWaveform",
    description: "Mixing, foley and sound for picture.",
    videoCount: 11,
  },
];

/** Flat list including sub-categories (handy for selects). */
export const flatCategories: Category[] = mockCategories.flatMap((c) => [c, ...(c.children ?? [])]);

export function getCategoryBySlug(slug: string): Category | undefined {
  return flatCategories.find((c) => c.slug === slug);
}
