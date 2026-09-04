"use client";

import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import { Container } from "@/components/Container";
import { Card } from "@/components/Card";
import { Badge } from "@/components/Badge";
import { Button } from "@/components/Button";
import { Cart, CartDisplay } from "@/types/cart";
import { getCart } from "@/lib/api";
import {
  getStoredCartId,
  fetchCartDisplay,
  updateItemQuantity,
  removeItemFromCart,
} from "@/lib/cart";

export default function CartPage() {
  const [rawCart, setRawCart] = useState<Cart | null>(null);
  const [cartDisplay, setCartDisplay] = useState<CartDisplay | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isUpdating, setIsUpdating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadCart = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    const cartId = getStoredCartId();
    if (!cartId) {
      setRawCart(null);
      setCartDisplay(null);
      setIsLoading(false);
      return;
    }

    try {
      const [cartData, displayData] = await Promise.all([
        getCart(cartId).catch(() => null),
        fetchCartDisplay(cartId),
      ]);

      if (cartData && displayData && displayData.items.length > 0) {
        setRawCart(cartData);
        setCartDisplay(displayData);
      } else {
        setRawCart(null);
        setCartDisplay(null);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load your cart");
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    let ignore = false;

    async function initialLoad() {
      const cartId = getStoredCartId();
      if (!cartId) {
        setIsLoading(false);
        return;
      }

      try {
        const [cartData, displayData] = await Promise.all([
          getCart(cartId).catch(() => null),
          fetchCartDisplay(cartId),
        ]);

        if (!ignore) {
          if (cartData && displayData && displayData.items.length > 0) {
            setRawCart(cartData);
            setCartDisplay(displayData);
          } else {
            setRawCart(null);
            setCartDisplay(null);
          }
          setIsLoading(false);
        }
      } catch (err) {
        if (!ignore) {
          setError(err instanceof Error ? err.message : "Failed to load your cart");
          setIsLoading(false);
        }
      }
    }

    initialLoad();

    return () => {
      ignore = true;
    };
  }, []);

  const handleQuantityChange = async (menuItemId: number, newQty: number) => {
    if (!rawCart) return;
    setIsUpdating(true);
    try {
      const updated = await updateItemQuantity(rawCart, menuItemId, newQty);
      if (!updated) {
        setRawCart(null);
        setCartDisplay(null);
      } else {
        setRawCart(updated);
        const display = await fetchCartDisplay(updated.id);
        setCartDisplay(display);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to update item quantity");
    } finally {
      setIsUpdating(false);
    }
  };

  const handleRemove = async (menuItemId: number) => {
    if (!rawCart) return;
    setIsUpdating(true);
    try {
      const updated = await removeItemFromCart(rawCart, menuItemId);
      if (!updated) {
        setRawCart(null);
        setCartDisplay(null);
      } else {
        setRawCart(updated);
        const display = await fetchCartDisplay(updated.id);
        setCartDisplay(display);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to remove item");
    } finally {
      setIsUpdating(false);
    }
  };

  return (
    <div className="flex-1 py-10 sm:py-16">
      <Container>
        {/* Page Header */}
        <div className="mb-8 sm:mb-12">
          <Badge variant="default" className="mb-2">
            Your Selection
          </Badge>
          <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
            <div>
              <h1 className="text-4xl sm:text-5xl font-serif text-brand-fg tracking-tight">
                Your Cart
              </h1>
              {cartDisplay && cartDisplay.items.length > 0 && (
                <p className="text-brand-muted text-base mt-2">
                  Ordering from{" "}
                  <Link
                    href={`/restaurants/${cartDisplay.restaurantId}`}
                    className="font-medium text-brand-fg underline underline-offset-4 hover:text-brand-primary transition-colors"
                  >
                    {cartDisplay.restaurantName}
                  </Link>
                </p>
              )}
            </div>
            {cartDisplay && cartDisplay.items.length > 0 && (
              <span className="text-sm font-medium text-brand-muted">
                {cartDisplay.items.reduce((acc, item) => acc + item.quantity, 0)} items selected
              </span>
            )}
          </div>
        </div>

        {/* Loading State */}
        {isLoading && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-10 animate-pulse">
            <div className="lg:col-span-2 space-y-4">
              {[1, 2, 3].map((idx) => (
                <Card key={idx} className="p-6">
                  <div className="flex justify-between items-start gap-4">
                    <div className="space-y-2 flex-1">
                      <div className="h-6 w-1/3 bg-brand-border/60 rounded" />
                      <div className="h-4 w-1/2 bg-brand-border/40 rounded" />
                    </div>
                    <div className="h-6 w-16 bg-brand-border/60 rounded" />
                  </div>
                </Card>
              ))}
            </div>
            <div className="lg:col-span-1">
              <Card className="p-6 space-y-4">
                <div className="h-6 w-1/2 bg-brand-border/60 rounded" />
                <div className="h-4 w-full bg-brand-border/40 rounded" />
                <div className="h-12 w-full bg-brand-border/60 rounded-md" />
              </Card>
            </div>
          </div>
        )}

        {/* Error State */}
        {!isLoading && error && (
          <div className="max-w-xl mx-auto my-12 text-center">
            <Card className="p-8 border-rose-200 bg-white shadow-sm">
              <div className="w-12 h-12 mx-auto mb-4 rounded-full bg-rose-50 flex items-center justify-center text-rose-600">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                </svg>
              </div>
              <h2 className="text-2xl font-serif text-brand-fg mb-2">Cart Error</h2>
              <p className="text-brand-muted text-sm mb-6">{error}</p>
              <div className="flex gap-4 justify-center">
                <Button href="/restaurants" variant="outline">
                  Browse Restaurants
                </Button>
                <Button onClick={loadCart} variant="primary">
                  Try Again
                </Button>
              </div>
            </Card>
          </div>
        )}

        {/* Empty State */}
        {!isLoading && !error && (!cartDisplay || cartDisplay.items.length === 0) && (
          <div className="max-w-md mx-auto my-16 text-center">
            <Card className="p-10 bg-white shadow-xs border-brand-border/80">
              <div className="w-16 h-16 mx-auto mb-5 rounded-full bg-brand-bg flex items-center justify-center text-brand-muted">
                <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
                </svg>
              </div>
              <h2 className="text-2xl sm:text-3xl font-serif text-brand-fg mb-3">
                Your cart is empty
              </h2>
              <p className="text-brand-muted text-sm leading-relaxed mb-8">
                Explore our curated restaurants to find honest, memorable dishes prepared without the noise.
              </p>
              <Button href="/restaurants" size="lg" variant="primary" className="w-full">
                Find Restaurants
              </Button>
            </Card>
          </div>
        )}

        {/* Populated Cart State */}
        {!isLoading && !error && cartDisplay && cartDisplay.items.length > 0 && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
            {/* Left Column: Cart Items List */}
            <div className="lg:col-span-2 space-y-4">
              {cartDisplay.items.map((item) => (
                <Card
                  key={item.menuItemId}
                  className="p-6 bg-white shadow-xs hover:border-brand-primary/30 transition-colors"
                >
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div className="space-y-1 flex-1">
                      <div className="flex items-center justify-between sm:justify-start gap-3">
                        <h3 className="font-serif text-xl font-medium text-brand-fg">
                          {item.name}
                        </h3>
                      </div>
                      {item.description && (
                        <p className="text-brand-muted text-sm line-clamp-1">
                          {item.description}
                        </p>
                      )}
                      <p className="text-xs text-brand-muted font-medium pt-1">
                        ₹{item.unitPrice.toFixed(2)} each
                      </p>
                    </div>

                    <div className="flex items-center justify-between sm:justify-end gap-6 pt-3 sm:pt-0 border-t sm:border-t-0 border-brand-border/60">
                      {/* Quantity Controls */}
                      <div className="flex items-center rounded-lg border border-brand-border bg-brand-bg/50 p-1">
                        <button
                          type="button"
                          disabled={isUpdating}
                          onClick={() => handleQuantityChange(item.menuItemId, item.quantity - 1)}
                          className="w-7 h-7 flex items-center justify-center rounded text-brand-fg hover:bg-white transition-colors disabled:opacity-40"
                          aria-label="Decrease quantity"
                        >
                          –
                        </button>
                        <span className="w-8 text-center text-sm font-semibold text-brand-fg">
                          {item.quantity}
                        </span>
                        <button
                          type="button"
                          disabled={isUpdating}
                          onClick={() => handleQuantityChange(item.menuItemId, item.quantity + 1)}
                          className="w-7 h-7 flex items-center justify-center rounded text-brand-fg hover:bg-white transition-colors disabled:opacity-40"
                          aria-label="Increase quantity"
                        >
                          +
                        </button>
                      </div>

                      {/* Line Total */}
                      <span className="font-serif text-lg font-semibold text-brand-fg min-w-[70px] text-right">
                        ₹{item.subtotal.toFixed(2)}
                      </span>

                      {/* Remove Action */}
                      <button
                        type="button"
                        disabled={isUpdating}
                        onClick={() => handleRemove(item.menuItemId)}
                        className="text-xs font-medium text-brand-muted hover:text-rose-600 transition-colors disabled:opacity-40"
                        title="Remove item"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                        </svg>
                      </button>
                    </div>
                  </div>
                </Card>
              ))}

              <div className="pt-2 flex justify-between items-center text-sm">
                <Link
                  href={`/restaurants/${cartDisplay.restaurantId}`}
                  className="text-brand-muted hover:text-brand-fg transition-colors inline-flex items-center gap-1 font-medium"
                >
                  ← Add more items from {cartDisplay.restaurantName}
                </Link>
              </div>
            </div>

            {/* Right Column: Order Summary */}
            <div className="lg:col-span-1">
              <Card className="p-6 sm:p-8 bg-white shadow-xs sticky top-24">
                <h2 className="font-serif text-2xl font-medium text-brand-fg mb-6 pb-4 border-b border-brand-border">
                  Order Summary
                </h2>

                <div className="space-y-3.5 text-sm">
                  <div className="flex justify-between text-brand-muted">
                    <span>Items subtotal</span>
                    <span className="font-medium text-brand-fg">
                      ₹{cartDisplay.totalAmount.toFixed(2)}
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
                      ₹{cartDisplay.totalAmount.toFixed(2)}
                    </span>
                  </div>
                </div>

                <div className="mt-8 space-y-3">
                  <Button
                    href="/checkout"
                    size="lg"
                    variant="primary"
                    className="w-full text-base font-medium h-13"
                  >
                    Proceed to checkout
                  </Button>
                  <p className="text-center text-xs text-brand-muted">
                    Checkout and order placement will be available on the next step.
                  </p>
                </div>
              </Card>
            </div>
          </div>
        )}
      </Container>
    </div>
  );
}
