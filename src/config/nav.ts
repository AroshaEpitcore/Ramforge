import type { Permission } from "@/lib/rbac";
import type { SessionUser } from "@/types";
import { can } from "@/lib/rbac";
import {
  Activity,
  BarChart3,
  Boxes,
  Clapperboard,
  FolderTree,
  GraduationCap,
  Image,
  KeyRound,
  LayoutDashboard,
  Library,
  Mail,
  MessageSquare,
  Receipt,
  RotateCcw,
  Settings,
  ShieldCheck,
  ShoppingBag,
  Ticket,
  UploadCloud,
  UserCog,
  Users,
  type LucideIcon,
} from "lucide-react";

export interface NavItem {
  title: string;
  href: string;
  description?: string;
  icon?: LucideIcon;
  /** When set, the item is only shown to users with this permission. */
  permission?: Permission;
  external?: boolean;
}

export interface NavGroup {
  label: string;
  items: NavItem[];
}

/** Storefront top navigation. */
export const mainNav: NavItem[] = [
  { title: "Shop", href: "/shop", description: "Browse the full catalogue" },
  { title: "Courses", href: "/courses", description: "Structured, lesson-by-lesson" },
  { title: "Bundles", href: "/bundles", description: "Save with video packs" },
  { title: "Blog", href: "/blog", description: "News and tutorials" },
  { title: "About", href: "/about" },
  { title: "Contact", href: "/contact" },
];

/** Footer link groups. */
export const footerNav: NavGroup[] = [
  {
    label: "Explore",
    items: [
      { title: "Shop", href: "/shop" },
      { title: "Courses", href: "/courses" },
      { title: "Bundles", href: "/bundles" },
      { title: "Categories", href: "/categories" },
    ],
  },
  {
    label: "Company",
    items: [
      { title: "About", href: "/about" },
      { title: "Contact", href: "/contact" },
      { title: "Blog", href: "/blog" },
      { title: "FAQ", href: "/faq" },
    ],
  },
  {
    label: "Legal",
    items: [
      { title: "Privacy", href: "/legal/privacy" },
      { title: "Cookies", href: "/legal/cookies" },
      { title: "Terms", href: "/legal/terms" },
      { title: "Refund policy", href: "/legal/refund-policy" },
    ],
  },
];

/** Customer account area sidebar. */
export const accountNav: NavItem[] = [
  { title: "My Library", href: "/account/library", icon: Library },
  { title: "Orders", href: "/account/orders", icon: Receipt },
  { title: "Favourites", href: "/account/favourites", icon: ShoppingBag },
  { title: "Profile", href: "/account/profile", icon: UserCog },
  { title: "Security", href: "/account/security", icon: ShieldCheck },
];

/** Admin sidebar, grouped. Items are filtered by permission at render time. */
export const adminNav: NavGroup[] = [
  {
    label: "Overview",
    items: [{ title: "Dashboard", href: "/admin", icon: LayoutDashboard }],
  },
  {
    label: "Catalog",
    items: [
      { title: "Videos", href: "/admin/videos", icon: Clapperboard, permission: "videos:read" },
      { title: "Courses", href: "/admin/courses", icon: GraduationCap, permission: "videos:read" },
      {
        title: "Categories",
        href: "/admin/categories",
        icon: FolderTree,
        permission: "categories:manage",
      },
      { title: "Bundles", href: "/admin/bundles", icon: Boxes, permission: "bundles:manage" },
    ],
  },
  {
    label: "Media",
    items: [
      { title: "Uploads", href: "/admin/uploads", icon: UploadCloud, permission: "videos:upload" },
    ],
  },
  {
    label: "Orders",
    items: [
      { title: "Orders", href: "/admin/orders", icon: Receipt, permission: "orders:read" },
      { title: "Refunds", href: "/admin/refunds", icon: RotateCcw, permission: "orders:refund" },
    ],
  },
  {
    label: "Customers",
    items: [
      { title: "Customers", href: "/admin/customers", icon: Users, permission: "customers:read" },
      { title: "Access grants", href: "/admin/access", icon: KeyRound, permission: "access:read" },
    ],
  },
  {
    label: "Marketing",
    items: [
      { title: "Coupons", href: "/admin/coupons", icon: Ticket, permission: "coupons:manage" },
      { title: "Banners", href: "/admin/banners", icon: Image, permission: "banners:manage" },
      {
        title: "Email templates",
        href: "/admin/emails",
        icon: Mail,
        permission: "emailTemplates:manage",
      },
    ],
  },
  {
    label: "Content",
    items: [
      {
        title: "Reviews",
        href: "/admin/reviews",
        icon: MessageSquare,
        permission: "reviews:moderate",
      },
    ],
  },
  {
    label: "Insights",
    items: [
      { title: "Reports", href: "/admin/reports", icon: BarChart3, permission: "reports:read" },
      {
        title: "Activity log",
        href: "/admin/activity",
        icon: Activity,
        permission: "activity:read",
      },
    ],
  },
  {
    label: "Administration",
    items: [
      {
        title: "Users & roles",
        href: "/admin/users",
        icon: ShieldCheck,
        permission: "users:manage",
      },
      { title: "Settings", href: "/admin/settings", icon: Settings, permission: "settings:manage" },
    ],
  },
];

/** Filter admin nav groups by the user's permissions, dropping empty groups. */
export function filterAdminNav(user: Pick<SessionUser, "role"> | null | undefined): NavGroup[] {
  return adminNav
    .map((group) => ({
      ...group,
      items: group.items.filter((item) => !item.permission || can(user, item.permission)),
    }))
    .filter((group) => group.items.length > 0);
}
