import sys
import re

file_path = "frontend/src/app/operator/restaurants/page.tsx"
with open(file_path, "r") as f:
    content = f.read()

# Add a debug info state
if "debugInfo" not in content:
    content = content.replace("const [error, setError] = useState<string | null>(null);", 
    "const [error, setError] = useState<string | null>(null);\n  const [debugInfo, setDebugInfo] = useState<any>(null);\n  const { user } = useAuth();")

# Update fetchRestaurants to capture debug info
fetch_old = """const fetchRestaurants = async () => {
    try {
      const data = await getPendingRestaurants();
      setRestaurants(data);
    } catch (err: any) {
      setError(err.message || "Failed to load pending restaurants");
    } finally {
      setLoading(false);
    }
  };"""

fetch_new = """const fetchRestaurants = async () => {
    try {
      // Need to capture raw response for debug
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || "http://localhost:8080"}/api/operator/restaurants/pending`, {
        headers: { "Authorization": `Bearer ${localStorage.getItem("token")}` }
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.message || "Failed to load pending restaurants");
      }
      setRestaurants(data);
      if (data.length === 0) {
        setDebugInfo({
          endpoint: "/api/operator/restaurants/pending",
          status: res.status,
          body: data
        });
      }
    } catch (err: any) {
      setError(err.message || "Failed to load pending restaurants");
    } finally {
      setLoading(false);
    }
  };"""

content = content.replace(fetch_old, fetch_new)

# Add debug block to render
debug_block = """      {restaurants.length === 0 ? (
        <div className="bg-white rounded-lg shadow p-8 text-center text-gray-500">
          <p>No pending applications at the moment.</p>
          {debugInfo && (
            <div className="mt-8 text-left bg-gray-100 p-4 rounded text-xs font-mono">
              <h4 className="font-bold mb-2">Debug Info (Development Only)</h4>
              <p>Endpoint: {debugInfo.endpoint}</p>
              <p>HTTP status: {debugInfo.status}</p>
              <p>Response body: {JSON.stringify(debugInfo.body)}</p>
              <p>Current logged-in user: {user?.email}</p>
              <p>Current roles: {user?.roles?.join(", ")}</p>
            </div>
          )}
        </div>
      ) : ("""

content = re.sub(r'\{restaurants\.length === 0 \? \([\s\S]*?No pending applications at the moment\.[\s\S]*?\) : \(', debug_block, content)

with open(file_path, "w") as f:
    f.write(content)

