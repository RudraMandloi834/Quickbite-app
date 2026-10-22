"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { Container } from "@/components/Container";
import { Button } from "@/components/Button";
import { User, MapPin, CreditCard, Heart, Settings, LogOut, PackageSearch, Plus, Trash2, Edit2, Info } from "lucide-react";

export default function ProfilePage() {
  const router = useRouter();
  const { user, loading, logout } = useAuth();
  const [activeTab, setActiveTab] = useState('profile');

  useEffect(() => {
    if (!loading && !user) {
      router.push("/login?redirect=/profile");
    }
  }, [user, loading, router]);

  if (loading || !user) {
    return <div className="min-h-screen bg-stone-50" />;
  }

  const tabs = [
    { id: 'profile', label: 'My Profile', icon: User },
    { id: 'orders', label: 'Orders', icon: PackageSearch, onClick: () => router.push('/orders') },
    { id: 'addresses', label: 'Addresses', icon: MapPin },
    { id: 'payments', label: 'Payment Methods', icon: CreditCard },
    { id: 'favorites', label: 'Favorites', icon: Heart },
    { id: 'settings', label: 'Settings', icon: Settings },
  ];

  return (
    <div className="min-h-screen bg-stone-50 pt-24 pb-24">
      <Container>
        <div className="flex flex-col lg:flex-row gap-8">
          
          {/* Sidebar */}
          <div className="w-full lg:w-72 shrink-0">
            <div className="bg-white rounded-2xl border border-stone-100 shadow-sm overflow-hidden sticky top-24">
              <div className="p-6 border-b border-stone-100 bg-stone-50/50 flex items-center gap-4">
                <div className="w-14 h-14 bg-brand-primary/10 text-brand-primary rounded-full flex items-center justify-center font-extrabold text-xl">
                  {(user as any).name || (user as any).sub?.split('@')[0] || 'User'?.charAt(0) || 'U'}
                </div>
                <div>
                  <h2 className="font-bold text-stone-900">{(user as any).name || (user as any).sub?.split('@')[0] || 'User'}</h2>
                  <p className="text-sm text-stone-500">{(user as any).email || (user as any).sub}</p>
                </div>
              </div>
              <div className="p-3 space-y-1">
                {tabs.map(tab => (
                  <button
                    key={tab.id}
                    onClick={() => tab.onClick ? tab.onClick() : setActiveTab(tab.id)}
                    className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl font-medium transition-colors ${activeTab === tab.id ? 'bg-brand-primary text-white font-bold' : 'text-stone-600 hover:bg-stone-50 hover:text-stone-900'}`}
                  >
                    <tab.icon className="w-5 h-5" />
                    {tab.label}
                  </button>
                ))}
                <div className="pt-3 mt-3 border-t border-stone-100">
                  <button
                    onClick={logout}
                    className="w-full flex items-center gap-3 px-4 py-3 rounded-xl font-bold text-red-600 hover:bg-red-50 transition-colors"
                  >
                    <LogOut className="w-5 h-5" />
                    Sign Out
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Main Content */}
          <div className="flex-1 w-full">
            {activeTab === 'profile' && (
              <div className="bg-white rounded-2xl border border-stone-100 shadow-sm p-6 sm:p-8">
                <h2 className="text-2xl font-extrabold text-stone-900 mb-6">Profile Information</h2>
                <div className="space-y-6 max-w-lg">
                  <div>
                    <label className="block text-sm font-bold text-stone-700 mb-2">Full Name</label>
                    <input type="text" className="w-full bg-stone-50 border border-stone-200 rounded-xl p-3 focus:outline-none focus:border-brand-primary" defaultValue={(user as any).name || (user as any).sub?.split('@')[0] || 'User'} />
                  </div>
                  <div>
                    <label className="block text-sm font-bold text-stone-700 mb-2">Email Address</label>
                    <input type="email" className="w-full bg-stone-50 border border-stone-200 rounded-xl p-3 focus:outline-none focus:border-brand-primary" defaultValue={(user as any).email || (user as any).sub} disabled />
                    <p className="text-xs text-stone-500 mt-1.5 flex items-center gap-1"><Info className="w-3.5 h-3.5"/> Email cannot be changed</p>
                  </div>
                  <div>
                    <label className="block text-sm font-bold text-stone-700 mb-2">Phone Number</label>
                    <input type="tel" className="w-full bg-stone-50 border border-stone-200 rounded-xl p-3 focus:outline-none focus:border-brand-primary" placeholder="+91 98765 43210" />
                  </div>
                  <Button variant="primary" className="font-bold px-8">Save Changes</Button>
                </div>
              </div>
            )}

            {activeTab === 'addresses' && (
              <div className="bg-white rounded-2xl border border-stone-100 shadow-sm p-6 sm:p-8">
                <div className="flex justify-between items-center mb-6">
                  <h2 className="text-2xl font-extrabold text-stone-900">Saved Addresses</h2>
                  <button className="text-brand-primary font-bold bg-brand-primary/10 px-4 py-2 rounded-lg flex items-center gap-2 hover:bg-brand-primary/20"><Plus className="w-4 h-4"/> Add New</button>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="border-2 border-brand-primary bg-brand-primary/5 rounded-xl p-5 relative">
                    <div className="absolute top-4 right-4 flex gap-2">
                      <button className="text-stone-400 hover:text-brand-primary"><Edit2 className="w-4 h-4"/></button>
                      <button className="text-stone-400 hover:text-red-500"><Trash2 className="w-4 h-4"/></button>
                    </div>
                    <div className="flex items-center gap-2 mb-2"><MapPin className="w-5 h-5 text-brand-primary"/><span className="font-bold text-stone-900">Home</span></div>
                    <p className="text-sm text-stone-600 leading-relaxed max-w-[85%]">123 Main St, Apartment 4B<br/>New Delhi, Delhi 110001<br/>India</p>
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'payments' && (
              <div className="bg-white rounded-2xl border border-stone-100 shadow-sm p-6 sm:p-8">
                <div className="flex justify-between items-center mb-6">
                  <h2 className="text-2xl font-extrabold text-stone-900">Payment Methods</h2>
                  <button className="text-brand-primary font-bold bg-brand-primary/10 px-4 py-2 rounded-lg flex items-center gap-2 hover:bg-brand-primary/20"><Plus className="w-4 h-4"/> Add Card</button>
                </div>
                <div className="space-y-4 max-w-lg">
                  <div className="border border-stone-200 rounded-xl p-5 flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-8 bg-stone-100 rounded flex items-center justify-center font-bold text-xs text-stone-500 border border-stone-200">VISA</div>
                      <div>
                        <p className="font-bold text-stone-900">•••• •••• •••• 4242</p>
                        <p className="text-xs text-stone-500">Expires 12/28</p>
                      </div>
                    </div>
                    <button className="text-stone-400 hover:text-red-500"><Trash2 className="w-4 h-4"/></button>
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'favorites' && (
              <div className="bg-white rounded-2xl border border-stone-100 shadow-sm p-6 sm:p-8 text-center py-16">
                <Heart className="w-12 h-12 text-stone-300 mx-auto mb-4" />
                <h2 className="text-xl font-bold text-stone-900 mb-2">No Favorites Yet</h2>
                <p className="text-stone-500 mb-6">Tap the heart icon on any restaurant to save it here.</p>
                <Button href="/restaurants" variant="primary" className="font-bold">Browse Restaurants</Button>
              </div>
            )}

            {activeTab === 'settings' && (
              <div className="bg-white rounded-2xl border border-stone-100 shadow-sm p-6 sm:p-8">
                <h2 className="text-2xl font-extrabold text-stone-900 mb-6">Preferences</h2>
                <div className="space-y-6 max-w-lg">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-bold text-stone-900">Email Notifications</p>
                      <p className="text-sm text-stone-500">Receive order updates and offers</p>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input type="checkbox" defaultChecked className="sr-only peer" />
                      <div className="w-11 h-6 bg-stone-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-brand-primary"></div>
                    </label>
                  </div>
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-bold text-stone-900">SMS Alerts</p>
                      <p className="text-sm text-stone-500">For delivery partner coordination</p>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input type="checkbox" defaultChecked className="sr-only peer" />
                      <div className="w-11 h-6 bg-stone-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-brand-primary"></div>
                    </label>
                  </div>
                </div>
              </div>
            )}

          </div>
        </div>
      </Container>
    </div>
  );
}
