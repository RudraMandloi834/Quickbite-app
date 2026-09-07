import { Restaurant, MenuItem } from "@/types/restaurant";
import { Cart, CartItem, CreateCartRequest, AddCartItemRequest } from "@/types/cart";
import { Customer } from "@/types/customer";
import { Order } from "@/types/order";
import { Payment, PaymentInitiationResponse, PaymentVerificationRequest } from "@/types/payment";

const getApiBaseUrl = (): string => {
  if (typeof window !== "undefined") {
    // In browser, relative URL works seamlessly through Next.js proxy rewrites
    return "";
  }
  return process.env.API_URL || process.env.NEXT_PUBLIC_API_URL || "http://localhost:8080";
};

export async function getRestaurants(): Promise<Restaurant[]> {
  const res = await fetch(`${getApiBaseUrl()}/api/restaurants`, {
    cache: "no-store",
  });
  if (!res.ok) {
    throw new Error(`Failed to fetch restaurants (${res.status} ${res.statusText})`);
  }
  return res.json();
}

export async function getNearbyRestaurants(latitude: number, longitude: number, radiusKm: number = 10): Promise<Restaurant[]> {
  const params = new URLSearchParams({
    latitude: latitude.toString(),
    longitude: longitude.toString(),
    radiusKm: radiusKm.toString(),
  });
  
  const res = await fetch(`${getApiBaseUrl()}/api/restaurants/nearby?${params.toString()}`, {
    cache: "no-store",
  });
  
  if (!res.ok) {
    throw new Error(`Failed to fetch nearby restaurants (${res.status} ${res.statusText})`);
  }
  return res.json();
}

export async function getRestaurantMenu(restaurantId: number | string): Promise<MenuItem[]> {
  const res = await fetch(`${getApiBaseUrl()}/api/restaurants/${restaurantId}/menu`, {
    cache: "no-store",
  });
  if (!res.ok) {
    throw new Error(`Failed to fetch menu (${res.status} ${res.statusText})`);
  }
  return res.json();
}

export async function getRestaurantById(restaurantId: number | string): Promise<Restaurant | null> {
  const restaurants = await getRestaurants();
  const idNum = typeof restaurantId === "string" ? parseInt(restaurantId, 10) : restaurantId;
  const match = restaurants.find((r) => r.id === idNum);
  return match || null;
}

export async function createCart(restaurantId: number, customerId: number = 1): Promise<Cart> {
  const body: CreateCartRequest = { customerId, restaurantId };
  const res = await fetch(`${getApiBaseUrl()}/api/carts`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(body),
  });

  if (!res.ok) {
    const errorText = await res.text().catch(() => "");
    throw new Error(`Failed to create cart (${res.status} ${res.statusText}): ${errorText}`);
  }
  return res.json();
}

export async function addCartItem(
  cartId: number,
  menuItemId: number,
  quantity: number = 1
): Promise<CartItem> {
  const body: AddCartItemRequest = { menuItemId, quantity };
  const res = await fetch(`${getApiBaseUrl()}/api/carts/${cartId}/items`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(body),
  });

  if (!res.ok) {
    const errorText = await res.text().catch(() => "");
    throw new Error(`Failed to add item to cart (${res.status} ${res.statusText}): ${errorText}`);
  }
  return res.json();
}

export async function getCart(cartId: number): Promise<Cart> {
  const res = await fetch(`${getApiBaseUrl()}/api/carts/${cartId}`, {
    cache: "no-store",
  });

  if (!res.ok) {
    throw new Error(`Failed to fetch cart (${res.status} ${res.statusText})`);
  }
  return res.json();
}

export async function getCustomers(): Promise<Customer[]> {
  const res = await fetch(`${getApiBaseUrl()}/api/customers`, {
    cache: "no-store",
  });

  if (!res.ok) {
    throw new Error(`Failed to fetch customers (${res.status} ${res.statusText})`);
  }
  return res.json();
}

export async function createOrderFromCart(cartId: number): Promise<Order> {
  const res = await fetch(`${getApiBaseUrl()}/api/orders/from-cart/${cartId}`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
  });

  if (!res.ok) {
    const errorText = await res.text().catch(() => "");
    throw new Error(`Failed to place order (${res.status} ${res.statusText}): ${errorText}`);
  }
  return res.json();
}

export async function createRazorpayOrder(orderId: number): Promise<PaymentInitiationResponse> {
  const res = await fetch(`${getApiBaseUrl()}/api/payments/orders/${orderId}`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
  });

  if (!res.ok) {
    const errorText = await res.text().catch(() => "");
    throw new Error(`Failed to initiate payment (${res.status} ${res.statusText}): ${errorText}`);
  }
  return res.json();
}

export async function verifyPayment(request: PaymentVerificationRequest): Promise<Payment> {
  const res = await fetch(`${getApiBaseUrl()}/api/payments/verify`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(request),
  });

  if (!res.ok) {
    const errorText = await res.text().catch(() => "");
    throw new Error(`Failed to verify payment (${res.status} ${res.statusText}): ${errorText}`);
  }
  return res.json();
}

export async function getOrderById(orderId: number | string): Promise<Order> {
  const res = await fetch(`${getApiBaseUrl()}/api/orders/${orderId}`, {
    cache: "no-store",
  });

  if (!res.ok) {
    throw new Error(`Failed to fetch order (${res.status} ${res.statusText})`);
  }
  return res.json();
}

export async function getCustomerById(customerId: number | string): Promise<Customer> {
  const res = await fetch(`${getApiBaseUrl()}/api/customers/${customerId}`, {
    cache: "no-store",
  });

  if (!res.ok) {
    throw new Error(`Failed to fetch customer (${res.status} ${res.statusText})`);
  }
  return res.json();
}
