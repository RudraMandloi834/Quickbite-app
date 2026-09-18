#!/bin/bash
cat << 'INNER_EOF' > frontend/src/app/restaurants/[id]/page.tsx
"use client";

import { useEffect, useState, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { Container } from "@/components/Container";
import { Card, CardContent } from "@/components/Card";
import { Badge } from "@/components/Badge";
import { Button } from "@/components/Button";
import { ImageWithFallback } from "@/components/ImageWithFallback";
import { getRestaurantById, getRestaurantMenu, approveRestaurant, rejectRestaurant } from "@/lib/api";
import { useAuth } from "@/context/AuthContext";
import { addItemToCart, checkCartConflict } from "@/lib/cart";
import { ReplaceCartModal } from "@/components/ReplaceCartModal";
import { CartDisplay } from "@/types/cart";
import { Restaurant, MenuItem } from "@/types/restaurant";

export default function RestaurantDetailsPage() {
  const router = useRouter();
  const { requireAuth, user } = useAuth();
  const params = useParams();
  const rawId = params?.id;
  const restaurantId = Array.isArray(rawId) ? rawId[0] : (rawId as string);

  const [restaurant, setRestaurant] = useState<Restaurant | null>(null);
  const [menu, setMenu] = useState<MenuItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [addingItemId, setAddingItemId] = useState<number | null>(null);
  const [cartToast, setCartToast] = useState<{ message: string; subtext?: string } | null>(null);
  
  const [pendingReplacement, setPendingReplacement] = useState<{
    currentCart: CartDisplay;
    newItem: MenuItem;
  } | null>(null);
  const [isReplacing, setIsReplacing] = useState(false);

  const [adminActionLoading, setAdminActionLoading] = useState(false);

  const isOperator = user?.roles?.includes("OPERATOR");
  const isDriver = user?.roles?.includes("DRIVER");
  const isCustomer = !isOperator && !isDriver;

  const fetchData = useCallback(async () => {
    if (!restaurantId) return;
    setIsLoading(true);
    try {
      const data = await getRestaurantById(Number(restaurantId));
      setRestaurant(data);
      const menuData = await getRestaurantMenu(Number(restaurantId));
      setMenu(menuData);
    } catch (err: any) {
      if (err.status === 404) {
        setError("Restaurant not found");
      } else {
        setError("Failed to load restaurant details");
      }
    } finally {
      setIsLoading(false);
    }
  }, [restaurantId]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleAddToCart = async (item: MenuItem, forceReplace = false) => {
    if (!restaurant || !isCustomer) return;
    
    try {
      setAddingItemId(item.id);
      
      if (!forceReplace) {
        const conflict = await checkCartConflict(restaurant.id);
        if (conflict) {
          setPendingReplacement({
            currentCart: conflict,
            newItem: item
          });
          return;
        }
      }

      const { replacedRestaurant } = await addItemToCart(restaurant.id, item.id, 1, forceReplace);
      
      if (replacedRestaurant) {
        setCartToast({
          message: "Cart updated with new restaurant",
          subtext: `Removed items from ${replacedRestaurant}`
        });
      } else {
        setCartToast({ message: "Added to cart" });
      }

      setTimeout(() => setCartToast(null), 3000);
      
    } catch (err) {
      alert("Failed to add item to cart. Please try again.");
    } finally {
      setAddingItemId(null);
      setPendingReplacement(null);
    }
  };

  const handleAdminApprove = async () => {
    if (!restaurant) return;
    try {
      setAdminActionLoading(true);
      const res = await approveRestaurant(restaurant.id);
      alert(`Approved! Login Credentials:\nUser: ${res.username}\nPass: ${res.temporaryPassword}`);
      fetchData();
    } catch (err: any) {
      alert("Approval failed: " + err.message);
    } finally {
      setAdminActionLoading(false);
    }
  };

  const handleAdminReject = async () => {
    if (!restaurant) return;
    const reason = prompt("Enter rejection reason:");
    if (!reason) return;
    try {
      setAdminActionLoading(true);
      await rejectRestaurant(restaurant.id, reason);
      fetchData();
    } catch (err: any) {
      alert("Rejection failed: " + err.message);
    } finally {
      setAdminActionLoading(false);
    }
  };

  if (isLoading) {
    return (
      <Container className="py-20 text-center">
        <div className="inline-block w-8 h-8 border-4 border-brand-primary/30 border-t-brand-primary rounded-full animate-spin" />
      </Container>
    );
  }

  if (error || !restaurant) {
    return (
      <Container className="py-20 text-center">
        <div className="max-w-md mx-auto text-center">
          <h2 className="text-2xl font-serif text-brand-fg mb-4">
            {error || "Restaurant not found"}
          </h2>
          <Button href="/restaurants" variant="primary">
            Browse other restaurants
          </Button>
        </div>
      </Container>
    );
  }

  return (
    <div className="min-h-screen bg-brand-bg pb-20">
      {/* Header Banner */}
      <div className="h-64 sm:h-80 w-full relative bg-stone-900">
        <ImageWithFallback
          src={restaurant.coverImageUrl}
          alt={restaurant.name}
          priority
          className="w-full h-full object-cover opacity-60"
          fallbackNode={
            <div className="w-full h-full flex items-center justify-center opacity-30">
              <svg className="w-20 h-20 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
            </div>
          }
        />
        <div className="absolute inset-0 bg-gradient-to-t from-brand-bg via-brand-bg/60 to-transparent" />
      </div>

      <Container className="relative -mt-32">
        {/* Admin Controls */}
        {isOperator && (
          <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4 mb-6 rounded-r-md shadow-sm">
            <div className="flex justify-between items-center">
              <div>
                <h3 className="text-lg font-bold text-yellow-800">Admin Restaurant View</h3>
                <p className="text-sm text-yellow-700">Status: <span className="font-bold uppercase">{restaurant.status || 'PENDING_APPROVAL'}</span></p>
              </div>
              <div className="flex gap-3">
                {(!restaurant.status || restaurant.status === 'PENDING_APPROVAL') && (
                  <>
                    <button onClick={handleAdminApprove} disabled={adminActionLoading} className="bg-green-600 text-white px-4 py-2 rounded shadow hover:bg-green-700 disabled:opacity-50 font-medium">Approve</button>
                    <button onClick={handleAdminReject} disabled={adminActionLoading} className="bg-red-600 text-white px-4 py-2 rounded shadow hover:bg-red-700 disabled:opacity-50 font-medium">Reject</button>
                  </>
                )}
                <Link href="/admin/dashboard" className="bg-gray-800 text-white px-4 py-2 rounded shadow hover:bg-gray-900 font-medium">Back to Admin</Link>
              </div>
            </div>
          </div>
        )}

        <div className="flex flex-col md:flex-row gap-8">
          {/* Main Content */}
          <div className="flex-1 max-w-4xl">
            {/* Restaurant Info Card */}
            <Card className="mb-12 bg-white/80 backdrop-blur-sm border-brand-border/40 shadow-sm">
              <CardContent className="p-6 sm:p-8">
                <div className="flex flex-col md:flex-row md:items-start justify-between gap-6">
                  <div>
                    <div className="flex items-center gap-3 mb-4">
                      <Badge variant="primary">{restaurant.cuisine}</Badge>
                      <span className="flex items-center text-sm font-medium text-brand-fg">
                        <svg className="w-4 h-4 text-amber-500 mr-1 pb-0.5" fill="currentColor" viewBox="0 0 20 20">
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
                </div>
              </CardContent>
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

              {menu.length === 0 ? (
                <div className="text-center py-16 px-4">
                  <Card className="max-w-md mx-auto p-8 bg-white border-dashed">
                    <h3 className="text-xl font-serif text-brand-fg mb-2">No Menu Items Listed</h3>
                    <p className="text-brand-muted text-sm mb-6">This restaurant currently has no items available.</p>
                  </Card>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {menu.map((item, index) => (
                    <Card
                      key={item.id}
                      noPadding
                      className="flex flex-col bg-white shadow-xs overflow-hidden h-full"
                    >
                      <div className="h-48 w-full relative bg-stone-50">
                        <ImageWithFallback src={item.imageUrl} alt={item.name} className="w-full h-full object-cover" />
                      </div>
                      <CardContent className="p-6 flex flex-col flex-grow justify-between">
                        <div className="space-y-2">
                          <div className="flex justify-between items-start gap-4">
                            <h3 className="font-serif text-xl font-medium text-brand-fg">{item.name}</h3>
                          </div>
                          <p className="text-brand-muted text-sm leading-relaxed">{item.description}</p>
                        </div>

                        <div className="pt-5 mt-4 border-t border-brand-border/60 flex items-center justify-between gap-3">
                          <span className="font-serif text-xl font-semibold text-brand-primary">₹{item.price.toFixed(2)}</span>
                          {isCustomer && (
                            item.available ? (
                              <Button
                                size="sm"
                                variant="primary"
                                disabled={addingItemId === item.id}
                                onClick={() => requireAuth(() => handleAddToCart(item))}
                                className="text-xs px-3.5 h-9 font-medium"
                              >
                                {addingItemId === item.id ? "Adding..." : "Add to cart"}
                              </Button>
                            ) : (
                              <span className="text-xs text-brand-muted font-medium py-1.5 px-2.5 bg-stone-100 rounded-md">Unavailable</span>
                            )
                          )}
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </Container>

      {/* Cart Toast Notification */}
      {cartToast && (
        <div className="fixed bottom-6 right-6 z-50 max-w-sm bg-stone-900 text-white p-4 rounded-xl shadow-lg flex justify-between gap-4">
          <div><p className="text-stone-100">{cartToast.message}</p></div>
          <Link href="/cart" className="shrink-0 px-3.5 py-1.5 bg-brand-primary rounded-md">View Cart →</Link>
        </div>
      )}

      {/* Replace Cart Modal */}
      {pendingReplacement && (
        <ReplaceCartModal
          isOpen={true}
          currentRestaurantName={pendingReplacement.currentCart.restaurantName}
          newRestaurantName={restaurant.name}
          onConfirm={async () => {
            setIsReplacing(true);
            await handleAddToCart(pendingReplacement.newItem, true);
            setIsReplacing(false);
          }}
          onCancel={() => setPendingReplacement(null)}
          isLoading={isReplacing}
        />
      )}
    </div>
  );
}
INNER_EOF
bash fix_restaurant_page.sh
