/* eslint-disable */
"use client";

import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { Container } from "@/components/Container";
import { Card } from "@/components/Card";
import { Badge } from "@/components/Badge";
import { Button } from "@/components/Button";
import { useAuth } from "@/context/AuthContext";
import { useSSE } from "@/hooks/useSSE";

import {
  getAvailableDeliveries,
  getMyDeliveries,
  assignDelivery,
  updateDeliveryStatus,
} from "@/lib/api";
import { Delivery } from "@/types/delivery";

export default function DriverDashboardPage() {
  const queryClient = useQueryClient();
  const token = typeof window !== "undefined" ? localStorage.getItem("token") : null;
  const { user, loading, requireAuth } = useAuth();
  
  useSSE(token, (event: any) => {
    queryClient.invalidateQueries({ queryKey: ["driverDeliveries"] });
  });

  const { data: availableDeliveries = [], isLoading: isAvailableLoading, isError: isAvailableError, error: availableError } = useQuery({
    queryKey: ["driverDeliveries", "available"],
    queryFn: getAvailableDeliveries,
    enabled: !!user && user.roles?.includes("DRIVER")
  });

  const { data: myDeliveries = [], isLoading: isMyLoading, isError: isMyError, error: myError } = useQuery({
    queryKey: ["driverDeliveries", "mine", user?.sub],
    queryFn: getMyDeliveries,
    enabled: !!user && user.roles?.includes("DRIVER")
  });

  const handleAssign = async (deliveryId: number) => {
    try {
      await assignDelivery(deliveryId);
      queryClient.invalidateQueries({ queryKey: ["driverDeliveries"] });
    } catch (err: unknown) {
      alert(err instanceof Error ? err.message : "Error assigning delivery");
    }
  };

  const handleUpdateStatus = async (deliveryId: number, status: string) => {
    try {
      await updateDeliveryStatus(deliveryId, status);
      queryClient.invalidateQueries({ queryKey: ["driverDeliveries"] });
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

  if (loading || isAvailableLoading || isMyLoading) {
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

  const isError = isAvailableError || isMyError;
  const errorMsg = (availableError as Error)?.message || (myError as Error)?.message;

  if (isError) {
    return (
      <div className="flex-1 py-20">
        <Container>
          <Card className="max-w-md mx-auto p-10 text-center bg-white shadow-xs border-rose-200">
            <h2 className="text-2xl font-serif text-brand-fg mb-3">Error Loading Data</h2>
            <p className="text-brand-muted text-sm mb-8">{errorMsg || "An error occurred fetching deliveries."}</p>
            <Button href="/" variant="primary" className="w-full">Return Home</Button>
          </Card>
        </Container>
      </div>
    );
  }

  const activeDeliveries = myDeliveries.filter(d => d.status !== 'DELIVERED' && d.status !== 'CANCELLED');
  const completedDeliveries = myDeliveries.filter(d => d.status === 'DELIVERED');

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
            
            {activeDeliveries.length === 0 ? (
              <p className="text-sm text-brand-muted">You have no active deliveries.</p>
            ) : (
              activeDeliveries.map(delivery => {
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
            {completedDeliveries.length === 0 ? (
               <p className="text-sm text-brand-muted">No completed deliveries yet.</p>
            ) : (
               completedDeliveries.map(delivery => (
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
            
            {availableDeliveries.length === 0 ? (
              <p className="text-sm text-brand-muted">No deliveries waiting for assignment.</p>
            ) : (
              availableDeliveries.map(delivery => (
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
