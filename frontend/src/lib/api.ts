import { Restaurant, MenuItem } from "@/types/restaurant";
import { Cart, CartItem, CreateCartRequest, AddCartItemRequest } from "@/types/cart";
import { Customer } from "@/types/customer";
import { Order } from "@/types/order";
import { Payment, PaymentInitiationResponse, PaymentVerificationRequest } from "@/types/payment";
import { Delivery } from "@/types/delivery";
import { getAuthHeaders, getUser } from "@/lib/auth";

export const getApiBaseUrl = (): string => {
  if (typeof window !== "undefined") {
    return "";
  }
  return process.env.API_URL || process.env.NEXT_PUBLIC_API_URL || "http://localhost:8080";
};

// --- Public Endpoints ---

export async function getRestaurants(): Promise<Restaurant[]> {
  const res = await fetch(`${getApiBaseUrl()}/api/restaurants`, {
    cache: "no-store",
  });
  if (!res.ok) throw new Error(`Failed to fetch restaurants`);
  return res.json();
}

export async function getNearbyRestaurants(latitude: number, longitude: number, radiusKm: number = 10): Promise<Restaurant[]> {
  const params = new URLSearchParams({ latitude: latitude.toString(), longitude: longitude.toString(), radiusKm: radiusKm.toString() });
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
  const restaurants = await getRestaurants();
  const idNum = typeof restaurantId === "string" ? parseInt(restaurantId, 10) : restaurantId;
  const match = restaurants.find((r) => r.id === idNum);
  return match || null;
}

// --- Protected Endpoints ---

export class ApiError extends Error {
  status: number;
  constructor(message: string, status: number) {
    super(message);
    this.status = status;
  }
}

async function authFetch(url: string, options: RequestInit = {}) {
  const headers = { ...options.headers, ...getAuthHeaders() };
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

export async function createOrderFromCart(cartId: number): Promise<Order> {
  const res = await authFetch(`${getApiBaseUrl()}/api/orders/from-cart/${cartId}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
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
