"use client";

import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import { Container } from "@/components/Container";
import { Card, CardContent } from "@/components/Card";
import { Badge } from "@/components/Badge";
import { Button } from "@/components/Button";
import { ImageWithFallback } from "@/components/ImageWithFallback";
import { getRestaurants, getNearbyRestaurants } from "@/lib/api";
import { Restaurant } from "@/types/restaurant";

const formatDistance = (distanceKm?: number) => {
  if (distanceKm === undefined) return null;
  if (distanceKm < 1) {
    return `${Math.round(distanceKm * 1000)}m away`;
  }
  return `${distanceKm.toFixed(1)}km away`;
};

const CITIES = [
  "Mumbai", "Indore", "Bengaluru", "Delhi", "Hyderabad", 
  "Chennai", "Pune", "Kolkata", "Ahmedabad", "Jaipur", "Chandigarh"
];

export default function RestaurantsPage() {
  const [allRestaurants, setAllRestaurants] = useState<Restaurant[]>([]);
  const [restaurants, setRestaurants] = useState<Restaurant[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isLocating, setIsLocating] = useState(false);
  const [locationError, setLocationError] = useState<string | null>(null);
  const [selectedCity, setSelectedCity] = useState<string>("");

  const fetchRestaurantsList = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const data = await getRestaurants();
      setAllRestaurants(data);
      setRestaurants(data);
      setSelectedCity("");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load restaurants");
    } finally {
      setIsLoading(false);
    }
  }, []);

  const handleCityChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const city = e.target.value;
    setSelectedCity(city);
    setLocationError(null);
    if (city === "") {
      setRestaurants(allRestaurants);
    } else {
      setRestaurants(allRestaurants.filter(r => r.city === city));
    }
  };

  const handleUseLocation = () => {
    if (!navigator.geolocation) {
      setLocationError("Geolocation is not supported by your browser");
      return;
    }

    setIsLocating(true);
    setLocationError(null);
    setSelectedCity("");

    navigator.geolocation.getCurrentPosition(
      async (position) => {
        try {
          setIsLoading(true);
          const { latitude, longitude } = position.coords;
          const data = await getNearbyRestaurants(latitude, longitude, 10);
          setRestaurants(data);
        } catch (err) {
          setLocationError(err instanceof Error ? err.message : "Failed to load nearby restaurants");
        } finally {
          setIsLocating(false);
          setIsLoading(false);
        }
      },
      (err) => {
        setIsLocating(false);
        switch (err.code) {
          case err.PERMISSION_DENIED:
            setLocationError("Location permission denied");
            break;
          case err.POSITION_UNAVAILABLE:
            setLocationError("Location information is unavailable");
            break;
          case err.TIMEOUT:
            setLocationError("The request to get user location timed out");
            break;
          default:
            setLocationError("An unknown error occurred getting location");
            break;
        }
      },
      { timeout: 10000, enableHighAccuracy: true }
    );
  };

  useEffect(() => {
    let ignore = false;

    async function load() {
      try {
        const data = await getRestaurants();
        if (!ignore) {
          setAllRestaurants(data);
          setRestaurants(data);
          setIsLoading(false);
        }
      } catch (err) {
        if (!ignore) {
          setError(err instanceof Error ? err.message : "Failed to load restaurants");
          setIsLoading(false);
        }
      }
    }

    load();

    return () => {
      ignore = true;
    };
  }, []);

  return (
    <div className="flex-1 py-12 sm:py-16">
      <Container>
        {/* Page Header */}
        <div className="mb-10 sm:mb-12">
          <Badge variant="default" className="mb-3">
            Handpicked & Verified
          </Badge>
          <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
            <div>
              <h1 className="text-4xl sm:text-5xl font-serif text-brand-fg tracking-tight">
                Restaurants
              </h1>
              <p className="text-brand-muted text-base sm:text-lg mt-2 font-light">
                Discover distinct dining spots offering honest, delicious food without the noise.
              </p>
            </div>
            
            <div className="flex flex-col items-start sm:items-end gap-3 shrink-0">
              <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto">
                <div className="relative">
                  <select 
                    value={selectedCity}
                    onChange={handleCityChange}
                    disabled={isLocating || isLoading}
                    className="appearance-none bg-white border border-brand-border/80 text-brand-fg text-sm rounded-md px-4 py-2.5 pr-10 focus:outline-none focus:ring-2 focus:ring-brand-primary/20 focus:border-brand-primary transition-colors cursor-pointer w-full"
                  >
                    <option value="">All Locations</option>
                    {CITIES.map(city => (
                      <option key={city} value={city}>{city}</option>
                    ))}
                  </select>
                  <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-3 text-brand-muted">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 9l-7 7-7-7" />
                    </svg>
                  </div>
                </div>

                <Button 
                  onClick={handleUseLocation} 
                  variant="outline" 
                  disabled={isLocating}
                  className="flex items-center gap-2 justify-center"
                >
                  {isLocating ? (
                    <div className="w-4 h-4 rounded-full border-2 border-current border-t-transparent animate-spin opacity-70" />
                  ) : (
                    <svg className="w-4 h-4 opacity-70" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                    </svg>
                  )}
                  {isLocating ? "Locating..." : "Use my location"}
                </Button>
              </div>
              
              {!isLoading && !error && (
                <span className="text-sm font-medium text-brand-muted">
                  Showing {restaurants.length} {restaurants.length === 1 ? "restaurant" : "restaurants"}
                  {selectedCity && ` in ${selectedCity}`}
                  {!selectedCity && restaurants[0]?.distanceKm !== undefined && " nearby"}
                </span>
              )}
            </div>
          </div>

          {locationError && (
            <div className="mt-4 p-3 bg-rose-50 border border-rose-100 rounded-md text-sm text-rose-600 flex items-center gap-2 max-w-2xl">
              <svg className="w-4 h-4 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
              {locationError}
            </div>
          )}
        </div>

        {/* Loading State */}
        {isLoading && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {[1, 2, 3, 4, 5, 6].map((idx) => (
              <Card key={idx} noPadding className="overflow-hidden animate-pulse">
                <div className="h-48 bg-brand-border/40" />
                <CardContent className="p-6 space-y-4">
                  <div className="flex justify-between items-start">
                    <div className="h-6 w-3/5 bg-brand-border/60 rounded" />
                    <div className="h-5 w-12 bg-brand-border/60 rounded" />
                  </div>
                  <div className="h-4 w-4/5 bg-brand-border/40 rounded" />
                  <div className="flex gap-4 pt-2">
                    <div className="h-4 w-20 bg-brand-border/40 rounded" />
                    <div className="h-4 w-24 bg-brand-border/40 rounded" />
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        {/* Error State */}
        {!isLoading && error && (
          <div className="max-w-xl mx-auto my-12 text-center">
            <Card className="p-8 border-rose-200 bg-white shadow-sm">
              <div className="w-12 h-12 mx-auto mb-4 rounded-full bg-rose-50 flex items-center justify-center text-rose-600">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                </svg>
              </div>
              <h2 className="text-2xl font-serif text-brand-fg mb-2">Unable to Load Restaurants</h2>
              <p className="text-brand-muted text-sm mb-6">{error}</p>
              <Button onClick={fetchRestaurantsList} variant="primary">
                Try Again
              </Button>
            </Card>
          </div>
        )}

        {/* Empty State */}
        {!isLoading && !error && restaurants.length === 0 && (
          <div className="max-w-md mx-auto my-12 text-center">
            <Card className="p-8 bg-white">
              <div className="w-12 h-12 mx-auto mb-4 rounded-full bg-brand-bg flex items-center justify-center text-brand-muted">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                </svg>
              </div>
              <h2 className="text-2xl font-serif text-brand-fg mb-2">No Restaurants Found</h2>
              <p className="text-brand-muted text-sm mb-6">
                There are currently no dining partners available. Please check back shortly.
              </p>
              <Button onClick={fetchRestaurantsList} variant="outline">
                Refresh
              </Button>
            </Card>
          </div>
        )}

        {/* Populated State */}
        {!isLoading && !error && restaurants.length > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {restaurants.map((restaurant, index) => (
              <Link
                key={restaurant.id}
                href={`/restaurants/${restaurant.id}`}
                className="block group"
              >
                <Card
                  noPadding
                  className="h-full hover:border-brand-primary/40 hover:shadow-sm transition-all duration-200"
                >
                  <div className="h-44 bg-stone-100 relative flex items-center justify-center overflow-hidden border-b border-brand-border/60 group-hover:opacity-90 transition-opacity">
                    <ImageWithFallback
                      src={restaurant.coverImageUrl}
                      alt={restaurant.name}
                      priority={index < 6}
                      className="absolute inset-0 w-full h-full object-cover"
                      fallbackNode={
                        <>
                          <div className="absolute inset-0 bg-gradient-to-t from-stone-900/10 to-transparent" />
                          <span className="font-serif text-3xl font-semibold text-stone-300 select-none group-hover:scale-105 transition-transform duration-300">
                            {restaurant.name.charAt(0)}
                          </span>
                        </>
                      }
                    />
                    <div className="absolute top-4 left-4">
                      <Badge variant="default" className="bg-white/90 backdrop-blur-sm shadow-xs">
                        {restaurant.cuisine}
                      </Badge>
                    </div>
                  </div>

                  <CardContent className="p-6">
                    <div className="flex justify-between items-start gap-2 mb-2">
                      <h3 className="font-serif text-xl font-medium text-brand-fg group-hover:text-brand-primary transition-colors">
                        {restaurant.name}
                      </h3>
                      <span className="flex items-center text-sm font-medium bg-brand-bg px-2.5 py-1 rounded-md border border-brand-border shrink-0">
                        <svg className="w-3.5 h-3.5 text-amber-500 mr-1" fill="currentColor" viewBox="0 0 20 20">
                          <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                        </svg>
                        {restaurant.rating.toFixed(1)}
                      </span>
                    </div>

                    <div className="flex items-center justify-between text-sm text-brand-muted mb-6">
                      <div className="flex items-center min-w-0 pr-2">
                        <svg className="w-4 h-4 mr-1 shrink-0 opacity-70" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                        </svg>
                        <span className="truncate">{restaurant.location}</span>
                      </div>
                      
                      {restaurant.distanceKm !== undefined && (
                        <span className="shrink-0 font-medium text-brand-primary bg-brand-primary/5 px-2 py-0.5 rounded text-xs border border-brand-primary/10">
                          {formatDistance(restaurant.distanceKm)}
                        </span>
                      )}
                    </div>

                    <div className="pt-4 border-t border-brand-border/60 flex items-center justify-between text-xs text-brand-muted">
                      <span>{restaurant.cuisine} cuisine</span>
                      <span className="font-medium text-brand-fg group-hover:text-brand-primary flex items-center transition-colors">
                        View menu
                        <svg className="w-3.5 h-3.5 ml-1 transition-transform group-hover:translate-x-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                        </svg>
                      </span>
                    </div>
                  </CardContent>
                </Card>
              </Link>
            ))}
          </div>
        )}
      </Container>
    </div>
  );
}
