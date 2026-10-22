import re

file_path = "frontend/src/app/cart/page.tsx"
with open(file_path, "r") as f:
    content = f.read()

content = content.replace('import { useEffect, useState, useCallback } from "react";', 'import { useState } from "react";\nimport { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";')
content = re.sub(r'const \[rawCart, setRawCart\] = useState<Cart \| null>\(null\);\n\s*const \[cartDisplay, setCartDisplay\] = useState<CartDisplay \| null>\(null\);\n\s*const \[isLoading, setIsLoading\] = useState\(true\);\n\s*const \[isUpdating, setIsUpdating\] = useState\(false\);\n\s*const \[error, setError\] = useState<string \| null>\(null\);\n', 'const [isUpdating, setIsUpdating] = useState(false);\n  const queryClient = useQueryClient();\n', content)

content = re.sub(r'const loadCart = useCallback\(async \(\) => \{[\s\S]*?\}, \[\]\);\n\s*useEffect\(\(\) => \{[\s\S]*?\}, \[loadCart\]\);\n', '', content)

query_str = """
  const { data, isLoading, isError, error: queryError } = useQuery({
    queryKey: ['cart'],
    queryFn: async () => {
      const cartId = getStoredCartId();
      if (!cartId) return { rawCart: null, cartDisplay: null };
      const [cartData, displayData] = await Promise.all([
        getCart(cartId).catch(() => null),
        fetchCartDisplay(cartId),
      ]);
      if (cartData && displayData && displayData.items.length > 0) {
        return { rawCart: cartData, cartDisplay: displayData };
      }
      return { rawCart: null, cartDisplay: null };
    }
  });
  
  const rawCart = data?.rawCart;
  const cartDisplay = data?.cartDisplay;
  const error = isError ? (queryError as Error)?.message || "Failed to load your cart" : null;
  const loadCart = () => queryClient.invalidateQueries({ queryKey: ['cart'] });
"""

idx = content.find("export default function CartPage() {")
idx = content.find("const [isUpdating", idx)
content = content[:idx] + query_str + content[idx:]

with open(file_path, "w") as f:
    f.write(content)

