content = """/* eslint-disable */
"use client";

import { use, useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Container } from "@/components/Container";
import { Card } from "@/components/Card";
import { Badge } from "@/components/Badge";
import { useAuth } from "@/context/AuthContext";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { DeliveryTracker } from "@/components/DeliveryTracker";
import { useSSE } from "@/hooks/useSSE";

import { getOrderById, getCustomerById, getRestaurantById, getDeliveryByOrderId } from "@/lib/api";

const getStatusVariant = (status: string) => {
  switch (status.toUpperCase()) {
    case 'DELIVERED': return 'success';
    case 'CANCELLED': return 'danger';
    case 'OUT_FOR_DELIVERY': return 'warning';
    case 'READY_FOR_PICKUP':
    case 'DRIVER_ASSIGNED': return 'info';
    case 'PAYMENT_PENDING': return 'warning';
    default: return 'neutral';
  }
};

export default function OrderDetailsPage({ params }: { params: Promise<{ id: string }> }) {
  const router = useRouter();
  const queryClient = useQueryClient();
  const token = typeof window !== "undefined" ? localStorage.getItem("token") : null;
  const { user, loading: authLoading, requireAuth } = useAuth();
  const { id } = use(params);
  
  useSSE(token, (event: any) => {
    if (event.orderId === Number(id)) {
      queryClient.invalidateQueries({ queryKey: ["order", id] });
    }
  });

  const { data, isLoading, isError, error } = useQuery({
    queryKey: ["order", id],
    queryFn: async () => {
      const orderData = await getOrderById(id);
      const [customerData, restaurantData, deliveryData] = await Promise.all([
        getCustomerById(orderData.customerId).catch(() => null),
        getRestaurantById(orderData.restaurantId).catch(() => null),
        getDeliveryByOrderId(orderData.id).catch(() => null)
      ]);
      return { order: orderData, customer: customerData, restaurant: restaurantData, delivery: deliveryData };
    },
    enabled: !!user,
  });

  if (authLoading || isLoading) {
    return (
      <div className="flex-1 py-10 sm:py-16">
        <Container>
          <div className="animate-pulse space-y-8">
            <div className="h-10 w-1/3 bg-brand-border/40 rounded"></div>
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              <div className="lg:col-span-2 space-y-6">
                <div className="h-48 w-full bg-brand-border/40 rounded-xl"></div>
                <div className="h-64 w-full bg-brand-border/40 rounded-xl"></div>
              </div>
              <div className="space-y-6">
                <div className="h-40 w-full bg-brand-border/40 rounded-xl"></div>
                <div className="h-72 w-full bg-brand-border/40 rounded-xl"></div>
              </div>
            </div>
          </div>
        </Container>
      </div>
    );
  }

  if (isError) {
    return (
      <div className="flex-1 py-20">
        <Container>
          <Card className="max-w-md mx-auto p-10 text-center bg-white shadow-xs border-rose-200">
            <h2 className="text-2xl font-serif text-brand-fg mb-3">Order Not Found</h2>
            <p className="text-brand-muted text-sm mb-8">
              {(error as Error)?.message || "We couldn't find the order you're looking for. It may have been removed or you don't have permission to view it."}
            </p>
            <Link href="/orders" className="text-brand-primary font-medium hover:underline">
              Back to My Orders
            </Link>
          </Card>
        </Container>
      </div>
    );
  }

  if (!data || !data.order) return null;

  const { order, customer, restaurant, delivery } = data;
  const items = order.items || [];
  const isConfirmed = order.status.toUpperCase() !== "PAYMENT_PENDING" && order.status.toUpperCase() !== "PAYMENT_FAILED" && order.status.toUpperCase() !== "CREATED";

  return (
    <div className="flex-1 py-10 sm:py-16 bg-gray-50/50">
      <Container>
        <div className="mb-8">
          <Link href="/orders" className="text-sm font-medium text-brand-muted hover:text-brand-primary flex items-center gap-2 mb-4 transition-colors">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" /></svg>
            Back to Orders
          </Link>
          <div className="flex flex-col sm:flex-row sm:items-baseline gap-2 sm:gap-4">
            <h1 className="text-3xl sm:text-4xl font-serif font-semibold text-brand-fg tracking-tight">
              Order #{order.id}
            </h1>
            <span className="text-sm text-brand-muted font-medium">
              Placed on {new Date(order.createdAt).toLocaleString(undefined, {
                weekday: 'short', month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit'
              })}
            </span>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
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
                        Paid via Razorpay
                      </span>
                    ) : order.status.toUpperCase() === "CANCELLED" ? (
                      <span className="text-sm font-medium text-brand-muted flex items-center gap-1.5">
                        Cancelled
                      </span>
                    ) : (
                      <span className="text-sm font-medium text-amber-600 flex items-center gap-1.5">
                        Pending Payment
                      </span>
                    )}
                  </div>
                </div>
              </div>
            </Card>

            {order.status.toUpperCase() === "CONFIRMED" && (
              <DeliveryTracker delivery={delivery} />
            )}

            <Card className="p-6 bg-white shadow-xs">
              <div className="flex items-center justify-between pb-4 mb-4 border-b border-brand-border">
                <div>
                  <h2 className="font-serif text-xl font-medium text-brand-fg">Ordered Items</h2>
                  {restaurant && (
                    <p className="text-xs text-brand-muted mt-0.5">
                      From{" "}
                      <Link href={`/restaurants/${restaurant.id}`} className="font-medium text-brand-fg underline underline-offset-4 hover:text-brand-primary transition-colors">
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
                    <div key={item.id} className="py-3.5 flex items-center justify-between gap-4 first:pt-0 last:pb-0">
                      <div className="space-y-0.5 flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="font-medium text-brand-fg text-sm truncate">{item.name}</span>
                          <span className="text-xs font-semibold px-2 py-0.5 rounded bg-brand-bg text-brand-fg border border-brand-border shrink-0">× {item.quantity}</span>
                        </div>
                        <p className="text-xs text-brand-muted">₹{item.unitPrice.toFixed(2)} each</p>
                      </div>
                      <span className="font-serif font-semibold text-base text-brand-fg shrink-0">₹{item.subtotal.toFixed(2)}</span>
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
              <h2 className="font-serif text-xl font-medium text-brand-fg mb-4 pb-4 border-b border-brand-border">Customer Details</h2>
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
                </div>
              ) : (
                <p className="text-sm text-brand-muted">Customer details not available.</p>
              )}
            </Card>

            <Card className="p-6 sm:p-8 bg-white shadow-xs sticky top-24">
              <h2 className="font-serif text-xl font-medium text-brand-fg mb-4 pb-4 border-b border-brand-border">Order Summary</h2>
              <div className="space-y-3.5 text-sm">
                <div className="flex justify-between text-brand-muted">
                  <span>Items subtotal</span>
                  <span className="font-medium text-brand-fg">₹{order.totalAmount.toFixed(2)}</span>
                </div>
                <div className="pt-4 mt-4 border-t border-brand-border flex justify-between items-baseline">
                  <span className="font-serif text-lg font-medium text-brand-fg">Total</span>
                  <span className="font-serif text-3xl font-semibold text-brand-primary">₹{order.totalAmount.toFixed(2)}</span>
                </div>
              </div>
            </Card>
          </div>
        </div>
      </Container>
    </div>
  );
}
"""
with open("frontend/src/app/orders/[id]/page.tsx", "w") as f:
    f.write(content)
