export interface CartItem {
  id: number;
  cartId: number;
  menuItemId: number;
  quantity: number;
  unitPrice: number;
  subtotal: number;
}

export interface Cart {
  id: number;
  customerId: number;
  restaurantId: number;
  totalAmount: number;
  items: CartItem[];
}

export interface CreateCartRequest {
  customerId: number;
  restaurantId: number;
}

export interface AddCartItemRequest {
  menuItemId: number;
  quantity: number;
}

export interface CartItemDisplay {
  menuItemId: number;
  name: string;
  description: string;
  unitPrice: number;
  quantity: number;
  subtotal: number;
  rawItemIds: number[];
}

export interface CartDisplay {
  id: number;
  restaurantId: number;
  restaurantName: string;
  totalAmount: number;
  items: CartItemDisplay[];
}
