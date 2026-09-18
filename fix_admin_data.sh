#!/bin/bash
cat << 'INNER_EOF' > frontend/src/app/admin/data/page.tsx
"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { Container } from "@/components/Container";
import { authFetch, getApiBaseUrl } from "@/lib/api";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export default function AdminDataExplorer() {
  const router = useRouter();
  const { user, loading } = useAuth();
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [data, setData] = useState<{ customers: any[]; orders: any[]; deliveries: any[]; restaurants: any[] } | null>(null);

  useEffect(() => {
    if (loading) return;
    if (!user || !user.roles?.includes("OPERATOR")) {
      router.push("/");
      return;
    }

    Promise.all([
      authFetch(`${getApiBaseUrl()}/api/customers`).then(r => r.json()),
      authFetch(`${getApiBaseUrl()}/api/admin/orders`).then(r => r.json()),
      authFetch(`${getApiBaseUrl()}/api/admin/deliveries`).then(r => r.json()),
      authFetch(`${getApiBaseUrl()}/api/admin/restaurants`).then(r => r.json()),
    ]).then(([c, o, d, r]) => setData({ customers: c, orders: o, deliveries: d, restaurants: r }))
      .catch(console.error);
  }, [loading, user, router]);

  if (!data) return <div className="p-10 text-center">Loading explorer...</div>;

  return (
    <Container className="py-10">
      <h1 className="text-3xl font-serif mb-8">System Data Explorer</h1>
      
      <div className="space-y-12">
        <section>
          <h2 className="text-xl font-bold mb-4">All Restaurant Applications</h2>
          <div className="overflow-x-auto bg-white shadow rounded-lg p-4">
            <table className="min-w-full text-sm">
              <thead><tr><th className="text-left font-semibold border-b pb-2">ID</th><th className="text-left font-semibold border-b pb-2">Name</th><th className="text-left font-semibold border-b pb-2">Status</th></tr></thead>
              {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
              <tbody>{data.restaurants.map((r: any) => <tr key={r.id} className="border-b last:border-0"><td className="py-2">{r.id}</td><td className="py-2">{r.name}</td><td className="py-2">{r.status || 'PENDING_APPROVAL'}</td></tr>)}</tbody>
            </table>
          </div>
        </section>

        <section>
          <h2 className="text-xl font-bold mb-4">Customers</h2>
          <div className="overflow-x-auto bg-white shadow rounded-lg p-4">
            <table className="min-w-full text-sm">
              <thead><tr><th className="text-left font-semibold border-b pb-2">ID</th><th className="text-left font-semibold border-b pb-2">Email</th><th className="text-left font-semibold border-b pb-2">Role</th></tr></thead>
              {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
              <tbody>{data.customers.map((c: any) => <tr key={c.id} className="border-b last:border-0"><td className="py-2">{c.id}</td><td className="py-2">{c.email}</td><td className="py-2">{c.role}</td></tr>)}</tbody>
            </table>
          </div>
        </section>

        <section>
          <h2 className="text-xl font-bold mb-4">Orders</h2>
          <div className="overflow-x-auto bg-white shadow rounded-lg p-4">
            <table className="min-w-full text-sm">
              <thead><tr><th className="text-left font-semibold border-b pb-2">ID</th><th className="text-left font-semibold border-b pb-2">Cust ID</th><th className="text-left font-semibold border-b pb-2">Rest ID</th><th className="text-left font-semibold border-b pb-2">Status</th><th className="text-left font-semibold border-b pb-2">Total</th></tr></thead>
              {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
              <tbody>{data.orders.map((o: any) => <tr key={o.id} className="border-b last:border-0"><td className="py-2">{o.id}</td><td className="py-2">{o.customerId}</td><td className="py-2">{o.restaurantId}</td><td className="py-2">{o.status}</td><td className="py-2">₹{o.totalAmount}</td></tr>)}</tbody>
            </table>
          </div>
        </section>

        <section>
          <h2 className="text-xl font-bold mb-4">Deliveries</h2>
          <div className="overflow-x-auto bg-white shadow rounded-lg p-4">
            <table className="min-w-full text-sm">
              <thead><tr><th className="text-left font-semibold border-b pb-2">ID</th><th className="text-left font-semibold border-b pb-2">Order ID</th><th className="text-left font-semibold border-b pb-2">Driver ID</th><th className="text-left font-semibold border-b pb-2">Status</th></tr></thead>
              {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
              <tbody>{data.deliveries.map((d: any) => <tr key={d.id} className="border-b last:border-0"><td className="py-2">{d.id}</td><td className="py-2">{d.orderId}</td><td className="py-2">{d.driverId || 'Unassigned'}</td><td className="py-2">{d.status}</td></tr>)}</tbody>
            </table>
          </div>
        </section>
      </div>
    </Container>
  );
}
INNER_EOF
bash fix_admin_data.sh
