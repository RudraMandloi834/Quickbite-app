const fs = require('fs');
let code = fs.readFileSync('frontend/src/app/checkout/page.tsx', 'utf8');

const stateHooks = `  const [paymentFailed, setPaymentFailed] = useState(false);
  const [paymentErrorReason, setPaymentErrorReason] = useState<string | null>(null);`;
code = code.replace(/  const \[pendingOrderId, setPendingOrderId\] = useState<number \| null>\(null\);/, `  const [pendingOrderId, setPendingOrderId] = useState<number | null>(null);\n${stateHooks}`);

const newHandlePlaceOrder = `  const handlePlaceOrder = async () => {
    if (!rawCart) {
      setError("Please select a customer and ensure cart is not empty");
      return;
    }

    setIsSubmitting(true);
    setError(null);
    setPaymentFailed(false);
    setPaymentErrorReason(null);

    try {
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
        description: \`Order #\${orderIdToPay}\`,
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
            router.push(\`/orders/\${orderIdToPay}?success=true\`);
          } catch (verifyErr) {
            console.error("Payment verification failed:", verifyErr);
            setPaymentFailed(true);
            setPaymentErrorReason("Payment verification failed. Please contact support.");
            setIsSubmitting(false);
          }
        },
        modal: {
          ondismiss: function () {
            setIsSubmitting(false);
          }
        },
        prefill: {
          name: user?.name || "",
          email: user?.email || "",
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
         rzp.close();
      });
      rzp.open();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to initiate payment");
      setIsSubmitting(false);
    }
  };`;

// replace handlePlaceOrder securely
const startIdx = code.indexOf('  const handlePlaceOrder = async () => {');
const endIdx = code.indexOf('  if (isLoading) {', startIdx);
if (startIdx !== -1 && endIdx !== -1) {
    code = code.substring(0, startIdx) + newHandlePlaceOrder + '\n\n' + code.substring(endIdx);
} else {
    console.log("Could not find start or end index!");
}

const failureUI = `        {paymentFailed ? (
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
        ) : !cartDisplay || cartDisplay.items.length === 0 ? (`;

code = code.replace(/        \{\!cartDisplay \|\| cartDisplay\.items\.length === 0 \? \(/, failureUI);

fs.writeFileSync('frontend/src/app/checkout/page.tsx', code);
