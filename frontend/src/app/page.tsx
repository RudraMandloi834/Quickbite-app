"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Container } from "@/components/Container";
import { Button } from "@/components/Button";
import { Card, CardContent } from "@/components/Card";
import { Badge } from "@/components/Badge";
import { Input } from "@/components/Input";
import { Skeleton } from "@/components/Skeleton";
import { getApiBaseUrl, getCities } from "@/lib/api";
import { Restaurant } from "@/types/restaurant";
import { ImageWithFallback } from "@/components/ImageWithFallback";
import { getStoredLocation, setStoredLocation, INDIAN_CITIES, DEFAULT_CITY } from "@/lib/location";

const CATEGORIES = [
  { name: "Burgers", icon: "🍔" },
  { name: "Pizza", icon: "🍕" },
  { name: "Biryani", icon: "🍚" },
  { name: "Chinese", icon: "🍜" },
  { name: "Sushi", icon: "🍣" },
  { name: "Desserts", icon: "🍰" },
  { name: "Healthy", icon: "🥗" },
  { name: "More", icon: "⋯" },
];

const FEATURES = [
  { title: "Wide Variety", desc: "1000+ restaurants", icon: "M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" },
  { title: "Fast Delivery", desc: "At your doorstep", icon: "M13 10V3L4 14h7v7l9-11h-7z" },
  { title: "Secure Payments", desc: "100% safe & secure", icon: "M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" },
  { title: "Real Reviews", desc: "From food lovers", icon: "M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" },
];

export default function Home() {
  const router = useRouter();
  const [selectedCity, setSelectedCity] = useState<string>(DEFAULT_CITY);
  const [cityOptions, setCityOptions] = useState<string[]>([...INDIAN_CITIES]);
  const [searchQuery, setSearchQuery] = useState("");
  const [topRestaurants, setTopRestaurants] = useState<Restaurant[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Initialize location from stored preference
  useEffect(() => {
    const loc = getStoredLocation();
    if (loc.city) {
      setSelectedCity(loc.city);
    }
    // Fetch live cities from backend, combine with Indian cities
    getCities()
      .then((cities) => {
        if (cities && cities.length > 0) {
          const unique = Array.from(new Set([...cities, ...INDIAN_CITIES])).filter(Boolean);
          setCityOptions(unique);
        }
      })
      .catch(() => {});
  }, []);

  const handleCityChange = (newCity: string) => {
    setSelectedCity(newCity);
    setStoredLocation(newCity);
  };

  const handleSearchSubmit = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const params = new URLSearchParams();
    if (selectedCity) params.set("city", selectedCity);
    if (searchQuery.trim()) params.set("search", searchQuery.trim());
    router.push(`/restaurants?${params.toString()}`);
  };

  useEffect(() => {
    const fetchTopRestaurants = async () => {
      try {
        setIsLoading(true);
        const cityParam = selectedCity ? `&city=${encodeURIComponent(selectedCity)}` : "";
        const res = await fetch(`${getApiBaseUrl()}/api/restaurants?page=0&size=4${cityParam}`);
        if (!res.ok) throw new Error("Failed to fetch restaurants");
        const data = await res.json();
        
        if (data && Array.isArray(data.content) && data.content.length > 0) {
          setTopRestaurants(data.content);
        } else if (Array.isArray(data) && data.length > 0) {
          setTopRestaurants(data.slice(0, 4));
        } else {
          // If no restaurants in chosen city, fetch general top-rated without city filter
          const fallbackRes = await fetch(`${getApiBaseUrl()}/api/restaurants?page=0&size=4`);
          if (fallbackRes.ok) {
            const fallbackData = await fallbackRes.json();
            setTopRestaurants(fallbackData.content || (Array.isArray(fallbackData) ? fallbackData.slice(0, 4) : []));
          } else {
            setTopRestaurants([]);
          }
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : "An error occurred");
      } finally {
        setIsLoading(false);
      }
    };

    fetchTopRestaurants();
  }, [selectedCity]);

  return (
    <div className="flex flex-col min-h-screen bg-brand-bg">
      {/* Hero Section */}
      <section className="relative bg-white pt-8 pb-16 lg:pt-16 lg:pb-24 overflow-hidden rounded-b-[3rem] shadow-soft">
        <Container>
          <div className="flex flex-col lg:flex-row items-center gap-12">
            <div className="flex-1 space-y-8 z-10">
              <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-brand-primary/10 text-brand-primary text-xs font-bold tracking-wide">
                <span>🇮🇳</span> Discover Authentic Indian Food Delivered Fast
              </div>
              <h1 className="text-4xl sm:text-5xl lg:text-7xl font-sans font-bold text-brand-fg leading-[1.1]">
                QuickBite <span className="text-brand-primary block mt-2">Brings People Together</span>
              </h1>
              <p className="text-base sm:text-lg text-brand-muted max-w-lg">
                Explore the best local restaurants across India and get delicious meals delivered to your doorstep.
              </p>
              
              {/* Search & Location Bar */}
              <form onSubmit={handleSearchSubmit} className="flex flex-col sm:flex-row gap-3 bg-white p-2.5 rounded-2xl shadow-card border border-brand-border/60 max-w-xl">
                <div className="flex-1 relative">
                  <span className="absolute left-4 top-1/2 -translate-y-1/2 text-brand-primary pointer-events-none">
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"></path><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"></path></svg>
                  </span>
                  <select 
                    value={selectedCity}
                    onChange={(e) => handleCityChange(e.target.value)}
                    className="w-full h-12 pl-12 pr-6 bg-transparent border-none outline-none text-brand-fg font-semibold text-sm appearance-none cursor-pointer focus:ring-0"
                    aria-label="Select Indian City"
                  >
                    {cityOptions.map((c) => (
                      <option key={c} value={c}>
                        {c}, India
                      </option>
                    ))}
                  </select>
                </div>
                <div className="hidden sm:block w-px bg-brand-border/60 my-2"></div>
                <div className="flex-[2] relative">
                  <span className="absolute left-4 top-1/2 -translate-y-1/2 text-brand-muted pointer-events-none">
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"></path></svg>
                  </span>
                  <Input 
                    type="text" 
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Search dishes, restaurants, cuisines..." 
                    className="w-full h-12 pl-12 pr-4 border-none shadow-none focus:ring-0 rounded-xl text-sm"
                  />
                </div>
                <Button type="submit" size="md" className="w-full sm:w-auto px-7 shrink-0 font-bold">
                  Search
                </Button>
              </form>
            </div>
            
            <div className="flex-1 relative flex justify-center lg:justify-end">
              <div className="relative w-72 h-72 lg:w-[500px] lg:h-[500px] rounded-full overflow-hidden border-8 border-white shadow-soft z-10">
                {/* Fallback Hero Image using external standard unsplash */}
                <ImageWithFallback src="https://images.unsplash.com/photo-1559561724-732dbca7be1e?auto=format&fit=crop&q=80&w=800" alt="Premium North Indian Thali" className="w-full h-full" priority />
              </div>
              
              {/* Decorative blob behind the image */}
              <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full h-full max-w-[600px] bg-brand-primary/10 rounded-full blur-3xl -z-0"></div>
              
              {/* Floating review badge */}
              <div className="absolute bottom-10 left-0 lg:-left-10 bg-white p-4 rounded-2xl shadow-hover flex items-center gap-4 z-20 animate-bounce" style={{ animationDuration: '3s' }}>
                <div className="w-12 h-12 bg-amber-100 rounded-full flex items-center justify-center text-amber-500">
                  <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 20 20"><path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z"></path></svg>
                </div>
                <div>
                  <p className="font-bold text-brand-fg">4.9/5</p>
                  <p className="text-xs text-brand-muted">Happy Customers</p>
                </div>
              </div>
            </div>
          </div>
        </Container>
      </section>

      {/* Categories Row */}
      <section className="py-12 bg-brand-bg relative z-10 -mt-6">
        <Container>
          <div className="flex gap-4 sm:gap-8 overflow-x-auto pb-4 scrollbar-hide px-2">
            {CATEGORIES.map((cat, i) => (
              <div key={i} className="flex flex-col items-center gap-3 min-w-[80px] cursor-pointer group">
                <div className="w-20 h-20 bg-white rounded-full shadow-card flex items-center justify-center text-4xl group-hover:shadow-soft group-hover:scale-105 transition-all group-hover:border-brand-primary group-hover:border-2">
                  {cat.icon}
                </div>
                <span className="text-sm font-semibold text-brand-fg group-hover:text-brand-primary">{cat.name}</span>
              </div>
            ))}
          </div>
        </Container>
      </section>

      {/* Promotional Banner */}
      <section className="py-8">
        <Container>
          <div className="bg-[#0B4F48] rounded-3xl overflow-hidden shadow-hover relative">
            <div className="px-8 py-12 lg:p-16 relative z-10 flex flex-col sm:flex-row items-center justify-between">
              <div className="text-white max-w-lg mb-8 sm:mb-0">
                <h2 className="text-4xl md:text-5xl font-bold mb-4">Flat 50% OFF</h2>
                <p className="text-xl text-teal-100 mb-6">On your first order with QuickBite.</p>
                <div className="inline-flex items-center gap-4 bg-teal-900/50 p-2 pr-6 rounded-full border border-teal-500/30">
                  <Badge variant="success" className="text-sm py-1.5 px-4 bg-white text-[#0B4F48] border-none shadow-sm">Code</Badge>
                  <span className="font-mono font-bold text-xl tracking-wider">QUICKBITE50</span>
                </div>
              </div>
              <div className="hidden md:block w-64 h-64 relative -mr-8">
                <ImageWithFallback src="https://images.unsplash.com/photo-1568901346375-23c9450c58cd?auto=format&fit=crop&q=80&w=600" alt="Burger Promo" className="w-full h-full rounded-full shadow-2xl border-4 border-teal-700" />
              </div>
            </div>
            
            {/* Background pattern */}
            <div className="absolute right-0 top-0 w-1/2 h-full bg-gradient-to-l from-brand-primary/40 to-transparent -z-0 skew-x-12 translate-x-16"></div>
          </div>
        </Container>
      </section>

      {/* Top Restaurants Section */}
      <section className="py-12">
        <Container>
          <div className="flex justify-between items-end mb-8 px-2">
            <div>
              <h2 className="text-3xl font-bold text-brand-fg mb-2">Top Restaurants Near You</h2>
              <p className="text-brand-muted">Discover the best culinary experiences.</p>
            </div>
            <Link href="/restaurants" className="hidden sm:flex items-center text-brand-primary font-semibold hover:underline">
              View All 
              <svg className="w-5 h-5 ml-1" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 8l4 4m0 0l-4 4m4-4H3"></path></svg>
            </Link>
          </div>

          {isLoading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6">
              {[1, 2, 3, 4].map(i => (
                <Card key={i} noPadding className="border-none shadow-card">
                  <Skeleton className="h-48 w-full rounded-none" />
                  <div className="p-5 space-y-4">
                    <Skeleton className="h-6 w-3/4" />
                    <Skeleton className="h-4 w-1/2" />
                    <Skeleton className="h-10 w-full rounded-full mt-4" />
                  </div>
                </Card>
              ))}
            </div>
          ) : error ? (
            <div className="bg-rose-50 text-rose-600 p-8 rounded-2xl text-center border border-rose-100">
              <p className="font-semibold text-lg mb-2">Error Loading Restaurants</p>
              <p>{error}</p>
              <Button onClick={() => window.location.reload()} variant="outline" className="mt-4 border-rose-200 text-rose-600 hover:bg-rose-100">Try Again</Button>
            </div>
          ) : topRestaurants.length === 0 ? (
            <div className="bg-brand-card p-12 rounded-2xl text-center shadow-card border border-brand-border/40">
              <p className="text-xl font-medium text-brand-fg">No restaurants found near you</p>
              <p className="text-brand-muted mt-2">Try searching a different location.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6">
              {topRestaurants.map((restaurant) => (
                <Link href={`/restaurants/${restaurant.id}`} key={restaurant.id} className="group block">
                  <Card noPadding className="h-full border-none shadow-card hover:shadow-hover transition-all bg-white relative top-0 group-hover:-top-2">
                    <div className="relative h-48 w-full overflow-hidden bg-brand-border/20">
                      <ImageWithFallback src={restaurant.coverImageUrl || "https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?auto=format&fit=crop&q=80&w=600"} alt={restaurant.name} className="w-full h-full group-hover:scale-105 transition-transform duration-500" />
                      {restaurant.rating && restaurant.rating > 4.5 && (
                        <div className="absolute top-4 left-4">
                          <Badge variant="secondary" className="shadow-md bg-brand-secondary text-white border-none">
                            Popular
                          </Badge>
                        </div>
                      )}
                    </div>
                    <CardContent className="p-5">
                      <div className="flex justify-between items-start mb-2">
                        <h3 className="text-xl font-bold text-brand-fg line-clamp-1">{restaurant.name}</h3>
                        <div className="flex items-center gap-1 bg-brand-border/30 px-2 py-1 rounded-md text-sm font-semibold">
                          <span className="text-amber-500">★</span>
                          <span>{restaurant.rating?.toFixed(1) || "New"}</span>
                        </div>
                      </div>
                      <p className="text-brand-muted text-sm line-clamp-1 mb-4">
                        {restaurant.cuisine || "Various Cuisines"} • {restaurant.location || restaurant.city || "Local"}
                      </p>
                      
                      <div className="flex items-center justify-between text-sm font-medium pt-4 border-t border-brand-border/40">
                        <span className="flex items-center text-brand-muted">
                          <svg className="w-4 h-4 mr-1 text-brand-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
                          {restaurant.deliveryTimeMinutes || 30} mins
                        </span>
                        <span className="text-brand-primary font-bold">
                          {'₹'.repeat(restaurant.priceRange || 2)}
                        </span>
                      </div>
                    </CardContent>
                  </Card>
                </Link>
              ))}
            </div>
          )}
          
          <div className="mt-8 text-center sm:hidden">
            <Button href="/restaurants" variant="outline" className="w-full">View All Restaurants</Button>
          </div>
        </Container>
      </section>

      {/* Why Choose Section */}
      <section className="py-16 bg-white border-t border-brand-border/40">
        <Container>
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-brand-fg mb-4">Why Choose QuickBite?</h2>
            <p className="text-brand-muted">We provide the best delivery experience in the city.</p>
          </div>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
            {FEATURES.map((feature, i) => (
              <div key={i} className="flex flex-col items-center text-center p-6 bg-brand-bg rounded-3xl border border-brand-border/40 hover:border-brand-primary/30 transition-colors">
                <div className="w-16 h-16 bg-brand-primary/10 rounded-full flex items-center justify-center text-brand-primary mb-4">
                  <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d={feature.icon}></path>
                  </svg>
                </div>
                <h3 className="font-bold text-lg text-brand-fg mb-2">{feature.title}</h3>
                <p className="text-brand-muted text-sm">{feature.desc}</p>
              </div>
            ))}
          </div>
        </Container>
      </section>

    </div>
  );
}
