"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Container } from "@/components/Container";
import { Card } from "@/components/Card";
import { Button } from "@/components/Button";
import { Badge } from "@/components/Badge";
import { useAuth } from "@/context/AuthContext";
import { getMyApplications, getMyStaffRequests } from "@/lib/api";
import { Restaurant, RestaurantStaffProfile } from "@/types/restaurant";

export default function OnboardingStatusPage() {
  const router = useRouter();
  const { user, requireAuth, loading } = useAuth();
  
  const [applications, setApplications] = useState<Restaurant[]>([]);
  const [staffRequests, setStaffRequests] = useState<RestaurantStaffProfile[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let ignore = false;
    
    async function load() {
      try {
        
        const [apps, requests] = await Promise.all([
          getMyApplications(),
          getMyStaffRequests()
        ]);
        if (!ignore) {
          setApplications(apps);
          setStaffRequests(requests);
          setIsLoading(false);
        }
      } catch (err) {
        if (!ignore) {
          setError(err instanceof Error ? err.message : "Failed to load onboarding status");
          setIsLoading(false);
        }
      }
    }

    if (user) {
      load();
    } else if (!loading) {
      requireAuth(() => {});
    }
    
    return () => { ignore = true; };
  }, [user, loading, requireAuth]);

  if (isLoading) {
    return (
      <Container className="py-16">
        <div className="animate-pulse space-y-6">
          <div className="h-10 w-1/3 bg-brand-border/60 rounded" />
          <div className="h-32 bg-brand-border/40 rounded-xl" />
        </div>
      </Container>
    );
  }

  return (
    <Container className="py-12 sm:py-16 max-w-4xl mx-auto">
      <div className="mb-10 text-center sm:text-left flex flex-col sm:flex-row justify-between items-center gap-6">
        <div>
          <h1 className="text-3xl sm:text-4xl font-serif font-semibold text-brand-fg mb-2">Partner with QuickBite</h1>
          <p className="text-brand-muted text-lg">Manage your restaurant applications and staff access.</p>
        </div>
        <div className="flex gap-4">
          <Button href="/restaurant/register" variant="primary">Register Restaurant</Button>
          <Button href="/restaurant/join" variant="outline">Join Existing</Button>
        </div>
      </div>

      {error && (
        <div className="mb-8 p-4 bg-red-50 text-red-700 border border-red-200 rounded-lg text-sm text-center">
          {error}
        </div>
      )}

      <div className="space-y-12">
        {/* Applications Section */}
        <section>
          <h2 className="text-2xl font-serif text-brand-fg mb-4">New Restaurant Applications</h2>
          {applications.length === 0 ? (
            <Card className="p-8 text-center bg-brand-bg border-brand-border/60 border-dashed">
              <p className="text-brand-muted mb-4">You have not submitted any new restaurant applications.</p>
              <Button href="/restaurant/register" variant="outline" size="sm">Start Application</Button>
            </Card>
          ) : (
            <div className="space-y-4">
              {applications.map((app) => (
                <Card key={app.id} className="p-6 bg-white shadow-xs">
                  <div className="flex justify-between items-start flex-wrap gap-4">
                    <div>
                      <h3 className="text-xl font-medium text-brand-fg">{app.name}</h3>
                      <p className="text-brand-muted text-sm">{app.cuisine} • {app.city || app.location}</p>
                    </div>
                    <Badge variant={app.status === 'APPROVED' ? 'success' : app.status === 'PENDING_APPROVAL' ? 'warning' : 'neutral'}>
                      {app.status || 'APPROVED'}
                    </Badge>
                  </div>
                </Card>
              ))}
            </div>
          )}
        </section>

        {/* Staff Requests Section */}
        <section>
          <h2 className="text-2xl font-serif text-brand-fg mb-4">Staff Access Requests</h2>
          {staffRequests.length === 0 ? (
            <Card className="p-8 text-center bg-brand-bg border-brand-border/60 border-dashed">
              <p className="text-brand-muted mb-4">You have no pending staff requests.</p>
              <Button href="/restaurant/join" variant="outline" size="sm">Find a Restaurant</Button>
            </Card>
          ) : (
            <div className="space-y-4">
              {staffRequests.map((req) => (
                <Card key={req.id} className="p-6 bg-white shadow-xs">
                  <div className="flex justify-between items-start flex-wrap gap-4">
                    <div>
                      <h3 className="text-lg font-medium text-brand-fg">Restaurant ID: {req.restaurantId}</h3>
                      <p className="text-brand-muted text-sm mt-1">
                        Applied on: {req.createdAt ? new Date(req.createdAt).toLocaleDateString() : 'Unknown'}
                      </p>
                    </div>
                    <Badge variant={req.approvalStatus === 'APPROVED' ? 'success' : req.approvalStatus === 'PENDING_APPROVAL' ? 'warning' : 'error'}>
                      {req.approvalStatus}
                    </Badge>
                  </div>
                </Card>
              ))}
            </div>
          )}
        </section>
      </div>
    </Container>
  );
}
