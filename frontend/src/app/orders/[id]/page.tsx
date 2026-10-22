"use client";

import { useEffect, useState, useCallback, useMemo } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { getApiBaseUrl, authFetch } from "@/lib/api";
import { useAuth } from "@/context/AuthContext";
import { useSSE } from "@/hooks/useSSE";
import { ArrowLeft, CheckCircle2, Clock, ChefHat, Bike, PackageCheck, AlertCircle, Phone, MapPin, Store, Receipt, Navigation, User } from "lucide-react";

export default function OrderTrackingPage() {
  const router = useRouter();
  const { id } = useParams();
  const { user, loading: authLoading } = useAuth();
  
  const [order, setOrder] = useState<any>(null);
  const [restaurant, setRestaurant] = useState<any>(null);
  const [delivery, setDelivery] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");

  const token = typeof window !== "undefined" ? localStorage.getItem("token") : null;
  const { connectionStatus } = useSSE(token, (event: any) => {
    if (!event.orderId || String(event.orderId) === String(id)) {
      loadData();
    }
  });

  const loadData = useCallback(async () => {
    if (!id || authLoading) return;
    if (!user) {
      router.push(`/login?redirect=/orders/${id}`);
      return;
    }

    try {
      // 1. Fetch Order
      const orderRes = await authFetch(`${getApiBaseUrl()}/api/orders/${id}`);
      if (!orderRes.ok) throw new Error("Failed to fetch order");
      const orderData = await orderRes.json();
      setOrder(orderData);
      
      // 2. Fetch Restaurant
      if (orderData.restaurantId) {
        try {
          const restRes = await fetch(`${getApiBaseUrl()}/api/restaurants/${orderData.restaurantId}`);
          if (restRes.ok) {
            setRestaurant(await restRes.json());
          }
        } catch (e) {
          console.error("Failed to load restaurant details");
        }
      }
      
      // 3. Fetch Delivery Info
      try {
        const delRes = await authFetch(`${getApiBaseUrl()}/api/deliveries/order/${id}`);
        if (delRes.ok) {
          setDelivery(await delRes.json());
        } else {
          setDelivery(null); // Clear previous if needed
        }
      } catch (e) {
        // Ignored, might not be created yet
      }
    } catch (err: any) {
      setError(err.message || "Failed to load order tracking");
    } finally {
      setIsLoading(false);
    }
  }, [id, user, authLoading, router]);

  useEffect(() => {
    loadData();
    const interval = setInterval(loadData, 5000);
    return () => clearInterval(interval);
  }, [loadData]);

  if (authLoading || isLoading) {
    return <div className="min-h-screen bg-stone-50 flex items-center justify-center font-medium text-stone-500">Loading Order Tracking...</div>;
  }

  if (error || !order) {
    return (
      <div className="min-h-screen bg-stone-50 flex flex-col items-center justify-center p-6">
        <AlertCircle className="w-12 h-12 text-red-500 mb-4" />
        <h2 className="text-xl font-bold text-stone-900 mb-2">Order Not Found</h2>
        <p className="text-stone-500 mb-6">{error || "We couldn't find this order."}</p>
        <Link href="/orders" className="text-brand-primary font-bold hover:underline">View All Orders</Link>
      </div>
    );
  }

  const timelineSteps = [
    { key: "PLACED", label: "Order Placed", icon: Clock, message: "We've received your order." },
    { key: "ACCEPTED", label: "Restaurant Accepted", icon: CheckCircle2, message: "The restaurant has accepted your order." },
    { key: "PREPARING", label: "Preparing", icon: ChefHat, message: "Your restaurant is preparing your food." },
    { key: "READY_FOR_PICKUP", label: "Ready for Pickup", icon: PackageCheck, message: "Your order is packed and waiting for driver." },
    { key: "DRIVER_ASSIGNED", label: "Delivery Partner Assigned", icon: User, message: "Delivery partner has been assigned." },
    { key: "PICKED_UP", label: "Picked Up", icon: Bike, message: "Driver has picked up your order." },
    { key: "OUT_FOR_DELIVERY", label: "On The Way", icon: Navigation, message: "Your food is on the way." },
    { key: "DELIVERED", label: "Delivered", icon: MapPin, message: "Order delivered." }
  ];

  const currentStatusIndex = timelineSteps.findIndex(s => s.key === order.status);
  const isCancelled = order.status === "CANCELLED";
  const isRejected = order.status === "REJECTED";
  const isFailed = isCancelled || isRejected;

  const currentStepInfo = isFailed 
    ? { message: isCancelled ? "You cancelled this order." : "The restaurant could not fulfill your order.", icon: AlertCircle }
    : timelineSteps[Math.max(0, currentStatusIndex)];

  const CurrentIcon = currentStepInfo.icon;

  return (
    <div className="min-h-screen bg-stone-50 pb-24">
      {/* Top Navigation */}
      <div className="bg-white border-b border-stone-200 sticky top-0 z-30">
        <div className="max-w-3xl mx-auto px-4 h-16 flex items-center justify-between">
          <Link href="/orders" className="p-2 -ml-2 rounded-full hover:bg-stone-100 transition-colors text-stone-600">
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <div className="font-bold text-stone-900 tracking-tight">Order #{order.id}</div>
          <div className="w-9">{/* Spacer */}</div>
        </div>
      </div>

      <div className="max-w-3xl mx-auto px-4 mt-6">
        
        {/* Status Banner */}
        <div className={`p-6 rounded-3xl mb-6 shadow-sm border ${isFailed ? 'bg-red-50 border-red-100 text-red-900' : 'bg-brand-primary text-white border-brand-primary'}`}>
          <div className="flex items-center gap-4 mb-2">
            <div className={`w-12 h-12 rounded-full flex items-center justify-center flex-shrink-0 ${isFailed ? 'bg-red-100' : 'bg-white/20'}`}>
              <CurrentIcon className={`w-6 h-6 ${isFailed ? 'text-red-600' : 'text-white'}`} />
            </div>
            <div>
              <h1 className="text-2xl font-black">{isFailed ? (isCancelled ? "Cancelled" : "Rejected") : ("label" in currentStepInfo ? currentStepInfo.label : "")}</h1>
              <p className={`text-sm font-medium ${isFailed ? 'text-red-700' : 'text-brand-primary-light'}`}>
                {currentStepInfo.message}
              </p>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-5 gap-6">
          
          {/* Left Column: Timeline & Driver */}
          <div className="md:col-span-3 space-y-6">
            
            {/* Timeline */}
            {!isFailed && (
              <div className="bg-white rounded-3xl p-6 shadow-sm border border-stone-200">
                <h3 className="text-sm font-bold text-stone-400 uppercase tracking-wider mb-6">Tracking Timeline</h3>
                <div className="relative">
                  {/* Vertical Line */}
                  <div className="absolute left-4 top-2 bottom-4 w-0.5 bg-stone-100"></div>
                  
                  <div className="space-y-6 relative z-10">
                    {timelineSteps.map((step, index) => {
                      const isCompleted = currentStatusIndex >= index;
                      const isCurrent = currentStatusIndex === index;
                      const StepIcon = step.icon;
                      
                      return (
                        <div key={step.key} className={`flex items-start gap-4 ${isCompleted ? 'opacity-100' : 'opacity-40'}`}>
                          <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 border-2 bg-white transition-colors duration-300 ${
                            isCurrent ? 'border-brand-primary text-brand-primary shadow-[0_0_0_4px_rgba(var(--brand-primary-rgb),0.1)]' : 
                            isCompleted ? 'border-green-500 text-green-500' : 'border-stone-300 text-stone-300'
                          }`}>
                            <StepIcon className="w-4 h-4" />
                          </div>
                          <div className="pt-1.5">
                            <p className={`font-bold ${isCurrent ? 'text-stone-900 text-lg' : isCompleted ? 'text-stone-700' : 'text-stone-400'}`}>
                              {step.label}
                            </p>
                            {isCurrent && (
                              <p className="text-sm text-stone-500 mt-1">{step.message}</p>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            )}

            {/* Driver Info */}
            {delivery && delivery.driverName && !isFailed && (
              <div className="bg-white rounded-3xl p-6 shadow-sm border border-stone-200">
                <h3 className="text-sm font-bold text-stone-400 uppercase tracking-wider mb-4">Delivery Partner</h3>
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-stone-100 rounded-full flex items-center justify-center border border-stone-200 flex-shrink-0">
                    <Bike className="w-6 h-6 text-stone-500" />
                  </div>
                  <div className="flex-1">
                    <p className="font-bold text-stone-900 text-lg">{delivery.driverName}</p>
                    <p className="text-sm text-stone-500">{delivery.status === 'DELIVERED' ? 'Delivery Completed' : 'Assigned to your order'}</p>
                  </div>
                  {delivery.driverPhone && delivery.status !== 'DELIVERED' && (
                    <a href={`tel:${delivery.driverPhone}`} className="w-10 h-10 bg-green-100 text-green-700 rounded-full flex items-center justify-center hover:bg-green-200 transition-colors">
                      <Phone className="w-4 h-4" />
                    </a>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Right Column: Order Details */}
          <div className="md:col-span-2 space-y-6">
            
            {/* Restaurant & Delivery Addresses */}
            <div className="bg-white rounded-3xl p-6 shadow-sm border border-stone-200 space-y-5">
              <div>
                <h3 className="text-xs font-bold text-stone-400 uppercase tracking-wider mb-2 flex items-center gap-1.5"><Store className="w-3.5 h-3.5"/> Restaurant</h3>
                <p className="font-bold text-stone-900">{restaurant?.name || "Restaurant"}</p>
                <p className="text-sm text-stone-500 mt-0.5">{restaurant?.address || "Address unavailable"}</p>
              </div>
              
              <div className="pt-5 border-t border-stone-100">
                <h3 className="text-xs font-bold text-stone-400 uppercase tracking-wider mb-2 flex items-center gap-1.5"><MapPin className="w-3.5 h-3.5"/> Delivery Address</h3>
                <p className="font-bold text-stone-900">{(user as any)?.name || "Customer"}</p>
                <p className="text-sm text-stone-500 mt-0.5 leading-relaxed">
                  Delivery System Address
                </p>
              </div>
            </div>

            {/* Receipt */}
            <div className="bg-white rounded-3xl p-6 shadow-sm border border-stone-200">
              <h3 className="text-xs font-bold text-stone-400 uppercase tracking-wider mb-4 flex items-center gap-1.5"><Receipt className="w-3.5 h-3.5"/> Receipt</h3>
              
              <ul className="space-y-3 mb-4">
                {order.items?.map((item: any, idx: number) => (
                  <li key={idx} className="flex justify-between text-sm">
                    <div className="flex gap-2">
                      <span className="font-bold text-brand-primary bg-brand-primary/10 px-1.5 py-0.5 rounded text-xs h-fit">{item.quantity}x</span>
                      <span className="font-medium text-stone-800">{item.menuItemName || `Item #${item.menuItemId}`}</span>
                    </div>
                    <span className="text-stone-600">₹{item.subtotal?.toFixed(2)}</span>
                  </li>
                ))}
              </ul>
              
              <div className="border-t border-stone-100 pt-3 space-y-2 text-sm">
                <div className="flex justify-between text-stone-500">
                  <span>Subtotal</span>
                  <span>₹{order.totalAmount?.toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-stone-500">
                  <span>Delivery Fee</span>
                  <span>₹40.00</span>
                </div>
                <div className="flex justify-between font-black text-stone-900 text-lg mt-3 pt-3 border-t border-stone-100">
                  <span>Total</span>
                  <span>₹{(order.totalAmount + 40).toFixed(2)}</span>
                </div>
              </div>
            </div>

          </div>
        </div>
      </div>
    </div>
  );
}
