const fs = require('fs');

// 1. Fix Cart imports and methods
let cart = fs.readFileSync('frontend/src/app/cart/page.tsx', 'utf8');
cart = cart.replace('import { getCartDisplay, updateCartItemQuantity, removeCartItem } from "@/lib/cart";', 'import { fetchCartDisplay, updateItemQuantity, removeItemFromCart, getStoredCartId } from "@/lib/cart";');
cart = cart.replace('const display = await getCartDisplay();', `const cid = getStoredCartId(); if (!cid) { setIsLoading(false); return; }; const display = await fetchCartDisplay(cid);`);
cart = cart.replace('await updateCartItemQuantity(', 'await updateItemQuantity(');
cart = cart.replace('await removeCartItem(', 'await removeItemFromCart(');
fs.writeFileSync('frontend/src/app/cart/page.tsx', cart);

// 2. Overwrite Checkout completely to ensure it uses the exact original backend logic + new UI
const checkoutContent = `"use client";

import { useEffect, useState, useRef } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Container } from "@/components/Container";
import { Card } from "@/components/Card";
import { Button } from "@/components/Button";
import { Cart, CartDisplay } from "@/types/cart";
import { RazorpayOptions } from "@/types/razorpay";
import { getCart, createOrderFromCart, createRazorpayOrder, verifyPayment } from "@/lib/api";
import { getStoredCartId, fetchCartDisplay, clearStoredCartId } from "@/lib/cart";
import { loadRazorpay } from "@/lib/razorpay";
import { useAuth } from "@/context/AuthContext";
import { ArrowLeft, MapPin, CreditCard, Clock, ChevronRight, CheckCircle2, AlertCircle } from "lucide-react";

export default function CheckoutPage() {
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();

  const [rawCart, setRawCart] = useState<Cart | null>(null);
  const [cartDisplay, setCartDisplay] = useState<CartDisplay | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>("");

  const [isSubmitting, setIsSubmitting] = useState(false);
  const isSubmittingRef = useRef(false);
  
  const [paymentErrorReason, setPaymentErrorReason] = useState<string | null>("");
  const [address, setAddress] = useState("Home - 123 Main St, Apartment 4B");
  const [paymentMethod, setPaymentMethod] = useState("card");
  const [pendingOrderId, setPendingOrderId] = useState<number | null>(null);

  useEffect(() => {
    let ignore = false;
    async function loadCart() {
      if (authLoading) return;
      if (!user) {
        if (!ignore) router.push("/login?redirect=/checkout");
        return;
      }
      try {
        const cid = getStoredCartId();
        if (!cid) {
          setIsLoading(false);
          return;
        }
        const display = await fetchCartDisplay(cid);
        const raw = await getCart(cid);
        if (!ignore) {
          setCartDisplay(display);
          setRawCart(raw);
          setIsLoading(false);
        }
      } catch (err: unknown) {
        if (!ignore) {
          setError((err as Error).message || "Failed to load checkout details");
          setIsLoading(false);
        }
      }
    }
    loadCart();
    return () => { ignore = true; };
  }, [user, authLoading, router]);

  const handlePlaceOrder = async () => {
    if (isSubmittingRef.current) return;
    if (!rawCart) {
      setError("Please select a customer and ensure cart is not empty");
      return;
    }

    isSubmittingRef.current = true;
    setIsSubmitting(true);
    setError(null);
    setPaymentErrorReason(null);

    try {
      const res = await loadRazorpay();

      if (!res || typeof (window as any).Razorpay !== "function") {
        setError("Razorpay SDK failed to load. Are you online? If you have an adblocker, try disabling it for this page.");
        setIsSubmitting(false);
        isSubmittingRef.current = false;
        return;
      }

      let orderIdToPay = pendingOrderId;
      if (!orderIdToPay) {
        const order = await createOrderFromCart(rawCart.id);
        orderIdToPay = order.id;
        setPendingOrderId(order.id);
      }

      const initResponse = await createRazorpayOrder(orderIdToPay);

      if (initResponse.razorpayKeyId === "dummy-key-id" || initResponse.razorpayKeyId.includes("dev")) {
        await verifyPayment({
          razorpayPaymentId: "dev_success",
          razorpayOrderId: initResponse.razorpayOrderId,
          razorpaySignature: "dev_signature",
        });
        clearStoredCartId();
        router.push(\`/orders/\${orderIdToPay}?success=true\`);
        return;
      }

      const options: RazorpayOptions = {
        key: initResponse.razorpayKeyId,
        amount: Math.round(initResponse.amount * 100),
        currency: initResponse.currency,
        name: "QuickBite",
        description: \`Order #\${orderIdToPay}\`,
        order_id: initResponse.razorpayOrderId,
        handler: async function (response: { razorpay_order_id: string; razorpay_payment_id: string; razorpay_signature: string }) {
          try {
            await verifyPayment({
              razorpayOrderId: response.razorpay_order_id,
              razorpayPaymentId: response.razorpay_payment_id,
              razorpaySignature: response.razorpay_signature,
            });
            clearStoredCartId();
            router.push(\`/orders/\${orderIdToPay}?success=true\`);
          } catch (err: unknown) {
            setPaymentErrorReason((err as Error).message || "Payment verification failed on the server.");
            setIsSubmitting(false);
            isSubmittingRef.current = false;
          }
        },
        modal: {
          ondismiss: function () {
            setPaymentErrorReason("Payment was cancelled or modal was closed.");
            setIsSubmitting(false);
            isSubmittingRef.current = false;
          },
        },
        theme: { color: "#F97316" },
      };

      const razorpay = new (window as any).Razorpay(options);
      razorpay.on("payment.failed", function (response: any) {
        setPaymentErrorReason(response.error.description);
        setIsSubmitting(false);
        isSubmittingRef.current = false;
      });
      razorpay.open();
    } catch (err: unknown) {
      setPaymentErrorReason((err as Error).message || "An error occurred during payment initiation.");
      setIsSubmitting(false);
      isSubmittingRef.current = false;
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
                {[...Array(3)].map((_, i) => <div key={i} className="h-32 bg-stone-200 rounded-2xl" />)}
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
          <h1 className="text-3xl font-extrabold text-stone-900">Checkout</h1>
        </div>

        {error ? (
          <div className="bg-red-50 text-red-700 p-6 rounded-2xl border border-red-100 font-medium">{error}</div>
        ) : paymentErrorReason ? (
          <div className="bg-white rounded-2xl p-10 flex flex-col items-center justify-center text-center shadow-sm border border-stone-100 max-w-lg mx-auto">
            <AlertCircle className="w-16 h-16 text-red-400 mb-4" />
            <h2 className="text-2xl font-bold text-stone-900 mb-2">Payment Failed</h2>
            <p className="text-stone-500 mb-8">{paymentErrorReason}</p>
            <div className="flex gap-4 w-full">
              <Button onClick={() => handlePlaceOrder()} variant="primary" className="flex-1 font-bold">Try Again</Button>
              <Button href="/cart" variant="outline" className="flex-1 font-bold">Back to Cart</Button>
            </div>
          </div>
        ) : !cartDisplay || cartDisplay.items.length === 0 ? (
          <div className="bg-white rounded-2xl p-16 text-center shadow-sm border border-stone-100 max-w-2xl mx-auto">
            <h2 className="text-2xl font-bold text-stone-900 mb-2">Cart is empty</h2>
            <Button href="/restaurants" variant="primary" className="font-bold px-8 mt-4">Browse Restaurants</Button>
          </div>
        ) : (
          <div className="flex flex-col lg:flex-row gap-8 items-start">
            
            {/* Left Column - Checkout Steps */}
            <div className="flex-1 w-full space-y-6">
              
              {/* Address */}
              <div className="bg-white rounded-2xl p-6 border border-stone-100 shadow-sm">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-xl font-bold text-stone-900 flex items-center gap-2">
                    <MapPin className="w-5 h-5 text-brand-primary" /> Delivery Address
                  </h2>
                  <button className="text-sm font-bold text-brand-primary hover:text-brand-primary/80">Change</button>
                </div>
                <div className="bg-stone-50 rounded-xl p-4 border border-stone-200">
                  <p className="font-bold text-stone-900">Home</p>
                  <p className="text-sm text-stone-500 mt-1">{address}</p>
                  <input type="text" className="mt-3 w-full bg-white border border-stone-200 rounded-lg p-2 text-sm focus:outline-none focus:border-brand-primary" value={address} onChange={e => setAddress(e.target.value)} placeholder="Enter full address" />
                </div>
              </div>

              {/* Delivery Time */}
              <div className="bg-white rounded-2xl p-6 border border-stone-100 shadow-sm">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-xl font-bold text-stone-900 flex items-center gap-2">
                    <Clock className="w-5 h-5 text-brand-primary" /> Delivery Time
                  </h2>
                </div>
                <div className="flex gap-4">
                  <div className="flex-1 bg-brand-primary/5 border-2 border-brand-primary rounded-xl p-4 cursor-pointer">
                    <p className="font-bold text-stone-900">Asap</p>
                    <p className="text-sm text-stone-500 mt-1">20 - 30 mins</p>
                  </div>
                  <div className="flex-1 bg-stone-50 border-2 border-transparent rounded-xl p-4 cursor-pointer hover:border-stone-200 transition-colors">
                    <p className="font-bold text-stone-900">Schedule</p>
                    <p className="text-sm text-stone-500 mt-1">Choose time</p>
                  </div>
                </div>
              </div>

              {/* Payment Method */}
              <div className="bg-white rounded-2xl p-6 border border-stone-100 shadow-sm">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-xl font-bold text-stone-900 flex items-center gap-2">
                    <CreditCard className="w-5 h-5 text-brand-primary" /> Payment Method
                  </h2>
                </div>
                <div className="space-y-3">
                  <label className={\`flex items-center justify-between p-4 rounded-xl border-2 cursor-pointer transition-colors \${paymentMethod === 'card' ? 'border-brand-primary bg-brand-primary/5' : 'border-stone-100 hover:border-stone-200'}\`}>
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 bg-white shadow-sm rounded flex items-center justify-center"><CreditCard className="w-4 h-4 text-stone-600" /></div>
                      <span className="font-bold text-stone-900">Credit / Debit Card</span>
                    </div>
                    <input type="radio" name="payment" checked={paymentMethod === 'card'} onChange={() => setPaymentMethod('card')} className="w-4 h-4 text-brand-primary focus:ring-brand-primary" />
                  </label>
                  <label className={\`flex items-center justify-between p-4 rounded-xl border-2 cursor-pointer transition-colors \${paymentMethod === 'upi' ? 'border-brand-primary bg-brand-primary/5' : 'border-stone-100 hover:border-stone-200'}\`}>
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 bg-white shadow-sm rounded flex items-center justify-center font-bold text-xs text-stone-600">UPI</div>
                      <span className="font-bold text-stone-900">UPI / Netbanking</span>
                    </div>
                    <input type="radio" name="payment" checked={paymentMethod === 'upi'} onChange={() => setPaymentMethod('upi')} className="w-4 h-4 text-brand-primary focus:ring-brand-primary" />
                  </label>
                </div>
              </div>

              {/* Items Summary */}
              <div className="bg-white rounded-2xl p-6 border border-stone-100 shadow-sm">
                <h2 className="text-xl font-bold text-stone-900 mb-4">Items Review</h2>
                <div className="space-y-3">
                  {cartDisplay.items.map(item => (
                    <div key={item.menuItemId} className="flex justify-between items-start gap-4 pb-3 border-b border-stone-100 last:border-0 last:pb-0">
                      <div>
                        <p className="font-bold text-stone-900"><span className="text-brand-primary mr-1">{item.quantity}x</span> {item.name}</p>
                      </div>
                      <p className="font-bold text-stone-900">₹{item.subtotal.toFixed(2)}</p>
                    </div>
                  ))}
                </div>
              </div>

            </div>

            {/* Right Column - Order Summary */}
            <div className="w-full lg:w-96 shrink-0">
              <div className="bg-white rounded-2xl border border-stone-100 shadow-sm sticky top-24 overflow-hidden">
                <div className="bg-stone-50 p-5 border-b border-stone-100">
                  <h3 className="font-bold text-stone-900 text-lg">Order Summary</h3>
                  <p className="text-sm text-stone-500">{cartDisplay.restaurantName}</p>
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
                    onClick={handlePlaceOrder}
                    disabled={isSubmitting || !address.trim()}
                    variant="primary"
                    className="w-full h-14 text-lg font-bold shadow-md shadow-brand-primary/20 flex items-center justify-center gap-2 disabled:opacity-70"
                  >
                    {isSubmitting ? (
                      <span className="flex items-center gap-2">
                        <svg className="animate-spin h-5 w-5 text-white" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"/></svg>
                        Processing...
                      </span>
                    ) : (
                      \`Place Order • ₹\${finalTotal.toFixed(2)}\`
                    )}
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
`;
fs.writeFileSync('frontend/src/app/checkout/page.tsx', checkoutContent);
