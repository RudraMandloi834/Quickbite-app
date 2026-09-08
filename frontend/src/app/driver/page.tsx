"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { Container } from "@/components/Container";
import { Card } from "@/components/Card";
import { Badge } from "@/components/Badge";
import { Button } from "@/components/Button";
import { useAuth } from "@/context/AuthContext";
import {
  getAvailableDeliveries,
  getMyDeliveries,
  assignDelivery,
  updateDeliveryStatus,
} from "@/lib/api";
import { Delivery } from "@/types/delivery";

export default function DriverDashboardPage() {
  const router = useRouter();
  const { user, loading, requireAuth } = useAuth();
  
  const [deliveries, setDeliveries] = useState<Delivery[]>([]);
  const [myDeliveries, setMyDeliveries] = useState<Delivery[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchDeliveries = useCallback(async () => {
    if (loading) return;
    if (!user) {
      requireAuth(() => {});
      return;
    }
    
    try {
      const [available, mine] = await Promise.all([
        getAvailableDeliveries(),
        getMyDeliveries()
      ]);

      setDeliveries(available);
      setMyDeliveries(mine);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "An error occurred. You might not have the required permissions.");
    } finally {
      setIsLoading(false);
    }
  }, [loading, user, requireAuth]);

  useEffect(() => {
    fetchDeliveries();
  }, [fetchDeliveries]);

  const handleAssign = async (deliveryId: number) => {
    try {
      await assignDelivery(deliveryId);
      await fetchDeliveries();
    } catch (err: unknown) {
      alert(err instanceof Error ? err.message : "Error assigning delivery");
    }
  };

  const handleUpdateStatus = async (deliveryId: number, status: string) => {
    try {
      await updateDeliveryStatus(deliveryId, status);
      await fetchDeliveries();
    } catch (err: unknown) {
      alert(err instanceof Error ? err.message : "Error updating status");
    }
  };

  const getNextStatus = (currentStatus: string) => {
    switch (currentStatus) {
      case "ASSIGNED": return "PICKED_UP";
      case "PICKED_UP": return "OUT_FOR_DELIVERY";
      case "OUT_FOR_DELIVERY": return "DELIVERED";
      default: return null;
    }
  };

  if (isLoading) {
    return (
      <div className="flex-1 py-10">
        <Container>
          <div className="animate-pulse space-y-4">
            <div className="h-8 w-1/4 bg-brand-border/40 rounded"></div>
            <div className="h-32 w-full bg-brand-border/40 rounded"></div>
          </div>
        </Container>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex-1 py-20">
        <Container>
          <Card className="max-w-md mx-auto p-10 text-center bg-white shadow-xs border-rose-200">
            <h2 className="text-2xl font-serif text-brand-fg mb-3">Access Denied</h2>
            <p className="text-brand-muted text-sm mb-8">{error}</p>
            <Button href="/" variant="primary" className="w-full">Return Home</Button>
          </Card>
        </Container>
      </div>
    );
  }

  return (
    <div className="flex-1 py-10 sm:py-16">
      <Container>
        <div className="mb-8">
          <h1 className="text-3xl font-serif text-brand-fg">Driver Operations</h1>
          <p className="text-brand-muted mt-2">Manage and update your active deliveries.</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Active / Assigned Deliveries */}
          <div className="space-y-6">
            <h2 className="text-xl font-serif text-brand-fg border-b border-brand-border pb-2">My Active Deliveries</h2>
            
            {myDeliveries.filter(d => d.status !== 'DELIVERED' && d.status !== 'CANCELLED').length === 0 ? (
              <p className="text-sm text-brand-muted">You have no active deliveries.</p>
            ) : (
              myDeliveries.filter(d => d.status !== 'DELIVERED' && d.status !== 'CANCELLED').map(delivery => {
                const nextStatus = getNextStatus(delivery.status);
                return (
                  <Card key={delivery.id} className="p-6 bg-white shadow-xs">
                    <div className="flex justify-between items-start mb-4">
                      <div>
                        <p className="text-sm font-semibold text-brand-muted">Order #{delivery.orderId}</p>
                        <h3 className="text-lg font-medium text-brand-fg mt-1">Status: {delivery.status.replace(/_/g, ' ')}</h3>
                      </div>
                      <Badge variant="neutral">Active</Badge>
                    </div>
                    
                    {nextStatus && (
                      <Button 
                        variant="primary" 
                        onClick={() => handleUpdateStatus(delivery.id, nextStatus)}
                        className="w-full mt-4"
                      >
                        Mark as {nextStatus.replace(/_/g, ' ')}
                      </Button>
                    )}
                  </Card>
                );
              })
            )}

            <h2 className="text-xl font-serif text-brand-fg border-b border-brand-border pb-2 mt-8">My Completed Deliveries</h2>
            {myDeliveries.filter(d => d.status === 'DELIVERED').length === 0 ? (
               <p className="text-sm text-brand-muted">No completed deliveries yet.</p>
            ) : (
               myDeliveries.filter(d => d.status === 'DELIVERED').map(delivery => (
                 <Card key={delivery.id} className="p-4 bg-gray-50 border border-gray-100">
                    <p className="text-sm font-semibold text-gray-500">Order #{delivery.orderId}</p>
                    <p className="text-sm text-emerald-600 font-medium">Delivered successfully</p>
                 </Card>
               ))
            )}
          </div>

          {/* Available Deliveries */}
          <div className="space-y-6">
            <h2 className="text-xl font-serif text-brand-fg border-b border-brand-border pb-2">Available for Assignment</h2>
            
            {deliveries.length === 0 ? (
              <p className="text-sm text-brand-muted">No deliveries waiting for assignment.</p>
            ) : (
              deliveries.map(delivery => (
                <Card key={delivery.id} className="p-6 bg-white shadow-xs border-amber-200">
                  <div className="flex justify-between items-start mb-4">
                    <div>
                      <p className="text-sm font-semibold text-brand-muted">Order #{delivery.orderId}</p>
                      <h3 className="text-lg font-medium text-brand-fg mt-1">Needs Driver</h3>
                    </div>
                    <Badge variant="warning">Waiting</Badge>
                  </div>
                  
                  <Button 
                    variant="primary" 
                    onClick={() => handleAssign(delivery.id)}
                    className="w-full mt-2"
                  >
                    Accept Delivery
                  </Button>
                </Card>
              ))
            )}
          </div>
        </div>
      </Container>
    </div>
  );
}
