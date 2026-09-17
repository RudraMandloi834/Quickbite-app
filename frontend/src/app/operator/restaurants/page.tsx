"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { Restaurant } from "@/types/restaurant";
import { getPendingRestaurants, approveRestaurant, rejectRestaurant } from "@/lib/api";

export default function OperatorRestaurantsPage() {
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();
  
  const [restaurants, setRestaurants] = useState<Restaurant[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [rejectId, setRejectId] = useState<number | null>(null);
  const [rejectReason, setRejectReason] = useState("");
  const [actionLoading, setActionLoading] = useState<number | null>(null);

  useEffect(() => {
    if (authLoading) return; if (!user) {
      router.push("/login");
      return;
    }
    
    if (!(user?.roles?.includes("ROLE_OPERATOR"))) {
      router.push("/");
      return;
    }

    fetchRestaurants();
  }, [authLoading, user, router]);

  const fetchRestaurants = async () => {
    try {
      const data = await getPendingRestaurants();
      setRestaurants(data);
    } catch (err: any) {
      setError(err.message || "Failed to load pending restaurants");
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async (id: number) => {
    try {
      setActionLoading(id);
      await approveRestaurant(id);
      setRestaurants((prev) => prev.filter((r) => r.id !== id));
    } catch (err: any) {
      alert(err.message || "Failed to approve restaurant");
    } finally {
      setActionLoading(null);
    }
  };

  const handleReject = async (id: number) => {
    if (!rejectReason.trim()) {
      alert("Please provide a rejection reason.");
      return;
    }
    try {
      setActionLoading(id);
      await rejectRestaurant(id, rejectReason);
      setRejectId(null);
      setRejectReason("");
      setRestaurants((prev) => prev.filter((r) => r.id !== id));
    } catch (err: any) {
      alert(err.message || "Failed to reject restaurant");
    } finally {
      setActionLoading(null);
    }
  };

  if (loading) {
    return (
      <div className="max-w-4xl mx-auto mt-10 p-6 flex justify-center">
        <p className="text-gray-500">Loading pending applications...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="max-w-4xl mx-auto mt-10 p-6">
        <div className="bg-red-50 text-red-500 p-4 rounded-md">{error}</div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto mt-10 p-6">
      <h1 className="text-2xl font-bold mb-6 text-gray-800">Operator Dashboard</h1>
      <h2 className="text-xl font-semibold mb-4 text-gray-700">Pending Restaurant Applications</h2>
      
      {restaurants.length === 0 ? (
        <div className="bg-white rounded-lg shadow p-8 text-center text-gray-500">
          No pending applications at the moment.
        </div>
      ) : (
        <div className="space-y-4">
          {restaurants.map((r) => (
            <div key={r.id} className="bg-white rounded-lg shadow p-6 border border-gray-100">
              <div className="flex justify-between items-start">
                <div>
                  <h3 className="text-lg font-bold text-gray-900">{r.name}</h3>
                  <p className="text-gray-600">{r.cuisine}</p>
                  <p className="text-gray-500 text-sm mt-1">{r.location || r.city}</p>
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => handleApprove(r.id)}
                    disabled={actionLoading === r.id || rejectId === r.id}
                    className="bg-green-600 text-white px-4 py-2 rounded-md font-medium hover:bg-green-700 disabled:opacity-50"
                  >
                    {actionLoading === r.id && !rejectId ? "Approving..." : "Approve"}
                  </button>
                  <button
                    onClick={() => setRejectId(rejectId === r.id ? null : r.id)}
                    disabled={actionLoading === r.id}
                    className="bg-red-600 text-white px-4 py-2 rounded-md font-medium hover:bg-red-700 disabled:opacity-50"
                  >
                    Reject
                  </button>
                </div>
              </div>

              {rejectId === r.id && (
                <div className="mt-4 bg-gray-50 p-4 rounded-md border border-gray-200">
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Rejection Reason
                  </label>
                  <textarea
                    value={rejectReason}
                    onChange={(e) => setRejectReason(e.target.value)}
                    className="w-full border-gray-300 rounded-md shadow-sm p-2 mb-3 focus:ring-orange-500 focus:border-orange-500"
                    rows={3}
                    placeholder="Enter reason for rejection..."
                  />
                  <div className="flex justify-end gap-2">
                    <button
                      onClick={() => setRejectId(null)}
                      className="px-4 py-2 text-gray-600 hover:text-gray-900"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={() => handleReject(r.id)}
                      disabled={actionLoading === r.id || !rejectReason.trim()}
                      className="bg-red-600 text-white px-4 py-2 rounded-md font-medium hover:bg-red-700 disabled:opacity-50"
                    >
                      {actionLoading === r.id ? "Rejecting..." : "Confirm Rejection"}
                    </button>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
