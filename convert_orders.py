import re

file_path = "frontend/src/app/orders/page.tsx"
with open(file_path, "r") as f:
    content = f.read()

# Replace React hooks with React Query
content = content.replace('import { useEffect, useState, useCallback } from "react";', 'import { useQuery } from "@tanstack/react-query";')
content = re.sub(r'const \[orders, setOrders\] = useState<OrderWithRestaurant\[\]>\(\[\]\);\n\s*const \[isLoading, setIsLoading\] = useState\(true\);\n\s*const \[error, setError\] = useState<string \| null>\(null\);\n', '', content)

# Remove useEffect and fetchOrders
content = re.sub(r'const fetchOrders = useCallback\(async \(ignoreCache = false\) => \{[\s\S]*?\}, \[router, user, loading, requireAuth\]\);\n\s*useEffect\(\(\) => \{[\s\S]*?\}, \[fetchOrders\]\);\n', '', content)

query_str = """
  const { data: orders = [], isLoading, isError, error: queryError, refetch: fetchOrders } = useQuery({
    queryKey: ['myOrders'],
    queryFn: async () => {
      const fetchedOrders = await getMyOrders();
      const restaurants = await getRestaurants();
      return fetchedOrders.map((order) => {
        const restaurant = restaurants.find((r) => r.id === order.restaurantId);
        return {
          ...order,
          restaurantName: restaurant?.name || "Unknown Restaurant",
        };
      });
    },
    enabled: !!user,
  });
  
  const error = isError ? (queryError as Error)?.message || "Failed to load orders" : null;
"""
idx = content.find("export default function MyOrdersPage() {")
idx = content.find("\n", idx)
idx = content.find("const { user, loading, requireAuth } = useAuth();", idx)
idx = content.find("\n", idx)

content = content[:idx] + "\n" + query_str + content[idx:]

with open(file_path, "w") as f:
    f.write(content)

