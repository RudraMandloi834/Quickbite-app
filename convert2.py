import re

def rewrite_operator(filepath):
    with open(filepath, "r") as f: content = f.read()
    
    content = content.replace('import { useEffect, useState } from "react";', 'import { useState } from "react";\nimport { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";')
    content = re.sub(r'const \[restaurants, setRestaurants\] = useState<Restaurant\[\]>\(\[\]\);\n\s*const \[loading, setLoading\] = useState\(true\);\n\s*const \[error, setError\] = useState\(""\);\n', '', content)
    content = re.sub(r'useEffect\(\(\) => \{[\s\S]*?\}, \[authLoading, user, router\]\);', '', content)
    
    # replace fetchRestaurants
    content = re.sub(r'const fetchRestaurants = async \(\) => \{[\s\S]*?catch \(err: any\) \{[\s\S]*?\}\n\s*\};\n', '', content)
    
    query_str = """
  const queryClient = useQueryClient();
  const { data: restaurants = [], isLoading: loading, isError, error } = useQuery({
    queryKey: ['pendingRestaurants'],
    queryFn: getPendingRestaurants,
    enabled: !!user && !!user.roles?.includes("OPERATOR"),
  });
"""
    idx = content.find("const [actionLoading, setActionLoading] = useState<number | null>(null);")
    idx = content.find("\n", idx)
    content = content[:idx] + "\n" + query_str + content[idx:]
    
    # Replace handleApprove/Reject to invalidate queries
    content = content.replace("fetchRestaurants();", "queryClient.invalidateQueries({ queryKey: ['pendingRestaurants'] });")
    
    # Replace error handling
    content = content.replace('if (error) return <div className="p-10 text-center text-red-500">{error}</div>;', 'if (isError) return <div className="p-10 text-center text-red-500">{(error as Error)?.message || "Failed to load"}</div>;')
    
    with open(filepath, "w") as f: f.write(content)

rewrite_operator("frontend/src/app/operator/restaurants/page.tsx")
