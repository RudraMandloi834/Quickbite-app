"use client";

import { useEffect, useState, useMemo } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { Container } from "@/components/Container";
import { Card, CardContent } from "@/components/Card";
import { Badge } from "@/components/Badge";
import { Button } from "@/components/Button";
import { Input } from "@/components/Input";
import { Skeleton } from "@/components/Skeleton";
import { ImageWithFallback } from "@/components/ImageWithFallback";
import { getRestaurantById, getRestaurantMenu, approveRestaurant, rejectRestaurant } from "@/lib/api";
import { useAuth } from "@/context/AuthContext";
import { addItemToCart, checkCartConflict } from "@/lib/cart";
import { ReplaceCartModal } from "@/components/ReplaceCartModal";
import { CartDisplay } from "@/types/cart";
import { Restaurant, MenuItem } from "@/types/restaurant";
import { Star, MapPin, Clock, Info, Check, Search, Plus, Minus, Bike, Map, ShoppingBag, AlertCircle, ShoppingCart } from "lucide-react";

export default function RestaurantDetailsPage() {
  const router = useRouter();
  const { id: restaurantId } = useParams();
  const { requireAuth, user } = useAuth();
  
  const isOperator = user?.roles?.includes('RESTAURANT_OPERATOR') || user?.roles?.includes('ADMIN');
  const isCustomer = !user || user?.roles?.includes('CUSTOMER');

  // Restaurant State
  const [restaurant, setRestaurant] = useState<Restaurant | null>(null);
  const [loadingRestaurant, setLoadingRestaurant] = useState(true);
  const [restaurantError, setRestaurantError] = useState("");

  // Menu State
  const [menu, setMenu] = useState<MenuItem[]>([]);
  const [loadingMenu, setLoadingMenu] = useState(true);
  const [menuError, setMenuError] = useState("");

  // Menu Interactions
  const [menuSearch, setMenuSearch] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("All");
  const [quantities, setQuantities] = useState<Record<number, number>>({});
  
  // Delivery Toggle
  const [orderType, setOrderType] = useState<"delivery" | "pickup">("delivery");

  // Cart State
  const [addingItemId, setAddingItemId] = useState<number | null>(null);
  const [cartToast, setCartToast] = useState<{ message: string; subtext?: string } | null>(null);
  const [pendingReplacement, setPendingReplacement] = useState<{
    currentCart: CartDisplay;
    newItem: MenuItem;
    quantity: number;
  } | null>(null);
  const [isReplacing, setIsReplacing] = useState(false);
  const [adminActionLoading, setAdminActionLoading] = useState(false);

  useEffect(() => {
    let ignore = false;

    async function loadData() {
      if (!restaurantId) return;
      
      // Load Restaurant Info
      try {
        setLoadingRestaurant(true);
        const data = await getRestaurantById(Number(restaurantId));
        if (!ignore) {
          setRestaurant(data);
          setLoadingRestaurant(false);
        }
      } catch (err) {
        if (!ignore) {
          setRestaurantError((err as Error).message || "Failed to load restaurant details");
          setLoadingRestaurant(false);
        }
      }

      // Load Menu Info Separately
      try {
        setLoadingMenu(true);
        const menuData = await getRestaurantMenu(Number(restaurantId));
        if (!ignore) {
          setMenu(menuData);
          setLoadingMenu(false);
        }
      } catch (err) {
        if (!ignore) {
          setMenuError((err as Error).message || "Failed to load menu");
          setLoadingMenu(false);
        }
      }
    }

    loadData();
    return () => { ignore = true; };
  }, [restaurantId]);

  const handleAdminApprove = async () => {
    if (!restaurant) return;
    setAdminActionLoading(true);
    try {
      await approveRestaurant(restaurant.id);
      setRestaurant({ ...restaurant, status: 'APPROVED' });
      alert('Restaurant approved successfully');
    } catch (err) {
      alert('Failed to approve restaurant');
    } finally {
      setAdminActionLoading(false);
    }
  };

  const handleAdminReject = async () => {
    if (!restaurant) return;
    const reason = prompt("Enter rejection reason:");
    if (!reason) return;
    
    setAdminActionLoading(true);
    try {
      await rejectRestaurant(restaurant.id, reason);
      setRestaurant({ ...restaurant, status: 'REJECTED' });
      alert('Restaurant rejected successfully');
    } catch (err) {
      alert('Failed to reject restaurant');
    } finally {
      setAdminActionLoading(false);
    }
  };

  const updateQuantity = (itemId: number, delta: number) => {
    setQuantities(prev => {
      const current = prev[itemId] || 1;
      const next = Math.max(1, current + delta);
      return { ...prev, [itemId]: next };
    });
  };

  const handleAddToCart = async (item: MenuItem, quantity: number, forceReplace = false) => {
    if (!restaurant) return;
    setAddingItemId(item.id);
    
    try {
      if (!forceReplace) {
        const conflictRes = await checkCartConflict(restaurant.id);
        if (conflictRes.conflict && conflictRes.cartDisplay) {
          setPendingReplacement({
            currentCart: conflictRes.cartDisplay,
            newItem: item,
            quantity
          });
          setAddingItemId(null);
          return;
        }
      }
      
      const { replacedRestaurant } = await addItemToCart(restaurant.id, item.id, quantity, forceReplace);
      
      if (replacedRestaurant) {
        setCartToast({ message: "Cart updated with new restaurant" });
      } else {
        setCartToast({ message: `Added ${quantity}x ${item.name} to cart` });
      }
      
      // Reset quantity after adding
      setQuantities(prev => ({ ...prev, [item.id]: 1 }));
      setPendingReplacement(null);
      
      setTimeout(() => setCartToast(null), 3000);
    } catch (err) {
      alert("Failed to add item to cart. Please try again.");
    } finally {
      setAddingItemId(null);
    }
  };

  // Derive Categories dynamically based on menu items
  const categories = useMemo(() => {
    const defaultCategories = ["All"];
    const keywords = ["Burger", "Pizza", "Biryani", "Rice", "Curry", "Drink", "Dessert", "Bread", "Chicken", "Paneer"];
    
    const foundCategories = new Set<string>();
    menu.forEach(item => {
      let matched = false;
      for (const k of keywords) {
        if (item.name.toLowerCase().includes(k.toLowerCase())) {
          foundCategories.add(k);
          matched = true;
          break;
        }
      }
      if (!matched) foundCategories.add("Specials");
    });
    
    return [...defaultCategories, ...Array.from(foundCategories).sort()];
  }, [menu]);

  // Filter Menu Items
  const filteredMenu = useMemo(() => {
    return menu.filter(item => {
      const matchesSearch = item.name.toLowerCase().includes(menuSearch.toLowerCase()) || 
                            item.description.toLowerCase().includes(menuSearch.toLowerCase());
      if (!matchesSearch) return false;
      
      if (selectedCategory === "All") return true;
      if (selectedCategory === "Specials") {
        const keywords = ["Burger", "Pizza", "Biryani", "Rice", "Curry", "Drink", "Dessert", "Bread", "Chicken", "Paneer"];
        return !keywords.some(k => item.name.toLowerCase().includes(k.toLowerCase()));
      }
      
      return item.name.toLowerCase().includes(selectedCategory.toLowerCase());
    });
  }, [menu, menuSearch, selectedCategory]);

  if (loadingRestaurant) {
    return (
      <div className="min-h-screen bg-stone-50 pb-20 pt-16">
        <Skeleton className="h-64 sm:h-80 w-full" />
        <Container className="relative -mt-16 sm:-mt-24">
          <Skeleton className="w-full h-48 rounded-2xl mb-8" />
          <div className="flex gap-8">
            <Skeleton className="flex-1 h-96 rounded-2xl" />
            <Skeleton className="w-80 hidden lg:block h-64 rounded-2xl" />
          </div>
        </Container>
      </div>
    );
  }

  if (restaurantError || !restaurant) {
    return (
      <Container className="py-24">
        <div className="max-w-md mx-auto text-center bg-white p-8 rounded-2xl shadow-sm border border-stone-100">
          <AlertCircle className="w-12 h-12 text-red-400 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-stone-800 mb-2">
            Oops! Restaurant not found
          </h2>
          <p className="text-stone-500 mb-6">{restaurantError}</p>
          <Button onClick={() => router.push("/restaurants")} variant="primary" className="w-full">
            Browse other restaurants
          </Button>
        </div>
      </Container>
    );
  }

  return (
    <div className="min-h-screen bg-stone-50 pb-[calc(6.5rem+env(safe-area-inset-bottom,0px))] md:pb-20 pt-16">
      {/* Cover Image Banner */}
      <div className="h-48 sm:h-72 w-full relative bg-stone-900">
        <ImageWithFallback
          src={restaurant.coverImageUrl || ""}
          alt={restaurant.name}
          priority
          className="w-full h-full object-cover opacity-80"
          fallbackNode={<div className="w-full h-full bg-stone-800" />}
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent" />
      </div>

      <Container className="relative -mt-12 sm:-mt-20 z-10">
        
        {/* Admin Controls */}
        {isOperator && (
          <div className="bg-white border-l-4 border-yellow-400 p-4 mb-6 rounded-xl shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h3 className="font-bold text-stone-800">Admin Restaurant View</h3>
              <p className="text-sm text-stone-500">Status: <span className="font-bold text-yellow-600">{restaurant.status || 'PENDING'}</span></p>
            </div>
            <div className="flex gap-2">
              {(!restaurant.status || restaurant.status === 'PENDING_APPROVAL') && (
                <>
                  <Button onClick={handleAdminApprove} disabled={adminActionLoading} variant="primary" size="sm">Approve</Button>
                  <Button onClick={handleAdminReject} disabled={adminActionLoading} variant="outline" size="sm" className="border-red-200 text-red-600 hover:bg-red-50">Reject</Button>
                </>
              )}
              <Button onClick={() => router.push("/admin/dashboard")} variant="outline" size="sm">Dashboard</Button>
            </div>
          </div>
        )}

        <div className="flex flex-col lg:flex-row gap-8">
          
          {/* Main Left Column */}
          <div className="flex-1 min-w-0">
            {/* Restaurant Info Card */}
            <div className="bg-white rounded-2xl shadow-sm border border-stone-100 p-5 sm:p-8 mb-8">
              <div className="flex flex-col md:flex-row md:items-start justify-between gap-6 mb-6">
                <div>
                  <h1 className="text-3xl sm:text-4xl font-extrabold text-stone-900 mb-2">
                    {restaurant.name}
                  </h1>
                  <p className="text-stone-500 font-medium mb-4">{restaurant.cuisine}</p>
                  
                  <div className="flex flex-wrap items-center gap-4 text-sm text-stone-600 font-medium">
                    <span className="flex items-center gap-1.5 bg-green-50 text-green-700 px-2.5 py-1 rounded-md font-bold">
                      <Star className="w-4 h-4 fill-current" /> {restaurant.rating.toFixed(1)} 
                      <span className="text-green-600/70 font-medium text-xs ml-0.5">({restaurant.reviewCount || '100+'} reviews)</span>
                    </span>
                    <span className="flex items-center gap-1.5">
                      <MapPin className="w-4 h-4 text-stone-400" /> {restaurant.location}, {restaurant.city}
                    </span>
                    <span className="flex items-center gap-1.5">
                      <Clock className="w-4 h-4 text-stone-400" /> {restaurant.deliveryTimeMinutes || 30} mins
                    </span>
                  </div>
                </div>
              </div>

              {/* Delivery / Pickup Toggle */}
              <div className="bg-stone-50 rounded-xl p-1.5 inline-flex mb-6 border border-stone-200 shadow-inner">
                <button 
                  onClick={() => setOrderType("delivery")}
                  className={`flex items-center gap-2 px-6 py-2.5 rounded-lg text-sm font-bold transition-all ${orderType === "delivery" ? "bg-white text-brand-primary shadow-sm" : "text-stone-500 hover:text-stone-700"}`}
                >
                  <Bike className="w-4 h-4" /> Delivery
                </button>
                <button 
                  onClick={() => setOrderType("pickup")}
                  className={`flex items-center gap-2 px-6 py-2.5 rounded-lg text-sm font-bold transition-all ${orderType === "pickup" ? "bg-white text-brand-primary shadow-sm" : "text-stone-500 hover:text-stone-700"}`}
                >
                  <ShoppingBag className="w-4 h-4" /> Self Pickup
                </button>
              </div>

              <div className="border-t border-stone-100 pt-6">
                <h3 className="font-bold text-stone-800 mb-2 flex items-center gap-2"><Info className="w-4 h-4 text-brand-primary" /> Restaurant Information</h3>
                <p className="text-stone-600 text-sm leading-relaxed max-w-3xl">
                  Welcome to {restaurant.name}. We pride ourselves on serving the best {restaurant.cuisine} in {restaurant.location}. All our ingredients are sourced locally to provide you with the freshest meals possible. Enjoy your food!
                </p>
              </div>
            </div>

            {/* Menu Section */}
            <div id="menu">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6 sticky top-16 z-20 bg-stone-50 py-4 -mx-4 px-4 sm:mx-0 sm:px-0">
                <h2 className="text-2xl font-extrabold text-stone-900">Menu</h2>
                
                <div className="relative max-w-md w-full sm:w-64">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-stone-400" />
                  <Input
                    placeholder="Search in menu..."
                    value={menuSearch}
                    onChange={(e) => setMenuSearch(e.target.value)}
                    className="pl-9 bg-white border-stone-200 h-10 w-full"
                  />
                </div>
              </div>

              {/* Menu Categories */}
              {!loadingMenu && menu.length > 0 && (
                <div className="flex overflow-x-auto hide-scrollbar gap-2 mb-8 pb-2">
                  {categories.map(cat => (
                    <button
                      key={cat}
                      onClick={() => setSelectedCategory(cat)}
                      className={`shrink-0 px-4 py-2 rounded-full text-sm font-bold transition-colors whitespace-nowrap ${selectedCategory === cat ? "bg-stone-800 text-white" : "bg-white text-stone-600 border border-stone-200 hover:border-stone-300"}`}
                    >
                      {cat}
                    </button>
                  ))}
                </div>
              )}

              {/* Menu Items */}
              {loadingMenu ? (
                <div className="space-y-4">
                  {[...Array(4)].map((_, i) => (
                    <div key={i} className="bg-white p-4 rounded-2xl flex gap-4 border border-stone-100">
                      <Skeleton className="w-24 h-24 rounded-xl shrink-0" />
                      <div className="flex-1 space-y-3">
                        <Skeleton className="w-1/3 h-5 rounded" />
                        <Skeleton className="w-2/3 h-4 rounded" />
                        <Skeleton className="w-16 h-5 rounded" />
                      </div>
                    </div>
                  ))}
                </div>
              ) : menuError ? (
                <div className="bg-red-50 border border-red-100 p-8 rounded-2xl text-center text-red-600">
                  <AlertCircle className="w-10 h-10 mx-auto mb-3 opacity-50" />
                  <p className="font-medium">{menuError}</p>
                </div>
              ) : filteredMenu.length === 0 ? (
                <div className="bg-white p-12 rounded-2xl text-center border border-stone-100 shadow-sm">
                  <div className="w-16 h-16 bg-stone-50 rounded-full flex items-center justify-center mx-auto mb-4">
                    <Search className="w-8 h-8 text-stone-300" />
                  </div>
                  <h3 className="text-xl font-bold text-stone-800 mb-2">No items found</h3>
                  <p className="text-stone-500">Try adjusting your search or category filter.</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {filteredMenu.map((item) => (
                    <div key={item.id} className="bg-white border border-stone-100 rounded-2xl p-4 flex gap-4 sm:gap-6 shadow-sm hover:shadow-md transition-shadow">
                      <div className="w-24 h-24 sm:w-32 sm:h-32 shrink-0 bg-stone-100 rounded-xl overflow-hidden relative">
                        <ImageWithFallback 
                          src={item.imageUrl || ""} 
                          alt={item.name} 
                          className="w-full h-full object-cover" 
                          fallbackNode={<div className="w-full h-full flex items-center justify-center text-stone-400 bg-stone-100"><ShoppingCart className="w-6 h-6 opacity-30"/></div>} 
                        />
                      </div>
                      <div className="flex-1 flex flex-col justify-between py-1 min-w-0">
                        <div>
                          <div className="flex justify-between items-start gap-2 mb-1">
                            <h3 className="font-bold text-stone-900 text-base sm:text-lg truncate">{item.name}</h3>
                            <span className="font-extrabold text-stone-900 shrink-0">₹{item.price.toFixed(2)}</span>
                          </div>
                          <p className="text-stone-500 text-sm line-clamp-2">{item.description}</p>
                        </div>
                        
                        <div className="flex items-center justify-between mt-3">
                          {isCustomer && (
                            item.available ? (
                              <div className="flex items-center gap-3">
                                {/* Quantity Controls */}
                                <div className="flex items-center bg-stone-50 border border-stone-200 rounded-lg">
                                  <button onClick={() => updateQuantity(item.id, -1)} className="p-1.5 text-stone-500 hover:text-brand-primary transition-colors">
                                    <Minus className="w-4 h-4" />
                                  </button>
                                  <span className="w-6 text-center font-bold text-sm text-stone-800">{quantities[item.id] || 1}</span>
                                  <button onClick={() => updateQuantity(item.id, 1)} className="p-1.5 text-stone-500 hover:text-brand-primary transition-colors">
                                    <Plus className="w-4 h-4" />
                                  </button>
                                </div>
                                <Button
                                  size="sm"
                                  variant="primary"
                                  disabled={addingItemId === item.id}
                                  onClick={() => requireAuth(() => handleAddToCart(item, quantities[item.id] || 1))}
                                  className="text-xs sm:text-sm px-4 h-9 font-bold shadow-sm"
                                >
                                  {addingItemId === item.id ? "Adding..." : "Add"}
                                </Button>
                              </div>
                            ) : (
                              <span className="text-xs font-bold text-red-500 bg-red-50 px-3 py-1.5 rounded-lg border border-red-100">Sold Out</span>
                            )
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Right Column / Sticky Cart summary placeholder */}
          <div className="hidden lg:block w-80 shrink-0">
            <div className="sticky top-24 bg-white border border-stone-100 rounded-2xl p-6 shadow-sm">
              <h3 className="font-bold text-stone-900 mb-4 flex items-center gap-2"><ShoppingBag className="w-5 h-5 text-brand-primary" /> Order Cart</h3>
              <p className="text-sm text-stone-500 mb-6 leading-relaxed">
                Items you add from {restaurant.name} will appear in your cart. You can quickly navigate to checkout from the cart view.
              </p>
              <Button href="/cart" variant="primary" className="w-full font-bold">
                Go to Cart
              </Button>
            </div>
          </div>

        </div>
      </Container>

      {/* Cart Toast Notification */}
      {cartToast && (
        <div className="fixed bottom-[calc(4.75rem+env(safe-area-inset-bottom,0px))] md:bottom-6 left-4 right-4 sm:left-auto sm:right-6 sm:max-w-md z-[60] bg-stone-900/95 backdrop-blur-md text-white p-4 rounded-2xl shadow-2xl border border-stone-800 flex items-center justify-between gap-4 animate-in slide-in-from-bottom-5 duration-200">
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-8 h-8 bg-brand-primary rounded-full flex items-center justify-center shrink-0 shadow-sm">
              <Check className="w-4 h-4 text-white" />
            </div>
            <div className="min-w-0">
              <p className="font-semibold text-sm truncate">{cartToast.message}</p>
              {cartToast.subtext && <p className="text-xs text-stone-400 truncate">{cartToast.subtext}</p>}
            </div>
          </div>
          <Link
            href="/cart"
            className="shrink-0 px-4 py-2 bg-brand-primary text-white rounded-xl text-sm font-bold hover:bg-brand-primary/90 transition-colors shadow-sm flex items-center gap-1.5"
          >
            <ShoppingCart className="w-4 h-4" />
            <span>View Cart</span>
          </Link>
        </div>
      )}

      {/* Replace Cart Modal */}
      {pendingReplacement && (
        <ReplaceCartModal
          isOpen={true}
          currentCart={pendingReplacement.currentCart}
          newRestaurant={restaurant}
          newItem={pendingReplacement.newItem}
          isReplacing={isReplacing}
          onConfirm={async () => {
            setIsReplacing(true);
            await handleAddToCart(pendingReplacement.newItem, pendingReplacement.quantity, true);
            setIsReplacing(false);
          }}
          onClose={() => setPendingReplacement(null)}
        />
      )}
    </div>
  );
}
