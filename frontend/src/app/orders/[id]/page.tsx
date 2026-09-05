"use client";

import { use, useEffect, useState, useCallback } from "react";
import Link from "next/link";
import { Container } from "@/components/Container";
import { Card } from "@/components/Card";
import { Badge } from "@/components/Badge";
import { Button } from "@/components/Button";
import { getOrderById, getCustomerById, getRestaurantById } from "@/lib/api";
import { Order } from "@/types/order";
import { Customer } from "@/types/customer";
import { Restaurant } from "@/types/restaurant";

export default function OrderDetailsPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);

  const [order, setOrder] = useState<Order | null>(null);
  const [customer, setCustomer] = useState<Customer | null>(null);
  const [restaurant, setRestaurant] = useState<Restaurant | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [notFound, setNotFound] = useState(false);

  const loadOrderData = useCallback(async () => {
    setError(null);
    setNotFound(false);

    try {
      const orderData = await getOrderById(id);
      setOrder(orderData);

      const [customerData, restaurantData] = await Promise.all([
        getCustomerById(orderData.customerId).catch(() => null),
        getRestaurantById(orderData.restaurantId).catch(() => null)
      ]);

      setCustomer(customerData);
      setRestaurant(restaurantData);
    } catch (err: unknown) {
      if (err instanceof Error && err.message.includes("404")) {
        setNotFound(true);
      } else {
        setError(err instanceof Error ? err.message : "Failed to load order details");
      }
    } finally {
      setIsLoading(false);
    }
  }, [id]);

  useEffect(() => {
    let ignore = false;
    async function initialLoad() {
      try {
        const orderData = await getOrderById(id);
        if (ignore) return;
        setOrder(orderData);

        const [customerData, restaurantData] = await Promise.all([
          getCustomerById(orderData.customerId).catch(() => null),
          getRestaurantById(orderData.restaurantId).catch(() => null)
        ]);

        if (!ignore) {
          setCustomer(customerData);
          setRestaurant(restaurantData);
          setIsLoading(false);
        }
      } catch (err: unknown) {
        if (!ignore) {
          if (err instanceof Error && err.message.includes("404")) {
            setNotFound(true);
          } else {
            setError(err instanceof Error ? err.message : "Failed to load order details");
          }
          setIsLoading(false);
        }
      }
    }

    initialLoad();
    return () => { ignore = true; };
  }, [id]);

  const handleRetry = () => {
    setIsLoading(true);
    loadOrderData();
  };

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
          <div className="animate-pulse space-y-8">
            <div className="h-10 w-1/4 bg-brand-border/60 rounded" />
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
              <div className="lg:col-span-2 space-y-6">
                <div className="h-48 w-full bg-brand-border/40 rounded-xl" />
                <div className="h-64 w-full bg-brand-border/40 rounded-xl" />
              </div>
              <div className="lg:col-span-1 space-y-6">
                <div className="h-32 w-full bg-brand-border/40 rounded-xl" />
                <div className="h-64 w-full bg-brand-border/40 rounded-xl" />
              </div>
            </div>
          </div>
        </Container>
      </div>
    );
  }

  if (notFound) {
    return (
      <div className="flex-1 py-20">
        <Container>
          <Card className="max-w-md mx-auto p-10 text-center bg-white shadow-xs">
            <div className="w-16 h-16 mx-auto mb-5 rounded-full bg-brand-bg flex items-center justify-center text-brand-muted">
              <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </div>
            <h2 className="text-2xl font-serif text-brand-fg mb-3">Order Not Found</h2>
            <p className="text-brand-muted text-sm mb-8">
              We couldn&apos;t find an order with ID #{id}. It may have been removed or the ID is incorrect.
            </p>
            <Button href="/" variant="primary" className="w-full">
              Return Home
            </Button>
          </Card>
        </Container>
      </div>
    );
  }

  if (error || !order) {
    return (
      <div className="flex-1 py-20">
        <Container>
          <Card className="max-w-md mx-auto p-10 text-center bg-white shadow-xs border-rose-200">
            <div className="w-12 h-12 mx-auto mb-4 rounded-full bg-rose-50 flex items-center justify-center text-rose-600">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
            </div>
            <h2 className="text-2xl font-serif text-brand-fg mb-3">Error Loading Order</h2>
            <p className="text-brand-muted text-sm mb-8">{error || "An unexpected error occurred."}</p>
            <Button onClick={handleRetry} variant="primary">
              Try Again
            </Button>
          </Card>
        </Container>
      </div>
    );
  }

  const items = order.items || [];
  const isConfirmed = order.status.toUpperCase() === "CONFIRMED";

  return (
    <div className="flex-1 py-10 sm:py-16">
      <Container>
        {isConfirmed && (
          <div className="mb-8 p-4 rounded-xl border border-emerald-200 bg-emerald-50 text-emerald-800 flex items-start sm:items-center gap-4 shadow-sm">
            <div className="p-2 bg-emerald-100 rounded-full shrink-0">
              <svg className="w-5 h-5 text-emerald-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <div>
              <h3 className="font-semibold text-emerald-900">Order placed successfully!</h3>
              <p className="text-sm mt-0.5">We&apos;ve received your payment and the restaurant is preparing your food.</p>
            </div>
          </div>
        )}

        <div className="mb-8 sm:mb-12">
          <Badge variant="default" className="mb-2">
            Order Details
          </Badge>
          <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
            <div>
              <h1 className="text-4xl sm:text-5xl font-serif text-brand-fg tracking-tight">
                Order #{order.id}
              </h1>
              <p className="text-brand-muted text-base mt-2">
                Placed on {new Date(order.createdAt).toLocaleString(undefined, {
                  weekday: 'long', year: 'numeric', month: 'long', day: 'numeric',
                  hour: '2-digit', minute: '2-digit'
                })}
              </p>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
          {/* Left Column: Order Status and Items */}
          <div className="lg:col-span-2 space-y-6">
            <Card className="p-6 bg-white shadow-xs">
              <h2 className="font-serif text-xl font-medium text-brand-fg mb-4">Status & Payment</h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                <div>
                  <p className="text-xs text-brand-muted mb-1.5 uppercase tracking-wider font-semibold">Order Status</p>
                  <Badge variant={getStatusVariant(order.status)}>
                    {order.status}
                  </Badge>
                </div>
                <div>
                  <p className="text-xs text-brand-muted mb-1.5 uppercase tracking-wider font-semibold">Payment Status</p>
                  <div className="flex items-center gap-2">
                    {isConfirmed ? (
                      <span className="text-sm font-medium text-brand-fg flex items-center gap-1.5">
                        <svg className="w-4 h-4 text-emerald-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                        Paid via Razorpay
                      </span>
                    ) : order.status.toUpperCase() === "CANCELLED" ? (
                      <span className="text-sm font-medium text-brand-muted flex items-center gap-1.5">
                        <svg className="w-4 h-4 text-rose-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                        Cancelled
                      </span>
                    ) : (
                      <span className="text-sm font-medium text-amber-600 flex items-center gap-1.5">
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                        Pending Payment
                      </span>
                    )}
                  </div>
                </div>
              </div>
            </Card>

            <Card className="p-6 bg-white shadow-xs">
              <div className="flex items-center justify-between pb-4 mb-4 border-b border-brand-border">
                <div>
                  <h2 className="font-serif text-xl font-medium text-brand-fg">
                    Ordered Items
                  </h2>
                  {restaurant && (
                    <p className="text-xs text-brand-muted mt-0.5">
                      From{" "}
                      <Link
                        href={`/restaurants/${restaurant.id}`}
                        className="font-medium text-brand-fg underline underline-offset-4 hover:text-brand-primary transition-colors"
                      >
                        {restaurant.name}
                      </Link>
                    </p>
                  )}
                </div>
                <span className="text-sm font-medium text-brand-muted bg-brand-bg px-2.5 py-1 rounded-md">
                  {items.reduce((acc, item) => acc + item.quantity, 0)} items
                </span>
              </div>

              {items.length > 0 ? (
                <div className="divide-y divide-brand-border/60">
                  {items.map((item) => (
                    <div
                      key={item.id}
                      className="py-3.5 flex items-center justify-between gap-4 first:pt-0 last:pb-0"
                    >
                      <div className="space-y-0.5 flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="font-medium text-brand-fg text-sm truncate">
                            {item.name}
                          </span>
                          <span className="text-xs font-semibold px-2 py-0.5 rounded bg-brand-bg text-brand-fg border border-brand-border shrink-0">
                            × {item.quantity}
                          </span>
                        </div>
                        <p className="text-xs text-brand-muted">
                          ₹{item.unitPrice.toFixed(2)} each
                        </p>
                      </div>
                      <span className="font-serif font-semibold text-base text-brand-fg shrink-0">
                        ₹{item.subtotal.toFixed(2)}
                      </span>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-brand-muted py-2">No items found for this order.</p>
              )}
            </Card>
          </div>

          {/* Right Column: Customer Info and Order Summary */}
          <div className="lg:col-span-1 space-y-6">
            <Card className="p-6 sm:p-8 bg-white shadow-xs">
              <h2 className="font-serif text-xl font-medium text-brand-fg mb-4 pb-4 border-b border-brand-border">
                Customer Details
              </h2>
              {customer ? (
                <div className="space-y-3">
                  <div>
                    <p className="text-xs text-brand-muted mb-0.5 uppercase tracking-wider font-semibold">Name</p>
                    <p className="text-sm font-medium text-brand-fg">{customer.name}</p>
                  </div>
                  <div>
                    <p className="text-xs text-brand-muted mb-0.5 uppercase tracking-wider font-semibold">Email</p>
                    <p className="text-sm text-brand-fg">{customer.email}</p>
                  </div>
                  {customer.phone && (
                    <div>
                      <p className="text-xs text-brand-muted mb-0.5 uppercase tracking-wider font-semibold">Phone</p>
                      <p className="text-sm text-brand-fg">{customer.phone}</p>
                    </div>
                  )}
                </div>
              ) : (
                <p className="text-sm text-brand-muted">Customer details not available.</p>
              )}
            </Card>

            <Card className="p-6 sm:p-8 bg-white shadow-xs sticky top-24">
              <h2 className="font-serif text-xl font-medium text-brand-fg mb-4 pb-4 border-b border-brand-border">
                Order Summary
              </h2>

              <div className="space-y-3.5 text-sm">
                <div className="flex justify-between text-brand-muted">
                  <span>Items subtotal</span>
                  <span className="font-medium text-brand-fg">
                    ₹{order.totalAmount.toFixed(2)}
                  </span>
                </div>
                <div className="flex justify-between text-brand-muted">
                  <span>Delivery fee</span>
                  <span className="font-medium text-emerald-600">Free</span>
                </div>
                <div className="flex justify-between text-brand-muted">
                  <span>Taxes & charges</span>
                  <span className="font-medium text-brand-fg">Included</span>
                </div>

                <div className="pt-4 mt-4 border-t border-brand-border flex justify-between items-baseline">
                  <span className="font-serif text-lg font-medium text-brand-fg">
                    Total
                  </span>
                  <span className="font-serif text-3xl font-semibold text-brand-primary">
                    ₹{order.totalAmount.toFixed(2)}
                  </span>
                </div>
              </div>
            </Card>
          </div>
        </div>
      </Container>
    </div>
  );
}
