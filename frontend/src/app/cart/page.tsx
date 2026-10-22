"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Container } from "@/components/Container";
import { Card, CardContent } from "@/components/Card";
import { Button } from "@/components/Button";
import { fetchCartDisplay, updateItemQuantity, removeItemFromCart, getStoredCartId } from "@/lib/cart";
import { getCart } from "@/lib/api";
import { Cart } from "@/types/cart";
import { CartDisplay } from "@/types/cart";
import { useAuth } from "@/context/AuthContext";
import { Minus, Plus, Trash2, ArrowLeft, Receipt, ChevronRight, CheckCircle2, MessageSquare, ShoppingBag } from "lucide-react";

export default function CartPage() {
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();
  
  const [cartDisplay, setCartDisplay] = useState<CartDisplay | null>(null);
  const [rawCart, setRawCart] = useState<Cart | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");
  const [isUpdating, setIsUpdating] = useState(false);
  const [instructions, setInstructions] = useState("");

  useEffect(() => {
    let ignore = false;
    async function loadCart() {
      if (authLoading) return;
      
      try {
        const cid = getStoredCartId(); if (!cid) { setIsLoading(false); return; }; const display = await fetchCartDisplay(cid);
        const raw = await getCart(cid);
        if (!ignore) {
          setCartDisplay(display);
          setRawCart(raw);
          setIsLoading(false);
        }
      } catch (err: unknown) {
        if (!ignore) {
          setError((err as Error).message || "Failed to load cart");
          setIsLoading(false);
        }
      }
    }
    loadCart();
    return () => { ignore = true; };
  }, [authLoading]);

  const handleQuantityChange = async (menuItemId: number, newQuantity: number) => {
    if (newQuantity < 1 || !cartDisplay) return;
    setIsUpdating(true);
    try {
      if (!rawCart) return;
      await updateItemQuantity(rawCart, menuItemId, newQuantity);
      const display = await fetchCartDisplay(rawCart.id);
      setCartDisplay(display);
    } catch (err) {
      alert("Failed to update quantity");
    } finally {
      setIsUpdating(false);
    }
  };

  const handleRemove = async (menuItemId: number) => {
    if (!cartDisplay) return;
    setIsUpdating(true);
    try {
      if (!rawCart) return;
      await removeItemFromCart(rawCart, menuItemId);
      const display = await fetchCartDisplay(rawCart.id);
      setCartDisplay(display);
    } catch (err) {
      alert("Failed to remove item");
    } finally {
      setIsUpdating(false);
    }
  };

  if (authLoading || isLoading) {
    return (
      <div className="min-h-screen bg-stone-50 pt-24 pb-20">
        <Container>
          <div className="animate-pulse space-y-8">
            <div className="h-10 w-48 bg-stone-200 rounded-lg" />
            <div className="flex flex-col lg:flex-row gap-8">
              <div className="flex-1 space-y-4">
                {[...Array(3)].map((_, i) => (
                  <div key={i} className="h-32 bg-stone-200 rounded-2xl" />
                ))}
              </div>
              <div className="w-full lg:w-96 h-96 bg-stone-200 rounded-2xl" />
            </div>
          </div>
        </Container>
      </div>
    );
  }

  const fees = {
    delivery: cartDisplay?.items.length ? 49.00 : 0,
    taxes: cartDisplay ? cartDisplay.totalAmount * 0.05 : 0,
  };
  const finalTotal = cartDisplay ? cartDisplay.totalAmount + fees.delivery + fees.taxes : 0;

  return (
    <div className="min-h-screen bg-stone-50 pt-24 pb-24">
      <Container>
        <div className="mb-8 flex items-center gap-4">
          <button onClick={() => router.back()} className="w-10 h-10 bg-white border border-stone-200 rounded-full flex items-center justify-center text-stone-600 hover:text-stone-900 transition-colors shadow-sm">
            <ArrowLeft className="w-5 h-5" />
          </button>
          <h1 className="text-3xl font-extrabold text-stone-900">Your Cart</h1>
        </div>

        {error ? (
          <div className="bg-red-50 text-red-700 p-6 rounded-2xl border border-red-100 font-medium">
            {error}
          </div>
        ) : !cartDisplay || cartDisplay.items.length === 0 ? (
          <div className="bg-white rounded-2xl p-16 flex flex-col items-center justify-center text-center shadow-sm border border-stone-100 max-w-2xl mx-auto mt-12">
            <div className="w-24 h-24 bg-stone-50 rounded-full flex items-center justify-center mb-6">
              <ShoppingBag className="w-12 h-12 text-stone-300" />
            </div>
            <h2 className="text-2xl font-bold text-stone-900 mb-2">Cart is empty</h2>
            <p className="text-stone-500 mb-8 max-w-sm">Looks like you haven&apos;t added anything to your cart yet. Let&apos;s find some delicious food!</p>
            <Button href="/restaurants" variant="primary" className="font-bold px-8">
              Explore Restaurants
            </Button>
          </div>
        ) : (
          <div className="flex flex-col lg:flex-row gap-8 items-start">
            
            {/* Left Column - Items */}
            <div className="flex-1 w-full space-y-4">
              <div className="bg-white rounded-2xl p-5 border border-stone-100 shadow-sm flex justify-between items-center">
                <div>
                  <p className="text-sm font-bold text-stone-500 uppercase tracking-wide">Ordering From</p>
                  <Link href={`/restaurants/${cartDisplay.restaurantId}`} className="text-lg font-extrabold text-stone-900 hover:text-brand-primary transition-colors">
                    {cartDisplay.restaurantName}
                  </Link>
                </div>
                <Link href={`/restaurants/${cartDisplay.restaurantId}`} className="text-sm font-bold text-brand-primary bg-brand-primary/10 px-4 py-2 rounded-lg hover:bg-brand-primary/20 transition-colors">
                  Add items
                </Link>
              </div>

              <div className="space-y-4">
                {cartDisplay.items.map((item) => (
                  <div key={item.menuItemId} className="bg-white rounded-2xl p-5 border border-stone-100 shadow-sm flex flex-col sm:flex-row justify-between gap-4">
                    <div className="flex-1">
                      <div className="flex items-start justify-between">
                        <div>
                          <h3 className="font-bold text-stone-900 text-lg mb-1">{item.name}</h3>
                          {item.description && <p className="text-sm text-stone-500 line-clamp-1 mb-2">{item.description}</p>}
                          <p className="font-extrabold text-stone-900">₹{item.unitPrice.toFixed(2)}</p>
                        </div>
                      </div>
                    </div>
                    
                    <div className="flex items-center justify-between sm:flex-col sm:items-end sm:justify-between gap-4 border-t sm:border-none pt-4 sm:pt-0 border-stone-100">
                      <span className="font-extrabold text-lg text-brand-primary sm:hidden">₹{item.subtotal.toFixed(2)}</span>
                      
                      <div className="flex items-center gap-4">
                        <div className="flex items-center bg-stone-50 border border-stone-200 rounded-lg p-1">
                          <button
                            disabled={isUpdating}
                            onClick={() => handleQuantityChange(item.menuItemId, item.quantity - 1)}
                            className="w-8 h-8 flex items-center justify-center text-stone-500 hover:text-brand-primary disabled:opacity-50 transition-colors"
                          >
                            <Minus className="w-4 h-4" />
                          </button>
                          <span className="w-8 text-center font-bold text-stone-900">{item.quantity}</span>
                          <button
                            disabled={isUpdating}
                            onClick={() => handleQuantityChange(item.menuItemId, item.quantity + 1)}
                            className="w-8 h-8 flex items-center justify-center text-stone-500 hover:text-brand-primary disabled:opacity-50 transition-colors"
                          >
                            <Plus className="w-4 h-4" />
                          </button>
                        </div>
                        <button
                          disabled={isUpdating}
                          onClick={() => handleRemove(item.menuItemId)}
                          className="w-10 h-10 flex items-center justify-center text-stone-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors disabled:opacity-50"
                        >
                          <Trash2 className="w-5 h-5" />
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {/* Cooking Instructions */}
              <div className="bg-white rounded-2xl p-5 border border-stone-100 shadow-sm">
                <div className="flex gap-3 items-start">
                  <MessageSquare className="w-5 h-5 text-stone-400 mt-0.5 shrink-0" />
                  <div className="w-full">
                    <h4 className="font-bold text-stone-900 mb-2">Add cooking instructions</h4>
                    <textarea 
                      className="w-full bg-stone-50 border border-stone-200 rounded-xl p-3 text-sm focus:outline-none focus:ring-2 focus:ring-brand-primary/20 focus:border-brand-primary transition-all resize-none"
                      placeholder="E.g. Make it spicy, no onions..."
                      rows={2}
                      value={instructions}
                      onChange={(e) => setInstructions(e.target.value)}
                    ></textarea>
                  </div>
                </div>
              </div>
            </div>

            {/* Right Column - Bill Summary */}
            <div className="w-full lg:w-96 shrink-0">
              <div className="bg-white rounded-2xl border border-stone-100 shadow-sm sticky top-24 overflow-hidden">
                <div className="bg-stone-50 p-5 border-b border-stone-100 flex items-center gap-2">
                  <Receipt className="w-5 h-5 text-stone-700" />
                  <h3 className="font-bold text-stone-900 text-lg">Bill Details</h3>
                </div>
                
                <div className="p-5 space-y-4">
                  <div className="flex justify-between text-sm font-medium text-stone-600">
                    <span>Item Total</span>
                    <span>₹{cartDisplay.totalAmount.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between text-sm font-medium text-stone-600">
                    <span>Delivery Fee</span>
                    <span>₹{fees.delivery.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between text-sm font-medium text-stone-600">
                    <span>Taxes (5%)</span>
                    <span>₹{fees.taxes.toFixed(2)}</span>
                  </div>
                  
                  <div className="pt-4 border-t border-stone-100 border-dashed flex justify-between items-end">
                    <div>
                      <span className="block text-sm font-bold text-stone-500 uppercase">To Pay</span>
                    </div>
                    <span className="text-2xl font-extrabold text-stone-900">₹{finalTotal.toFixed(2)}</span>
                  </div>
                </div>

                <div className="p-5 bg-stone-50 border-t border-stone-100">
                  <Button
                    href="/checkout"
                    variant="primary"
                    className="w-full h-14 text-lg font-bold shadow-md shadow-brand-primary/20 flex items-center justify-center gap-2"
                  >
                    Proceed to Checkout <ChevronRight className="w-5 h-5" />
                  </Button>
                </div>
              </div>
            </div>
            
          </div>
        )}
      </Container>
    </div>
  );
}
