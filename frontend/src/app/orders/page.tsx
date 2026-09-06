"use client";

import { useEffect, useState, useCallback } from "react";
import { Container } from "@/components/Container";
import { Card } from "@/components/Card";
import { Badge } from "@/components/Badge";
import { Button } from "@/components/Button";
import { getOrderById, getRestaurants } from "@/lib/api";
import { getStoredOrderIds } from "@/lib/orders";
import { Order } from "@/types/order";
import { Restaurant } from "@/types/restaurant";

type OrderWithRestaurant = Order & { restaurantName: string };

export default function MyOrdersPage() {
  const [orders, setOrders] = useState<OrderWithRestaurant[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchOrders = useCallback(async (isRetry = false) => {
    if (isRetry) {
      setIsLoading(true);
    }
    setError(null);

    try {
      const orderIds = getStoredOrderIds();
      if (orderIds.length === 0) {
        setOrders([]);
        setIsLoading(false);
        return;
      }

      // Fetch all required data in parallel
      const [fetchedOrders, restaurants] = await Promise.all([
        Promise.all(orderIds.map((id) => getOrderById(id).catch(() => null))),
        getRestaurants().catch(() => [] as Restaurant[])
      ]);

      const validOrders = fetchedOrders.filter((o): o is Order => o !== null);

      // Map restaurant names and sort by newest first
      const enrichedOrders = validOrders.map((order) => {
        const restaurant = restaurants.find((r) => r.id === order.restaurantId);
        return {
          ...order,
          restaurantName: restaurant?.name || "Unknown Restaurant",
        };
      }).sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

      setOrders(enrichedOrders);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed to load orders");
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    let ignore = false;
    async function load() {
      try {
        const orderIds = getStoredOrderIds();
        if (ignore) return;
        if (orderIds.length === 0) {
          setOrders([]);
          setIsLoading(false);
          return;
        }

        const [fetchedOrders, restaurants] = await Promise.all([
          Promise.all(orderIds.map((id) => getOrderById(id).catch(() => null))),
          getRestaurants().catch(() => [] as Restaurant[])
        ]);

        if (ignore) return;
        const validOrders = fetchedOrders.filter((o): o is Order => o !== null);

        const enrichedOrders = validOrders.map((order) => {
          const restaurant = restaurants.find((r) => r.id === order.restaurantId);
          return {
            ...order,
            restaurantName: restaurant?.name || "Unknown Restaurant",
          };
        }).sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

        setOrders(enrichedOrders);
        setIsLoading(false);
      } catch (err: unknown) {
        if (!ignore) {
          setError(err instanceof Error ? err.message : "Failed to load orders");
          setIsLoading(false);
        }
      }
    }
    load();
    return () => { ignore = true; };
  }, []);

  const getStatusVariant = (status: string) => {
    switch (status.toUpperCase()) {
      case "CONFIRMED":
        return "success";
      case "PENDING":
        return "warning";
      case "CANCELLED":
        return "error";
      default:
        return "neutral";
    }
  };

  if (isLoading) {
    return (
      <div className="flex-1 py-10 sm:py-16">
        <Container>
          <div className="mb-8">
            <div className="h-10 w-1/4 bg-brand-border/60 rounded animate-pulse" />
          </div>
          <div className="space-y-6">
            {[1, 2, 3].map((i) => (
              <Card key={i} className="p-6 h-32 bg-brand-border/40 animate-pulse rounded-xl">
                <span className="sr-only">Loading</span>
              </Card>
            ))}
          </div>
        </Container>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex-1 py-20">
        <Container>
          <Card className="max-w-md mx-auto p-10 text-center bg-white shadow-xs border-rose-200">
            <div className="w-12 h-12 mx-auto mb-4 rounded-full bg-rose-50 flex items-center justify-center text-rose-600">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
            </div>
            <h2 className="text-2xl font-serif text-brand-fg mb-3">Error Loading Orders</h2>
            <p className="text-brand-muted text-sm mb-8">{error}</p>
            <Button onClick={() => fetchOrders(true)} variant="primary">
              Try Again
            </Button>
          </Card>
        </Container>
      </div>
    );
  }

  return (
    <div className="flex-1 py-10 sm:py-16">
      <Container>
        <div className="mb-8 sm:mb-12">
          <Badge variant="default" className="mb-2">
            History
          </Badge>
          <h1 className="text-4xl sm:text-5xl font-serif text-brand-fg tracking-tight">
            My Orders
          </h1>
          <p className="text-brand-muted text-base mt-2">
            Review your past orders and their status.
          </p>
        </div>

        {orders.length === 0 ? (
          <Card className="max-w-md mx-auto p-10 text-center bg-white shadow-xs">
            <div className="w-16 h-16 mx-auto mb-5 rounded-full bg-brand-bg flex items-center justify-center text-brand-muted">
              <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
              </svg>
            </div>
            <h2 className="text-2xl font-serif text-brand-fg mb-3">No orders yet</h2>
            <p className="text-brand-muted text-sm mb-8">
              Looks like you haven&apos;t placed any orders. Explore our curated restaurants and place your first order!
            </p>
            <Button href="/restaurants" variant="primary" className="w-full">
              Explore Restaurants
            </Button>
          </Card>
        ) : (
          <div className="space-y-6">
            {orders.map((order) => {
              const itemsCount = (order.items || []).reduce((acc, item) => acc + item.quantity, 0);
              
              return (
                <Card key={order.id} className="p-6 sm:p-8 bg-white shadow-xs transition-shadow hover:shadow-sm">
                  <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                    
                    {/* Left Info */}
                    <div className="space-y-3 flex-1 min-w-0">
                      <div className="flex items-center gap-3 flex-wrap">
                        <span className="font-serif text-xl sm:text-2xl font-medium text-brand-fg">
                          {order.restaurantName}
                        </span>
                        <Badge variant={getStatusVariant(order.status)}>
                          {order.status}
                        </Badge>
                      </div>
                      
                      <div className="flex items-center flex-wrap gap-x-4 gap-y-2 text-sm text-brand-muted">
                        <span className="font-mono text-xs bg-brand-bg px-2 py-0.5 rounded border border-brand-border text-brand-fg shrink-0">
                          Order #{order.id}
                        </span>
                        <span className="flex items-center gap-1.5 shrink-0">
                          <svg className="w-4 h-4 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
                          {new Date(order.createdAt).toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' })}
                        </span>
                        <span className="flex items-center gap-1.5 shrink-0">
                          <svg className="w-4 h-4 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" /></svg>
                          {itemsCount} {itemsCount === 1 ? 'item' : 'items'}
                        </span>
                      </div>
                      
                      {order.items && order.items.length > 0 && (
                        <p className="text-sm text-brand-muted truncate">
                          {order.items.map(i => `${i.quantity}× ${i.name}`).join(', ')}
                        </p>
                      )}
                    </div>
                    
                    {/* Right Info */}
                    <div className="flex flex-row md:flex-col items-center md:items-end justify-between md:justify-center gap-4 shrink-0 mt-4 md:mt-0 pt-4 md:pt-0 border-t md:border-t-0 border-brand-border">
                      <div className="text-left md:text-right">
                        <p className="text-xs text-brand-muted mb-0.5 uppercase tracking-wider font-semibold">Total</p>
                        <p className="font-serif text-xl sm:text-2xl font-semibold text-brand-primary">
                          ₹{order.totalAmount.toFixed(2)}
                        </p>
                      </div>
                      <Button href={`/orders/${order.id}`} variant="outline" className="w-full md:w-auto">
                        View Order
                      </Button>
                    </div>

                  </div>
                </Card>
              );
            })}
          </div>
        )}
      </Container>
    </div>
  );
}
