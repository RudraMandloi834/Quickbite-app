export interface Delivery {
  id: number;
  orderId: number;
  driverName: string;
  driverPhone: string;
  status: string;
  createdAt: string;
  updatedAt: string;
  assignedAt?: string;
  pickedUpAt?: string;
  outForDeliveryAt?: string;
  deliveredAt?: string;
}
