import { Container } from "@/components/layout/container";
import { CartView } from "@/features/cart/components/cart-view";
import { buildMetadata } from "@/lib/seo";
import type { Metadata } from "next";

export const metadata: Metadata = buildMetadata({ title: "Cart" });

export default function CartPage() {
  return (
    <Container className="py-8">
      <h1 className="mb-6 text-2xl font-semibold tracking-tight">Your cart</h1>
      <CartView />
    </Container>
  );
}
