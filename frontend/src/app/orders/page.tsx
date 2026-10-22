"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Container } from "@/components/Container";
import { getMyOrders, getRestaurantById } from "@/lib/api";
import { Order } from "@/types/order";
import { useAuth } from "@/context/AuthContext";
import { PackageSearch, Clock, ChevronRight, Store, ArrowLeft } from "lucide-react";

export default function OrdersPage() {
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();
  
  const [orders, setOrders] = useState<(Order & { restaurantName?: string })[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");

  const loadData = useCallback(async () => {
    if (authLoading) return;
    if (!user) {
      router.push("/login?redirect=/orders");
      return;
    }

    try {
      setIsLoading(true);
      const ordersData = await getMyOrders();
      
      const ordersWithRestaurants = await Promise.all(
        ordersData.map(async (order) => {
          try {
            const restaurant = await getRestaurantById(order.restaurantId);
            return {
              ...order,
              restaurantName: restaurant?.name || `Restaurant #${order.restaurantId}`
            };
          } catch {
            return { ...order, restaurantName: `Restaurant #${order.restaurantId}` };
          }
        })
      );
      
      const sortedOrders = ordersWithRestaurants.sort((a, b) => {
        return new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime();
      });
      
      setOrders(sortedOrders);
    } catch (err: unknown) {
      setError((err as Error).message || "Failed to load orders");
    } finally {
      setIsLoading(false);
    }
  }, [user, authLoading, router]);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    loadData();
  }, [loadData]);

  if (authLoading || isLoading) {
    return (
      <div className="min-h-screen bg-stone-50 pt-24 pb-20">
        <Container>
          <div className="animate-pulse space-y-6">
            <div className="h-10 w-48 bg-stone-200 rounded-lg" />
            {[...Array(4)].map((_, i) => (
              <div key={i} className="h-32 bg-stone-200 rounded-2xl" />
            ))}
          </div>
        </Container>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-stone-50 pt-24 pb-24">
      <Container className="max-w-4xl">
        <div className="mb-8 flex items-center gap-4">
          <button onClick={() => router.push('/profile')} className="w-10 h-10 bg-white border border-stone-200 rounded-full flex items-center justify-center text-stone-600 hover:text-stone-900 transition-colors shadow-sm">
            <ArrowLeft className="w-5 h-5" />
          </button>
          <h1 className="text-3xl font-extrabold text-stone-900">My Orders</h1>
        </div>

        {error ? (
          <div className="bg-red-50 text-red-700 p-6 rounded-2xl border border-red-100 font-medium">{error}</div>
        ) : orders.length === 0 ? (
          <div className="bg-white rounded-2xl p-16 text-center shadow-sm border border-stone-100 mt-12">
            <div className="w-24 h-24 bg-stone-50 rounded-full flex items-center justify-center mb-6 mx-auto">
              <PackageSearch className="w-12 h-12 text-stone-300" />
            </div>
            <h2 className="text-2xl font-bold text-stone-900 mb-2">No orders yet</h2>
            <p className="text-stone-500 mb-8 max-w-sm mx-auto">When you place an order, it will appear here so you can track it.</p>
            <Link href="/restaurants" className="inline-flex items-center justify-center bg-brand-primary text-white font-bold px-8 py-3 rounded-xl hover:bg-brand-primary/90 transition-colors">
              Find Food
            </Link>
          </div>
        ) : (
          <div className="space-y-4">
            {orders.map((order) => {
              const isDelivered = order.status === 'DELIVERED';
              const isCancelled = order.status === 'CANCELLED';
              const isActive = !isDelivered && !isCancelled;
              
              return (
                <Link key={order.id} href={`/orders/${order.id}`} className="block bg-white rounded-2xl p-5 border border-stone-100 shadow-sm hover:shadow-md transition-shadow group">
                  <div className="flex items-center justify-between gap-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <Store className="w-5 h-5 text-stone-400" />
                        <h3 className="font-bold text-stone-900 text-lg">{order.restaurantName}</h3>
                      </div>
                      <div className="flex items-center gap-4 text-sm font-medium">
                        <span className="text-stone-500">Order #{order.id}</span>
                        <span className="text-stone-300">•</span>
                        <span className="text-stone-500">₹{order.totalAmount.toFixed(2)}</span>
                        <span className="text-stone-300">•</span>
                        <span className="text-stone-500 flex items-center gap-1">
                          <Clock className="w-4 h-4" /> 
                          {order.createdAt ? new Date(order.createdAt).toLocaleDateString() : 'Recent'}
                        </span>
                      </div>
                    </div>
                    
                    <div className="flex flex-col items-end gap-3">
                      <div className={`px-3 py-1 rounded-full text-xs font-bold ${
                        isActive ? 'bg-amber-100 text-amber-700' :
                        isDelivered ? 'bg-green-100 text-green-700' :
                        'bg-red-100 text-red-700'
                      }`}>
                        {order.status.replace(/_/g, ' ')}
                      </div>
                      <div className="w-8 h-8 rounded-full bg-stone-50 flex items-center justify-center group-hover:bg-brand-primary/10 transition-colors">
                        <ChevronRight className="w-4 h-4 text-stone-400 group-hover:text-brand-primary" />
                      </div>
                    </div>
                  </div>
                </Link>
              );
            })}
          </div>
        )}
      </Container>
    </div>
  );
}
