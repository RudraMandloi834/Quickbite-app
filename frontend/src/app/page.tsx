import Link from "next/link";
import { Container } from "@/components/Container";
import { Button } from "@/components/Button";
import { Card, CardContent } from "@/components/Card";
import { Badge } from "@/components/Badge";

export default function Home() {
  return (
    <div className="flex flex-col min-h-screen">
      {/* Hero Section */}
      <section className="relative py-24 sm:py-32 overflow-hidden">
        <Container className="relative z-10 text-center max-w-4xl mx-auto">
          <Badge variant="default" className="mb-6">Now delivering in Metro areas</Badge>
          <h1 className="text-5xl md:text-7xl font-serif text-brand-fg mb-6 leading-tight">
            Good food, <br className="hidden sm:block" />
            <span className="text-brand-muted">without the noise.</span>
          </h1>
          <p className="text-xl text-brand-muted mb-10 max-w-2xl mx-auto font-light">
            Curated restaurants. Honest reviews. Reliable delivery. 
            Experience a premium dining experience delivered right to your door.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
            <Button href="/restaurants" size="lg" className="w-full sm:w-auto">
              Find restaurants
            </Button>
            <Button href="/offers" size="lg" variant="outline" className="w-full sm:w-auto bg-brand-bg">
              View offers
            </Button>
          </div>
        </Container>
        
        {/* Subtle background element */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-brand-primary/5 rounded-full blur-3xl -z-10"></div>
      </section>

      {/* Featured Section */}
      <section className="py-20 bg-white border-t border-brand-border">
        <Container>
          <div className="flex items-end justify-between mb-12">
            <div>
              <h2 className="text-3xl font-serif text-brand-fg mb-3">Curated selections</h2>
              <p className="text-brand-muted">The best culinary experiences in your area.</p>
            </div>
            <Button href="/restaurants" variant="ghost" className="hidden sm:flex">See all</Button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {/* Mock Restaurant Cards */}
            {[1, 2, 3].map((i) => (
              <Link href={`/restaurants/${i}`} key={i} className="block">
                <Card noPadding className="group h-full cursor-pointer hover:border-brand-primary/30 transition-colors">
                  <div className="h-48 bg-brand-border/50 relative">
                    <div className="absolute top-4 left-4">
                      {i === 1 && <Badge variant="success">New</Badge>}
                    </div>
                  </div>
                  <CardContent className="p-6">
                    <div className="flex justify-between items-start mb-2">
                      <h3 className="font-serif text-xl font-medium text-brand-fg group-hover:text-brand-primary transition-colors">
                        {i === 1 ? "Bistro Nouveau" : i === 2 ? "The Spice Room" : "Ocean Catch"}
                      </h3>
                      <span className="flex items-center text-sm font-medium bg-brand-bg px-2 py-1 rounded-md border border-brand-border">
                        <svg className="w-3 h-3 text-amber-500 mr-1" fill="currentColor" viewBox="0 0 20 20">
                          <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z"></path>
                        </svg>
                        {4.5 + (i * 0.2)}
                      </span>
                    </div>
                    <p className="text-brand-muted text-sm mb-4">
                      {i === 1 ? "French • European • Fine Dining" : i === 2 ? "Indian • Curry • Spices" : "Seafood • Fresh • Local"}
                    </p>
                    <div className="flex text-sm text-brand-muted gap-4">
                      <span className="flex items-center">
                        <svg className="w-4 h-4 mr-1.5 opacity-70" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                        25-35 min
                      </span>
                      <span className="flex items-center">
                        <svg className="w-4 h-4 mr-1.5 opacity-70" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 8h14M5 8a2 2 0 110-4h14a2 2 0 110 4M5 8v10a2 2 0 002 2h10a2 2 0 002-2V8m-9 4h4" /></svg>
                        Free delivery
                      </span>
                    </div>
                  </CardContent>
                </Card>
              </Link>
            ))}
          </div>
          
          <div className="mt-8 text-center sm:hidden">
            <Button href="/restaurants" variant="outline" className="w-full">See all restaurants</Button>
          </div>
        </Container>
      </section>

      {/* Footer minimal */}
      <footer className="bg-brand-fg text-brand-bg py-12 mt-auto">
        <Container>
          <div className="flex flex-col md:flex-row justify-between items-center gap-6">
            <div className="font-serif text-2xl font-semibold">
              QuickBite<span className="text-brand-primary">.</span>
            </div>
            <div className="text-brand-muted text-sm">
              © {new Date().getFullYear()} QuickBite. All rights reserved.
            </div>
          </div>
        </Container>
      </footer>
    </div>
  );
}
