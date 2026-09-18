import { Container } from "@/components/Container";
import { Button } from "@/components/Button";

export default function NotFound() {
  return (
    <div className="flex flex-col min-h-screen bg-brand-bg items-center justify-center">
      <Container className="text-center max-w-2xl py-20">
        <h1 className="text-8xl font-serif text-brand-primary mb-6">404</h1>
        <h2 className="text-3xl font-serif text-brand-fg mb-4">Page not found</h2>
        <p className="text-brand-muted mb-8 max-w-md mx-auto">
          We couldn&apos;t find the page you&apos;re looking for. It might have been moved or the link might be broken.
        </p>
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Button href="/" size="lg" variant="primary">
            Return to Homepage
          </Button>
          <Button href="/restaurants" size="lg" variant="outline" className="bg-white">
            Browse Restaurants
          </Button>
        </div>
      </Container>
    </div>
  );
}
