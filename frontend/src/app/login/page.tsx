import { Container } from "@/components/Container";

export default function LoginPage() {
  return (
    <Container className="py-20 flex-1 max-w-md mx-auto">
      <h1 className="text-4xl font-serif text-brand-fg mb-4">Log in</h1>
      <p className="text-brand-muted">Welcome back to QuickBite.</p>
    </Container>
  );
}
