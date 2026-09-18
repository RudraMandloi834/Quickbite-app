/* eslint-disable */
"use client";

import { useEffect, useState, useRef } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { Restaurant, MenuItem } from "@/types/restaurant";
import { getRestaurantDashboardSummary, getRestaurantOrders, updateRestaurantOrderStatus, updateMenuItem, deleteMenuItem, createInvitation, authFetch, getApiBaseUrl, getJoinRequestsForRestaurant, approveJoinRequest, rejectJoinRequest, RestaurantJoinRequest } from "@/lib/api";
import { useSSE } from "@/hooks/useSSE";
type OrderEvent = { orderId: number; restaurantId: number; status: string; };

type DashboardSummary = { status: string; pendingOrders: number; activeOrders: number; activeMenuItems: number; };

type DashboardOrder = { id: number; status: string; totalAmount: number; };

export default function RestaurantDashboard() {
  const token = typeof window !== "undefined" ? localStorage.getItem("token") : null;
  const { connectionStatus } = useSSE(token, (event: any) => {
    if (selectedRestaurantId && (event.restaurantId === selectedRestaurantId || !event.restaurantId)) {
      loadDashboardData(selectedRestaurantId);
    }
  });
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();
  
  const [restaurants, setRestaurants] = useState<Restaurant[]>([]);
  const [selectedRestaurantId, setSelectedRestaurantId] = useState<number | null>(null);
  
  
  const [summary, setSummary] = useState<DashboardSummary | null>(null);
  
  const [orders, setOrders] = useState<DashboardOrder[]>([]);
  const [menuItems, setMenuItems] = useState<MenuItem[]>([]);
  const [joinRequests, setJoinRequests] = useState<RestaurantJoinRequest[]>([]);
  
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [inviteCode, setInviteCode] = useState<string | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  
  
  
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
      
      const approvedApps = appData.filter((r: { status: string; id: number; name: string; }) => r.status === "APPROVED");
      const approvedStaffRestIds = staffData
        .filter((s: { approvalStatus: string; restaurantId: number; }) => s.approvalStatus === "APPROVED")
        .map((s: { approvalStatus: string; restaurantId: number; }) => s.restaurantId);
        
      const allRes = await authFetch(`${getApiBaseUrl()}/api/restaurants`);
      const allData = allRes.ok ? await allRes.json() : [];
      const staffRestaurants = allData.filter((r: { status: string; id: number; name: string; }) => approvedStaffRestIds.includes(r.id));
      
      const combined = [...approvedApps, ...staffRestaurants];
      const unique = Array.from(new Map(combined.map(item => [item.id, item])).values());
      
      setRestaurants(unique);
      if (unique.length > 0) {
        setSelectedRestaurantId(unique[0].id);
      } else {
        setError("You do not have approved access to any restaurant.");
        setLoading(false);
      }
    } catch (err: unknown) {
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
        authFetch(`${getApiBaseUrl()}/api/restaurants/${id}/menu`),
        getJoinRequestsForRestaurant(id).catch(() => [] as RestaurantJoinRequest[])
      ]);
      
      setSummary(sumData);
      setOrders(ordData);
      setJoinRequests(arguments[0][3] || []);
      if (menuRes.ok) {
        setMenuItems(await menuRes.json());
      }
    } catch (err: unknown) {
      setError((err instanceof Error ? err.message : String(err)) || "Error loading dashboard");
    } finally {
      setLoading(false);
    }
  };

  
  const handleGenerateInvite = async () => {
    if (!selectedRestaurantId) return;
    setIsGenerating(true);
    setInviteCode(null);
    try {
      const res = await createInvitation(selectedRestaurantId);
      setInviteCode(res.code);
    } catch (err) {
      alert("Failed to generate invitation code.");
    } finally {
      setIsGenerating(false);
    }
  };

  const handleApproveJoin = async (reqId: number) => {
    try {
      await approveJoinRequest(reqId);
      setJoinRequests(prev => prev.map(r => r.id === reqId ? { ...r, status: 'APPROVED' } : r));
    } catch {
      alert("Failed to approve");
    }
  };

  const handleRejectJoin = async (reqId: number) => {
    try {
      await rejectJoinRequest(reqId);
      setJoinRequests(prev => prev.map(r => r.id === reqId ? { ...r, status: 'REJECTED' } : r));
    } catch {
      alert("Failed to reject");
    }
  };


  const handleUpdateOrderStatus = async (orderId: number, status: string) => {
    if (!selectedRestaurantId) return;
    try {
      await updateRestaurantOrderStatus(selectedRestaurantId, orderId, status);
      // Wait for WS event to update local state, or fetch manually if WS fails
    } catch (err: unknown) {
      alert("Error: " + (err instanceof Error ? err.message : String(err)));
    }
  };

  const handleDeleteMenu = async (menuItemId: number) => {
    if (!selectedRestaurantId) return;
    if (!confirm("Are you sure you want to delete this menu item?")) return;
    try {
      await deleteMenuItem(selectedRestaurantId, menuItemId);
      loadDashboardData(selectedRestaurantId);
    } catch (err: unknown) {
      alert("Error: " + (err instanceof Error ? err.message : String(err)));
    }
  };

  if (authLoading || loading && !summary) return <div className="p-10 text-center">Loading dashboard...</div>;
  if (error) return <div className="p-10 text-center text-red-500">{error}</div>;

  return (
    <div className="max-w-6xl mx-auto p-6 mt-6">
      <div className="flex justify-between items-center mb-6">
        <div className="flex items-center gap-4">
          <h1 className="text-3xl font-bold text-gray-800">Partner Dashboard</h1>
          <span className={`px-2 py-1 text-xs rounded-full font-semibold ${connectionStatus === 'Connected' ? 'bg-green-100 text-green-800' : connectionStatus === 'Reconnecting' ? 'bg-yellow-100 text-yellow-800' : 'bg-red-100 text-red-800'}`}>
            {connectionStatus}
          </span>
        </div>
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
      <div className="bg-white p-4 shadow-sm border border-brand-border/60 rounded-lg mt-4 flex items-center justify-between">
        <div>
          <h3 className="font-medium text-brand-fg">Invite Co-Owners</h3>
          <p className="text-sm text-brand-muted">Generate a code to allow another user to co-manage.</p>
        </div>
        <div className="flex gap-2 items-center">
          {inviteCode && (
            <span className="font-mono text-brand-secondary font-bold px-3 py-1 bg-brand-secondary/10 rounded border border-brand-secondary/20">
              {inviteCode}
            </span>
          )}
          <button 
            onClick={handleGenerateInvite} 
            disabled={isGenerating}
            className="px-4 py-2 bg-brand-primary text-white rounded font-medium text-sm disabled:opacity-50"
          >
            {isGenerating ? "Generating..." : "Generate Code"}
          </button>
        </div>

      {joinRequests.filter(r => r.status === 'PENDING_APPROVAL').length > 0 && (
        <div className="bg-white p-4 shadow-sm border border-brand-border/60 rounded-lg mt-4">
          <h3 className="font-medium text-brand-fg mb-3">Pending Join Requests</h3>
          <div className="space-y-3">
            {joinRequests.filter(r => r.status === 'PENDING_APPROVAL').map(req => (
              <div key={req.id} className="flex items-center justify-between p-3 bg-brand-bg rounded border border-brand-border/40">
                <div>
                  <p className="text-sm font-medium text-brand-fg">User ID: {req.userId}</p>
                  <p className="text-xs text-brand-muted">Requested on {new Date(req.createdAt).toLocaleDateString()}</p>
                </div>
                <div className="flex gap-2">
                  <button onClick={() => handleApproveJoin(req.id)} className="px-3 py-1 bg-green-600 text-white text-xs font-medium rounded hover:bg-green-700">Approve</button>
                  <button onClick={() => handleRejectJoin(req.id)} className="px-3 py-1 bg-red-600 text-white text-xs font-medium rounded hover:bg-red-700">Reject</button>
                </div>
              </div>
            ))}
          </div>
        </div>
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
                    {o.status === "CONFIRMED" && (
                      <button onClick={() => handleUpdateOrderStatus(o.id, "RESTAURANT_ACCEPTED")} className="bg-green-500 text-white px-3 py-1 rounded text-sm hover:bg-green-600">Accept</button>
                    )}
                    {o.status === "RESTAURANT_ACCEPTED" && (
                      <button onClick={() => handleUpdateOrderStatus(o.id, "PREPARING")} className="bg-blue-500 text-white px-3 py-1 rounded text-sm hover:bg-blue-600">Prepare</button>
                    )}
                    {o.status === "PREPARING" && (
                      <button onClick={() => handleUpdateOrderStatus(o.id, "READY_FOR_PICKUP")} className="bg-purple-500 text-white px-3 py-1 rounded text-sm hover:bg-purple-600">Ready</button>
                    )}
                    {(o.status === "CONFIRMED" || o.status === "RESTAURANT_ACCEPTED" || o.status === "PREPARING") && (
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
