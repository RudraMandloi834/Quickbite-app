export interface OrderItem {
  id: number;
  orderId: number;
  menuItemId: number;
  name: string;
  quantity: number;
  unitPrice: number;
  subtotal: number;
}

export interface Order {
  id: number;
  customerId: number;
  restaurantId: number;
  totalAmount: number;
  status: "PENDING" | "CONFIRMED" | "CANCELLED" | string;
  paymentMethod?: string;
  paymentStatus?: string;
  createdAt: string;
  items?: OrderItem[];
}
