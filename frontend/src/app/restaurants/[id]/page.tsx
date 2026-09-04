import { Container } from "@/components/Container";

export default async function RestaurantDetailsPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  
  return (
    <Container className="py-20 flex-1">
      <h1 className="text-4xl font-serif text-brand-fg mb-4">Restaurant: {id}</h1>
      <p className="text-brand-muted">Menu and details coming soon.</p>
    </Container>
  );
}
