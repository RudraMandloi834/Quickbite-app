const fs = require('fs');
let code = fs.readFileSync('frontend/src/app/checkout/page.tsx', 'utf8');

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

// Extract from "const handlePlaceOrder" up to the end of the function.
// We can use a simpler replacement method: find start and end indices.
const startIdx = code.indexOf('  const handlePlaceOrder = async () => {');
const endIdx = code.indexOf('  return (', startIdx);
if (startIdx !== -1 && endIdx !== -1) {
    code = code.substring(0, startIdx) + newHandlePlaceOrder + '\n\n' + code.substring(endIdx);
    fs.writeFileSync('frontend/src/app/checkout/page.tsx', code);
    console.log("Successfully replaced handlePlaceOrder");
} else {
    console.error("Could not find bounds");
}
