import { Restaurant, MenuItem, RestaurantStaffProfile } from "@/types/restaurant";
import { Cart, CartItem, CreateCartRequest, AddCartItemRequest } from "@/types/cart";
import { Customer } from "@/types/customer";
import { Order } from "@/types/order";
import { Payment, PaymentInitiationResponse, PaymentVerificationRequest } from "@/types/payment";
import { Delivery } from "@/types/delivery";
import { getAuthHeaders, getUser } from "@/lib/auth";

export interface Page<T> {
  content: T[];
  totalElements: number;
  totalPages: number;
  size: number;
  number: number;
}

export const getApiBaseUrl = (): string => {
  const url = process.env.NEXT_PUBLIC_API_URL || (typeof window !== "undefined" && window.location.hostname !== "localhost" ? "" : "http://localhost:8080");
  return url.replace(/\/+$/, "");
};


// --- Public Endpoints ---

export async function getRestaurants(params?: Record<string, string>): Promise<Page<Restaurant>> {
  const urlParams = new URLSearchParams();
  if (params) {
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined && value !== '') {
        urlParams.append(key, value);
      }
    });
  }
  const res = await fetch(`${getApiBaseUrl()}/api/restaurants?${urlParams.toString()}`, {
    cache: "no-store",
  });
  if (!res.ok) throw new Error(`Failed to fetch restaurants`);
  return res.json();
}

export async function getNearbyRestaurants(latitude: number, longitude: number, radiusKm: number = 10, page: number = 0, size: number = 16): Promise<Page<Restaurant>> {
  const params = new URLSearchParams({ latitude: latitude.toString(), longitude: longitude.toString(), radiusKm: radiusKm.toString(), page: page.toString(), size: size.toString() });
  const res = await fetch(`${getApiBaseUrl()}/api/restaurants/nearby?${params.toString()}`, { cache: "no-store" });
  if (!res.ok) throw new Error(`Failed to fetch nearby restaurants`);
  return res.json();
}

export async function getRestaurantMenu(restaurantId: number | string): Promise<MenuItem[]> {
  const res = await fetch(`${getApiBaseUrl()}/api/restaurants/${restaurantId}/menu`, { cache: "no-store" });
  if (!res.ok) throw new Error(`Failed to fetch menu`);
  return res.json();
}

export async function getRestaurantById(restaurantId: number | string): Promise<Restaurant | null> {
  const res = await fetch(`${getApiBaseUrl()}/api/restaurants/${restaurantId}`, { cache: "no-store" });
  if (!res.ok) {
    if (res.status === 404) return null;
    throw new Error(`Failed to fetch restaurant details`);
  }
  return res.json();
}

// --- Protected Endpoints ---

export class ApiError extends Error {
  status: number;
  constructor(message: string, status: number) {
    super(message);
    this.status = status;
  }
}

export async function authFetch(url: string, options: RequestInit = {}) {
  const customHeaders: Record<string, string> = {};
  if (options.headers) {
    if (options.headers instanceof Headers) {
      options.headers.forEach((val, key) => { customHeaders[key] = val; });
    } else if (Array.isArray(options.headers)) {
      options.headers.forEach(([k, v]) => { customHeaders[k] = v; });
    } else {
      Object.assign(customHeaders, options.headers);
    }
  }

  if (options.body && typeof options.body === "string") {
    const hasContentType = Object.keys(customHeaders).some(
      (k) => k.toLowerCase() === "content-type"
    );
    if (!hasContentType) {
      customHeaders["Content-Type"] = "application/json";
    }
  }

  const headers = { ...customHeaders, ...getAuthHeaders() };
  const res = await fetch(url, { ...options, headers });
  if (res.status === 401) {
    if (typeof window !== "undefined") {
      localStorage.removeItem("token");
      // Trigger a custom event for AuthContext to handle
      window.dispatchEvent(new Event("auth_unauthorized"));
    }
    throw new ApiError("Unauthorized", res.status);
  }
  if (res.status === 403) {
    // Just throw, do not wipe token or redirect
    throw new ApiError("Forbidden", res.status);
  }
  if (!res.ok) {
    const errorText = await res.text().catch(() => "");
    throw new ApiError(`Request failed: ${res.statusText} - ${errorText}`, res.status);
  }
  return res;
}

export async function createCart(restaurantId: number, customerId?: number): Promise<Cart> {
  const resolvedCustomerId = customerId || getUser()?.customerId || 0;
  const body: CreateCartRequest = { customerId: resolvedCustomerId, restaurantId };
  const res = await authFetch(`${getApiBaseUrl()}/api/carts`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  return res.json();
}

export async function addCartItem(cartId: number, menuItemId: number, quantity: number = 1): Promise<CartItem> {
  const body: AddCartItemRequest = { menuItemId, quantity };
  const res = await authFetch(`${getApiBaseUrl()}/api/carts/${cartId}/items`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  return res.json();
}

export async function getCart(cartId: number): Promise<Cart> {
  const res = await authFetch(`${getApiBaseUrl()}/api/carts/${cartId}`, {
    cache: "no-store",
  });
  return res.json();
}

export async function getCustomers(): Promise<Customer[]> {
  const res = await authFetch(`${getApiBaseUrl()}/api/customers`, { cache: "no-store" });
  return res.json();
}

export async function getCustomerById(customerId: number | string): Promise<Customer> {
  const res = await authFetch(`${getApiBaseUrl()}/api/customers/${customerId}`, { cache: "no-store" });
  return res.json();
}

export async function createOrderFromCart(cartId: number, paymentMethod?: string): Promise<Order> {
  const res = await authFetch(`${getApiBaseUrl()}/api/orders/from-cart/${cartId}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ paymentMethod: paymentMethod || "CARD" }),
  });
  return res.json();
}

export async function createRazorpayOrder(orderId: number): Promise<PaymentInitiationResponse> {
  const res = await authFetch(`${getApiBaseUrl()}/api/payments/orders/${orderId}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
  });
  return res.json();
}

export async function verifyPayment(request: PaymentVerificationRequest): Promise<Payment> {
  const res = await authFetch(`${getApiBaseUrl()}/api/payments/verify`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(request),
  });
  return res.json();
}

export async function getOrderById(orderId: number | string): Promise<Order> {
  const res = await authFetch(`${getApiBaseUrl()}/api/orders/${orderId}`, {
    cache: "no-store",
  });
  return res.json();
}

export async function getMyOrders(): Promise<Order[]> {
  const res = await authFetch(`${getApiBaseUrl()}/api/customers/me/orders`, {
    cache: "no-store",
  });
  return res.json();
}

export async function getDeliveryByOrderId(orderId: number | string): Promise<Delivery> {
  const res = await authFetch(`${getApiBaseUrl()}/api/deliveries/order/${orderId}`, {
    cache: "no-store",
  });
  return res.json();
}

// --- Auth Endpoints ---

export async function login(email: string, password: string): Promise<{ token: string }> {
  const res = await fetch(`${getApiBaseUrl()}/api/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, password }),
  });
  if (!res.ok) {
    throw new Error("Invalid email or password");
  }
  return res.json();
}

export async function signup(name: string, email: string, password: string): Promise<{ token: string }> {
  const res = await fetch(`${getApiBaseUrl()}/api/auth/signup`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ name, email, password }),
  });
  if (!res.ok) {
    if (res.status === 409) throw new Error("Email already exists");
    throw new Error("Failed to create account");
  }
  return res.json();
}

export async function getAvailableDeliveries(): Promise<Delivery[]> {
  const res = await authFetch(`${getApiBaseUrl()}/api/deliveries/available`, { cache: "no-store" });
  if (!res.ok) throw new ApiError(await res.text(), res.status);
  return res.json();
}

export async function getMyDeliveries(): Promise<Delivery[]> {
  const res = await authFetch(`${getApiBaseUrl()}/api/deliveries/driver/me`, { cache: "no-store" });
  if (!res.ok) throw new ApiError(await res.text(), res.status);
  return res.json();
}

export async function assignDelivery(deliveryId: number): Promise<Delivery> {
  const res = await authFetch(`${getApiBaseUrl()}/api/deliveries/${deliveryId}/assign`, {
    method: "POST",
  });
  if (!res.ok) throw new ApiError(await res.text(), res.status);
  return res.json();
}

export async function updateDeliveryStatus(deliveryId: number, status: string): Promise<Delivery> {
  const res = await authFetch(`${getApiBaseUrl()}/api/deliveries/${deliveryId}/status`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ status }),
  });
  if (!res.ok) throw new ApiError(await res.text(), res.status);
  return res.json();
}

export async function confirmCashCollection(deliveryId: number): Promise<Delivery> {
  const res = await authFetch(`${getApiBaseUrl()}/api/deliveries/${deliveryId}/collect-cash`, {
    method: "POST",
  });
  if (!res.ok) throw new ApiError(await res.text(), res.status);
  return res.json();
}

// --- Restaurant Onboarding Endpoints ---

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export interface CreateRestaurantRequest {
  name: string;
  cuisine: string;
  phone: string;
  email: string;
  city: string;
  location: string;
  address: string;
  latitude: number;
  longitude: number;
  openingTime: string;
  closingTime: string;
  coverImageUrl?: string;
  area?: string;
  rating?: number;
  deliveryRadius?: number;
}

export async function applyForRestaurant(data: CreateRestaurantRequest): Promise<Restaurant> {
  const res = await authFetch(`${getApiBaseUrl()}/api/restaurants/apply`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(data),
  });
  if (!res.ok) {
    const errorText = await res.text().catch(() => "Unknown error");
    throw new ApiError(`Failed to apply: ${errorText}`, res.status);
  }
  return res.json();
}

export async function requestStaffAccess(restaurantId: number): Promise<RestaurantStaffProfile> {
  const res = await authFetch(`${getApiBaseUrl()}/api/restaurants/${restaurantId}/staff-requests`, {
    method: "POST",
  });
  if (!res.ok) {
    const errorText = await res.text().catch(() => "Unknown error");
    throw new ApiError(`Failed to request staff access: ${errorText}`, res.status);
  }
  return res.json();
}

export async function getMyApplications(): Promise<Restaurant[]> {
  const res = await authFetch(`${getApiBaseUrl()}/api/restaurants/my-applications`);
  if (!res.ok) throw new ApiError(`Failed to fetch applications`, res.status);
  return res.json();
}

export async function getMyStaffRequests(): Promise<RestaurantStaffProfile[]> {
  const res = await authFetch(`${getApiBaseUrl()}/api/restaurants/my-staff-requests`);
  if (!res.ok) throw new ApiError(`Failed to fetch staff requests`, res.status);
  return res.json();
}


export interface RestaurantAdminDTO {
  id: number;
  name: string;
  ownerName: string;
  ownerEmail: string;
  ownerPhone: string;
  city: string;
  locality: string;
  address: string;
  cuisine: string;
  status: string;
  tempPassword?: string;
  createdAt: string;
}

export const getPendingRestaurants = async (): Promise<RestaurantAdminDTO[]> => {
  const res = await authFetch(`${getApiBaseUrl()}/api/admin/restaurants/pending`);
  if (!res.ok) throw new Error("Failed to fetch pending restaurants");
  return res.json();
};

export const getApprovedRestaurants = async (): Promise<RestaurantAdminDTO[]> => {
  const res = await authFetch(`${getApiBaseUrl()}/api/admin/restaurants/approved`);
  if (!res.ok) throw new Error("Failed to fetch approved restaurants");
  return res.json();
};

export const getRejectedRestaurants = async (): Promise<RestaurantAdminDTO[]> => {
  const res = await authFetch(`${getApiBaseUrl()}/api/admin/restaurants/rejected`);
  if (!res.ok) throw new Error("Failed to fetch rejected restaurants");
  return res.json();
};

export const approveRestaurant = async (restaurantId: number): Promise<RestaurantAdminDTO> => {
  const res = await authFetch(`${getApiBaseUrl()}/api/admin/restaurants/${restaurantId}/approve`, {
    method: "PUT"
  });
  if (!res.ok) throw new Error("Failed to approve restaurant");
  return res.json();
};

export const rejectRestaurant = async (restaurantId: number, reason: string): Promise<RestaurantAdminDTO> => {
  const res = await authFetch(`${getApiBaseUrl()}/api/admin/restaurants/${restaurantId}/reject`, {
    method: "PUT"
  });
  if (!res.ok) throw new Error("Failed to reject restaurant");
  return res.json();
};



export const getRestaurantDashboardSummary = async (restaurantId: number) => {
  const res = await authFetch(`${getApiBaseUrl()}/api/restaurants/${restaurantId}/dashboard-summary`);
  if (!res.ok) throw new Error("Failed to fetch dashboard summary");
  return res.json();
};

export const getRestaurantOrders = async (restaurantId: number) => {
  const res = await authFetch(`${getApiBaseUrl()}/api/restaurants/${restaurantId}/orders`);
  if (!res.ok) throw new Error("Failed to fetch orders");
  return res.json();
};

export const updateRestaurantOrderStatus = async (restaurantId: number, orderId: number, status: string) => {
  const res = await authFetch(`${getApiBaseUrl()}/api/restaurants/${restaurantId}/orders/${orderId}/status`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ status })
  });
  if (!res.ok) throw new Error("Failed to update order status");
  return res.json();
};

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const updateMenuItem = async (restaurantId: number, menuItemId: number, data: any) => {
  const res = await authFetch(`${getApiBaseUrl()}/api/restaurants/${restaurantId}/menu/${menuItemId}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data)
  });
  if (!res.ok) throw new Error("Failed to update menu item");
  return res.json();
};

export const deleteMenuItem = async (restaurantId: number, menuItemId: number) => {
  const res = await authFetch(`${getApiBaseUrl()}/api/restaurants/${restaurantId}/menu/${menuItemId}`, {
    method: "DELETE"
  });
  if (!res.ok) throw new Error("Failed to delete menu item");
};

// --- Admin Endpoints ---
export async function getAdminStats(): Promise<{ totalCustomers: number; totalRestaurants: number; totalOrders: number; totalDeliveries: number }> {
  const res = await authFetch(`${getApiBaseUrl()}/api/admin/stats`);
  if (!res.ok) throw new ApiError("Failed to load admin stats", res.status);
  return res.json();
}

export const getWsBaseUrl = (): string => {
  const url = process.env.NEXT_PUBLIC_API_URL || (typeof window !== "undefined" && window.location.hostname !== "localhost" ? "" : "http://localhost:8080");
  return url.replace(/\/+$/, "");
};


export interface RestaurantJoinRequest {
  id: number;
  restaurantId: number;
  userId: number;
  status: string;
  tempPassword?: string;
  createdAt: string;
}

export async function joinWithCode(code: string): Promise<RestaurantJoinRequest> {
  const res = await authFetch(`${getApiBaseUrl()}/api/restaurants/join-with-code`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ code })
  });
  if (!res.ok) {
    const errorText = await res.text().catch(() => "Unknown error");
    throw new ApiError(`Failed to join: ${errorText}`, res.status);
  }
  return res.json();
}

export async function getMyJoinRequests(): Promise<RestaurantJoinRequest[]> {
  const res = await authFetch(`${getApiBaseUrl()}/api/restaurants/my-join-requests`);
  if (!res.ok) throw new ApiError(`Failed to fetch join requests`, res.status);
  return res.json();
}

export async function getJoinRequestsForRestaurant(restaurantId: number): Promise<RestaurantJoinRequest[]> {
  const res = await authFetch(`${getApiBaseUrl()}/api/restaurants/${restaurantId}/join-requests`);
  if (!res.ok) throw new ApiError(`Failed to fetch join requests`, res.status);
  return res.json();
}

export async function createInvitation(restaurantId: number): Promise<{ code: string }> {
  const res = await authFetch(`${getApiBaseUrl()}/api/restaurants/${restaurantId}/invitations`, {
    method: "POST"
  });
  if (!res.ok) throw new ApiError(`Failed to create invitation`, res.status);
  return res.json();
}

export async function approveJoinRequest(requestId: number): Promise<RestaurantJoinRequest> {
  const res = await authFetch(`${getApiBaseUrl()}/api/restaurants/join-requests/${requestId}/approve`, {
    method: "POST"
  });
  if (!res.ok) throw new ApiError(`Failed to approve`, res.status);
  return res.json();
}

export async function rejectJoinRequest(requestId: number): Promise<RestaurantJoinRequest> {
  const res = await authFetch(`${getApiBaseUrl()}/api/restaurants/join-requests/${requestId}/reject`, {
    method: "POST"
  });
  if (!res.ok) throw new ApiError(`Failed to reject`, res.status);
  return res.json();
}

export async function getCities(): Promise<string[]> {
  try {
    const res = await fetch(`${getApiBaseUrl()}/api/restaurants/cities`, { cache: "no-store" });
    if (!res.ok) return [];
    return res.json();
  } catch {
    return [];
  }
}
