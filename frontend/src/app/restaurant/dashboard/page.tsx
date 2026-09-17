"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { Restaurant, MenuItem } from "@/types/restaurant";
import { getRestaurantDashboardSummary, getRestaurantOrders, updateRestaurantOrderStatus, updateMenuItem, deleteMenuItem, authFetch, getApiBaseUrl } from "@/lib/api";

export default function RestaurantDashboard() {
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();
  
  const [restaurants, setRestaurants] = useState<Restaurant[]>([]);
  const [selectedRestaurantId, setSelectedRestaurantId] = useState<number | null>(null);
  
  const [summary, setSummary] = useState<any>(null);
  const [orders, setOrders] = useState<any[]>([]);
  const [menuItems, setMenuItems] = useState<MenuItem[]>([]);
  
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    if (authLoading) return;
    if (!user) {
      router.push("/login");
      return;
    }
    fetchAccessibleRestaurants();
  }, [user, authLoading, router]);

  useEffect(() => {
    if (selectedRestaurantId) {
      loadDashboardData(selectedRestaurantId);
    }
  }, [selectedRestaurantId]);

  const fetchAccessibleRestaurants = async () => {
    try {
      const [appRes, staffRes] = await Promise.all([
        authFetch(`${getApiBaseUrl()}/api/restaurants/my-applications`),
        authFetch(`${getApiBaseUrl()}/api/restaurants/my-staff-requests`)
      ]);
      const appData = appRes.ok ? await appRes.json() : [];
      const staffData = staffRes.ok ? await staffRes.json() : [];
      
      const approvedApps = appData.filter((r: any) => r.status === "APPROVED");
      const approvedStaffRestIds = staffData
        .filter((s: any) => s.approvalStatus === "APPROVED")
        .map((s: any) => s.restaurantId);
        
      // Fetch full restaurant objects for staff using standard list (mocking local for now)
      // Actually, my-applications returns full restaurants. If the user is staff, we might need a dedicated API if we don't want to load all restaurants.
      // But for QuickBite frontend simplicity, let's just use what's returned.
      // Wait, staff requests only give restaurantId. We'll fetch all restaurants and filter.
      const allRes = await authFetch(`${getApiBaseUrl()}/api/restaurants`);
      const allData = allRes.ok ? await allRes.json() : [];
      const staffRestaurants = allData.filter((r: any) => approvedStaffRestIds.includes(r.id));
      
      const combined = [...approvedApps, ...staffRestaurants];
      // Deduplicate
      const unique = Array.from(new Map(combined.map(item => [item.id, item])).values());
      
      setRestaurants(unique);
      if (unique.length > 0) {
        setSelectedRestaurantId(unique[0].id);
      } else {
        setError("You do not have approved access to any restaurant.");
        setLoading(false);
      }
    } catch (err: any) {
      setError("Failed to load restaurants.");
      setLoading(false);
    }
  };

  const loadDashboardData = async (id: number) => {
    setLoading(true);
    setError("");
    try {
      const [sumData, ordData, menuRes] = await Promise.all([
        getRestaurantDashboardSummary(id),
        getRestaurantOrders(id),
        authFetch(`${getApiBaseUrl()}/api/restaurants/${id}/menu`)
      ]);
      
      setSummary(sumData);
      setOrders(ordData);
      if (menuRes.ok) {
        setMenuItems(await menuRes.json());
      }
    } catch (err: any) {
      setError(err.message || "Error loading dashboard");
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateOrderStatus = async (orderId: number, status: string) => {
    if (!selectedRestaurantId) return;
    try {
      await updateRestaurantOrderStatus(selectedRestaurantId, orderId, status);
      loadDashboardData(selectedRestaurantId);
    } catch (err: any) {
      alert("Error: " + err.message);
    }
  };

  const handleDeleteMenu = async (menuItemId: number) => {
    if (!selectedRestaurantId) return;
    if (!confirm("Are you sure you want to delete this menu item?")) return;
    try {
      await deleteMenuItem(selectedRestaurantId, menuItemId);
      loadDashboardData(selectedRestaurantId);
    } catch (err: any) {
      alert("Error: " + err.message);
    }
  };

  if (authLoading || loading) return <div className="p-10 text-center">Loading dashboard...</div>;
  if (error) return <div className="p-10 text-center text-red-500">{error}</div>;

  return (
    <div className="max-w-6xl mx-auto p-6 mt-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold text-gray-800">Partner Dashboard</h1>
        {restaurants.length > 1 && (
          <select 
            value={selectedRestaurantId || ""}
            onChange={(e) => setSelectedRestaurantId(Number(e.target.value))}
            className="p-2 border rounded-md"
          >
            {restaurants.map(r => (
              <option key={r.id} value={r.id}>{r.name}</option>
            ))}
          </select>
        )}
      </div>
      
      {summary && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
          <div className="bg-white p-4 shadow rounded-lg border">
            <h3 className="text-gray-500 text-sm font-semibold">Status</h3>
            <p className="text-2xl font-bold text-green-600">{summary.status}</p>
          </div>
          <div className="bg-white p-4 shadow rounded-lg border">
            <h3 className="text-gray-500 text-sm font-semibold">Pending Orders</h3>
            <p className="text-2xl font-bold">{summary.pendingOrders}</p>
          </div>
          <div className="bg-white p-4 shadow rounded-lg border">
            <h3 className="text-gray-500 text-sm font-semibold">Active Orders</h3>
            <p className="text-2xl font-bold text-orange-500">{summary.activeOrders}</p>
          </div>
          <div className="bg-white p-4 shadow rounded-lg border">
            <h3 className="text-gray-500 text-sm font-semibold">Menu Items</h3>
            <p className="text-2xl font-bold">{summary.activeMenuItems}</p>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div className="bg-white p-6 rounded-lg shadow border">
          <h2 className="text-xl font-bold mb-4">Recent Orders</h2>
          {orders.length === 0 ? <p className="text-gray-500">No orders yet.</p> : (
            <div className="space-y-4">
              {orders.slice(0, 10).map((o) => (
                <div key={o.id} className="border p-4 rounded-md">
                  <div className="flex justify-between items-center mb-2">
                    <span className="font-bold">Order #{o.id}</span>
                    <span className="bg-gray-100 text-gray-800 px-2 py-1 rounded text-sm">{o.status}</span>
                  </div>
                  <p className="text-sm text-gray-600 mb-2">Total: ${o.totalAmount.toFixed(2)}</p>
                  <div className="flex gap-2">
                    {o.status === "PENDING" && (
                      <button onClick={() => handleUpdateOrderStatus(o.id, "CONFIRMED")} className="bg-green-500 text-white px-3 py-1 rounded text-sm hover:bg-green-600">Confirm</button>
                    )}
                    {o.status === "CONFIRMED" && (
                      <button onClick={() => handleUpdateOrderStatus(o.id, "PREPARING")} className="bg-blue-500 text-white px-3 py-1 rounded text-sm hover:bg-blue-600">Prepare</button>
                    )}
                    {o.status === "PREPARING" && (
                      <button onClick={() => handleUpdateOrderStatus(o.id, "READY")} className="bg-purple-500 text-white px-3 py-1 rounded text-sm hover:bg-purple-600">Ready</button>
                    )}
                    {o.status === "PENDING" && (
                      <button onClick={() => handleUpdateOrderStatus(o.id, "CANCELLED")} className="bg-red-500 text-white px-3 py-1 rounded text-sm hover:bg-red-600">Cancel</button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="bg-white p-6 rounded-lg shadow border">
          <h2 className="text-xl font-bold mb-4">Menu Items</h2>
          {menuItems.length === 0 ? <p className="text-gray-500">No menu items.</p> : (
            <div className="space-y-4">
              {menuItems.map((m) => (
                <div key={m.id} className="border p-4 rounded-md flex justify-between items-center">
                  <div>
                    <h3 className="font-bold">{m.name}</h3>
                    <p className="text-sm text-gray-500">${m.price.toFixed(2)}</p>
                  </div>
                  <div className="flex gap-2">
                    <button onClick={() => handleDeleteMenu(m.id)} className="text-red-500 hover:text-red-700 text-sm font-semibold">Delete</button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
