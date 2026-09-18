"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import Link from "next/link";
import { Container } from "@/components/Container";
import { getAdminStats } from "@/lib/api";

export default function AdminDashboardPage() {
  const router = useRouter();
  const { user, loading } = useAuth();
  const [stats, setStats] = useState<{ totalCustomers: number; totalRestaurants: number; totalOrders: number; totalDeliveries: number } | null>(null);

  useEffect(() => {
    if (loading) return;
    if (!user || !user.roles?.includes("OPERATOR")) {
      router.push("/");
      return;
    }

    getAdminStats().then(setStats).catch(console.error);
  }, [loading, user, router]);

  if (loading) return <div className="p-10 text-center text-gray-500">Loading admin dashboard...</div>;
  if (!user || !user.roles?.includes("OPERATOR")) return null;

  return (
    <div className="flex-1 py-10 sm:py-16 bg-gray-50">
      <Container>
        <div className="mb-8">
          <h1 className="text-3xl font-serif text-gray-900">Admin Dashboard</h1>
          <p className="text-gray-500 mt-2">Manage the QuickBite platform</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-10">
          <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-100">
            <h3 className="text-sm font-medium text-gray-500">Total Customers</h3>
            <p className="text-3xl font-bold text-gray-900 mt-2">{stats?.totalCustomers ?? "--"}</p>
          </div>
          <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-100">
            <h3 className="text-sm font-medium text-gray-500">Restaurants</h3>
            <p className="text-3xl font-bold text-orange-600 mt-2">{stats?.totalRestaurants ?? "--"}</p>
          </div>
          <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-100">
            <h3 className="text-sm font-medium text-gray-500">Total Orders</h3>
            <p className="text-3xl font-bold text-gray-900 mt-2">{stats?.totalOrders ?? "--"}</p>
          </div>
          <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-100">
            <h3 className="text-sm font-medium text-gray-500">Deliveries</h3>
            <p className="text-3xl font-bold text-gray-900 mt-2">{stats?.totalDeliveries ?? "--"}</p>
          </div>
        </div>

        <h2 className="text-xl font-serif text-gray-900 mb-4 border-b pb-2">Quick Actions</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Link href="/operator/restaurants" className="bg-white p-6 rounded-lg shadow-sm border border-gray-200 hover:border-brand-primary hover:shadow-md transition">
            <h3 className="text-lg font-bold text-gray-900">Restaurant Approvals</h3>
            <p className="text-sm text-gray-500 mt-1">Review pending restaurant applications and manage credentials</p>
          </Link>
          <Link href="/admin/data" className="bg-white p-6 rounded-lg shadow-sm border border-gray-200 hover:border-brand-primary hover:shadow-md transition">
            <h3 className="text-lg font-bold text-gray-900">System Data Explorer</h3>
            <p className="text-sm text-gray-500 mt-1">View all entities directly</p>
          </Link>
        </div>
      </Container>
    </div>
  );
}
