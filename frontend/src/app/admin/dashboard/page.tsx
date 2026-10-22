"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { 
  getPendingRestaurants, 
  getApprovedRestaurants, 
  approveRestaurant, 
  rejectRestaurant
} from "@/lib/api";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { CheckCircle2, Clock, MapPin, User, Utensils, Mail, Phone, CalendarDays } from "lucide-react";

export default function AdminDashboardPage() {
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();
  
  const queryClient = useQueryClient();
  const [rejectId, setRejectId] = useState<number | null>(null);
  const [rejectReason, setRejectReason] = useState("");
  const [actionLoading, setActionLoading] = useState<number | null>(null);
  const [successMessage, setSuccessMessage] = useState("");
  const [approvedData, setApprovedData] = useState<any>(null);

  const { data: pending = [], isLoading: pLoad } = useQuery({
    queryKey: ['adminRestaurants', 'PENDING'],
    queryFn: getPendingRestaurants,
    enabled: !!user && !!user.roles?.includes("OPERATOR"),
  });

  const { data: approved = [], isLoading: aLoad } = useQuery({
    queryKey: ['adminRestaurants', 'APPROVED'],
    queryFn: getApprovedRestaurants,
    enabled: !!user && !!user.roles?.includes("OPERATOR"),
  });

  if (authLoading) return <div className="p-10 text-center text-stone-500">Loading...</div>;
  
  if (!user || !user.roles?.includes("OPERATOR")) {
    return <div className="p-10 text-center text-red-500">Access Denied</div>;
  }

  const handleApprove = async (id: number, name: string) => {
    setActionLoading(id);
    try {
      const response = await approveRestaurant(id);
      queryClient.invalidateQueries({ queryKey: ['adminRestaurants'] });
      setApprovedData({
        restaurantName: name,
        ownerName: response.ownerName,
        loginEmail: response.ownerEmail,
        tempPassword: response.tempPassword || "(Error generating password)"
      });
    } catch (err: any) {
      alert(err.message || "Approval failed");
    } finally {
      setActionLoading(null);
    }
  };

  const handleReject = async (id: number) => {
    if (!rejectReason.trim()) {
      alert("Please provide a rejection reason");
      return;
    }
    setActionLoading(id);
    try {
      await rejectRestaurant(id, rejectReason);
      setRejectId(null);
      setRejectReason("");
      queryClient.invalidateQueries({ queryKey: ['adminRestaurants'] });
    } catch (err: any) {
      alert(err.message || "Rejection failed");
    } finally {
      setActionLoading(null);
    }
  };

  const formatDate = (dateStr: string) => {
    if (!dateStr) return "N/A";
    return new Date(dateStr).toLocaleDateString("en-IN", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit"
    });
  };

  return (
    <div className="min-h-screen bg-stone-50 pt-8 pb-20">
      <div className="max-w-6xl mx-auto px-6">
        
        {/* Header Section */}
        <div className="mb-10 flex flex-col md:flex-row md:items-end justify-between gap-4">
          <div>
            <h1 className="text-4xl font-extrabold text-stone-900 tracking-tight">QuickBite Admin</h1>
            <p className="text-stone-500 mt-2 text-lg">Manage restaurant onboarding and approvals.</p>
          </div>
          
          <div className="flex gap-4">
            <div className="bg-white px-6 py-4 rounded-2xl shadow-sm border border-stone-200 flex flex-col items-center min-w-[120px]">
              <span className="text-stone-500 text-xs font-bold uppercase tracking-wider mb-1">Pending</span>
              <span className="text-3xl font-black text-amber-600">{pLoad ? "-" : pending.length}</span>
            </div>
            <div className="bg-white px-6 py-4 rounded-2xl shadow-sm border border-stone-200 flex flex-col items-center min-w-[120px]">
              <span className="text-stone-500 text-xs font-bold uppercase tracking-wider mb-1">Approved</span>
              <span className="text-3xl font-black text-green-600">{aLoad ? "-" : approved.length}</span>
            </div>
          </div>
        </div>

        {successMessage && (
          <div className="mb-8 p-4 bg-green-50 border border-green-200 text-green-800 rounded-xl flex items-center gap-3 animate-in fade-in slide-in-from-top-4">
            <CheckCircle2 className="w-5 h-5 text-green-600" />
            <span className="font-medium">{successMessage}</span>
          </div>
        )}

        <div className="space-y-12">
          
          
        {/* APPROVAL MODAL */}
        {approvedData && (
          <div className="fixed inset-0 bg-stone-900/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-3xl p-8 max-w-md w-full shadow-2xl relative animate-in fade-in zoom-in duration-200">
              <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
                <CheckCircle2 className="w-8 h-8 text-green-600" />
              </div>
              <h2 className="text-2xl font-black text-center text-stone-900 mb-2">Restaurant Approved ✓</h2>
              <p className="text-stone-500 text-center mb-6">Partner account has been activated.</p>
              
              <div className="bg-stone-50 rounded-2xl p-6 space-y-4 border border-stone-100 mb-8">
                <div>
                  <p className="text-xs font-bold text-stone-400 uppercase tracking-wider mb-1">Restaurant</p>
                  <p className="font-medium text-stone-900">{approvedData.restaurantName}</p>
                </div>
                <div>
                  <p className="text-xs font-bold text-stone-400 uppercase tracking-wider mb-1">Owner</p>
                  <p className="font-medium text-stone-900">{approvedData.ownerName}</p>
                </div>
                <div>
                  <p className="text-xs font-bold text-stone-400 uppercase tracking-wider mb-1">Login</p>
                  <p className="font-mono text-sm text-brand-primary font-bold">{approvedData.loginEmail}</p>
                </div>
                <div>
                  <p className="text-xs font-bold text-stone-400 uppercase tracking-wider mb-1">Temporary Password</p>
                  <div className="bg-stone-200/50 p-3 rounded-lg border border-stone-200 flex justify-between items-center">
                    <code className="font-mono text-stone-900 font-bold tracking-wide">{approvedData.tempPassword}</code>
                  </div>
                </div>
              </div>

              <div className="flex gap-3">
                <button 
                  onClick={() => {
                    navigator.clipboard.writeText(`Login: ${approvedData.loginEmail}\nPassword: ${approvedData.tempPassword}`);
                    setSuccessMessage("Credentials copied to clipboard");
                    setTimeout(() => setSuccessMessage(""), 3000);
                  }}
                  className="flex-1 py-3 bg-stone-100 text-stone-700 font-bold rounded-xl hover:bg-stone-200 transition-colors"
                >
                  Copy Credentials
                </button>
                <button 
                  onClick={() => setApprovedData(null)}
                  className="flex-1 py-3 bg-brand-primary text-white font-bold rounded-xl hover:bg-brand-primary/90 transition-colors"
                >
                  Done
                </button>
              </div>
            </div>
          </div>
        )}
  
          {/* PENDING SECTION */}
          <section>
            <div className="flex items-center gap-3 mb-6">
              <h2 className="text-2xl font-bold text-stone-900">Pending Restaurant Requests</h2>
              <span className="bg-amber-100 text-amber-800 px-3 py-1 rounded-full text-sm font-bold flex items-center gap-1.5">
                <Clock className="w-4 h-4"/> Action Required
              </span>
            </div>
            
            {pLoad ? (
              <div className="text-stone-500 p-8 text-center bg-white rounded-2xl border border-stone-200">Loading pending requests...</div>
            ) : pending.length === 0 ? (
              <div className="bg-white border border-stone-200 rounded-2xl p-12 text-center shadow-sm">
                <div className="w-16 h-16 bg-stone-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <CheckCircle2 className="w-8 h-8 text-stone-400" />
                </div>
                <h3 className="text-lg font-bold text-stone-900 mb-1">All Caught Up!</h3>
                <p className="text-stone-500">There are no pending restaurant requests at this time.</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 gap-6">
                {pending.map(r => (
                  <div key={r.id} className="bg-white border border-amber-200/60 rounded-2xl p-6 shadow-sm flex flex-col lg:flex-row gap-8 hover:shadow-md transition-shadow relative overflow-hidden">
                    <div className="absolute top-0 left-0 w-1.5 h-full bg-amber-400"></div>
                    
                    <div className="flex-1">
                      <div className="flex items-start justify-between mb-4">
                        <div>
                          <h3 className="text-2xl font-black text-stone-900 mb-1">{r.name}</h3>
                          <div className="flex flex-wrap items-center gap-3 text-sm text-stone-500 font-medium">
                            <span className="flex items-center gap-1 bg-stone-100 px-2.5 py-1 rounded-md"><Utensils className="w-4 h-4"/> {r.cuisine || "Cuisine not set"}</span>
                            <span className="flex items-center gap-1"><strong className="font-bold text-stone-700">Status:</strong> PENDING</span>
                            <span className="flex items-center gap-1"><CalendarDays className="w-4 h-4"/> Submitted: {formatDate(r.createdAt)}</span>
                          </div>
                        </div>
                      </div>
                      
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 bg-stone-50/80 rounded-xl p-5 border border-stone-100">
                        <div>
                          <h4 className="text-xs font-bold text-stone-400 uppercase tracking-wider mb-3 flex items-center gap-1.5">
                            <User className="w-3.5 h-3.5" /> Owner Information
                          </h4>
                          <div className="space-y-2 text-sm">
                            <p className="flex items-center gap-2 text-stone-900"><strong className="w-16 font-medium text-stone-500">Name:</strong> {r.ownerName || "Unknown"}</p>
                            <p className="flex items-center gap-2 text-stone-900"><strong className="w-16 font-medium text-stone-500"><Mail className="w-3.5 h-3.5 inline mr-1"/> Email:</strong> {r.ownerEmail || "N/A"}</p>
                            <p className="flex items-center gap-2 text-stone-900"><strong className="w-16 font-medium text-stone-500"><Phone className="w-3.5 h-3.5 inline mr-1"/> Phone:</strong> {r.ownerPhone || "N/A"}</p>
                          </div>
                        </div>
                        <div>
                          <h4 className="text-xs font-bold text-stone-400 uppercase tracking-wider mb-3 flex items-center gap-1.5">
                            <MapPin className="w-3.5 h-3.5" /> Location Details
                          </h4>
                          <div className="space-y-2 text-sm">
                            <p className="flex items-center gap-2 text-stone-900"><strong className="w-16 font-medium text-stone-500">City:</strong> {r.city}</p>
                            <p className="flex items-center gap-2 text-stone-900"><strong className="w-16 font-medium text-stone-500">Locality:</strong> {r.locality}</p>
                            <p className="flex items-start gap-2 text-stone-900"><strong className="w-16 font-medium text-stone-500 shrink-0">Address:</strong> <span className="line-clamp-2">{r.address}</span></p>
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className="flex flex-col gap-3 justify-center min-w-[240px] lg:border-l lg:border-stone-100 lg:pl-8">
                      {rejectId === r.id ? (
                        <div className="flex flex-col gap-3 animate-in fade-in">
                          <label className="text-xs font-bold text-stone-700">Rejection Reason</label>
                          <textarea 
                            className="w-full p-3 border border-red-200 rounded-xl text-sm focus:ring-2 focus:ring-red-500 focus:border-red-500 bg-red-50/30"
                            rows={3}
                            placeholder="Explain why this is being rejected..."
                            value={rejectReason}
                            onChange={(e) => setRejectReason(e.target.value)}
                          />
                          <div className="flex gap-2">
                            <button 
                              onClick={() => { setRejectId(null); setRejectReason(""); }}
                              disabled={actionLoading === r.id}
                              className="flex-1 py-2.5 bg-stone-200 text-stone-700 rounded-lg text-sm font-bold hover:bg-stone-300 disabled:opacity-50 transition-colors"
                            >
                              Cancel
                            </button>
                            <button 
                              onClick={() => handleReject(r.id)}
                              disabled={actionLoading === r.id}
                              className="flex-1 py-2.5 bg-red-600 text-white rounded-lg text-sm font-bold hover:bg-red-700 disabled:opacity-50 transition-colors shadow-sm"
                            >
                              {actionLoading === r.id ? "..." : "Reject"}
                            </button>
                          </div>
                        </div>
                      ) : (
                        <>
                          <button 
                            onClick={() => router.push(`/restaurants/\${r.id}`)}
                            className="w-full py-2.5 bg-stone-100 text-stone-700 rounded-xl text-sm font-bold hover:bg-stone-200 transition-colors"
                          >
                            View Restaurant Page
                          </button>
                          <button 
                            onClick={() => handleApprove(r.id, r.name)}
                            disabled={actionLoading === r.id}
                            className="w-full py-3.5 bg-green-600 text-white rounded-xl text-sm font-bold hover:bg-green-700 disabled:opacity-50 transition-all shadow-sm hover:shadow-md hover:-translate-y-0.5"
                          >
                            {actionLoading === r.id ? "Processing..." : "Approve Application"}
                          </button>
                          <button 
                            onClick={() => setRejectId(r.id)}
                            disabled={actionLoading === r.id}
                            className="w-full py-2.5 bg-white border-2 border-red-100 text-red-600 rounded-xl text-sm font-bold hover:bg-red-50 hover:border-red-200 disabled:opacity-50 transition-colors"
                          >
                            Reject
                          </button>
                        </>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </section>

          {/* APPROVED SECTION */}
          <section>
            <div className="flex items-center gap-3 mb-6">
              <h2 className="text-2xl font-bold text-stone-900">Approved Restaurants</h2>
            </div>
            
            {aLoad ? (
              <div className="text-stone-500 p-8 text-center bg-white rounded-2xl border border-stone-200">Loading approved...</div>
            ) : approved.length === 0 ? (
              <div className="bg-white border border-stone-200 rounded-2xl p-10 text-center shadow-sm">
                <p className="text-stone-500">No approved restaurants yet.</p>
              </div>
            ) : (
              <div className="bg-white rounded-2xl shadow-sm border border-stone-200 overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="bg-stone-50/80 border-b border-stone-200 text-stone-500 text-xs uppercase tracking-wider">
                        <th className="p-4 font-bold">Restaurant</th>
                        <th className="p-4 font-bold">Owner</th>
                        <th className="p-4 font-bold">Location</th>
                        <th className="p-4 font-bold">Approved On</th>
                        <th className="p-4 font-bold">Status</th>
                        <th className="p-4 font-bold text-right">Action</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-stone-100">
                      {approved.map(r => (
                        <tr key={r.id} className="hover:bg-stone-50/50 transition-colors group">
                          <td className="p-4">
                            <p className="font-bold text-stone-900">{r.name}</p>
                            <p className="text-xs text-stone-500">{r.cuisine}</p>
                          </td>
                          <td className="p-4">
                            <p className="font-medium text-stone-800 text-sm">{r.ownerName || "Unknown"}</p>
                          </td>
                          <td className="p-4">
                            <p className="font-medium text-stone-800 text-sm">{r.city}</p>
                            <p className="text-xs text-stone-500">{r.locality}</p>
                          </td>
                          <td className="p-4 text-sm text-stone-600">
                            {formatDate(r.createdAt)}
                          </td>
                          <td className="p-4">
                            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold bg-green-100 text-green-700">
                              <CheckCircle2 className="w-3.5 h-3.5" /> Status: APPROVED
                            </span>
                          </td>
                          <td className="p-4 text-right">
                            <button 
                              onClick={() => router.push(`/restaurants/\${r.id}`)}
                              className="text-sm font-bold text-brand-primary hover:text-brand-primary/80 px-4 py-2 rounded-lg hover:bg-brand-primary/5 transition-colors"
                            >
                              View
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </section>

        </div>
      </div>
    </div>
  );
}
