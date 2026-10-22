import re

file_path = "frontend/src/app/restaurants/page.tsx"
with open(file_path, "r") as f:
    content = f.read()

content = content.replace('import { useEffect, useState, useCallback } from "react";', 'import { useState } from "react";\nimport { useQuery } from "@tanstack/react-query";')
content = re.sub(r'const \[allRestaurants, setAllRestaurants\] = useState<Restaurant\[\]>\(\[\]\);\n\s*const \[restaurants, setRestaurants\] = useState<Restaurant\[\]>\(\[\]\);\n\s*const \[isLoading, setIsLoading\] = useState\(true\);\n\s*const \[error, setError\] = useState<string \| null>\(null\);\n', '', content)

content = re.sub(r'const fetchRestaurantsList = useCallback\(async \(\) => \{[\s\S]*?\}, \[\]\);\n\s*useEffect\(\(\) => \{[\s\S]*?\}, \[fetchRestaurantsList\]\);\n', '', content)

query_str = """
  const { data: allRestaurants = [], isLoading, isError, error: queryError, refetch: fetchRestaurantsList } = useQuery({
    queryKey: ['restaurantsList'],
    queryFn: getRestaurants,
  });
  
  const error = isError ? (queryError as Error)?.message || "Failed to load restaurants" : null;
  
  // To handle local filtering, we calculate displayed restaurants on the fly
  const restaurants = selectedCity ? allRestaurants.filter(r => r.city === selectedCity) : allRestaurants;
"""
# Need to fix setRestaurants(data) inside geolocation logic!
content = content.replace('setRestaurants(data);', '/* setRestaurants(data); */')
content = content.replace('setRestaurants(allRestaurants);', '')
content = content.replace('setRestaurants(allRestaurants.filter(r => r.city === city));', '')

idx = content.find("const [isLocating, setIsLocating] = useState(false);")
idx = content.find("\n", idx)

content = content[:idx] + "\n" + query_str + content[idx:]

with open(file_path, "w") as f:
    f.write(content)

