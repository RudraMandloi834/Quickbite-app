import re

file_path = "frontend/src/app/restaurants/[id]/page.tsx"
with open(file_path, "r") as f:
    content = f.read()

content = content.replace('import { useEffect, useState, useCallback } from "react";', 'import { useState } from "react";\nimport { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";')
content = re.sub(r'const \[restaurant, setRestaurant\] = useState<Restaurant \| null>\(null\);\n\s*const \[menu, setMenu\] = useState<MenuItem\[\]>\(\[\]\);\n\s*const \[isLoading, setIsLoading\] = useState\(true\);\n\s*const \[error, setError\] = useState<string \| null>\(null\);\n', 'const queryClient = useQueryClient();\n', content)

content = re.sub(r'const fetchData = useCallback\(async \(\) => \{[\s\S]*?\}, \[restaurantId\]\);\n\s*useEffect\(\(\) => \{[\s\S]*?\}, \[fetchData\]\);\n', '', content)

query_str = """
  const { data, isLoading, isError, error: queryError, refetch: fetchData } = useQuery({
    queryKey: ['restaurantDetails', restaurantId],
    queryFn: async () => {
      if (!restaurantId) throw new Error("No restaurant ID");
      const restaurantData = await getRestaurantById(Number(restaurantId));
      let menuData: MenuItem[] = [];
      try {
        menuData = await getRestaurantMenu(Number(restaurantId));
      } catch (e) {
        console.error("Failed to load menu", e);
      }
      return { restaurant: restaurantData, menu: menuData };
    },
    enabled: !!restaurantId,
    retry: false, // Don't retry on 404
  });
  
  const restaurant = data?.restaurant || null;
  const menu = data?.menu || [];
  
  const error = isError ? (queryError as any)?.status === 404 ? "Restaurant not found" : "Failed to load restaurant details" : null;
"""
idx = content.find("const [addingItemId, setAddingItemId]")
content = content[:idx] + query_str + content[idx:]

with open(file_path, "w") as f:
    f.write(content)

