/* eslint-disable */
"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { Restaurant } from "@/types/restaurant";
import { getPendingRestaurants, approveRestaurant, rejectRestaurant, ApprovalResponse } from "@/lib/api";
import { useQuery, useQueryClient } from "@tanstack/react-query";

export default function OperatorRestaurantsPage() {
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();
  
  const queryClient = useQueryClient();
  const [rejectId, setRejectId] = useState<number | null>(null);
  const [rejectReason, setRejectReason] = useState("");
  const [actionLoading, setActionLoading] = useState<number | null>(null);
  const [approvedCredentials, setApprovedCredentials] = useState<ApprovalResponse | null>(null);

  const { data: restaurants = [], isLoading, isError, error } = useQuery({
    queryKey: ['pendingRestaurants'],
    queryFn: getPendingRestaurants,
    enabled: !!user && !!user.roles?.includes("OPERATOR"),
  });

  if (authLoading || isLoading) return <div className="p-10 text-center text-gray-500">Loading pending restaurants...</div>;
  
  if (!user || !user.roles?.includes("OPERATOR")) {
    return <div className="p-10 text-center text-red-500">Access Denied</div>;
  }

  if (isError) return <div className="p-10 text-center text-red-500">{(error as Error)?.message || "Failed to load"}</div>;

  const handleApprove = async (id: number) => {
    setActionLoading(id);
    try {
      const res = await approveRestaurant(id);
      setApprovedCredentials(res);
      queryClient.invalidateQueries({ queryKey: ['pendingRestaurants'] });
    } catch (err: any) {
      alert(err.message || "Approval failed");
    } finally {
      setActionLoading(null);
    }
  };

  const handleReject = async (id: number) => {
    if (!rejectReason.trim()) {
      alert("Please provide a rejection reason");
      return;
    }
    setActionLoading(id);
    try {
      await rejectRestaurant(id, rejectReason);
      setRejectId(null);
      setRejectReason("");
      queryClient.invalidateQueries({ queryKey: ['pendingRestaurants'] });
    } catch (err: any) {
      alert(err.message || "Rejection failed");
    } finally {
      setActionLoading(null);
    }
  };

  return (
    <div className="max-w-4xl mx-auto p-6 mt-6">
      <h1 className="text-3xl font-bold mb-8 text-gray-800">Pending Restaurant Applications</h1>

      {approvedCredentials && (
        <div className="bg-green-50 border border-green-200 text-green-800 p-6 rounded-md mb-8">
          <h2 className="text-lg font-bold mb-2">Restaurant Approved Successfully!</h2>
          <p className="mb-4">Please share these initial owner credentials with the applicant securely.</p>
          <div className="bg-white p-4 rounded border font-mono text-sm">
            <p><strong>Login URL:</strong> {window.location.origin}/login</p>
            <p><strong>Email:</strong> {approvedCredentials.username}</p>
            <p><strong>Password:</strong> {approvedCredentials.temporaryPassword}</p>
          </div>
          <button 
            onClick={() => setApprovedCredentials(null)}
            className="mt-4 px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700"
          >
            Dismiss
          </button>
        </div>
      )}

      {restaurants.length === 0 ? (
        <div className="bg-gray-50 border border-gray-200 rounded-lg p-10 text-center">
          <p className="text-gray-500">No pending applications at the moment.</p>
        </div>
      ) : (
        <div className="space-y-6">
          {restaurants.map(r => (
            <div key={r.id} className="bg-white border rounded-lg shadow-sm p-6">
              <div className="flex justify-between items-start mb-4">
                <div>
                  <h2 className="text-xl font-bold text-gray-900">{r.name}</h2>
                  <p className="text-sm text-gray-500">Applied on {new Date(r.createdAt || new Date().toISOString()).toLocaleDateString()}</p>
                </div>
                <span className="bg-yellow-100 text-yellow-800 px-3 py-1 rounded-full text-xs font-semibold">
                  PENDING REVIEW
                </span>
              </div>
              
              <div className="grid grid-cols-2 gap-4 text-sm mb-6">
                <div>
                  <p className="text-gray-500 font-medium">Cuisine</p>
                  <p>{r.cuisine || "Not specified"}</p>
                </div>
                <div>
                  <p className="text-gray-500 font-medium">Address</p>
                  <p>{r.location || "Not specified"}</p>
                </div>
                {r.city && (
                  <div>
                    <p className="text-gray-500 font-medium">City</p>
                    <p>{r.city}</p>
                  </div>
                )}
                
              </div>

              {rejectId === r.id ? (
                <div className="bg-red-50 p-4 rounded-md border border-red-100 mt-4">
                  <h3 className="font-medium text-red-800 mb-2">Provide Rejection Reason</h3>
                  <textarea 
                    className="w-full p-2 border rounded mb-3 text-sm"
                    rows={3}
                    placeholder="E.g., Incomplete address, invalid license..."
                    value={rejectReason}
                    onChange={(e) => setRejectReason(e.target.value)}
                  />
                  <div className="flex gap-2">
                    <button 
                      onClick={() => handleReject(r.id)}
                      disabled={actionLoading === r.id}
                      className="px-4 py-2 bg-red-600 text-white rounded text-sm font-medium hover:bg-red-700 disabled:opacity-50"
                    >
                      {actionLoading === r.id ? "Rejecting..." : "Confirm Rejection"}
                    </button>
                    <button 
                      onClick={() => { setRejectId(null); setRejectReason(""); }}
                      disabled={actionLoading === r.id}
                      className="px-4 py-2 bg-gray-200 text-gray-800 rounded text-sm font-medium hover:bg-gray-300 disabled:opacity-50"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              ) : (
                <div className="flex gap-3 mt-4 border-t pt-4">
                  <button 
                    onClick={() => handleApprove(r.id)}
                    disabled={actionLoading === r.id}
                    className="px-4 py-2 bg-green-600 text-white rounded text-sm font-medium hover:bg-green-700 disabled:opacity-50 flex-1 sm:flex-none"
                  >
                    {actionLoading === r.id ? "Processing..." : "Approve"}
                  </button>
                  <button 
                    onClick={() => setRejectId(r.id)}
                    disabled={actionLoading === r.id}
                    className="px-4 py-2 bg-red-100 text-red-700 rounded text-sm font-medium hover:bg-red-200 disabled:opacity-50 flex-1 sm:flex-none"
                  >
                    Reject
                  </button>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
