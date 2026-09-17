"use client";

import { useState, useEffect, useMemo } from "react";
import { useRouter } from "next/navigation";
import { Container } from "@/components/Container";
import { Card, CardContent } from "@/components/Card";
import { Button } from "@/components/Button";
import { useAuth } from "@/context/AuthContext";
import { getRestaurants, requestStaffAccess, ApiError } from "@/lib/api";
import { Restaurant } from "@/types/restaurant";

export default function JoinRestaurantPage() {
  const router = useRouter();
  const { user, requireAuth, loading } = useAuth();
  
  const [restaurants, setRestaurants] = useState<Restaurant[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [submittingId, setSubmittingId] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let ignore = false;
    
    async function fetchAll() {
      try {
        const data = await getRestaurants();
        if (!ignore) {
          setRestaurants(data);
          setIsLoading(false);
        }
      } catch (err) {
        if (!ignore) {
          setError("Failed to load restaurants.");
          setIsLoading(false);
        }
      }
    }

    if (user) {
      fetchAll();
    } else if (!loading) {
      requireAuth(() => {});
    }

    return () => { ignore = true; };
  }, [user, loading, requireAuth]);

  const filteredRestaurants = useMemo(() => {
    const query = searchQuery.toLowerCase().trim();
    if (!query) return restaurants.slice(0, 10); // Show max 10 when empty

    return restaurants.filter((r) => {
      return (
        (r.name && r.name.toLowerCase().includes(query)) ||
        (r.city && r.city.toLowerCase().includes(query)) ||
        (r.cuisine && r.cuisine.toLowerCase().includes(query)) ||
        (r.location && r.location.toLowerCase().includes(query))
      );
    }).slice(0, 20); // Bounded display strategy
  }, [restaurants, searchQuery]);

  const handleJoin = async (restaurantId: number) => {
    
    setSubmittingId(restaurantId);
    setError(null);

    try {
      await requestStaffAccess(restaurantId);
      router.push("/restaurant/onboarding-status");
    } catch (err) {
      if (err instanceof ApiError && err.status === 409) {
        setError("You already have a pending staff request for this restaurant.");
      } else {
        setError(err instanceof Error ? err.message : "Failed to submit request.");
      }
      setSubmittingId(null);
    }
  };

  if (!user) {
    return (
      <Container className="py-16 text-center">
        <p className="text-brand-muted">Please log in to join a restaurant.</p>
      </Container>
    );
  }

  return (
    <Container className="py-12 sm:py-16 max-w-3xl mx-auto">
      <div className="mb-10 text-center">
        <h1 className="text-3xl sm:text-4xl font-serif font-semibold text-brand-fg mb-3">Join a Restaurant</h1>
        <p className="text-brand-muted text-lg">
          Search for an existing QuickBite partner restaurant to request staff access. Your request will require approval from the owner or operator.
        </p>
      </div>

      <Card className="mb-8 p-4 sm:p-6 bg-white shadow-xs border-brand-border/60">
        <div className="relative">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <svg className="h-5 w-5 text-brand-muted" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
          </div>
          <input
            type="text"
            className="block w-full pl-10 pr-3 py-3 border border-brand-border rounded-lg leading-5 bg-transparent placeholder-brand-muted focus:outline-none focus:ring-2 focus:ring-brand-primary/50 text-brand-fg sm:text-sm transition-shadow"
            placeholder="Search by name, city, cuisine, or location..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
      </Card>

      {error && (
        <div className="mb-8 p-4 bg-red-50 text-red-700 border border-red-200 rounded-lg text-sm text-center">
          {error}
        </div>
      )}

      {isLoading ? (
        <div className="space-y-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-24 bg-brand-border/40 rounded-xl animate-pulse" />
          ))}
        </div>
      ) : filteredRestaurants.length === 0 ? (
        <div className="text-center py-12 text-brand-muted border border-dashed border-brand-border/60 rounded-xl">
          <p>No restaurants found matching your search.</p>
        </div>
      ) : (
        <div className="space-y-4">
          <div className="text-sm text-brand-muted mb-4 font-medium">
            Showing {filteredRestaurants.length} result{filteredRestaurants.length !== 1 && 's'}
            {searchQuery === "" && " (Use search to find more)"}
          </div>
          {filteredRestaurants.map((restaurant) => (
            <Card key={restaurant.id} className="p-5 sm:p-6 bg-white shadow-xs transition-shadow hover:shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <h3 className="text-xl font-medium text-brand-fg">{restaurant.name}</h3>
                <p className="text-brand-muted text-sm mt-1">
                  {restaurant.cuisine} • {restaurant.city || restaurant.location}
                </p>
              </div>
              <Button
                variant="outline"
                onClick={() => handleJoin(restaurant.id)}
                disabled={submittingId !== null}
                className="w-full sm:w-auto"
              >
                {submittingId === restaurant.id ? "Requesting..." : "Request Access"}
              </Button>
            </Card>
          ))}
        </div>
      )}
    </Container>
  );
}
