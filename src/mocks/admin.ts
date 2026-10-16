import type { OrderStatus } from "@/types";

export interface AdminOrderRow {
  id: string;
  customer: string;
  email: string;
  items: number;
  total: number;
  status: OrderStatus;
  date: string;
}

export const mockOrders: AdminOrderRow[] = [
  { id: "10482", customer: "Mara Jensen", email: "mara@acme.co", items: 5, total: 11900, status: "PAID", date: "2026-10-15" },
  { id: "10481", customer: "Dev Patel", email: "dev@studio.io", items: 1, total: 3900, status: "PAID", date: "2026-10-15" },
  { id: "10480", customer: "Sofia Romano", email: "sofia@vfx.com", items: 2, total: 6400, status: "REFUNDED", date: "2026-10-14" },
  { id: "10479", customer: "Liam Walsh", email: "liam@post.tv", items: 1, total: 2900, status: "PENDING", date: "2026-10-14" },
  { id: "10478", customer: "Aiko Tanaka", email: "aiko@frame.jp", items: 3, total: 9900, status: "PAID", date: "2026-10-13" },
  { id: "10477", customer: "Noah Smith", email: "noah@edit.co", items: 1, total: 6900, status: "PARTIALLY_REFUNDED", date: "2026-10-13" },
  { id: "10476", customer: "Elena Garcia", email: "elena@grade.es", items: 4, total: 14900, status: "PAID", date: "2026-10-12" },
  { id: "10475", customer: "Tom Becker", email: "tom@render.de", items: 1, total: 4900, status: "FAILED", date: "2026-10-12" },
  { id: "10474", customer: "Priya Nair", email: "priya@comp.in", items: 2, total: 5400, status: "PAID", date: "2026-10-11" },
  { id: "10473", customer: "Marco Rossi", email: "marco@cine.it", items: 1, total: 3200, status: "PAID", date: "2026-10-11" },
  { id: "10472", customer: "Hana Kim", email: "hana@motion.kr", items: 6, total: 18900, status: "PAID", date: "2026-10-10" },
  { id: "10471", customer: "Owen Clarke", email: "owen@fx.uk", items: 1, total: 2400, status: "PENDING", date: "2026-10-10" },
];

export const dashboardStats = {
  revenue: 4820000,
  revenueDelta: 12.4,
  orders: 342,
  ordersDelta: 8.1,
  customers: 1284,
  customersDelta: 3.2,
  refundRate: 2.1,
  refundRateDelta: -0.4,
};
