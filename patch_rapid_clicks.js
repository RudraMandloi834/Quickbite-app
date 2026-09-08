const fs = require('fs');
let code = fs.readFileSync('frontend/src/app/checkout/page.tsx', 'utf8');

// Add useRef
code = code.replace(/import \{ useEffect, useState \} from "react";/, 'import { useEffect, useState, useRef } from "react";');

// Add ref tracking
code = code.replace(/  const \[isSubmitting, setIsSubmitting\] = useState\(false\);/, `  const [isSubmitting, setIsSubmitting] = useState(false);\n  const isSubmittingRef = useRef(false);`);

// Use ref in handlePlaceOrder
const replaceHandlePlaceOrder = `  const handlePlaceOrder = async () => {
    if (isSubmittingRef.current) return;
    if (!rawCart) {
      setError("Please select a customer and ensure cart is not empty");
      return;
    }

    isSubmittingRef.current = true;
    setIsSubmitting(true);
    setError(null);
    setPaymentFailed(false);
    setPaymentErrorReason(null);`;

code = code.replace(/  const handlePlaceOrder = async \(\) => \{\n    if \(!rawCart\) \{\n      setError\("Please select a customer and ensure cart is not empty"\);\n      return;\n    \}\n\n    setIsSubmitting\(true\);\n    setError\(null\);\n    setPaymentFailed\(false\);\n    setPaymentErrorReason\(null\);/, replaceHandlePlaceOrder);

// Reset ref on failure/success
code = code.replace(/setIsSubmitting\(false\);/g, 'setIsSubmitting(false);\n            isSubmittingRef.current = false;');
code = code.replace(/setIsSubmitting\(false\);\n\s*rzp\.close\(\);/g, 'setIsSubmitting(false);\n         isSubmittingRef.current = false;\n         rzp.close();');

fs.writeFileSync('frontend/src/app/checkout/page.tsx', code);
