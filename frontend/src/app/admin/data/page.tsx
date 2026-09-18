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
      authFetch(`${getApiBaseUrl()}/api/restaurants`).then(r => r.json()),
    ]).then(([c, o, d, r]) => setData({ customers: c, orders: o, deliveries: d, restaurants: r }))
      .catch(console.error);
  }, [loading, user, router]);

  if (!data) return <div className="p-10 text-center">Loading explorer...</div>;

  return (
    <Container className="py-10">
      <h1 className="text-3xl font-serif mb-8">System Data Explorer</h1>
      
      <div className="space-y-12">
        <section>
          <h2 className="text-xl font-bold mb-4">Customers</h2>
          <div className="overflow-x-auto bg-white shadow rounded-lg p-4">
            <table className="min-w-full text-sm">
              <thead><tr><th className="text-left font-semibold">ID</th><th className="text-left font-semibold">Email</th><th className="text-left font-semibold">Role</th></tr></thead>
              {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
              <tbody>{data.customers.map((c: any) => <tr key={c.id}><td>{c.id}</td><td>{c.email}</td><td>{c.role}</td></tr>)}</tbody>
            </table>
          </div>
        </section>

        <section>
          <h2 className="text-xl font-bold mb-4">Restaurants (Approved)</h2>
          <div className="overflow-x-auto bg-white shadow rounded-lg p-4">
            <table className="min-w-full text-sm">
              <thead><tr><th className="text-left font-semibold">ID</th><th className="text-left font-semibold">Name</th><th className="text-left font-semibold">Owner ID</th></tr></thead>
              {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
              <tbody>{data.restaurants.map((r: any) => <tr key={r.id}><td>{r.id}</td><td>{r.name}</td><td>{r.ownerId}</td></tr>)}</tbody>
            </table>
          </div>
        </section>

        <section>
          <h2 className="text-xl font-bold mb-4">Orders</h2>
          <div className="overflow-x-auto bg-white shadow rounded-lg p-4">
            <table className="min-w-full text-sm">
              <thead><tr><th className="text-left font-semibold">ID</th><th className="text-left font-semibold">Cust ID</th><th className="text-left font-semibold">Rest ID</th><th className="text-left font-semibold">Status</th><th className="text-left font-semibold">Total</th></tr></thead>
              {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
              <tbody>{data.orders.map((o: any) => <tr key={o.id}><td>{o.id}</td><td>{o.customerId}</td><td>{o.restaurantId}</td><td>{o.status}</td><td>₹{o.totalAmount}</td></tr>)}</tbody>
            </table>
          </div>
        </section>

        <section>
          <h2 className="text-xl font-bold mb-4">Deliveries</h2>
          <div className="overflow-x-auto bg-white shadow rounded-lg p-4">
            <table className="min-w-full text-sm">
              <thead><tr><th className="text-left font-semibold">ID</th><th className="text-left font-semibold">Order ID</th><th className="text-left font-semibold">Driver ID</th><th className="text-left font-semibold">Status</th></tr></thead>
              {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
              <tbody>{data.deliveries.map((d: any) => <tr key={d.id}><td>{d.id}</td><td>{d.orderId}</td><td>{d.driverId || 'Unassigned'}</td><td>{d.status}</td></tr>)}</tbody>
            </table>
          </div>
        </section>
      </div>
    </Container>
  );
}
