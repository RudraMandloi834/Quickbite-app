import { Container } from "@/components/Container";

export default async function OrderDetailsPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  
  return (
    <Container className="py-20 flex-1">
      <h1 className="text-4xl font-serif text-brand-fg mb-4">Order: {id}</h1>
      <p className="text-brand-muted">Order details and tracking status.</p>
    </Container>
  );
}
