import os
import re

def rewrite_admin_dashboard(filepath):
    with open(filepath, "r") as f: content = f.read()
    
    # replace useState/useEffect
    content = re.sub(r'import \{ useEffect, useState \} from "react";', 'import { useQuery } from "@tanstack/react-query";', content)
    content = re.sub(r'const \[stats, setStats\] = useState<.*?null>\(null\);', '', content)
    content = re.sub(r'useEffect\(\(\) => \{[\s\S]*?\}, \[loading, user, router\]\);', '', content)
    
    # insert useQuery
    query_str = """
  const { data: stats, isLoading: isStatsLoading, isError, error } = useQuery({
    queryKey: ['adminStats'],
    queryFn: getAdminStats,
    enabled: !!user && !!user.roles?.includes("OPERATOR"),
  });
"""
    content = content.replace("export default function AdminDashboardPage() {", "export default function AdminDashboardPage() {")
    # Actually just insert it after `const { user, loading } = useAuth();`
    idx = content.find("const { user, loading } = useAuth();")
    idx = content.find("\n", idx)
    content = content[:idx] + "\n" + query_str + content[idx:]
    
    # modify loading/error
    content = content.replace("if (loading) return", "if (loading || isStatsLoading) return")
    content = content.replace("if (!user || !user.roles?.includes(\"OPERATOR\")) return null;", "if (!user || !user.roles?.includes(\"OPERATOR\")) return null;\n  if (isError) return <div className=\"p-10 text-center text-red-500\">{error?.message || \"Failed to load stats\"}</div>;")
    
    with open(filepath, "w") as f: f.write(content)


rewrite_admin_dashboard("frontend/src/app/admin/dashboard/page.tsx")
