"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { Restaurant } from "@/types/restaurant";
import { authFetch, getApiBaseUrl } from "@/lib/api";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useSSE } from "@/hooks/useSSE";
import { Clock, CheckCircle2, ChefHat, Check, ShoppingBag, MapPin, XCircle, User } from "lucide-react";

export default function RestaurantDashboard() {
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();
  const queryClient = useQueryClient();

  const [restaurantsList, setRestaurantsList] = useState<Restaurant[]>([]);
  const [restaurant, setRestaurant] = useState<Restaurant | null>(null);

  useEffect(() => {
    if (user) {
      authFetch(`${getApiBaseUrl()}/api/restaurants/my-applications`)
        .then(res => res.json())
        .then((data: Restaurant[]) => {
          if (Array.isArray(data)) {
            const approved = data.filter(r => r.status === 'APPROVED');
            setRestaurantsList(approved);
            if (approved.length > 0 && !restaurant) {
              setRestaurant(approved[0]);
            }
          }
        });
    }
  }, [user]);

  const token = typeof window !== "undefined" ? localStorage.getItem("token") : null;
  const { connectionStatus } = useSSE(token, (event: any) => {
    if (!event.restaurantId || (restaurant && String(event.restaurantId) === String(restaurant.id))) {
      queryClient.invalidateQueries({ queryKey: ['restaurantOrders'] });
    } else if (event.restaurantId && event.type === 'ORDER_CREATED') {
      authFetch(`${getApiBaseUrl()}/api/restaurants/${event.restaurantId}`)
        .then(res => res.json())
        .then(r => {
          if (r && r.id) {
            setRestaurant(r);
            setRestaurantsList(prev => {
              if (prev.some(p => p.id === r.id)) return prev;
              return [r, ...prev];
            });
            queryClient.invalidateQueries({ queryKey: ['restaurantOrders'] });
          }
        });
    }
  });

  const { data: orders = [], isLoading: ordersLoading } = useQuery({
    queryKey: ['restaurantOrders', restaurant?.id],
    queryFn: async () => {
      const res = await authFetch(`${getApiBaseUrl()}/api/restaurants/${restaurant!.id}/orders`);
      if (!res.ok) throw new Error("Failed to fetch orders");
      return res.json();
    },
    enabled: !!restaurant,
    refetchInterval: 4000,
  });

  const updateStatusMutation = useMutation({
    mutationFn: async ({ orderId, status }: { orderId: number, status: string }) => {
      const res = await authFetch(`${getApiBaseUrl()}/api/restaurants/${restaurant!.id}/orders/${orderId}/status`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status })
      });
      if (!res.ok) throw new Error("Failed to update status");
      return res.json();
    },
    onSuccess: (updatedOrder: any) => {
      if (updatedOrder && updatedOrder.id) {
        queryClient.setQueryData(['restaurantOrders', restaurant?.id], (old: any[] = []) => 
          old.map((o: any) => o.id === updatedOrder.id ? { ...o, ...updatedOrder } : o)
        );
      }
      queryClient.invalidateQueries({ queryKey: ['restaurantOrders', restaurant?.id] });
    }
  });

  if (authLoading || (!restaurant && user)) return <div className="p-20 text-center text-stone-500 font-medium">Loading Dashboard...</div>;
  if (!user || !user.roles?.includes("RESTAURANT_PARTNER")) {
    return <div className="p-20 text-center text-red-500 font-bold">Access Denied.</div>;
  }
  if (!restaurant) {
    return <div className="p-20 text-center text-stone-500 font-medium">No approved restaurant found.</div>;
  }

  const newOrders = orders.filter((o: any) => o.status === 'PLACED');
  const preparingOrders = orders.filter((o: any) => o.status === 'ACCEPTED' || o.status === 'PREPARING');
  const readyOrders = orders.filter((o: any) => o.status === 'READY_FOR_PICKUP' || o.status === 'DRIVER_ASSIGNED' || o.status === 'PICKED_UP' || o.status === 'OUT_FOR_DELIVERY');
  const completedOrders = orders.filter((o: any) => o.status === 'DELIVERED');

  const activeOrders = [...newOrders, ...preparingOrders, ...readyOrders].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

  return (
    <div className="min-h-screen bg-stone-50 pt-8 pb-20">
      <div className="max-w-7xl mx-auto px-6">
        
        {/* Header */}
        <div className="mb-10 flex flex-col md:flex-row md:items-end justify-between gap-4">
          <div>
            <div className="flex items-center gap-3 flex-wrap">
              <h1 className="text-4xl font-black text-stone-900 tracking-tight">{restaurant.name}</h1>
              {restaurantsList.length > 1 && (
                <select 
                  value={restaurant.id} 
                  onChange={(e) => {
                    const selected = restaurantsList.find(r => r.id === Number(e.target.value));
                    if (selected) setRestaurant(selected);
                  }}
                  className="bg-white border border-stone-200 text-stone-700 text-sm font-semibold rounded-xl px-3 py-1.5 focus:outline-none focus:ring-2 focus:ring-brand-primary cursor-pointer shadow-sm"
                >
                  {restaurantsList.map(r => (
                    <option key={r.id} value={r.id}>{r.name}</option>
                  ))}
                </select>
              )}
            </div>
            <p className="text-stone-500 mt-2 text-lg">Manage your orders and kitchen flow.</p>
          </div>
          <div className="flex items-center gap-2">
            <span className={`w-3 h-3 rounded-full ${connectionStatus === 'connected' ? 'bg-green-500' : 'bg-red-500'}`}></span>
            <span className="text-xs font-bold text-stone-500 uppercase tracking-wider">{connectionStatus === 'connected' ? 'Live Updates Active' : 'Connecting...'}</span>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-10">
          <div className="bg-white p-6 rounded-3xl shadow-sm border border-stone-200">
            <p className="text-stone-500 text-sm font-bold uppercase tracking-wider flex items-center gap-2 mb-2"><ShoppingBag className="w-4 h-4"/> New Orders</p>
            <p className="text-4xl font-black text-blue-600">{newOrders.length}</p>
          </div>
          <div className="bg-white p-6 rounded-3xl shadow-sm border border-stone-200">
            <p className="text-stone-500 text-sm font-bold uppercase tracking-wider flex items-center gap-2 mb-2"><ChefHat className="w-4 h-4"/> Preparing</p>
            <p className="text-4xl font-black text-amber-500">{preparingOrders.length}</p>
          </div>
          <div className="bg-white p-6 rounded-3xl shadow-sm border border-stone-200">
            <p className="text-stone-500 text-sm font-bold uppercase tracking-wider flex items-center gap-2 mb-2"><CheckCircle2 className="w-4 h-4"/> Ready / En Route</p>
            <p className="text-4xl font-black text-green-500">{readyOrders.length}</p>
          </div>
          <div className="bg-white p-6 rounded-3xl shadow-sm border border-stone-200">
            <p className="text-stone-500 text-sm font-bold uppercase tracking-wider flex items-center gap-2 mb-2"><Check className="w-4 h-4"/> Completed</p>
            <p className="text-4xl font-black text-stone-900">{completedOrders.length}</p>
          </div>
        </div>

        {/* Error Banner */}
        {updateStatusMutation.isError && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 text-red-700 text-sm font-semibold rounded-2xl flex items-center justify-between">
            <span>Failed to update order: {(updateStatusMutation.error as any)?.message || "An error occurred"}</span>
            <button onClick={() => updateStatusMutation.reset()} className="text-red-500 hover:text-red-700 font-bold ml-4">✕</button>
          </div>
        )}

        {/* Main Section */}
        <h2 className="text-2xl font-black text-stone-900 mb-6 flex items-center gap-3">
          <div className="w-8 h-8 rounded-full bg-stone-200 flex items-center justify-center text-stone-700">⚡</div>
          NEW ORDERS
        </h2>

        {ordersLoading ? (
          <div className="p-12 text-center text-stone-500 font-medium bg-white rounded-3xl border border-stone-200">Loading Orders...</div>
        ) : activeOrders.length === 0 ? (
          <div className="p-16 text-center text-stone-500 font-medium bg-white rounded-3xl border border-stone-200 shadow-sm flex flex-col items-center">
            <div className="w-20 h-20 bg-stone-50 rounded-full flex items-center justify-center mb-4">
              <ShoppingBag className="w-10 h-10 text-stone-300" />
            </div>
            <p className="text-lg">No active orders right now.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {activeOrders.map((order: any) => (
              <div key={order.id} className="bg-white rounded-3xl border border-stone-200 shadow-sm overflow-hidden flex flex-col">
                <div className="p-6 border-b border-stone-100 bg-stone-50/50 flex justify-between items-start">
                  <div>
                    <h3 className="text-xl font-black text-stone-900">Order #{order.id}</h3>
                    <p className="text-sm text-stone-500 font-medium mt-1 flex items-center gap-1.5">
                      <Clock className="w-3.5 h-3.5" /> 
                      {new Date(order.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </p>
                  </div>
                  <div className="text-right">
                    <span className={`inline-block px-3 py-1 rounded-full text-xs font-bold ${
                      order.status === 'PLACED' ? 'bg-blue-100 text-blue-700' :
                      ['ACCEPTED', 'PREPARING'].includes(order.status) ? 'bg-amber-100 text-amber-700' :
                      ['READY_FOR_PICKUP', 'DRIVER_ASSIGNED', 'PICKED_UP', 'OUT_FOR_DELIVERY'].includes(order.status) ? 'bg-green-100 text-green-700' :
                      'bg-stone-100 text-stone-700'
                    }`}>
                      {order.status.replace(/_/g, ' ')}
                    </span>
                    <p className="text-xs text-stone-400 font-bold uppercase mt-2">Method: {order.paymentMethod || 'CARD'}</p>
                    <p className={`text-xs font-bold uppercase mt-1 ${order.paymentStatus === 'SUCCESS' ? 'text-green-600' : 'text-amber-600'}`}>
                      Payment: {order.paymentStatus || 'PENDING'}
                    </p>
                  </div>
                </div>

                <div className="p-6 flex-1 flex flex-col md:flex-row gap-6">
                  
                  {/* Customer Info */}
                  <div className="flex-1 space-y-4">
                    <div>
                      <h4 className="text-xs font-bold text-stone-400 uppercase tracking-wider mb-2 flex items-center gap-1.5"><User className="w-3.5 h-3.5"/> Customer</h4>
                      <p className="font-bold text-stone-900">{order.customerName || 'Customer'}</p>
                      {order.customerPhone && <p className="text-sm text-stone-500">{order.customerPhone}</p>}
                    </div>
                    <div>
                      <h4 className="text-xs font-bold text-stone-400 uppercase tracking-wider mb-2 flex items-center gap-1.5"><MapPin className="w-3.5 h-3.5"/> Delivery Address</h4>
                      <p className="text-sm text-stone-700 leading-relaxed bg-stone-100 p-3 rounded-xl">{order.deliveryAddress || 'Address not provided'}</p>
                    </div>
                    
                    {/* Driver Status if visible */}
                    {['READY_FOR_PICKUP', 'DRIVER_ASSIGNED', 'PICKED_UP', 'OUT_FOR_DELIVERY', 'DELIVERED'].includes(order.status) && (
                      <div className="bg-blue-50 text-blue-800 p-3 rounded-xl border border-blue-100 text-sm font-medium mt-4">
                        {order.status === 'READY_FOR_PICKUP' ? (
                          <div className="flex items-center gap-2">
                            <div className="w-2 h-2 rounded-full bg-blue-400 animate-pulse"></div>
                            Waiting for delivery partner
                          </div>
                        ) : (
                          <div>
                            <div className="font-bold text-blue-900 mb-1">Driver Assigned</div>
                            <div className="flex justify-between items-center text-blue-800">
                              <span>{order.driverName || 'Driver'}</span>
                              <span className="text-xs uppercase tracking-wider font-bold bg-blue-200/50 px-2 py-0.5 rounded">{order.status.replace(/_/g, ' ')}</span>
                            </div>
                            {order.driverPhone && <div className="mt-1 text-xs text-blue-700">{order.driverPhone}</div>}
                          </div>
                        )}
                      </div>
                    )}
                  </div>

                  {/* Order Items */}
                  <div className="flex-1 bg-stone-50 p-5 rounded-2xl border border-stone-100">
                    <h4 className="text-xs font-bold text-stone-400 uppercase tracking-wider mb-3">Order Items</h4>
                    <ul className="space-y-3 mb-4">
                      {order.items?.map((item: any) => (
                        <li key={item.id} className="flex justify-between text-sm">
                          <span className="font-medium text-stone-800"><span className="text-stone-400 font-bold">{item.quantity}x</span> {item.menuItemName}</span>
                          <span className="text-stone-600">₹{item.subtotal?.toFixed(2)}</span>
                        </li>
                      ))}
                    </ul>
                    <div className="border-t border-stone-200 pt-3 space-y-1 text-sm">
                      <div className="flex justify-between text-stone-500">
                        <span>Subtotal</span>
                        <span>₹{order.totalAmount?.toFixed(2)}</span>
                      </div>
                      <div className="flex justify-between text-stone-500">
                        <span>Delivery Fee</span>
                        <span>₹40.00</span>
                      </div>
                      <div className="flex justify-between font-black text-stone-900 text-base mt-2">
                        <span>Total</span>
                        <span>₹{(order.totalAmount + 40).toFixed(2)}</span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Actions */}
                <div className="p-4 bg-stone-100 border-t border-stone-200 flex flex-wrap gap-2">
                  {order.status === 'PLACED' && (
                    <>
                      <button 
                        disabled={updateStatusMutation.isPending}
                        onClick={() => updateStatusMutation.mutate({ orderId: order.id, status: 'ACCEPTED' })}
                        className="flex-1 py-3 bg-brand-primary text-white font-bold rounded-xl hover:bg-brand-primary/90 transition-all flex items-center justify-center gap-2 shadow-sm disabled:opacity-50"
                      >
                        <CheckCircle2 className="w-5 h-5"/> 
                        {updateStatusMutation.isPending && (updateStatusMutation.variables as any)?.orderId === order.id && (updateStatusMutation.variables as any)?.status === 'ACCEPTED' ? 'Accepting...' : 'Accept Order'}
                      </button>
                      <button 
                        disabled={updateStatusMutation.isPending}
                        onClick={() => updateStatusMutation.mutate({ orderId: order.id, status: 'REJECTED' })}
                        className="py-3 px-6 bg-white border border-red-200 text-red-600 font-bold rounded-xl hover:bg-red-50 transition-colors flex items-center justify-center gap-2 disabled:opacity-50"
                      >
                        <XCircle className="w-5 h-5"/> 
                        {updateStatusMutation.isPending && (updateStatusMutation.variables as any)?.orderId === order.id && (updateStatusMutation.variables as any)?.status === 'REJECTED' ? 'Rejecting...' : 'Reject'}
                      </button>
                    </>
                  )}
                  {order.status === 'ACCEPTED' && (
                    <button 
                      disabled={updateStatusMutation.isPending}
                      onClick={() => updateStatusMutation.mutate({ orderId: order.id, status: 'PREPARING' })}
                      className="w-full py-3 bg-amber-500 text-white font-bold rounded-xl hover:bg-amber-600 transition-all flex items-center justify-center gap-2 shadow-sm disabled:opacity-50"
                    >
                      <ChefHat className="w-5 h-5"/> 
                      {updateStatusMutation.isPending && (updateStatusMutation.variables as any)?.orderId === order.id && (updateStatusMutation.variables as any)?.status === 'PREPARING' ? 'Updating...' : 'Start Preparing'}
                    </button>
                  )}
                  {order.status === 'PREPARING' && (
                    <button 
                      disabled={updateStatusMutation.isPending}
                      onClick={() => updateStatusMutation.mutate({ orderId: order.id, status: 'READY_FOR_PICKUP' })}
                      className="w-full py-3 bg-green-500 text-white font-bold rounded-xl hover:bg-green-600 transition-all flex items-center justify-center gap-2 shadow-sm disabled:opacity-50"
                    >
                      <CheckCircle2 className="w-5 h-5"/> 
                      {updateStatusMutation.isPending && (updateStatusMutation.variables as any)?.orderId === order.id && (updateStatusMutation.variables as any)?.status === 'READY_FOR_PICKUP' ? 'Updating...' : 'Mark Ready for Pickup'}
                    </button>
                  )}
                </div>

              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
