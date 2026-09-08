"use client";

import { useEffect, useState, useRef } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Container } from "@/components/Container";
import { Card } from "@/components/Card";
import { Button } from "@/components/Button";
import { Cart, CartDisplay } from "@/types/cart";
import { RazorpayOptions } from "@/types/razorpay";
import {
  getCart,
  createOrderFromCart,
  createRazorpayOrder,
  verifyPayment,
} from "@/lib/api";
import {
  getStoredCartId,
  fetchCartDisplay,
  clearStoredCartId,
} from "@/lib/cart";
import { loadRazorpay } from "@/lib/razorpay";
import { useAuth } from "@/context/AuthContext";

export default function CheckoutPage() {
  const router = useRouter();
  const { user, loading, requireAuth } = useAuth();

  const [rawCart, setRawCart] = useState<Cart | null>(null);
  const [cartDisplay, setCartDisplay] = useState<CartDisplay | null>(null);

  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const isSubmittingRef = useRef(false);
  const [error, setError] = useState<string | null>(null);
  const [pendingOrderId, setPendingOrderId] = useState<number | null>(null);
  const [paymentFailed, setPaymentFailed] = useState(false);
  const [paymentErrorReason, setPaymentErrorReason] = useState<string | null>(null);


  useEffect(() => {
    let ignore = false;
    if (loading) return;
    if (!user) {
      requireAuth(() => {});
      return;
    }
    const fetchIt = async () => {
      setIsLoading(true);
      setError(null);
      const cartId = getStoredCartId();
      if (!cartId) {
        if (!ignore) {
          setRawCart(null);
          setCartDisplay(null);
          setIsLoading(false);
        }
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
          setError(err instanceof Error ? err.message : "Failed to load checkout details");
          setIsLoading(false);
        }
      }
    };
    fetchIt();
    return () => { ignore = true; };
  }, []);

  const handlePlaceOrder = async () => {
    if (isSubmittingRef.current) return;
    if (!rawCart) {
      setError("Please select a customer and ensure cart is not empty");
      return;
    }

    isSubmittingRef.current = true;
    setIsSubmitting(true);
    setError(null);
    setPaymentFailed(false);
    setPaymentErrorReason(null);

    try {
      const res = await loadRazorpay();

      if (!res || typeof (window as any).Razorpay !== "function") {
        setError("Razorpay SDK failed to load. Are you online? If you have an adblocker, try disabling it for this page.");
        setIsSubmitting(false);
        isSubmittingRef.current = false;
        return;
      }

      // 1. Create order OR reuse existing
      let orderIdToPay = pendingOrderId;
      if (!orderIdToPay) {
        const order = await createOrderFromCart(rawCart.id);
        orderIdToPay = order.id;
        setPendingOrderId(order.id);
      }

      // 2. Initiate Razorpay Payment
      const initResponse = await createRazorpayOrder(orderIdToPay);

      // 3. Open Razorpay Checkout
      const options: RazorpayOptions = {
        key: initResponse.razorpayKeyId,
        amount: Math.round(initResponse.amount * 100),
        currency: initResponse.currency,
        name: "QuickBite",
        description: `Order #${orderIdToPay}`,
        order_id: initResponse.razorpayOrderId,
        handler: async function (response: { razorpay_order_id: string; razorpay_payment_id: string; razorpay_signature: string }) {
          try {
            // 4. Verify payment on our backend
            await verifyPayment({
              razorpayOrderId: response.razorpay_order_id,
              razorpayPaymentId: response.razorpay_payment_id,
              razorpaySignature: response.razorpay_signature,
            });

            // 5. Success -> Clear cart and redirect
            clearStoredCartId();
            router.push(`/orders/${orderIdToPay}?success=true`);
          } catch (verifyErr) {
            console.error("Payment verification failed:", verifyErr);
            setPaymentFailed(true);
            setPaymentErrorReason("Payment verification failed. Please contact support.");
            setIsSubmitting(false);
            isSubmittingRef.current = false;
          }
        },
        modal: {
          ondismiss: function () {
            setIsSubmitting(false);
            isSubmittingRef.current = false;
          }
        },
        prefill: {
          name: "",
          email: user?.sub || "",
          contact: "",
        },
        theme: {
          color: "#0f172a", // brand-fg
        },
      };

      // Handle Razorpay explicit failures (like test mode failures)
      const rzp = new (window as any).Razorpay(options);
      rzp.on('payment.failed', function (response: any) {
         setPaymentFailed(true);
         setPaymentErrorReason(response.error.description || "Payment failed");
         setIsSubmitting(false);
            isSubmittingRef.current = false;
         rzp.close();
      });
      rzp.open();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to initiate payment");
      setIsSubmitting(false);
            isSubmittingRef.current = false;
    }
  };

  if (isLoading) {
    return (
      <Container className="py-20 flex justify-center">
        <div className="animate-pulse space-y-4 text-center">
          <div className="h-6 w-32 bg-brand-border rounded mx-auto" />
          <div className="h-4 w-48 bg-brand-border/60 rounded mx-auto" />
        </div>
      </Container>
    );
  }

  return (
    <div className="bg-brand-bg min-h-screen pb-20">

      <Container className="pt-10">
        <div className="mb-8">
          <h1 className="font-serif text-4xl sm:text-5xl font-semibold tracking-tight text-brand-fg mb-3">
            Checkout
          </h1>
          <p className="text-brand-muted text-lg">
            Review your order and securely complete payment.
          </p>
        </div>

        {error && (
          <div className="mb-8 p-4 bg-red-50 text-red-700 rounded-lg border border-red-200">
            {error}
            {pendingOrderId && (
              <div className="mt-2 text-sm">
                Order #{pendingOrderId} was created but payment failed. You can retry payment from the orders page.
              </div>
            )}
          </div>
        )}

        {paymentFailed ? (
          <Card className="p-8 md:p-12 text-center bg-white shadow-sm border-red-200">
            <div className="w-16 h-16 rounded-full bg-red-50 text-red-500 flex items-center justify-center mx-auto mb-6">
              <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
            </div>
            <h2 className="text-2xl font-serif font-semibold text-brand-fg mb-3">
              Payment didn't go through
            </h2>
            <p className="text-brand-muted text-lg mb-8 max-w-md mx-auto">
              Your order and cart are safe. You can try the payment again.
              {paymentErrorReason && (
                <span className="block mt-2 text-sm text-red-600 bg-red-50 py-2 px-3 rounded-md border border-red-100">
                  {paymentErrorReason}
                </span>
              )}
            </p>
            <div className="flex flex-col sm:flex-row justify-center gap-4">
              <Button
                type="button"
                variant="primary"
                size="lg"
                onClick={handlePlaceOrder}
                disabled={isSubmitting}
                className="min-w-[200px]"
              >
                {isSubmitting ? "Retrying..." : "Retry Payment"}
              </Button>
              <Link href="/cart">
                <Button
                  type="button"
                  variant="outline"
                  size="lg"
                  className="w-full sm:w-auto min-w-[200px]"
                >
                  Back to Cart
                </Button>
              </Link>
            </div>
          </Card>
        ) : !cartDisplay || cartDisplay.items.length === 0 ? (
          <Card className="p-12 text-center bg-white shadow-sm border-brand-border/50">
            <svg
              className="w-12 h-12 text-brand-muted mx-auto mb-4"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
            </svg>
            <h2 className="text-xl font-medium text-brand-fg mb-2">
              Your cart is empty
            </h2>
            <p className="text-brand-muted mb-6">
              Looks like you haven&apos;t added anything to your cart yet.
            </p>
            <Link
              href="/restaurants"
              className="inline-block bg-brand-fg text-brand-bg px-6 py-2.5 rounded-full font-medium hover:bg-brand-fg/90 transition-colors"
            >
              Browse Restaurants
            </Link>
          </Card>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
            <div className="lg:col-span-2 space-y-6">
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
                    disabled={isSubmitting || !rawCart}
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
