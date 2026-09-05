import { Cart, CartDisplay, CartItemDisplay } from "@/types/cart";
import { MenuItem } from "@/types/restaurant";
import {
  createCart,
  addCartItem,
  getCart,
  getRestaurantById,
  getRestaurantMenu,
} from "./api";

const CART_STORAGE_KEY = "quickbite_cart_id";

export function getStoredCartId(): number | null {
  if (typeof window === "undefined") return null;
  const stored = localStorage.getItem(CART_STORAGE_KEY);
  if (!stored) return null;
  const parsed = parseInt(stored, 10);
  return isNaN(parsed) ? null : parsed;
}

export function setStoredCartId(cartId: number): void {
  if (typeof window === "undefined") return;
  localStorage.setItem(CART_STORAGE_KEY, String(cartId));
}

export function clearStoredCartId(): void {
  if (typeof window === "undefined") return;
  localStorage.removeItem(CART_STORAGE_KEY);
}

/**
 * Adds an item to the current cart.
 * If no cart exists or if the existing cart is from a different restaurant,
 * creates a new cart for this restaurant and saves the cartId in localStorage.
 */
export async function addItemToCart(
  restaurantId: number,
  menuItemId: number,
  quantity: number = 1
): Promise<{ cart: Cart; replacedRestaurant: boolean }> {
  let cartId = getStoredCartId();
  let existingCart: Cart | null = null;
  let replacedRestaurant = false;

  if (cartId) {
    try {
      existingCart = await getCart(cartId);
    } catch {
      // Stale or deleted cart, clear it
      clearStoredCartId();
      cartId = null;
    }
  }

  // If cart exists and is for the same restaurant
  if (cartId && existingCart && existingCart.restaurantId === restaurantId) {
    await addCartItem(cartId, menuItemId, quantity);
    const updatedCart = await getCart(cartId);
    return { cart: updatedCart, replacedRestaurant: false };
  }

  // If cart was from a different restaurant
  if (existingCart && existingCart.restaurantId !== restaurantId) {
    replacedRestaurant = true;
  }

  // Create a new cart for this restaurant
  const newCart = await createCart(restaurantId, 1);
  setStoredCartId(newCart.id);
  await addCartItem(newCart.id, menuItemId, quantity);
  const finalCart = await getCart(newCart.id);
  return { cart: finalCart, replacedRestaurant };
}

/**
 * Updates quantity of an item in the cart.
 * If newQuantity <= 0, the item is removed.
 * Recreates the cart on the backend to keep accurate records and total amounts.
 */
export async function updateItemQuantity(
  cart: Cart,
  menuItemId: number,
  newQuantity: number
): Promise<Cart | null> {
  // Aggregate current items by menuItemId
  const qtyMap = new Map<number, number>();
  for (const item of cart.items) {
    qtyMap.set(item.menuItemId, (qtyMap.get(item.menuItemId) || 0) + item.quantity);
  }

  if (newQuantity <= 0) {
    qtyMap.delete(menuItemId);
  } else {
    qtyMap.set(menuItemId, newQuantity);
  }

  // If no items left, clear cart
  if (qtyMap.size === 0) {
    clearStoredCartId();
    return null;
  }

  // Recreate cart with updated quantities
  const newCart = await createCart(cart.restaurantId, cart.customerId);
  for (const [mId, qty] of qtyMap.entries()) {
    await addCartItem(newCart.id, mId, qty);
  }

  setStoredCartId(newCart.id);
  return await getCart(newCart.id);
}

/**
 * Removes an item entirely from the cart.
 */
export async function removeItemFromCart(
  cart: Cart,
  menuItemId: number
): Promise<Cart | null> {
  return updateItemQuantity(cart, menuItemId, 0);
}

/**
 * Fetches the enriched cart display model with restaurant name and menu item details.
 */
export async function fetchCartDisplay(cartId: number): Promise<CartDisplay | null> {
  let cart: Cart;
  try {
    cart = await getCart(cartId);
  } catch {
    clearStoredCartId();
    return null;
  }

  if (!cart.items || cart.items.length === 0) {
    return {
      id: cart.id,
      restaurantId: cart.restaurantId,
      restaurantName: "QuickBite Restaurant",
      totalAmount: 0,
      items: [],
    };
  }

  const [restaurant, menu] = await Promise.all([
    getRestaurantById(cart.restaurantId).catch(() => null),
    getRestaurantMenu(cart.restaurantId).catch(() => [] as MenuItem[]),
  ]);

  const menuMap = new Map<number, MenuItem>();
  for (const m of menu) {
    menuMap.set(m.id, m);
  }

  // Consolidate cart items by menuItemId for clean UI presentation
  const consolidatedMap = new Map<number, CartItemDisplay>();
  for (const item of cart.items) {
    const existing = consolidatedMap.get(item.menuItemId);
    const menuItem = menuMap.get(item.menuItemId);
    const itemName = menuItem?.name || `Dish #${item.menuItemId}`;
    const itemDesc = menuItem?.description || "";

    if (existing) {
      existing.quantity += item.quantity;
      existing.subtotal += Number(item.subtotal);
      existing.rawItemIds.push(item.id);
    } else {
      consolidatedMap.set(item.menuItemId, {
        menuItemId: item.menuItemId,
        name: itemName,
        description: itemDesc,
        unitPrice: Number(item.unitPrice),
        quantity: item.quantity,
        subtotal: Number(item.subtotal),
        rawItemIds: [item.id],
      });
    }
  }

  return {
    id: cart.id,
    restaurantId: cart.restaurantId,
    restaurantName: restaurant?.name || `Restaurant #${cart.restaurantId}`,
    totalAmount: Number(cart.totalAmount),
    items: Array.from(consolidatedMap.values()),
  };
}

/**
 * Assigns or updates the cart customer.
 * If the current cart's customerId differs from targetCustomerId,
 * recreates the cart under the new customer with all current items.
 */
export async function assignCartToCustomer(
  cart: Cart,
  customerId: number
): Promise<Cart> {
  if (cart.customerId === customerId) {
    return cart;
  }

  const qtyMap = new Map<number, number>();
  for (const item of cart.items) {
    qtyMap.set(item.menuItemId, (qtyMap.get(item.menuItemId) || 0) + item.quantity);
  }

  const newCart = await createCart(cart.restaurantId, customerId);
  for (const [mId, qty] of qtyMap.entries()) {
    await addCartItem(newCart.id, mId, qty);
  }

  setStoredCartId(newCart.id);
  return await getCart(newCart.id);
}

