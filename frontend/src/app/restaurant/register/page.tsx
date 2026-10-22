"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Container } from "@/components/Container";
import { useAuth } from "@/context/AuthContext";
import { applyForRestaurant, CreateRestaurantRequest } from "@/lib/api";
import { CheckCircle2, Store, User, MapPin, Clock } from "lucide-react";

export default function RegisterRestaurantPage() {
  const router = useRouter();
  const { user, requireAuth, loading } = useAuth();
  
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  
  const [formData, setFormData] = useState<CreateRestaurantRequest>({
    name: "",
    cuisine: "",
    phone: "",
    email: "",
    city: "",
    location: "", // maps to locality
    address: "",
    latitude: 0,
    longitude: 0,
    openingTime: "09:00",
    closingTime: "22:00",
    coverImageUrl: "https://images.unsplash.com/photo-1552566626-52f8b828add9?auto=format&fit=crop&q=80&w=800",
  });

  useEffect(() => {
    if (!user && !loading) {
      requireAuth(() => {});
    }
  }, [user, loading, requireAuth]);

  if (loading || !user) {
    return <div className="p-20 text-center text-stone-500 font-medium">Loading...</div>;
  }

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData((prev: CreateRestaurantRequest) => ({
      ...prev,
      [name]: name === "latitude" || name === "longitude" ? parseFloat(value) || 0 : value
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError(null);

    // Validate required
    if (!formData.name || !formData.cuisine || !formData.phone || !formData.email || !formData.city || !formData.location || !formData.address) {
      setError("Please fill out all required fields.");
      setIsSubmitting(false);
      return;
    }

    try {
      await applyForRestaurant(formData);
      setSuccess(true);
    } catch (err: any) {
      setError(err.message || "Failed to submit application. You might already have a pending request.");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (success) {
    return (
      <div className="min-h-screen bg-stone-50 py-16">
        <Container>
          <div className="max-w-2xl mx-auto bg-white rounded-3xl p-12 text-center shadow-sm border border-stone-100">
            <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
              <CheckCircle2 className="w-10 h-10 text-green-600" />
            </div>
            <h1 className="text-3xl font-black text-stone-900 mb-4">Application submitted successfully</h1>
            <p className="text-xl text-stone-600 mb-8">Your restaurant is waiting for admin approval.</p>
            
            <div className="inline-flex items-center gap-2 bg-amber-100 text-amber-800 px-4 py-2 rounded-full font-bold text-sm tracking-wide">
              Status: PENDING_APPROVAL
            </div>
            
            <div className="mt-12">
              <button 
                onClick={() => router.push('/')}
                className="text-stone-500 font-bold hover:text-stone-800 transition-colors"
              >
                Return to Home
              </button>
            </div>
          </div>
        </Container>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-stone-50 py-12">
      <Container>
        <div className="max-w-4xl mx-auto">
          <div className="mb-10 text-center">
            <h1 className="text-4xl font-black text-stone-900 tracking-tight mb-3">Partner With Us</h1>
            <p className="text-lg text-stone-500">Register your restaurant and reach thousands of new customers.</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-8">
            
            {error && (
              <div className="bg-red-50 border-l-4 border-red-500 p-4 rounded-r-lg">
                <p className="text-red-700 font-medium">{error}</p>
              </div>
            )}

            {/* RESTAURANT DETAILS */}
            <div className="bg-white p-8 rounded-3xl shadow-sm border border-stone-200">
              <h2 className="text-xl font-bold text-stone-900 mb-6 flex items-center gap-2 border-b border-stone-100 pb-4">
                <Store className="w-5 h-5 text-brand-primary" /> Restaurant Details
              </h2>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-bold text-stone-700 mb-2">Restaurant Name *</label>
                  <input required name="name" value={formData.name} onChange={handleChange} className="w-full p-3 border border-stone-300 rounded-xl focus:ring-2 focus:ring-brand-primary focus:border-brand-primary bg-stone-50 focus:bg-white transition-colors" placeholder="e.g. Spice Route" />
                </div>
                <div>
                  <label className="block text-sm font-bold text-stone-700 mb-2">Cuisine Type *</label>
                  <input required name="cuisine" value={formData.cuisine} onChange={handleChange} className="w-full p-3 border border-stone-300 rounded-xl focus:ring-2 focus:ring-brand-primary focus:border-brand-primary bg-stone-50 focus:bg-white transition-colors" placeholder="e.g. North Indian, Chinese" />
                </div>
                <div>
                  <label className="block text-sm font-bold text-stone-700 mb-2">Restaurant Phone *</label>
                  <input required type="tel" name="phone" value={formData.phone} onChange={handleChange} className="w-full p-3 border border-stone-300 rounded-xl focus:ring-2 focus:ring-brand-primary focus:border-brand-primary bg-stone-50 focus:bg-white transition-colors" placeholder="+91 9876543210" />
                </div>
                <div>
                  <label className="block text-sm font-bold text-stone-700 mb-2">Restaurant Email *</label>
                  <input required type="email" name="email" value={formData.email} onChange={handleChange} className="w-full p-3 border border-stone-300 rounded-xl focus:ring-2 focus:ring-brand-primary focus:border-brand-primary bg-stone-50 focus:bg-white transition-colors" placeholder="hello@spiceroute.com" />
                </div>
              </div>
            </div>

            {/* LOCATION DETAILS */}
            <div className="bg-white p-8 rounded-3xl shadow-sm border border-stone-200">
              <h2 className="text-xl font-bold text-stone-900 mb-6 flex items-center gap-2 border-b border-stone-100 pb-4">
                <MapPin className="w-5 h-5 text-brand-primary" /> Location & Timing
              </h2>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                <div>
                  <label className="block text-sm font-bold text-stone-700 mb-2">City *</label>
                  <input required name="city" value={formData.city} onChange={handleChange} className="w-full p-3 border border-stone-300 rounded-xl focus:ring-2 focus:ring-brand-primary focus:border-brand-primary bg-stone-50 focus:bg-white transition-colors" placeholder="e.g. Mumbai" />
                </div>
                <div>
                  <label className="block text-sm font-bold text-stone-700 mb-2">Locality *</label>
                  <input required name="location" value={formData.location} onChange={handleChange} className="w-full p-3 border border-stone-300 rounded-xl focus:ring-2 focus:ring-brand-primary focus:border-brand-primary bg-stone-50 focus:bg-white transition-colors" placeholder="e.g. Bandra West" />
                </div>
                <div className="md:col-span-2">
                  <label className="block text-sm font-bold text-stone-700 mb-2">Full Address *</label>
                  <textarea required name="address" rows={2} value={formData.address} onChange={handleChange} className="w-full p-3 border border-stone-300 rounded-xl focus:ring-2 focus:ring-brand-primary focus:border-brand-primary bg-stone-50 focus:bg-white transition-colors" placeholder="Complete street address" />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                <div className="md:col-span-1">
                  <label className="block text-sm font-bold text-stone-700 mb-2">Opening Time *</label>
                  <input required type="time" name="openingTime" value={formData.openingTime} onChange={handleChange} className="w-full p-3 border border-stone-300 rounded-xl focus:ring-2 focus:ring-brand-primary focus:border-brand-primary bg-stone-50 focus:bg-white transition-colors" />
                </div>
                <div className="md:col-span-1">
                  <label className="block text-sm font-bold text-stone-700 mb-2">Closing Time *</label>
                  <input required type="time" name="closingTime" value={formData.closingTime} onChange={handleChange} className="w-full p-3 border border-stone-300 rounded-xl focus:ring-2 focus:ring-brand-primary focus:border-brand-primary bg-stone-50 focus:bg-white transition-colors" />
                </div>
                <div className="md:col-span-1">
                  <label className="block text-sm font-bold text-stone-700 mb-2">Latitude (Opt)</label>
                  <input type="number" step="any" name="latitude" value={formData.latitude || ""} onChange={handleChange} className="w-full p-3 border border-stone-300 rounded-xl focus:ring-2 focus:ring-brand-primary focus:border-brand-primary bg-stone-50 focus:bg-white transition-colors" placeholder="19.0760" />
                </div>
                <div className="md:col-span-1">
                  <label className="block text-sm font-bold text-stone-700 mb-2">Longitude (Opt)</label>
                  <input type="number" step="any" name="longitude" value={formData.longitude || ""} onChange={handleChange} className="w-full p-3 border border-stone-300 rounded-xl focus:ring-2 focus:ring-brand-primary focus:border-brand-primary bg-stone-50 focus:bg-white transition-colors" placeholder="72.8777" />
                </div>
              </div>
            </div>

            {/* OWNER DETAILS */}
            <div className="bg-white p-8 rounded-3xl shadow-sm border border-stone-200">
              <h2 className="text-xl font-bold text-stone-900 mb-6 flex items-center gap-2 border-b border-stone-100 pb-4">
                <User className="w-5 h-5 text-brand-primary" /> Owner Details
              </h2>
              <p className="text-sm text-stone-500 mb-6">These details are tied to your current QuickBite account.</p>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div>
                  <label className="block text-sm font-bold text-stone-700 mb-2">Owner Name</label>
                  <input disabled value={(user as any)?.name || ""} className="w-full p-3 border border-stone-200 rounded-xl bg-stone-100 text-stone-600 font-medium cursor-not-allowed" />
                </div>
                <div>
                  <label className="block text-sm font-bold text-stone-700 mb-2">Owner Email</label>
                  <input disabled value={(user as any)?.email || ""} className="w-full p-3 border border-stone-200 rounded-xl bg-stone-100 text-stone-600 font-medium cursor-not-allowed" />
                </div>
                <div>
                  <label className="block text-sm font-bold text-stone-700 mb-2">Owner Phone</label>
                  <input disabled value={(user as any)?.phone || ""} className="w-full p-3 border border-stone-200 rounded-xl bg-stone-100 text-stone-600 font-medium cursor-not-allowed" />
                </div>
              </div>
            </div>

            <div className="pt-4 flex justify-end">
              <button
                type="submit"
                disabled={isSubmitting}
                className="bg-brand-primary hover:bg-brand-primary/90 text-white font-bold py-4 px-12 rounded-xl shadow-lg transition-transform hover:-translate-y-0.5 disabled:opacity-50 disabled:hover:translate-y-0 text-lg"
              >
                {isSubmitting ? "Submitting Application..." : "Submit Registration"}
              </button>
            </div>
            
          </form>
        </div>
      </Container>
    </div>
  );
}
