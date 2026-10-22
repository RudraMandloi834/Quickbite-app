"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useSSE } from "@/hooks/useSSE";
import { authFetch, getApiBaseUrl } from "@/lib/api";
import { Package, MapPin, CheckCircle2, Navigation, Clock, User, Phone, Check } from "lucide-react";

export default function DriverDashboardPage() {
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();
  const queryClient = useQueryClient();

  const token = typeof window !== "undefined" ? localStorage.getItem("token") : null;
  const { connectionStatus } = useSSE(token, (event: any) => {
    queryClient.invalidateQueries({ queryKey: ["driverDeliveries"] });
  });

  const { data: availableDeliveries = [], isLoading: availableLoading } = useQuery({
    queryKey: ["driverDeliveries", "available"],
    queryFn: async () => {
      const res = await authFetch(`${getApiBaseUrl()}/api/deliveries/available`);
      if (!res.ok) throw new Error("Failed to fetch");
      return res.json();
    },
    enabled: !!user,
    refetchInterval: 4000,
  });

  const { data: myDeliveries = [], isLoading: myLoading } = useQuery({
    queryKey: ["driverDeliveries", "mine"],
    queryFn: async () => {
      const res = await authFetch(`${getApiBaseUrl()}/api/deliveries/driver/me`);
      if (!res.ok) throw new Error("Failed to fetch");
      return res.json();
    },
    enabled: !!user,
    refetchInterval: 4000,
  });

  const assignMutation = useMutation({
    mutationFn: async (deliveryId: number) => {
      const res = await authFetch(`${getApiBaseUrl()}/api/deliveries/${deliveryId}/assign`, { method: "POST" });
      if (!res.ok) throw new Error("Failed to assign");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["driverDeliveries"] });
    }
  });

  const updateStatusMutation = useMutation({
    mutationFn: async ({ deliveryId, status }: { deliveryId: number, status: string }) => {
      const res = await authFetch(`${getApiBaseUrl()}/api/deliveries/${deliveryId}/status`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status })
      });
      if (!res.ok) throw new Error("Failed to update");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["driverDeliveries"] });
    }
  });

  if (authLoading) return <div className="p-20 text-center text-stone-500 font-medium">Loading Dashboard...</div>;
  if (!user || !user.roles?.includes("DRIVER")) {
    return <div className="p-20 text-center text-red-500 font-bold">Access Denied. You must be an approved driver.</div>;
  }

  // Derived states
  const activeStatuses = ['ASSIGNED', 'PICKED_UP', 'OUT_FOR_DELIVERY'];
  const activeDelivery = myDeliveries.find((d: any) => activeStatuses.includes(d.status));
  
  const todayStart = new Date();
  todayStart.setHours(0, 0, 0, 0);
  const completedToday = myDeliveries.filter((d: any) => d.status === 'DELIVERED' && new Date(d.updatedAt) >= todayStart)
                                     .sort((a: any, b: any) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime());

  return (
    <div className="min-h-screen bg-stone-50 pt-8 pb-24">
      <div className="max-w-4xl mx-auto px-6">
        
        {/* Header */}
        <div className="mb-10 flex flex-col md:flex-row md:items-end justify-between gap-4">
          <div>
            <h1 className="text-4xl font-black text-stone-900 tracking-tight">Today</h1>
            <p className="text-stone-500 mt-2 text-lg">Manage your active and available deliveries.</p>
          </div>
          <div className="flex items-center gap-2">
            <span className={`w-3 h-3 rounded-full ${connectionStatus === 'connected' ? 'bg-green-500' : 'bg-red-500'}`}></span>
            <span className="text-xs font-bold text-stone-500 uppercase tracking-wider">{connectionStatus === 'connected' ? 'Live Updates Active' : 'Connecting...'}</span>
          </div>
        </div>

        {/* Error Banner */}
        {(assignMutation.isError || updateStatusMutation.isError) && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 text-red-700 text-sm font-semibold rounded-2xl flex items-center justify-between">
            <span>Action failed: {((assignMutation.error || updateStatusMutation.error) as any)?.message || "An error occurred"}</span>
            <button onClick={() => { assignMutation.reset(); updateStatusMutation.reset(); }} className="text-red-500 hover:text-red-700 font-bold ml-4">✕</button>
          </div>
        )}

        {/* 1. AVAILABLE DELIVERIES */}
        {!activeDelivery && (
          <div className="mb-12">
            <h2 className="text-xl font-bold text-stone-900 mb-6 flex items-center gap-2">
              <span className="w-8 h-8 rounded-full bg-blue-100 text-blue-700 flex items-center justify-center">1</span>
              Available Deliveries
            </h2>
            
            {availableLoading ? (
              <div className="p-8 text-center text-stone-500 bg-white rounded-3xl border border-stone-200">Loading available orders...</div>
            ) : availableDeliveries.length === 0 ? (
              <div className="p-8 text-center text-stone-500 bg-white rounded-3xl border border-stone-200 border-dashed">
                <Package className="w-8 h-8 mx-auto mb-3 text-stone-300" />
                No available deliveries right now. Waiting for new orders...
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {availableDeliveries.map((delivery: any) => (
                  <div key={delivery.id} className="bg-white p-6 rounded-3xl border border-stone-200 shadow-sm flex flex-col">
                    <div className="flex justify-between items-start mb-4">
                      <div>
                        <p className="text-xs font-bold text-stone-400 uppercase tracking-wider mb-1">Order #{delivery.orderId}</p>
                        <h3 className="font-bold text-stone-900">{delivery.restaurantName || "Restaurant"}</h3>
                        <p className="text-sm text-stone-500 line-clamp-1">{delivery.restaurantAddress || "Address not provided"}</p>
                      </div>
                      <div className="text-right">
                        <span className="inline-block px-2 py-1 bg-green-100 text-green-700 text-xs font-bold rounded-lg uppercase tracking-wide">
                          Ready
                        </span>
                      </div>
                    </div>
                    
                    <div className="bg-stone-50 p-4 rounded-2xl mb-6">
                      <div className="flex items-center gap-2 mb-2 text-sm text-stone-700">
                        <MapPin className="w-4 h-4 text-brand-primary" />
                        <span className="font-medium truncate">{delivery.customerAddress || "Delivery Area"}</span>
                      </div>
                      <div className="flex justify-between text-sm mt-3 pt-3 border-t border-stone-200">
                        <span className="text-stone-500">Value</span>
                        <span className="font-bold text-stone-900">₹{delivery.orderTotal?.toFixed(2)}</span>
                      </div>
                    </div>
                    
                    <button
                      disabled={assignMutation.isPending}
                      onClick={() => assignMutation.mutate(delivery.id)}
                      className="mt-auto w-full py-3.5 bg-brand-primary text-white font-bold rounded-xl hover:bg-brand-primary/90 transition-all flex items-center justify-center gap-2 disabled:opacity-50"
                    >
                      <Navigation className="w-5 h-5" /> 
                      {assignMutation.isPending && (assignMutation.variables as any) === delivery.id ? "Accepting..." : "Accept Delivery"}
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* 2. ACTIVE DELIVERY */}
        <div className="mb-12">
          <h2 className="text-xl font-bold text-stone-900 mb-6 flex items-center gap-2">
            <span className="w-8 h-8 rounded-full bg-amber-100 text-amber-700 flex items-center justify-center">2</span>
            My Active Delivery
          </h2>
          
          {myLoading ? (
            <div className="p-8 text-center text-stone-500 bg-white rounded-3xl border border-stone-200">Loading...</div>
          ) : !activeDelivery ? (
            <div className="p-8 text-center text-stone-400 font-medium bg-white rounded-3xl border border-stone-200 shadow-sm border-dashed">
              You do not have an active delivery.
            </div>
          ) : (
            <div className="bg-white rounded-3xl border-2 border-brand-primary/20 shadow-md overflow-hidden relative">
              <div className="absolute top-0 left-0 w-1 h-full bg-brand-primary"></div>
              
              <div className="p-6 md:p-8">
                <div className="flex flex-col md:flex-row justify-between items-start gap-4 mb-8">
                  <div>
                    <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-amber-100 text-amber-800 text-xs font-bold rounded-full uppercase tracking-wide mb-3">
                      <div className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse"></div>
                      {activeDelivery.status.replace(/_/g, ' ')}
                    </span>
                    <h3 className="text-2xl font-black text-stone-900">Order #{activeDelivery.orderId}</h3>
                  </div>
                  <div className="text-right bg-stone-50 p-4 rounded-2xl w-full md:w-auto">
                    <p className="text-xs font-bold text-stone-400 uppercase tracking-wider mb-1">Items & Total</p>
                    <p className="font-medium text-stone-900">{activeDelivery.orderItemsSummary}</p>
                    <p className="text-xl font-black text-stone-900 mt-1">₹{activeDelivery.orderTotal?.toFixed(2)}</p>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-8">
                  {/* Pickup */}
                  <div className="relative">
                    <div className="absolute left-3.5 top-8 bottom-0 w-0.5 bg-stone-200"></div>
                    <div className="flex gap-4 relative z-10">
                      <div className="w-7 h-7 bg-white border-2 border-brand-primary rounded-full flex items-center justify-center flex-shrink-0 mt-1">
                        <div className="w-2.5 h-2.5 bg-brand-primary rounded-full"></div>
                      </div>
                      <div>
                        <p className="text-xs font-bold text-stone-400 uppercase tracking-wider mb-1">Pickup From</p>
                        <p className="font-bold text-stone-900 text-lg">{activeDelivery.restaurantName}</p>
                        <p className="text-sm text-stone-600 mt-1">{activeDelivery.restaurantAddress}</p>
                      </div>
                    </div>
                  </div>

                  {/* Dropoff */}
                  <div className="flex gap-4">
                    <div className="w-7 h-7 bg-white border-2 border-stone-300 rounded-full flex items-center justify-center flex-shrink-0 mt-1">
                      <MapPin className="w-3.5 h-3.5 text-stone-400" />
                    </div>
                    <div>
                      <p className="text-xs font-bold text-stone-400 uppercase tracking-wider mb-1">Deliver To</p>
                      <p className="font-bold text-stone-900 text-lg flex items-center gap-2">
                        {activeDelivery.customerName}
                      </p>
                      <p className="text-sm text-stone-600 mt-1">{activeDelivery.customerAddress}</p>
                      {activeDelivery.customerPhone && (
                        <p className="text-sm font-medium text-brand-primary mt-2 flex items-center gap-1.5 bg-brand-primary/10 w-fit px-2 py-1 rounded-lg">
                          <Phone className="w-3.5 h-3.5" /> {activeDelivery.customerPhone}
                        </p>
                      )}
                    </div>
                  </div>
                </div>

                {/* Actions */}
                <div className="pt-6 border-t border-stone-100 flex flex-col sm:flex-row gap-3">
                  {activeDelivery.status === 'ASSIGNED' && (
                    <button
                      disabled={updateStatusMutation.isPending}
                      onClick={() => updateStatusMutation.mutate({ deliveryId: activeDelivery.id, status: 'PICKED_UP' })}
                      className="w-full py-4 bg-brand-primary text-white font-bold rounded-xl hover:bg-brand-primary/90 transition-transform hover:-translate-y-0.5 text-lg flex items-center justify-center gap-2 disabled:opacity-50"
                    >
                      <Package className="w-5 h-5"/> 
                      {updateStatusMutation.isPending && (updateStatusMutation.variables as any)?.status === 'PICKED_UP' ? 'Updating...' : 'Mark Picked Up'}
                    </button>
                  )}
                  {activeDelivery.status === 'PICKED_UP' && (
                    <button
                      disabled={updateStatusMutation.isPending}
                      onClick={() => updateStatusMutation.mutate({ deliveryId: activeDelivery.id, status: 'OUT_FOR_DELIVERY' })}
                      className="w-full py-4 bg-amber-500 text-white font-bold rounded-xl hover:bg-amber-600 transition-transform hover:-translate-y-0.5 text-lg flex items-center justify-center gap-2 disabled:opacity-50"
                    >
                      <Navigation className="w-5 h-5"/> 
                      {updateStatusMutation.isPending && (updateStatusMutation.variables as any)?.status === 'OUT_FOR_DELIVERY' ? 'Updating...' : 'Start Delivery Route'}
                    </button>
                  )}
                  {activeDelivery.status === 'OUT_FOR_DELIVERY' && (
                    <button
                      disabled={updateStatusMutation.isPending}
                      onClick={() => updateStatusMutation.mutate({ deliveryId: activeDelivery.id, status: 'DELIVERED' })}
                      className="w-full py-4 bg-green-500 text-white font-bold rounded-xl hover:bg-green-600 transition-transform hover:-translate-y-0.5 text-lg flex items-center justify-center gap-2 disabled:opacity-50"
                    >
                      <CheckCircle2 className="w-5 h-5"/> 
                      {updateStatusMutation.isPending && (updateStatusMutation.variables as any)?.status === 'DELIVERED' ? 'Updating...' : 'Mark Delivered'}
                    </button>
                  )}
                </div>

              </div>
            </div>
          )}
        </div>

        {/* 3. COMPLETED TODAY */}
        <div>
          <h2 className="text-xl font-bold text-stone-900 mb-6 flex items-center gap-2">
            <span className="w-8 h-8 rounded-full bg-green-100 text-green-700 flex items-center justify-center">3</span>
            Completed Today
          </h2>
          
          {myLoading ? (
            <div className="p-8 text-center text-stone-500 bg-white rounded-3xl border border-stone-200">Loading...</div>
          ) : completedToday.length === 0 ? (
            <div className="p-8 text-center text-stone-400 font-medium bg-white rounded-3xl border border-stone-200 shadow-sm border-dashed">
              You haven't completed any deliveries today.
            </div>
          ) : (
            <div className="bg-white rounded-3xl border border-stone-200 shadow-sm overflow-hidden">
              <div className="divide-y divide-stone-100">
                {completedToday.map((delivery: any) => (
                  <div key={delivery.id} className="p-4 sm:p-6 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 hover:bg-stone-50 transition-colors">
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 bg-green-50 rounded-full flex items-center justify-center flex-shrink-0">
                        <Check className="w-6 h-6 text-green-600" />
                      </div>
                      <div>
                        <p className="font-bold text-stone-900">Order #{delivery.orderId}</p>
                        <p className="text-sm text-stone-500 mt-0.5">
                          {delivery.restaurantName} → {delivery.customerAddress || "Customer"}
                        </p>
                      </div>
                    </div>
                    <div className="text-right sm:w-auto w-full flex justify-between sm:block">
                      <span className="inline-block px-2.5 py-1 bg-green-100 text-green-800 text-xs font-bold rounded-lg mb-1 uppercase tracking-wide">
                        Delivered
                      </span>
                      <p className="text-xs font-bold text-stone-400 flex items-center gap-1">
                        <Clock className="w-3 h-3" /> {new Date(delivery.updatedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

      </div>
    </div>
  );
}
