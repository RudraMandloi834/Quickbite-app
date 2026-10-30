"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { 
  getPendingRestaurants, 
  getApprovedRestaurants, 
  approveRestaurant, 
  rejectRestaurant,
  getAdminUsers,
  updateAdminUserRole,
  getAdminOrders,
  getAdminStats,
  provisionTestAccounts,
  AdminUser
} from "@/lib/api";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { 
  CheckCircle2, Clock, MapPin, User, Utensils, Mail, Phone, CalendarDays, 
  Shield, Users, ShoppingBag, Store, KeyRound, ArrowRight, RefreshCw, AlertCircle
} from "lucide-react";

export default function AdminDashboardPage() {
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();
  const queryClient = useQueryClient();

  const [activeTab, setActiveTab] = useState<"restaurants" | "orders" | "users" | "setup">("restaurants");
  const [rejectId, setRejectId] = useState<number | null>(null);
  const [rejectReason, setRejectReason] = useState("");
  const [actionLoading, setActionLoading] = useState<number | null>(null);
  const [successMessage, setSuccessMessage] = useState("");
  const [errorMessage, setErrorMessage] = useState("");
  const [approvedData, setApprovedData] = useState<any>(null);

  // Test account provisioning modal/state
  const [provisionPassword, setProvisionPassword] = useState("dev123");
  const [isProvisioning, setIsProvisioning] = useState(false);
  const [provisionResult, setProvisionResult] = useState<any>(null);

  const isAdmin = !!user && (user.roles?.includes("OPERATOR") || user.roles?.includes("ADMIN"));

  const { data: stats } = useQuery({
    queryKey: ['adminStats'],
    queryFn: getAdminStats,
    enabled: isAdmin,
    refetchInterval: 10000,
  });

  const { data: pending = [], isLoading: pLoad } = useQuery({
    queryKey: ['adminRestaurants', 'PENDING'],
    queryFn: getPendingRestaurants,
    enabled: isAdmin,
  });

  const { data: approved = [], isLoading: aLoad } = useQuery({
    queryKey: ['adminRestaurants', 'APPROVED'],
    queryFn: getApprovedRestaurants,
    enabled: isAdmin,
  });

  const { data: usersList = [], isLoading: uLoad } = useQuery({
    queryKey: ['adminUsers'],
    queryFn: getAdminUsers,
    enabled: isAdmin && activeTab === "users",
  });

  const { data: ordersList = [], isLoading: oLoad } = useQuery({
    queryKey: ['adminOrders'],
    queryFn: getAdminOrders,
    enabled: isAdmin && activeTab === "orders",
    refetchInterval: 5000,
  });

  if (authLoading) return <div className="p-10 text-center text-stone-500 font-medium">Loading Admin Console...</div>;
  
  if (!isAdmin) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center p-8 text-center max-w-md mx-auto">
        <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mb-4">
          <Shield className="w-8 h-8 text-red-600" />
        </div>
        <h2 className="text-2xl font-bold text-stone-900 mb-2">Access Denied</h2>
        <p className="text-stone-500 mb-6">You must be logged in as an Administrator (ROLE_OPERATOR or ROLE_ADMIN) to view this console.</p>
        <button 
          onClick={() => router.push("/login")} 
          className="px-6 py-2.5 bg-brand-primary text-white font-bold rounded-xl hover:bg-brand-primary/90"
        >
          Sign In as Admin
        </button>
      </div>
    );
  }

  const handleApprove = async (id: number, name: string) => {
    setActionLoading(id);
    try {
      const response = await approveRestaurant(id);
      queryClient.invalidateQueries({ queryKey: ['adminRestaurants'] });
      queryClient.invalidateQueries({ queryKey: ['adminStats'] });
      setApprovedData({
        restaurantName: name,
        ownerName: response.ownerName,
        loginEmail: response.ownerEmail,
        tempPassword: response.tempPassword || "(Password already set)"
      });
    } catch (err: any) {
      setErrorMessage(err.message || "Approval failed");
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
      queryClient.invalidateQueries({ queryKey: ['adminStats'] });
    } catch (err: any) {
      setErrorMessage(err.message || "Rejection failed");
    } finally {
      setActionLoading(null);
    }
  };

  const handleRoleChange = async (userId: number, newRole: string) => {
    try {
      await updateAdminUserRole(userId, newRole);
      queryClient.invalidateQueries({ queryKey: ['adminUsers'] });
      setSuccessMessage(`User role updated to ${newRole}`);
      setTimeout(() => setSuccessMessage(""), 3000);
    } catch (err: any) {
      setErrorMessage(err.message || "Failed to update user role");
      setTimeout(() => setErrorMessage(""), 4000);
    }
  };

  const handleProvisionTestAccounts = async () => {
    if (!provisionPassword.trim()) {
      alert("Please provide a password for the test accounts");
      return;
    }
    setIsProvisioning(true);
    setErrorMessage("");
    try {
      const res = await provisionTestAccounts(provisionPassword.trim());
      setProvisionResult(res);
      setSuccessMessage("Test accounts successfully provisioned!");
      queryClient.invalidateQueries({ queryKey: ['adminStats'] });
      queryClient.invalidateQueries({ queryKey: ['adminUsers'] });
    } catch (err: any) {
      setErrorMessage(err.message || "Failed to provision test accounts");
    } finally {
      setIsProvisioning(false);
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
        <div className="mb-8 flex flex-col md:flex-row md:items-end justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-amber-100 text-amber-800 uppercase tracking-wider">
                Admin Console
              </span>
            </div>
            <h1 className="text-3xl sm:text-4xl font-extrabold text-stone-900 tracking-tight">System Management</h1>
            <p className="text-stone-500 mt-1">Monitor restaurants, orders, users, and delivery operations.</p>
          </div>
          
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div className="bg-white px-4 py-3 rounded-2xl shadow-sm border border-stone-200 flex flex-col items-center min-w-[90px]">
              <span className="text-stone-400 text-[11px] font-bold uppercase tracking-wider">Restaurants</span>
              <span className="text-2xl font-black text-stone-900">{stats?.totalRestaurants ?? approved.length}</span>
            </div>
            <div className="bg-white px-4 py-3 rounded-2xl shadow-sm border border-stone-200 flex flex-col items-center min-w-[90px]">
              <span className="text-stone-400 text-[11px] font-bold uppercase tracking-wider">Pending</span>
              <span className="text-2xl font-black text-amber-600">{pLoad ? "-" : pending.length}</span>
            </div>
            <div className="bg-white px-4 py-3 rounded-2xl shadow-sm border border-stone-200 flex flex-col items-center min-w-[90px]">
              <span className="text-stone-400 text-[11px] font-bold uppercase tracking-wider">Orders</span>
              <span className="text-2xl font-black text-stone-900">{stats?.totalOrders ?? "-"}</span>
            </div>
            <div className="bg-white px-4 py-3 rounded-2xl shadow-sm border border-stone-200 flex flex-col items-center min-w-[90px]">
              <span className="text-stone-400 text-[11px] font-bold uppercase tracking-wider">Deliveries</span>
              <span className="text-2xl font-black text-stone-900">{stats?.totalDeliveries ?? "-"}</span>
            </div>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="flex border-b border-stone-200 mb-8 overflow-x-auto gap-2">
          <button
            onClick={() => setActiveTab("restaurants")}
            className={`pb-3 px-4 text-sm font-bold border-b-2 whitespace-nowrap transition-colors flex items-center gap-2 ${
              activeTab === "restaurants"
                ? "border-brand-primary text-brand-primary"
                : "border-transparent text-stone-500 hover:text-stone-800"
            }`}
          >
            <Store className="w-4 h-4" /> Restaurants & Approvals
            {pending.length > 0 && (
              <span className="bg-amber-100 text-amber-800 text-xs px-2 py-0.5 rounded-full font-extrabold">
                {pending.length}
              </span>
            )}
          </button>

          <button
            onClick={() => setActiveTab("orders")}
            className={`pb-3 px-4 text-sm font-bold border-b-2 whitespace-nowrap transition-colors flex items-center gap-2 ${
              activeTab === "orders"
                ? "border-brand-primary text-brand-primary"
                : "border-transparent text-stone-500 hover:text-stone-800"
            }`}
          >
            <ShoppingBag className="w-4 h-4" /> Live Orders
          </button>

          <button
            onClick={() => setActiveTab("users")}
            className={`pb-3 px-4 text-sm font-bold border-b-2 whitespace-nowrap transition-colors flex items-center gap-2 ${
              activeTab === "users"
                ? "border-brand-primary text-brand-primary"
                : "border-transparent text-stone-500 hover:text-stone-800"
            }`}
          >
            <Users className="w-4 h-4" /> Users & Drivers
          </button>

          <button
            onClick={() => setActiveTab("setup")}
            className={`pb-3 px-4 text-sm font-bold border-b-2 whitespace-nowrap transition-colors flex items-center gap-2 ${
              activeTab === "setup"
                ? "border-brand-primary text-brand-primary"
                : "border-transparent text-stone-500 hover:text-stone-800"
            }`}
          >
            <KeyRound className="w-4 h-4" /> Test Account Provisioning
          </button>
        </div>

        {/* Alerts */}
        {successMessage && (
          <div className="mb-6 p-4 bg-green-50 border border-green-200 text-green-800 rounded-xl flex items-center gap-3">
            <CheckCircle2 className="w-5 h-5 text-green-600 shrink-0" />
            <span className="font-medium text-sm">{successMessage}</span>
          </div>
        )}
        {errorMessage && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 text-red-800 rounded-xl flex items-center gap-3">
            <AlertCircle className="w-5 h-5 text-red-600 shrink-0" />
            <span className="font-medium text-sm">{errorMessage}</span>
          </div>
        )}

        {/* APPROVAL MODAL */}
        {approvedData && (
          <div className="fixed inset-0 bg-stone-900/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-3xl p-8 max-w-md w-full shadow-2xl relative animate-in fade-in zoom-in duration-200">
              <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
                <CheckCircle2 className="w-8 h-8 text-green-600" />
              </div>
              <h2 className="text-2xl font-black text-center text-stone-900 mb-2">Restaurant Approved ✓</h2>
              <p className="text-stone-500 text-center mb-6 text-sm">Partner account and kitchen dashboard activated.</p>
              
              <div className="bg-stone-50 rounded-2xl p-5 space-y-3 border border-stone-100 mb-6">
                <div>
                  <p className="text-xs font-bold text-stone-400 uppercase tracking-wider">Restaurant</p>
                  <p className="font-bold text-stone-900">{approvedData.restaurantName}</p>
                </div>
                <div>
                  <p className="text-xs font-bold text-stone-400 uppercase tracking-wider">Owner</p>
                  <p className="font-medium text-stone-800">{approvedData.ownerName}</p>
                </div>
                <div>
                  <p className="text-xs font-bold text-stone-400 uppercase tracking-wider">Login Email</p>
                  <p className="font-mono text-sm text-brand-primary font-bold">{approvedData.loginEmail}</p>
                </div>
                <div>
                  <p className="text-xs font-bold text-stone-400 uppercase tracking-wider">Password</p>
                  <p className="font-mono text-sm text-stone-800 font-bold">{approvedData.tempPassword}</p>
                </div>
              </div>

              <div className="flex gap-3">
                <button 
                  onClick={() => {
                    navigator.clipboard.writeText(`Login: ${approvedData.loginEmail}\nPassword: ${approvedData.tempPassword}`);
                    setSuccessMessage("Credentials copied to clipboard");
                    setTimeout(() => setSuccessMessage(""), 3000);
                  }}
                  className="flex-1 py-3 bg-stone-100 text-stone-700 font-bold rounded-xl hover:bg-stone-200 text-sm transition-colors"
                >
                  Copy
                </button>
                <button 
                  onClick={() => setApprovedData(null)}
                  className="flex-1 py-3 bg-brand-primary text-white font-bold rounded-xl hover:bg-brand-primary/90 text-sm transition-colors"
                >
                  Done
                </button>
              </div>
            </div>
          </div>
        )}

        {/* TAB 1: RESTAURANTS */}
        {activeTab === "restaurants" && (
          <div className="space-y-10">
            {/* PENDING SECTION */}
            <section>
              <div className="flex items-center gap-3 mb-4">
                <h2 className="text-xl font-bold text-stone-900">Pending Restaurant Requests</h2>
                <span className="bg-amber-100 text-amber-800 px-2.5 py-0.5 rounded-full text-xs font-bold flex items-center gap-1">
                  <Clock className="w-3.5 h-3.5"/> Action Required
                </span>
              </div>
              
              {pLoad ? (
                <div className="text-stone-500 p-8 text-center bg-white rounded-2xl border border-stone-200">Loading pending requests...</div>
              ) : pending.length === 0 ? (
                <div className="bg-white border border-stone-200 rounded-2xl p-10 text-center shadow-sm">
                  <CheckCircle2 className="w-10 h-10 text-stone-300 mx-auto mb-2" />
                  <h3 className="text-base font-bold text-stone-900 mb-1">All Caught Up!</h3>
                  <p className="text-stone-500 text-sm">There are no pending restaurant onboarding requests.</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 gap-5">
                  {pending.map((r: any) => (
                    <div key={r.id} className="bg-white border border-amber-200/60 rounded-2xl p-6 shadow-sm flex flex-col lg:flex-row gap-6 hover:shadow-md transition-shadow relative overflow-hidden">
                      <div className="absolute top-0 left-0 w-1.5 h-full bg-amber-400"></div>
                      
                      <div className="flex-1">
                        <div className="flex items-start justify-between mb-3">
                          <div>
                            <h3 className="text-xl font-black text-stone-900 mb-1">{r.name}</h3>
                            <div className="flex flex-wrap items-center gap-3 text-xs text-stone-500 font-medium">
                              <span className="flex items-center gap-1 bg-stone-100 px-2 py-0.5 rounded-md"><Utensils className="w-3.5 h-3.5"/> {r.cuisine || "Cuisine not set"}</span>
                              <span className="flex items-center gap-1"><CalendarDays className="w-3.5 h-3.5"/> Submitted: {formatDate(r.createdAt)}</span>
                            </div>
                          </div>
                        </div>
                        
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 bg-stone-50/80 rounded-xl p-4 border border-stone-100 text-xs">
                          <div>
                            <h4 className="font-bold text-stone-400 uppercase tracking-wider mb-2 flex items-center gap-1">
                              <User className="w-3 h-3" /> Owner Info
                            </h4>
                            <p className="text-stone-900"><strong className="text-stone-500">Name:</strong> {r.ownerName || "Unknown"}</p>
                            <p className="text-stone-900"><strong className="text-stone-500">Email:</strong> {r.ownerEmail || "N/A"}</p>
                            <p className="text-stone-900"><strong className="text-stone-500">Phone:</strong> {r.ownerPhone || "N/A"}</p>
                          </div>
                          <div>
                            <h4 className="font-bold text-stone-400 uppercase tracking-wider mb-2 flex items-center gap-1">
                              <MapPin className="w-3 h-3" /> Location
                            </h4>
                            <p className="text-stone-900"><strong className="text-stone-500">City:</strong> {r.city}, {r.locality}</p>
                            <p className="text-stone-700 line-clamp-2">{r.address}</p>
                          </div>
                        </div>
                      </div>

                      <div className="flex flex-col gap-2.5 justify-center min-w-[200px] lg:border-l lg:border-stone-100 lg:pl-6">
                        {rejectId === r.id ? (
                          <div className="flex flex-col gap-2 animate-in fade-in">
                            <textarea 
                              className="w-full p-2.5 border border-red-200 rounded-xl text-xs bg-red-50/30"
                              rows={2}
                              placeholder="Reason for rejection..."
                              value={rejectReason}
                              onChange={(e) => setRejectReason(e.target.value)}
                            />
                            <div className="flex gap-2">
                              <button 
                                onClick={() => { setRejectId(null); setRejectReason(""); }}
                                disabled={actionLoading === r.id}
                                className="flex-1 py-2 bg-stone-200 text-stone-700 rounded-lg text-xs font-bold"
                              >
                                Cancel
                              </button>
                              <button 
                                onClick={() => handleReject(r.id)}
                                disabled={actionLoading === r.id}
                                className="flex-1 py-2 bg-red-600 text-white rounded-lg text-xs font-bold"
                              >
                                {actionLoading === r.id ? "..." : "Reject"}
                              </button>
                            </div>
                          </div>
                        ) : (
                          <>
                            <button 
                              onClick={() => handleApprove(r.id, r.name)}
                              disabled={actionLoading === r.id}
                              className="w-full py-2.5 bg-green-600 text-white rounded-xl text-sm font-bold hover:bg-green-700 disabled:opacity-50 transition-colors shadow-sm"
                            >
                              {actionLoading === r.id ? "Processing..." : "Approve Restaurant"}
                            </button>
                            <button 
                              onClick={() => setRejectId(r.id)}
                              disabled={actionLoading === r.id}
                              className="w-full py-2 bg-white border border-red-200 text-red-600 rounded-xl text-xs font-bold hover:bg-red-50"
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
              <h2 className="text-xl font-bold text-stone-900 mb-4">Approved Restaurants</h2>
              {aLoad ? (
                <div className="text-stone-500 p-8 text-center bg-white rounded-2xl border border-stone-200">Loading approved...</div>
              ) : approved.length === 0 ? (
                <div className="bg-white border border-stone-200 rounded-2xl p-8 text-center shadow-sm text-stone-500 text-sm">
                  No approved restaurants yet.
                </div>
              ) : (
                <div className="bg-white rounded-2xl shadow-sm border border-stone-200 overflow-hidden">
                  <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse text-sm">
                      <thead>
                        <tr className="bg-stone-50/80 border-b border-stone-200 text-stone-500 text-xs uppercase tracking-wider">
                          <th className="p-3.5 font-bold">Restaurant</th>
                          <th className="p-3.5 font-bold">Owner</th>
                          <th className="p-3.5 font-bold">Location</th>
                          <th className="p-3.5 font-bold">Status</th>
                          <th className="p-3.5 font-bold text-right">Action</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-stone-100">
                        {approved.map((r: any) => (
                          <tr key={r.id} className="hover:bg-stone-50/50 transition-colors">
                            <td className="p-3.5">
                              <p className="font-bold text-stone-900">{r.name}</p>
                              <p className="text-xs text-stone-500">{r.cuisine}</p>
                            </td>
                            <td className="p-3.5 text-stone-800 text-xs">
                              {r.ownerName || "Unknown"}
                            </td>
                            <td className="p-3.5 text-stone-800 text-xs">
                              {r.city}, {r.locality}
                            </td>
                            <td className="p-3.5">
                              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-green-100 text-green-700">
                                <CheckCircle2 className="w-3 h-3" /> APPROVED
                              </span>
                            </td>
                            <td className="p-3.5 text-right">
                              <button 
                                onClick={() => router.push(`/restaurants/${r.id}`)}
                                className="text-xs font-bold text-brand-primary hover:underline px-2 py-1"
                              >
                                View Menu
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
        )}

        {/* TAB 2: LIVE ORDERS */}
        {activeTab === "orders" && (
          <section>
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-bold text-stone-900">System Orders Live Monitor</h2>
              <button 
                onClick={() => queryClient.invalidateQueries({ queryKey: ['adminOrders'] })}
                className="text-xs font-bold text-stone-600 hover:text-stone-900 flex items-center gap-1.5 bg-white border border-stone-200 px-3 py-1.5 rounded-lg shadow-sm"
              >
                <RefreshCw className="w-3.5 h-3.5" /> Refresh
              </button>
            </div>

            {oLoad ? (
              <div className="text-stone-500 p-8 text-center bg-white rounded-2xl border border-stone-200">Loading orders...</div>
            ) : ordersList.length === 0 ? (
              <div className="bg-white border border-stone-200 rounded-2xl p-10 text-center shadow-sm text-stone-500">
                No orders placed yet.
              </div>
            ) : (
              <div className="bg-white rounded-2xl shadow-sm border border-stone-200 overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse text-sm">
                    <thead>
                      <tr className="bg-stone-50/80 border-b border-stone-200 text-stone-500 text-xs uppercase tracking-wider">
                        <th className="p-3.5 font-bold">Order #</th>
                        <th className="p-3.5 font-bold">Customer ID</th>
                        <th className="p-3.5 font-bold">Restaurant ID</th>
                        <th className="p-3.5 font-bold">Total</th>
                        <th className="p-3.5 font-bold">Payment</th>
                        <th className="p-3.5 font-bold">Status</th>
                        <th className="p-3.5 font-bold text-right">Action</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-stone-100">
                      {ordersList.slice(0, 50).map((o: any) => (
                        <tr key={o.id} className="hover:bg-stone-50/50 transition-colors">
                          <td className="p-3.5 font-bold text-stone-900">#{o.id}</td>
                          <td className="p-3.5 text-stone-700 text-xs">Customer #{o.customerId}</td>
                          <td className="p-3.5 text-stone-700 text-xs">Restaurant #{o.restaurantId}</td>
                          <td className="p-3.5 font-bold text-stone-900">₹{o.totalAmount}</td>
                          <td className="p-3.5 text-xs">
                            <span className="font-semibold text-stone-700">{o.paymentMethod || "COD"}</span>
                            <span className="ml-1 text-stone-400">({o.paymentStatus || "PENDING"})</span>
                          </td>
                          <td className="p-3.5">
                            <span className={`inline-block px-2.5 py-0.5 rounded-full text-xs font-bold ${
                              o.status === "DELIVERED" ? "bg-green-100 text-green-700" :
                              o.status === "CANCELLED" || o.status === "REJECTED" ? "bg-red-100 text-red-700" :
                              "bg-amber-100 text-amber-800"
                            }`}>
                              {o.status}
                            </span>
                          </td>
                          <td className="p-3.5 text-right">
                            <button
                              onClick={() => router.push(`/orders/${o.id}`)}
                              className="text-xs font-bold text-brand-primary hover:underline px-2 py-1"
                            >
                              Track
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
        )}

        {/* TAB 3: USERS & ROLES */}
        {activeTab === "users" && (
          <section>
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-bold text-stone-900">Registered Accounts & Roles</h2>
              <button 
                onClick={() => queryClient.invalidateQueries({ queryKey: ['adminUsers'] })}
                className="text-xs font-bold text-stone-600 hover:text-stone-900 flex items-center gap-1.5 bg-white border border-stone-200 px-3 py-1.5 rounded-lg shadow-sm"
              >
                <RefreshCw className="w-3.5 h-3.5" /> Refresh
              </button>
            </div>

            {uLoad ? (
              <div className="text-stone-500 p-8 text-center bg-white rounded-2xl border border-stone-200">Loading users...</div>
            ) : usersList.length === 0 ? (
              <div className="bg-white border border-stone-200 rounded-2xl p-8 text-center shadow-sm text-stone-500">
                No users found.
              </div>
            ) : (
              <div className="bg-white rounded-2xl shadow-sm border border-stone-200 overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse text-sm">
                    <thead>
                      <tr className="bg-stone-50/80 border-b border-stone-200 text-stone-500 text-xs uppercase tracking-wider">
                        <th className="p-3.5 font-bold">User</th>
                        <th className="p-3.5 font-bold">Email</th>
                        <th className="p-3.5 font-bold">Phone</th>
                        <th className="p-3.5 font-bold">Current Role</th>
                        <th className="p-3.5 font-bold text-right">Modify Role</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-stone-100">
                      {usersList.map((u: AdminUser) => (
                        <tr key={u.id} className="hover:bg-stone-50/50 transition-colors">
                          <td className="p-3.5 font-bold text-stone-900">{u.name}</td>
                          <td className="p-3.5 font-mono text-xs text-stone-700">{u.email}</td>
                          <td className="p-3.5 text-xs text-stone-600">{u.phone || "—"}</td>
                          <td className="p-3.5">
                            <span className={`inline-block px-2.5 py-0.5 rounded-full text-xs font-bold ${
                              u.role === "ROLE_OPERATOR" || u.role === "ROLE_ADMIN" ? "bg-purple-100 text-purple-800" :
                              u.role === "ROLE_RESTAURANT_PARTNER" ? "bg-blue-100 text-blue-800" :
                              u.role === "ROLE_DRIVER" ? "bg-emerald-100 text-emerald-800" :
                              "bg-stone-100 text-stone-700"
                            }`}>
                              {u.role}
                            </span>
                          </td>
                          <td className="p-3.5 text-right">
                            <select
                              value={u.role}
                              onChange={(e) => handleRoleChange(u.id, e.target.value)}
                              className="bg-white border border-stone-200 text-xs font-semibold rounded-lg px-2 py-1 text-stone-700 focus:ring-2 focus:ring-brand-primary"
                            >
                              <option value="ROLE_CUSTOMER">CUSTOMER</option>
                              <option value="ROLE_RESTAURANT_PARTNER">RESTAURANT_OWNER</option>
                              <option value="ROLE_DRIVER">DELIVERY_DRIVER</option>
                              <option value="ROLE_OPERATOR">ADMIN</option>
                            </select>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </section>
        )}

        {/* TAB 4: TEST ACCOUNT PROVISIONING */}
        {activeTab === "setup" && (
          <section className="bg-white rounded-3xl p-8 border border-stone-200 shadow-sm max-w-2xl">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-12 h-12 bg-brand-primary/10 rounded-2xl flex items-center justify-center">
                <KeyRound className="w-6 h-6 text-brand-primary" />
              </div>
              <div>
                <h2 className="text-xl font-bold text-stone-900">Provision 4 Role Test Accounts</h2>
                <p className="text-stone-500 text-sm">Idempotently seed or update test accounts in the database.</p>
              </div>
            </div>

            <div className="bg-stone-50 p-4 rounded-2xl border border-stone-200/60 mb-6 space-y-2 text-xs text-stone-700">
              <p className="font-bold text-stone-900">This will configure the following test accounts with your chosen password:</p>
              <ul className="list-disc list-inside space-y-1">
                <li><span className="font-semibold">Customer:</span> <code className="bg-white px-1 py-0.5 rounded border border-stone-200">customer@test.com</code> (ROLE_CUSTOMER)</li>
                <li><span className="font-semibold">Restaurant Owner:</span> <code className="bg-white px-1 py-0.5 rounded border border-stone-200">restaurant@test.com</code> (ROLE_RESTAURANT_PARTNER) + Approved Restaurant & Menu</li>
                <li><span className="font-semibold">Delivery Driver:</span> <code className="bg-white px-1 py-0.5 rounded border border-stone-200">driver@test.com</code> (ROLE_DRIVER)</li>
                <li><span className="font-semibold">Administrator:</span> <code className="bg-white px-1 py-0.5 rounded border border-stone-200">admin@test.com</code> (ROLE_OPERATOR)</li>
              </ul>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-stone-700 mb-1.5 uppercase tracking-wider">
                  Test Account Password
                </label>
                <input 
                  type="text"
                  value={provisionPassword}
                  onChange={(e) => setProvisionPassword(e.target.value)}
                  placeholder="Enter password (e.g. dev123)"
                  className="w-full h-11 px-3.5 bg-stone-50 border border-stone-200 rounded-xl font-mono text-sm focus:ring-2 focus:ring-brand-primary outline-none"
                />
              </div>

              <button
                onClick={handleProvisionTestAccounts}
                disabled={isProvisioning}
                className="w-full h-12 bg-brand-primary text-white font-bold rounded-xl hover:bg-brand-primary/90 disabled:opacity-50 transition-colors shadow-sm flex items-center justify-center gap-2"
              >
                {isProvisioning ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin" /> Provisioning Accounts...
                  </>
                ) : (
                  <>
                    <KeyRound className="w-4 h-4" /> Provision / Update 4 Test Accounts
                  </>
                )}
              </button>
            </div>

            {provisionResult && (
              <div className="mt-6 p-4 bg-green-50 border border-green-200 rounded-xl">
                <p className="text-green-800 font-bold text-sm mb-2">✓ Provisioning Complete!</p>
                <div className="text-xs text-green-700 space-y-1 font-mono">
                  <p>Customer: {provisionResult.customer}</p>
                  <p>Restaurant: {provisionResult.restaurantPartner}</p>
                  <p>Driver: {provisionResult.driver}</p>
                  <p>Admin: {provisionResult.admin}</p>
                  <p className="mt-2 text-green-800 font-bold">Password: {provisionPassword}</p>
                </div>
              </div>
            )}
          </section>
        )}

      </div>
    </div>
  );
}
