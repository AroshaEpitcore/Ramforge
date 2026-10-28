import "server-only";

import { db } from "@/server/db";

// --- Dashboard / reports ---------------------------------------------------

export interface DashboardStats {
  revenue: number;
  paidOrders: number;
  customers: number;
  publishedVideos: number;
  courses: number;
  pendingReviews: number;
  refundedOrders: number;
  newsletterSubscribers: number;
}

export async function getDashboardStats(): Promise<DashboardStats> {
  const [
    revenue,
    paidOrders,
    refundedOrders,
    customers,
    publishedVideos,
    courses,
    pendingReviews,
    subs,
  ] = await Promise.all([
    db.order.aggregate({ where: { status: "PAID" }, _sum: { total: true } }),
    db.order.count({ where: { status: "PAID" } }),
    db.order.count({ where: { status: "REFUNDED" } }),
    db.user.count({ where: { role: "CUSTOMER" } }),
    db.video.count({ where: { status: "PUBLISHED" } }),
    db.course.count(),
    db.review.count({ where: { approved: false } }),
    db.newsletterSubscriber.count({ where: { unsubscribedAt: null } }),
  ]);
  return {
    revenue: revenue._sum.total ?? 0,
    paidOrders,
    refundedOrders,
    customers,
    publishedVideos,
    courses,
    pendingReviews,
    newsletterSubscribers: subs,
  };
}

// --- Orders ----------------------------------------------------------------

export interface AdminOrderRow {
  id: string;
  customer: string;
  email: string;
  itemCount: number;
  total: number;
  status: "PENDING" | "PAID" | "FAILED" | "REFUNDED" | "PARTIALLY_REFUNDED";
  date: string;
}

export async function listAllOrders(): Promise<AdminOrderRow[]> {
  const rows = await db.order.findMany({
    orderBy: { createdAt: "desc" },
    select: {
      id: true,
      total: true,
      status: true,
      createdAt: true,
      user: { select: { name: true, email: true } },
      _count: { select: { items: true } },
    },
  });
  return rows.map((o) => ({
    id: o.id,
    customer: o.user.name ?? "—",
    email: o.user.email,
    itemCount: o._count.items,
    total: o.total,
    status: o.status,
    date: o.createdAt.toISOString(),
  }));
}

// --- Customers -------------------------------------------------------------

export interface AdminCustomerRow {
  id: string;
  name: string;
  email: string;
  role: string;
  orderCount: number;
  purchaseCount: number;
  createdAt: string;
}

export async function listCustomers(): Promise<AdminCustomerRow[]> {
  const rows = await db.user.findMany({
    orderBy: { createdAt: "desc" },
    select: {
      id: true,
      name: true,
      email: true,
      role: true,
      createdAt: true,
      _count: { select: { orders: true, purchases: true } },
    },
  });
  return rows.map((u) => ({
    id: u.id,
    name: u.name ?? "—",
    email: u.email,
    role: u.role,
    orderCount: u._count.orders,
    purchaseCount: u._count.purchases,
    createdAt: u.createdAt.toISOString(),
  }));
}

// --- Access grants ---------------------------------------------------------

export interface AccessGrantRow {
  id: string;
  userEmail: string;
  item: string;
  kind: "course" | "video";
  type: string;
  manual: boolean;
  revoked: boolean;
  createdAt: string;
}

export async function listAccessGrants(): Promise<AccessGrantRow[]> {
  const rows = await db.purchase.findMany({
    orderBy: { createdAt: "desc" },
    take: 200,
    select: {
      id: true,
      type: true,
      revokedAt: true,
      createdAt: true,
      grantedById: true,
      user: { select: { email: true } },
      course: { select: { title: true } },
      video: { select: { title: true } },
    },
  });
  return rows.map((p) => ({
    id: p.id,
    userEmail: p.user.email,
    item: p.course?.title ?? p.video?.title ?? "—",
    kind: p.course ? "course" : "video",
    type: p.type,
    manual: Boolean(p.grantedById),
    revoked: Boolean(p.revokedAt),
    createdAt: p.createdAt.toISOString(),
  }));
}

// --- Activity log ----------------------------------------------------------

export interface ActivityRow {
  id: string;
  action: string;
  entity: string | null;
  entityId: string | null;
  actor: string | null;
  createdAt: string;
}

export async function listActivity(limit = 100): Promise<ActivityRow[]> {
  const rows = await db.activityLog.findMany({
    orderBy: { createdAt: "desc" },
    take: limit,
    select: {
      id: true,
      action: true,
      entity: true,
      entityId: true,
      createdAt: true,
      user: { select: { email: true } },
    },
  });
  return rows.map((a) => ({
    id: a.id,
    action: a.action,
    entity: a.entity,
    entityId: a.entityId,
    actor: a.user?.email ?? null,
    createdAt: a.createdAt.toISOString(),
  }));
}
