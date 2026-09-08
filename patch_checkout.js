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
        amount: initResponse.amount,
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

code = code.replace(/  const handlePlaceOrder = async \(\) => \{[\s\S]*?theme: \{\n\s*color: "#0f172a", \/\/ brand-fg\n\s*\},\n\s*\};\n\n\s*const rzp = new \(window as any\)\.Razorpay\(options\);\n\s*rzp\.open\(\);\n\s*\} catch \(err\) \{\n\s*setError\(err instanceof Error \? err\.message : "Failed to initiate payment"\);\n\s*setIsSubmitting\(false\);\n\s*\}\n\s*\};/, newHandlePlaceOrder);

fs.writeFileSync('frontend/src/app/checkout/page.tsx', code);
