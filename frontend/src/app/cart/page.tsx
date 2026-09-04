import { Container } from "@/components/Container";

export default function CartPage() {
  return (
    <Container className="py-20 flex-1">
      <h1 className="text-4xl font-serif text-brand-fg mb-4">Your Cart</h1>
      <p className="text-brand-muted">Review your items before checkout.</p>
    </Container>
  );
}
