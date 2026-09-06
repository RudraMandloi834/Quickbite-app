"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Script from "next/script";
import { Container } from "@/components/Container";
import { Card } from "@/components/Card";
import { Badge } from "@/components/Badge";
import { Button } from "@/components/Button";
import { Cart, CartDisplay } from "@/types/cart";
import { Customer } from "@/types/customer";
import { RazorpayOptions } from "@/types/razorpay";
import {
  getCart,
  getCustomers,
  createOrderFromCart,
  createRazorpayOrder,
  verifyPayment,
} from "@/lib/api";
import {
  getStoredCartId,
  fetchCartDisplay,
  clearStoredCartId,
  assignCartToCustomer,
} from "@/lib/cart";

export default function CheckoutPage() {
  const router = useRouter();

  const [rawCart, setRawCart] = useState<Cart | null>(null);
  const [cartDisplay, setCartDisplay] = useState<CartDisplay | null>(null);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [selectedCustomerId, setSelectedCustomerId] = useState<number | null>(null);

  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pendingOrderId, setPendingOrderId] = useState<number | null>(null);

  const loadCheckoutData = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    const cartId = getStoredCartId();
    if (!cartId) {
      setRawCart(null);
      setCartDisplay(null);
      setCustomers([]);
      setIsLoading(false);
      return;
    }

    try {
      const [cartData, displayData, customersData] = await Promise.all([
        getCart(cartId).catch(() => null),
        fetchCartDisplay(cartId),
        getCustomers().catch(() => [] as Customer[]),
      ]);

      if (cartData && displayData && displayData.items.length > 0) {
        setRawCart(cartData);
        setCartDisplay(displayData);
        setCustomers(customersData);

        if (customersData.length > 0) {
          // Preselect customer matching the cart, or the first available customer
          const matched = customersData.find((c) => c.id === cartData.customerId);
          setSelectedCustomerId(matched ? matched.id : customersData[0].id);
        }
      } else {
        setRawCart(null);
        setCartDisplay(null);
        setCustomers([]);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load checkout details");
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
        const [cartData, displayData, customersData] = await Promise.all([
          getCart(cartId).catch(() => null),
          fetchCartDisplay(cartId),
          getCustomers().catch(() => [] as Customer[]),
        ]);

        if (!ignore) {
          if (cartData && displayData && displayData.items.length > 0) {
            setRawCart(cartData);
            setCartDisplay(displayData);
            setCustomers(customersData);

            if (customersData.length > 0) {
              const matched = customersData.find((c) => c.id === cartData.customerId);
              setSelectedCustomerId(matched ? matched.id : customersData[0].id);
            }
          } else {
            setRawCart(null);
            setCartDisplay(null);
            setCustomers([]);
          }
          setIsLoading(false);
        }
      } catch (err) {
        if (!ignore) {
          setError(err instanceof Error ? err.message : "Failed to load checkout details");
          setIsLoading(false);
        }
      }
    }

    initialLoad();

    return () => {
      ignore = true;
    };
  }, []);


  const handlePlaceOrder = async () => {
    if (!rawCart || !selectedCustomerId) {
      return;
    }

    setIsSubmitting(true);
    setError(null);

    try {
      let orderIdToPay = pendingOrderId;

      if (!orderIdToPay) {
        let finalCartId = rawCart.id;
        if (rawCart.customerId !== selectedCustomerId) {
          const updatedCart = await assignCartToCustomer(rawCart, selectedCustomerId);
          finalCartId = updatedCart.id;
        }

        // Create the QuickBite order
        const order = await createOrderFromCart(finalCartId);
        orderIdToPay = order.id;
        setPendingOrderId(order.id);
        clearStoredCartId(); // Clear cart immediately since backend emptied it
      }

      // Initiate Razorpay payment order
      const paymentInit = await createRazorpayOrder(orderIdToPay);

      const customer = customers.find((c) => c.id === selectedCustomerId);

      const options: RazorpayOptions = {
        key: paymentInit.razorpayKeyId,
        amount: Math.round(paymentInit.amount * 100),
        currency: paymentInit.currency,
        name: "QuickBite",
        description: `Order #${orderIdToPay}`,
        order_id: paymentInit.razorpayOrderId,
        prefill: {
          name: customer?.name || "",
          email: customer?.email || "",
          contact: customer?.phone || "",
        },
        theme: {
          color: "#C2410C", // QuickBite primary color
        },
        handler: async function (response: import("@/types/razorpay").RazorpayResponse) {
          try {
            await verifyPayment({
              razorpayPaymentId: response.razorpay_payment_id,
              razorpayOrderId: response.razorpay_order_id,
              razorpaySignature: response.razorpay_signature,
            });

            // Store order ID locally so it appears in "My Orders"
            const { addStoredOrderId } = await import("@/lib/orders");
            addStoredOrderId(orderIdToPay);

            router.push(`/orders/${orderIdToPay}`);
          } catch (verifyErr) {
            setError(
              verifyErr instanceof Error
                ? verifyErr.message
                : "Payment verification failed. If money was deducted, it will be refunded."
            );
            setIsSubmitting(false);
          }
        },
        modal: {
          ondismiss: function () {
            setIsSubmitting(false);
          },
        },
      };

      const razorpay = new window.Razorpay(options);
      
      razorpay.on("payment.failed", function (response: import("@/types/razorpay").RazorpayErrorResponse) {
        setError(response.error.description || "Payment failed or was cancelled.");
        setIsSubmitting(false);
      });

      razorpay.open();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to initiate payment. Please try again.");
      setIsSubmitting(false);
    }
  };

  return (
    <div className="flex-1 py-10 sm:py-16">
      <Script src="https://checkout.razorpay.com/v1/checkout.js" strategy="lazyOnload" />
      <Container>
        {/* Page Header */}
        <div className="mb-8 sm:mb-12">
          <Badge variant="default" className="mb-2">
            Checkout
          </Badge>
          <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
            <div>
              <h1 className="text-4xl sm:text-5xl font-serif text-brand-fg tracking-tight">
                Review & Place Order
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
                {cartDisplay.items.reduce((acc, item) => acc + item.quantity, 0)} items in cart
              </span>
            )}
          </div>
        </div>

        {/* Loading State */}
        {isLoading && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-10 animate-pulse">
            <div className="lg:col-span-2 space-y-6">
              <Card className="p-6 space-y-4">
                <div className="h-6 w-1/3 bg-brand-border/60 rounded" />
                <div className="space-y-3">
                  <div className="h-16 w-full bg-brand-border/40 rounded-lg" />
                  <div className="h-16 w-full bg-brand-border/40 rounded-lg" />
                </div>
              </Card>
              <Card className="p-6 space-y-4">
                <div className="h-6 w-1/4 bg-brand-border/60 rounded" />
                <div className="space-y-3">
                  <div className="h-12 w-full bg-brand-border/40 rounded" />
                  <div className="h-12 w-full bg-brand-border/40 rounded" />
                </div>
              </Card>
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
              <h2 className="text-2xl font-serif text-brand-fg mb-2">Checkout Error</h2>
              <p className="text-brand-muted text-sm mb-6">{error}</p>
              <div className="flex gap-4 justify-center">
                <Button href="/cart" variant="outline">
                  Return to Cart
                </Button>
                <Button onClick={loadCheckoutData} variant="primary">
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
                There are no items to check out. Select dishes from our curated restaurant menus to proceed.
              </p>
              <Button href="/restaurants" size="lg" variant="primary" className="w-full">
                Explore Restaurants
              </Button>
            </Card>
          </div>
        )}

        {/* Checkout Content State */}
        {!isLoading && !error && cartDisplay && cartDisplay.items.length > 0 && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
            {/* Left Column: Customer Selection & Cart Items */}
            <div className="lg:col-span-2 space-y-6">
              {/* Customer Selector */}
              <Card className="p-6 bg-white shadow-xs">
                <div className="flex items-center justify-between pb-4 mb-4 border-b border-brand-border">
                  <div>
                    <h2 className="font-serif text-xl font-medium text-brand-fg">
                      Select Customer
                    </h2>
                    <p className="text-xs text-brand-muted mt-0.5">
                      Choose which customer profile to place this order under
                    </p>
                  </div>
                  {customers.length > 0 && (
                    <Badge variant="neutral">
                      {customers.length} {customers.length === 1 ? "profile" : "profiles"}
                    </Badge>
                  )}
                </div>

                {customers.length === 0 ? (
                  <div className="p-4 rounded-lg border border-amber-200 bg-amber-50/50 text-amber-800 text-sm">
                    No customer profiles found. Please ensure customers are registered in the system.
                  </div>
                ) : (
                  <div className="space-y-3">
                    {customers.map((cust) => {
                      const isSelected = selectedCustomerId === cust.id;
                      return (
                        <label
                          key={cust.id}
                          className={`flex items-start gap-4 p-4 rounded-xl border cursor-pointer transition-all ${
                            isSelected
                              ? "border-brand-primary bg-brand-primary/5 ring-1 ring-brand-primary shadow-xs"
                              : "border-brand-border bg-white hover:border-brand-muted/40"
                          }`}
                        >
                          <input
                            type="radio"
                            name="customer"
                            value={cust.id}
                            checked={isSelected}
                            onChange={() => setSelectedCustomerId(cust.id)}
                            className="mt-1 h-4 w-4 text-brand-primary focus:ring-brand-primary accent-brand-primary cursor-pointer"
                          />
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center justify-between gap-2">
                              <span className="font-medium text-brand-fg truncate">
                                {cust.name}
                              </span>
                              <span className="text-xs font-mono text-brand-muted shrink-0">
                                ID #{cust.id}
                              </span>
                            </div>
                            <div className="text-xs sm:text-sm text-brand-muted mt-1 space-y-0.5">
                              <div className="flex items-center gap-1.5 truncate">
                                <svg
                                  className="w-3.5 h-3.5 text-brand-muted shrink-0"
                                  fill="none"
                                  stroke="currentColor"
                                  viewBox="0 0 24 24"
                                >
                                  <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    strokeWidth={1.5}
                                    d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
                                  />
                                </svg>
                                <span className="truncate">{cust.email}</span>
                              </div>
                              {cust.phone && (
                                <div className="flex items-center gap-1.5 truncate">
                                  <svg
                                    className="w-3.5 h-3.5 text-brand-muted shrink-0"
                                    fill="none"
                                    stroke="currentColor"
                                    viewBox="0 0 24 24"
                                  >
                                    <path
                                      strokeLinecap="round"
                                      strokeLinejoin="round"
                                      strokeWidth={1.5}
                                      d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z"
                                    />
                                  </svg>
                                  <span>{cust.phone}</span>
                                </div>
                              )}
                            </div>
                          </div>
                        </label>
                      );
                    })}
                  </div>
                )}
              </Card>

              {/* Order Items Review */}
              <Card className="p-6 bg-white shadow-xs">
                <div className="flex items-center justify-between pb-4 mb-4 border-b border-brand-border">
                  <div>
                    <h2 className="font-serif text-xl font-medium text-brand-fg">
                      Items Review
                    </h2>
                    <p className="text-xs text-brand-muted mt-0.5">
                      Order from {cartDisplay.restaurantName}
                    </p>
                  </div>
                  <Link
                    href="/cart"
                    className="text-xs font-medium text-brand-primary hover:text-brand-primary-hover underline underline-offset-4"
                  >
                    Edit Cart
                  </Link>
                </div>

                <div className="divide-y divide-brand-border/60">
                  {cartDisplay.items.map((item) => (
                    <div
                      key={item.menuItemId}
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
                        {item.description && (
                          <p className="text-xs text-brand-muted line-clamp-1">
                            {item.description}
                          </p>
                        )}
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
              </Card>
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
                    type="button"
                    onClick={handlePlaceOrder}
                    disabled={isSubmitting || !selectedCustomerId || customers.length === 0}
                    size="lg"
                    variant="primary"
                    className="w-full text-base font-medium h-13"
                  >
                    {isSubmitting ? (
                      <span className="flex items-center gap-2">
                        <svg
                          className="animate-spin h-5 w-5 text-white"
                          fill="none"
                          viewBox="0 0 24 24"
                        >
                          <circle
                            className="opacity-25"
                            cx="12"
                            cy="12"
                            r="10"
                            stroke="currentColor"
                            strokeWidth="4"
                          />
                          <path
                            className="opacity-75"
                            fill="currentColor"
                            d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                          />
                        </svg>
                        Processing Payment...
                      </span>
                    ) : (
                      `Place Order & Pay • ₹${cartDisplay.totalAmount.toFixed(2)}`
                    )}
                  </Button>
                  <p className="text-center text-xs text-brand-muted">
                    Order will be sent directly to {cartDisplay.restaurantName}.
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

