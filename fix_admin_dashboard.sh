#!/bin/bash
cat << 'INNER_EOF' > frontend/src/app/admin/dashboard/page.tsx
"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import Link from "next/link";
import { Container } from "@/components/Container";
import { getAdminStats, getPendingRestaurants, approveRestaurant, rejectRestaurant, ApprovalResponse } from "@/lib/api";
import { Restaurant } from "@/types/restaurant";

export default function AdminDashboardPage() {
  const router = useRouter();
  const { user, loading } = useAuth();
  const [stats, setStats] = useState<{ totalCustomers: number; totalRestaurants: number; totalOrders: number; totalDeliveries: number } | null>(null);
  const [pendingRestaurants, setPendingRestaurants] = useState<Restaurant[]>([]);
  
  const [rejectId, setRejectId] = useState<number | null>(null);
  const [rejectReason, setRejectReason] = useState("");
  const [actionLoading, setActionLoading] = useState<number | null>(null);
  const [approvedCredentials, setApprovedCredentials] = useState<ApprovalResponse | null>(null);

  useEffect(() => {
    if (loading) return;
    if (!user || !user.roles?.includes("OPERATOR")) {
      router.push("/");
      return;
    }

    getAdminStats().then(setStats).catch(console.error);
    getPendingRestaurants().then(setPendingRestaurants).catch(console.error);
  }, [loading, user, router]);

  const handleApprove = async (id: number) => {
    try {
      setActionLoading(id);
      const res = await approveRestaurant(id);
      setApprovedCredentials(res);
      setPendingRestaurants((prev) => prev.filter((r) => r.id !== id));
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
      setPendingRestaurants((prev) => prev.filter((r) => r.id !== id));
    } catch (err: any) {
      alert(err.message || "Failed to reject restaurant");
    } finally {
      setActionLoading(null);
    }
  };

  if (loading) return <div className="p-10 text-center text-gray-500">Loading admin dashboard...</div>;
  if (!user || !user.roles?.includes("OPERATOR")) return null;

  return (
    <div className="flex-1 py-10 sm:py-16 bg-gray-50">
      <Container>
        <div className="mb-8">
          <h1 className="text-3xl font-serif text-gray-900">Admin Dashboard</h1>
          <p className="text-gray-500 mt-2">Manage the QuickBite platform</p>
        </div>

        {approvedCredentials && (
          <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50 z-50">
            <div className="bg-white p-8 rounded-lg shadow-xl max-w-md w-full">
              <h3 className="text-2xl font-bold text-green-600 mb-2">Restaurant Approved!</h3>
              <p className="text-gray-600 mb-6">
                The restaurant <strong>{approvedCredentials.restaurant.name}</strong> has been successfully approved.
              </p>
              
              <div className="bg-gray-50 p-4 rounded border border-gray-200 mb-6">
                <p className="text-sm text-gray-500 mb-1">Login Username:</p>
                <p className="font-mono font-bold text-gray-800 mb-3 select-all">{approvedCredentials.username}</p>
                <p className="text-sm text-gray-500 mb-1">Temporary Password:</p>
                <p className="font-mono font-bold text-gray-800 select-all">{approvedCredentials.temporaryPassword}</p>
              </div>
              
              <button
                onClick={() => setApprovedCredentials(null)}
                className="w-full bg-brand-primary text-white font-semibold py-2 rounded hover:bg-orange-600 transition"
              >
                Close
              </button>
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-10">
          <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-100">
            <h3 className="text-sm font-medium text-gray-500">Total Customers</h3>
            <p className="text-3xl font-bold text-gray-900 mt-2">{stats?.totalCustomers ?? "--"}</p>
          </div>
          <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-100">
            <h3 className="text-sm font-medium text-gray-500">Total Restaurants</h3>
            <p className="text-3xl font-bold text-orange-600 mt-2">{stats?.totalRestaurants ?? "--"}</p>
          </div>
          <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-100">
            <h3 className="text-sm font-medium text-gray-500">Total Orders</h3>
            <p className="text-3xl font-bold text-gray-900 mt-2">{stats?.totalOrders ?? "--"}</p>
          </div>
          <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-100">
            <h3 className="text-sm font-medium text-gray-500">Total Deliveries</h3>
            <p className="text-3xl font-bold text-gray-900 mt-2">{stats?.totalDeliveries ?? "--"}</p>
          </div>
        </div>

        <h2 className="text-2xl font-serif text-gray-900 mb-4 border-b pb-2">Pending Restaurant Applications</h2>
        {pendingRestaurants.length === 0 ? (
          <div className="bg-white rounded-lg shadow p-8 text-center text-gray-500 mb-10">
            No pending applications at the moment.
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-10">
            {pendingRestaurants.map((r) => (
              <div key={r.id} className="bg-white p-6 rounded-lg shadow border border-gray-200">
                <h3 className="text-lg font-bold text-gray-900">{r.name}</h3>
                <p className="text-gray-600">{r.cuisine} - {r.location || r.city}</p>
                <div className="flex gap-2 mt-4">
                  <button
                    onClick={() => handleApprove(r.id)}
                    disabled={actionLoading === r.id || rejectId === r.id}
                    className="bg-green-600 text-white px-4 py-2 rounded-md font-medium hover:bg-green-700 disabled:opacity-50 text-sm"
                  >
                    {actionLoading === r.id && !rejectId ? "Approving..." : "Approve"}
                  </button>
                  <button
                    onClick={() => setRejectId(rejectId === r.id ? null : r.id)}
                    disabled={actionLoading === r.id}
                    className="bg-red-600 text-white px-4 py-2 rounded-md font-medium hover:bg-red-700 disabled:opacity-50 text-sm"
                  >
                    Reject
                  </button>
                </div>
                {rejectId === r.id && (
                  <div className="mt-4 bg-gray-50 p-4 rounded-md border border-gray-200">
                    <textarea
                      value={rejectReason}
                      onChange={(e) => setRejectReason(e.target.value)}
                      className="w-full border-gray-300 rounded-md shadow-sm p-2 mb-3 text-sm"
                      rows={2}
                      placeholder="Enter rejection reason..."
                    />
                    <div className="flex justify-end gap-2">
                      <button onClick={() => setRejectId(null)} className="px-3 py-1 text-sm text-gray-600">Cancel</button>
                      <button onClick={() => handleReject(r.id)} disabled={!rejectReason.trim()} className="bg-red-600 text-white px-3 py-1 text-sm rounded-md hover:bg-red-700 disabled:opacity-50">Confirm</button>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}

        <h2 className="text-xl font-serif text-gray-900 mb-4 border-b pb-2">Quick Links</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Link href="/operator/restaurants" className="bg-white p-6 rounded-lg shadow-sm border border-gray-200 hover:border-brand-primary hover:shadow-md transition">
            <h3 className="text-lg font-bold text-gray-900">Detailed Approvals Page</h3>
          </Link>
          <Link href="/admin/data" className="bg-white p-6 rounded-lg shadow-sm border border-gray-200 hover:border-brand-primary hover:shadow-md transition">
            <h3 className="text-lg font-bold text-gray-900">System Data Explorer</h3>
          </Link>
        </div>
      </Container>
    </div>
  );
}
INNER_EOF
bash fix_admin_dashboard.sh
