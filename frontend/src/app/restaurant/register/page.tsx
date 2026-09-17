"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Container } from "@/components/Container";
import { Card, CardContent } from "@/components/Card";
import { Button } from "@/components/Button";
import { useAuth } from "@/context/AuthContext";
import { applyForRestaurant } from "@/lib/api";

export default function RegisterRestaurantPage() {
  const router = useRouter();
  const { user, requireAuth, loading } = useAuth();
  
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    name: "",
    cuisine: "",
    location: "",
    rating: 0.0,
    address: "",
    city: "",
    area: "",
    latitude: 0.0,
    longitude: 0.0,
    openingHours: "",
    deliveryRadius: 5.0,
    coverImageUrl: ""
  });

  useEffect(() => {
    if (!user && !loading) {
      requireAuth(() => {});
    }
  }, [user, loading, requireAuth]);

  if (!user) {
    return (
      <Container className="py-16 text-center">
        <p className="text-brand-muted">Please log in to apply.</p>
      </Container>
    );
  }

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value, type } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === "number" ? parseFloat(value) || 0 : value
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    
    setIsSubmitting(true);
    setError(null);

    try {
      await applyForRestaurant(formData);
      router.push("/restaurant/onboarding-status");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to submit application");
      setIsSubmitting(false);
    }
  };

  return (
    <Container className="py-12 sm:py-16 max-w-2xl mx-auto">
      <div className="mb-8 text-center">
        <h1 className="text-3xl sm:text-4xl font-serif font-semibold text-brand-fg mb-3">Register a Restaurant</h1>
        <p className="text-brand-muted text-lg">
          Submit your restaurant details to partner with QuickBite. Your application will be reviewed by our operations team.
        </p>
      </div>

      <Card className="shadow-sm border-brand-border/60">
        <CardContent className="p-6 sm:p-8">
          {error && (
            <div className="mb-6 p-4 bg-red-50 text-red-700 border border-red-200 rounded-lg text-sm">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-1.5">
              <label className="block text-sm font-medium text-brand-fg" htmlFor="name">Restaurant Name *</label>
              <input required id="name" name="name" type="text" className="w-full px-4 py-2 bg-transparent border border-brand-border rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-primary/50 text-brand-fg" value={formData.name} onChange={handleChange} />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              <div className="space-y-1.5">
                <label className="block text-sm font-medium text-brand-fg" htmlFor="cuisine">Cuisine Type *</label>
                <input required id="cuisine" name="cuisine" type="text" className="w-full px-4 py-2 bg-transparent border border-brand-border rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-primary/50 text-brand-fg" placeholder="e.g. Italian, Indian" value={formData.cuisine} onChange={handleChange} />
              </div>
              
              <div className="space-y-1.5">
                <label className="block text-sm font-medium text-brand-fg" htmlFor="location">Short Location *</label>
                <input required id="location" name="location" type="text" className="w-full px-4 py-2 bg-transparent border border-brand-border rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-primary/50 text-brand-fg" placeholder="e.g. Downtown" value={formData.location} onChange={handleChange} />
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="block text-sm font-medium text-brand-fg" htmlFor="address">Full Address</label>
              <input id="address" name="address" type="text" className="w-full px-4 py-2 bg-transparent border border-brand-border rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-primary/50 text-brand-fg" value={formData.address} onChange={handleChange} />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              <div className="space-y-1.5">
                <label className="block text-sm font-medium text-brand-fg" htmlFor="city">City</label>
                <input id="city" name="city" type="text" className="w-full px-4 py-2 bg-transparent border border-brand-border rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-primary/50 text-brand-fg" value={formData.city} onChange={handleChange} />
              </div>
              
              <div className="space-y-1.5">
                <label className="block text-sm font-medium text-brand-fg" htmlFor="area">Area</label>
                <input id="area" name="area" type="text" className="w-full px-4 py-2 bg-transparent border border-brand-border rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-primary/50 text-brand-fg" value={formData.area} onChange={handleChange} />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              <div className="space-y-1.5">
                <label className="block text-sm font-medium text-brand-fg" htmlFor="latitude">Latitude</label>
                <input id="latitude" name="latitude" type="number" step="any" className="w-full px-4 py-2 bg-transparent border border-brand-border rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-primary/50 text-brand-fg" value={formData.latitude} onChange={handleChange} />
              </div>
              
              <div className="space-y-1.5">
                <label className="block text-sm font-medium text-brand-fg" htmlFor="longitude">Longitude</label>
                <input id="longitude" name="longitude" type="number" step="any" className="w-full px-4 py-2 bg-transparent border border-brand-border rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-primary/50 text-brand-fg" value={formData.longitude} onChange={handleChange} />
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="block text-sm font-medium text-brand-fg" htmlFor="openingHours">Opening Hours</label>
              <input id="openingHours" name="openingHours" type="text" className="w-full px-4 py-2 bg-transparent border border-brand-border rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-primary/50 text-brand-fg" placeholder="e.g. 9:00 AM - 10:00 PM" value={formData.openingHours} onChange={handleChange} />
            </div>

            <div className="space-y-1.5">
              <label className="block text-sm font-medium text-brand-fg" htmlFor="coverImageUrl">Cover Image URL</label>
              <input id="coverImageUrl" name="coverImageUrl" type="url" className="w-full px-4 py-2 bg-transparent border border-brand-border rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-primary/50 text-brand-fg" placeholder="https://..." value={formData.coverImageUrl} onChange={handleChange} />
            </div>

            <div className="pt-4">
              <Button type="submit" disabled={isSubmitting} className="w-full" size="lg">
                {isSubmitting ? "Submitting..." : "Submit Application"}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </Container>
  );
}
