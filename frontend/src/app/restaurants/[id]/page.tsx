"use client";

import { useEffect, useState, useCallback } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { Container } from "@/components/Container";
import { Card } from "@/components/Card";
import { Badge } from "@/components/Badge";
import { Button } from "@/components/Button";
import { getRestaurantById, getRestaurantMenu } from "@/lib/api";
import { addItemToCart } from "@/lib/cart";
import { Restaurant, MenuItem } from "@/types/restaurant";

export default function RestaurantDetailsPage() {
  const params = useParams();
  const rawId = params?.id;
  const restaurantId = Array.isArray(rawId) ? rawId[0] : (rawId as string);

  const [restaurant, setRestaurant] = useState<Restaurant | null>(null);
  const [menu, setMenu] = useState<MenuItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [addingItemId, setAddingItemId] = useState<number | null>(null);
  const [cartToast, setCartToast] = useState<{ message: string; subtext?: string } | null>(null);

  const fetchData = useCallback(async () => {
    if (!restaurantId) return;
    setIsLoading(true);
    setError(null);

    try {
      const [restaurantData, menuData] = await Promise.all([
        getRestaurantById(restaurantId),
        getRestaurantMenu(restaurantId),
      ]);

      if (!restaurantData) {
        setError("Restaurant not found.");
      } else {
        setRestaurant(restaurantData);
        setMenu(menuData);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load restaurant details");
    } finally {
      setIsLoading(false);
    }
  }, [restaurantId]);

  useEffect(() => {
    if (!restaurantId) return;
    let ignore = false;

    async function load() {
      try {
        const [restaurantData, menuData] = await Promise.all([
          getRestaurantById(restaurantId),
          getRestaurantMenu(restaurantId),
        ]);

        if (!ignore) {
          if (!restaurantData) {
            setError("Restaurant not found.");
          } else {
            setRestaurant(restaurantData);
            setMenu(menuData);
          }
          setIsLoading(false);
        }
      } catch (err) {
        if (!ignore) {
          setError(err instanceof Error ? err.message : "Failed to load restaurant details");
          setIsLoading(false);
        }
      }
    }

    load();

    return () => {
      ignore = true;
    };
  }, [restaurantId]);

  const handleAddToCart = async (item: MenuItem) => {
    if (!restaurant) return;
    setAddingItemId(item.id);
    try {
      const { replacedRestaurant } = await addItemToCart(restaurant.id, item.id, 1);
      setCartToast({
        message: `Added "${item.name}" to cart`,
        subtext: replacedRestaurant
          ? "Replaced items from your previous restaurant"
          : undefined,
      });
      setTimeout(() => setCartToast(null), 4000);
    } catch (err) {
      setCartToast({
        message: "Failed to add item to cart",
        subtext: err instanceof Error ? err.message : "Please try again",
      });
      setTimeout(() => setCartToast(null), 4000);
    } finally {
      setAddingItemId(null);
    }
  };

  return (
    <div className="flex-1 py-10 sm:py-14">
      <Container>
        {/* Navigation Breadcrumb */}
        <div className="mb-6">
          <Link
            href="/restaurants"
            className="inline-flex items-center text-sm font-medium text-brand-muted hover:text-brand-fg transition-colors group"
          >
            <svg
              className="w-4 h-4 mr-1.5 transition-transform group-hover:-translate-x-0.5"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            Back to restaurants
          </Link>
        </div>

        {/* Loading State */}
        {isLoading && (
          <div className="space-y-10 animate-pulse">
            <Card className="p-8 space-y-4">
              <div className="h-6 w-32 bg-brand-border/60 rounded" />
              <div className="h-10 w-2/3 bg-brand-border/60 rounded" />
              <div className="flex gap-3">
                <div className="h-6 w-20 bg-brand-border/40 rounded-full" />
                <div className="h-6 w-24 bg-brand-border/40 rounded-full" />
              </div>
            </Card>

            <div className="space-y-4">
              <div className="h-8 w-40 bg-brand-border/60 rounded" />
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {[1, 2, 3, 4].map((idx) => (
                  <Card key={idx} className="p-6 space-y-3">
                    <div className="h-6 w-1/2 bg-brand-border/60 rounded" />
                    <div className="h-4 w-4/5 bg-brand-border/40 rounded" />
                    <div className="h-6 w-16 bg-brand-border/50 rounded" />
                  </Card>
                ))}
              </div>
            </div>
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
              <h2 className="text-2xl font-serif text-brand-fg mb-2">
                {restaurant ? "Unable to Load Menu" : "Restaurant Not Found"}
              </h2>
              <p className="text-brand-muted text-sm mb-6">{error}</p>
              <div className="flex gap-4 justify-center">
                <Button href="/restaurants" variant="outline">
                  Browse Restaurants
                </Button>
                <Button onClick={fetchData} variant="primary">
                  Try Again
                </Button>
              </div>
            </Card>
          </div>
        )}

        {/* Populated / Content State */}
        {!isLoading && !error && restaurant && (
          <div className="space-y-12">
            {/* Restaurant Hero Card */}
            <Card className="p-8 sm:p-10 bg-white shadow-xs border-brand-border/80">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                <div>
                  <div className="flex items-center gap-2 mb-3">
                    <Badge variant="default">{restaurant.cuisine}</Badge>
                    <span className="flex items-center text-xs font-semibold bg-stone-100 text-stone-800 px-2.5 py-0.5 rounded-full border border-stone-200">
                      <svg className="w-3.5 h-3.5 text-amber-500 mr-1" fill="currentColor" viewBox="0 0 20 20">
                        <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                      </svg>
                      {restaurant.rating.toFixed(1)} Rating
                    </span>
                  </div>

                  <h1 className="text-3xl sm:text-5xl font-serif text-brand-fg font-medium tracking-tight">
                    {restaurant.name}
                  </h1>

                  <div className="flex items-center text-sm text-brand-muted mt-3">
                    <svg className="w-4 h-4 mr-1.5 shrink-0 opacity-70" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                    </svg>
                    <span>{restaurant.location}</span>
                  </div>
                </div>

                <div className="flex md:flex-col items-start md:items-end gap-2 text-xs text-brand-muted border-t md:border-t-0 pt-4 md:pt-0 border-brand-border">
                  <span className="flex items-center">
                    <span className="w-2 h-2 rounded-full bg-emerald-500 mr-2" />
                    Open for orders
                  </span>
                  <span>Delivery in 25–35 min</span>
                </div>
              </div>
            </Card>

            {/* Menu Section */}
            <div>
              <div className="flex items-center justify-between mb-8 pb-4 border-b border-brand-border">
                <div>
                  <h2 className="text-2xl sm:text-3xl font-serif text-brand-fg">Menu</h2>
                  <p className="text-brand-muted text-sm mt-1">Prepared fresh to order</p>
                </div>
                <span className="text-sm font-medium text-brand-muted">
                  {menu.length} {menu.length === 1 ? "dish" : "dishes"}
                </span>
              </div>

              {/* Empty Menu State */}
              {menu.length === 0 ? (
                <div className="text-center py-16 px-4">
                  <Card className="max-w-md mx-auto p-8 bg-white border-dashed">
                    <div className="w-12 h-12 mx-auto mb-4 rounded-full bg-brand-bg flex items-center justify-center text-brand-muted">
                      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                      </svg>
                    </div>
                    <h3 className="text-xl font-serif text-brand-fg mb-2">No Menu Items Listed</h3>
                    <p className="text-brand-muted text-sm mb-6">
                      This restaurant currently has no items available on its digital menu. Please check back soon.
                    </p>
                    <Button href="/restaurants" variant="outline">
                      Explore Other Restaurants
                    </Button>
                  </Card>
                </div>
              ) : (
                /* Menu Items Grid */
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {menu.map((item) => (
                    <Card
                      key={item.id}
                      className="p-6 flex flex-col justify-between hover:border-brand-primary/30 transition-colors bg-white shadow-xs"
                    >
                      <div className="space-y-2">
                        <div className="flex justify-between items-start gap-4">
                          <h3 className="font-serif text-xl font-medium text-brand-fg">
                            {item.name}
                          </h3>
                          <Badge variant={item.available ? "success" : "neutral"} className="shrink-0">
                            {item.available ? "Available" : "Sold out"}
                          </Badge>
                        </div>
                        <p className="text-brand-muted text-sm leading-relaxed">
                          {item.description}
                        </p>
                      </div>

                      <div className="pt-5 mt-4 border-t border-brand-border/60 flex items-center justify-between gap-3">
                        <span className="font-serif text-xl font-semibold text-brand-primary">
                          ₹{item.price.toFixed(2)}
                        </span>
                        {item.available ? (
                          <Button
                            size="sm"
                            variant="primary"
                            disabled={addingItemId === item.id}
                            onClick={() => handleAddToCart(item)}
                            className="text-xs px-3.5 h-9 font-medium"
                          >
                            {addingItemId === item.id ? "Adding..." : "Add to cart"}
                          </Button>
                        ) : (
                          <span className="text-xs text-brand-muted font-medium py-1.5 px-2.5 bg-stone-100 rounded-md">
                            Unavailable
                          </span>
                        )}
                      </div>
                    </Card>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}
      </Container>

      {/* Cart Toast Notification */}
      {cartToast && (
        <div className="fixed bottom-6 right-6 z-50 max-w-sm bg-stone-900 text-white p-4 rounded-xl shadow-lg border border-stone-800 flex items-center justify-between gap-4">
          <div className="text-sm font-medium">
            <p className="text-stone-100">{cartToast.message}</p>
            {cartToast.subtext && <p className="text-xs text-stone-400 mt-0.5">{cartToast.subtext}</p>}
          </div>
          <Link
            href="/cart"
            className="shrink-0 px-3.5 py-1.5 bg-brand-primary text-white text-xs font-medium rounded-md hover:bg-brand-primary-hover transition-colors"
          >
            View Cart →
          </Link>
        </div>
      )}
    </div>
  );
}
