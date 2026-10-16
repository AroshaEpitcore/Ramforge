import {
  AudioWaveform,
  Boxes,
  Camera,
  Clapperboard,
  Layers,
  Palette,
  Scissors,
  Shapes,
  type LucideIcon,
} from "lucide-react";

/** Map a Category.icon string to a lucide component (with a sensible default). */
const ICONS: Record<string, LucideIcon> = {
  Layers,
  Palette,
  Boxes,
  Shapes,
  Scissors,
  Camera,
  AudioWaveform,
};

export function getCategoryIcon(icon?: string): LucideIcon {
  return (icon && ICONS[icon]) || Clapperboard;
}
