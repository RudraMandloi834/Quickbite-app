import { Container } from "@/components/Container";

export default function OrdersPage() {
  return (
    <Container className="py-20 flex-1">
      <h1 className="text-4xl font-serif text-brand-fg mb-4">Your Orders</h1>
      <p className="text-brand-muted">Track and review your past orders.</p>
    </Container>
  );
}
