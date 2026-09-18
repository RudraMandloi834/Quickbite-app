#!/bin/bash
cat << 'INNER_EOF' > frontend/src/app/restaurant/dashboard/page.tsx
"use client";

import { useEffect, useState, useRef } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { Client } from "@stomp/stompjs";
import SockJS from "sockjs-client";
import { 
  getRestaurantDashboardSummary, 
  getRestaurantOrders, 
  updateRestaurantOrderStatus,
  deleteMenuItem,
  authFetch,
  getWsBaseUrl,
  getApiBaseUrl
} from "@/lib/api";
import { MenuItem, Restaurant } from "@/types/restaurant";

interface DashboardSummary {
  status: string;
  pendingOrders: number;
  activeOrders: number;
  activeMenuItems: number;
}

interface DashboardOrder {
  id: number;
  totalAmount: number;
  status: string;
  items: any[];
}

interface OrderEvent {
  orderId: number;
  restaurantId: number;
  status: string;
}

export default function RestaurantDashboardPage() {
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();
  
  const [restaurants, setRestaurants] = useState<Restaurant[]>([]);
  const [selectedRestaurantId, setSelectedRestaurantId] = useState<number | null>(null);
  
  const [summary, setSummary] = useState<DashboardSummary | null>(null);
  const [orders, setOrders] = useState<DashboardOrder[]>([]);
  const [menuItems, setMenuItems] = useState<MenuItem[]>([]);
  
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [connectionStatus, setConnectionStatus] = useState<"Connecting..." | "Connected" | "Disconnected" | "Error">("Disconnected");
  
  const stompClient = useRef<Client | null>(null);

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
      connectWebSocket(selectedRestaurantId);
    }
    return () => {
      if (stompClient.current) {
        stompClient.current.deactivate();
      }
    };
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
        authFetch(`${getApiBaseUrl()}/api/restaurants/${id}/menu`)
      ]);
      
      setSummary(sumData);
      setOrders(ordData);
      if (menuRes.ok) {
        setMenuItems(await menuRes.json());
      }
    } catch (err: unknown) {
      setError((err instanceof Error ? err.message : String(err)) || "Error loading dashboard");
    } finally {
      setLoading(false);
    }
  };

  const connectWebSocket = (restaurantId: number) => {
    if (stompClient.current) {
      stompClient.current.deactivate();
    }
    const token = localStorage.getItem("token");
    setConnectionStatus("Connecting...");
    
    const client = new Client({
      webSocketFactory: () => new SockJS(`${getWsBaseUrl()}/ws`),
      connectHeaders: {
        Authorization: `Bearer ${token}`
      },
      debug: (str) => {
        console.log(str);
      },
      onConnect: () => {
        setConnectionStatus("Connected");
        client.subscribe(`/topic/restaurants/${restaurantId}/orders`, (message) => {
          if (message.body) {
            const event: OrderEvent = JSON.parse(message.body);
            handleOrderEvent(event);
          }
        });
      },
      onStompError: (frame) => {
        console.error('Broker reported error: ' + frame.headers['message']);
        console.error('Additional details: ' + frame.body);
        setConnectionStatus("Error");
      },
      onWebSocketClose: () => {
        setConnectionStatus("Disconnected");
      }
    });
    
    client.activate();
    stompClient.current = client;
  };

  const retryConnection = () => {
    if (selectedRestaurantId) {
      connectWebSocket(selectedRestaurantId);
    }
  };

  const handleOrderEvent = (event: OrderEvent) => {
    setOrders(prev => {
      const exists = prev.find(o => o.id === event.orderId);
      if (exists) {
        return prev.map(o => o.id === event.orderId ? { ...o, status: event.status } : o);
      } else {
        if (selectedRestaurantId) loadDashboardData(selectedRestaurantId);
        return prev;
      }
    });
    if (selectedRestaurantId) getRestaurantDashboardSummary(selectedRestaurantId).then(setSummary);
  };

  const handleUpdateOrderStatus = async (orderId: number, status: string) => {
    if (!selectedRestaurantId) return;
    try {
      await updateRestaurantOrderStatus(selectedRestaurantId, orderId, status);
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
          <div className="flex items-center gap-2">
            <span className={`px-2 py-1 text-xs rounded-full font-semibold ${
              connectionStatus === 'Connected' ? 'bg-green-100 text-green-800' : 
              connectionStatus === 'Connecting...' ? 'bg-yellow-100 text-yellow-800' : 
              'bg-red-100 text-red-800'
            }`}>
              {connectionStatus}
            </span>
            {(connectionStatus === 'Disconnected' || connectionStatus === 'Error') && (
              <button 
                onClick={retryConnection}
                className="text-xs bg-gray-200 hover:bg-gray-300 text-gray-800 px-2 py-1 rounded"
              >
                Retry
              </button>
            )}
          </div>
        </div>
        {restaurants.length > 1 && (
          <select 
            value={selectedRestaurantId || ""}
            onChange={(e) => setSelectedRestaurantId(Number(e.target.value))}
            className="p-2 border rounded-md bg-white shadow-sm"
          >
            {restaurants.map(r => (
              <option key={r.id} value={r.id}>{r.name}</option>
            ))}
          </select>
        )}
      </div>

      {(connectionStatus === 'Disconnected' || connectionStatus === 'Error') && (
        <div className="bg-red-50 text-red-600 p-3 rounded-md mb-6 border border-red-200 text-sm flex justify-between items-center">
          <span>Real-time updates are currently disconnected. You may miss incoming orders.</span>
          <button onClick={retryConnection} className="bg-red-100 hover:bg-red-200 px-3 py-1 rounded text-red-800 font-medium">Reconnect</button>
        </div>
      )}
      
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
                    <span className="bg-gray-100 text-gray-800 px-2 py-1 rounded text-sm font-mono">{o.status}</span>
                  </div>
                  <p className="text-sm text-gray-600 mb-3">Total: ₹{o.totalAmount.toFixed(2)}</p>
                  <div className="flex gap-2">
                    {o.status === "PENDING" && (
                      <button onClick={() => handleUpdateOrderStatus(o.id, "CONFIRMED")} className="bg-green-500 text-white px-3 py-1.5 rounded text-sm font-medium hover:bg-green-600 transition">Confirm</button>
                    )}
                    {o.status === "CONFIRMED" && (
                      <button onClick={() => handleUpdateOrderStatus(o.id, "PREPARING")} className="bg-blue-500 text-white px-3 py-1.5 rounded text-sm font-medium hover:bg-blue-600 transition">Prepare</button>
                    )}
                    {o.status === "PREPARING" && (
                      <button onClick={() => handleUpdateOrderStatus(o.id, "READY")} className="bg-purple-500 text-white px-3 py-1.5 rounded text-sm font-medium hover:bg-purple-600 transition">Ready for Delivery</button>
                    )}
                    {o.status === "PENDING" && (
                      <button onClick={() => handleUpdateOrderStatus(o.id, "CANCELLED")} className="bg-red-50 text-red-600 px-3 py-1.5 rounded text-sm font-medium hover:bg-red-100 transition">Reject</button>
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
            <div className="space-y-3">
              {menuItems.map((m) => (
                <div key={m.id} className="border p-3 rounded-md flex justify-between items-center">
                  <div>
                    <h3 className="font-bold text-gray-900">{m.name}</h3>
                    <p className="text-sm text-gray-500">₹{m.price.toFixed(2)}</p>
                  </div>
                  <button onClick={() => handleDeleteMenu(m.id)} className="text-red-500 hover:text-red-700 text-sm font-medium px-2 py-1 hover:bg-red-50 rounded transition">Remove</button>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
INNER_EOF
bash fix_restaurant_dashboard.sh
