export interface Restaurant {
  id: number;
  name: string;
  cuisine: string;
  location: string;
  reviewCount?: number;
  priceRange?: number;
  deliveryTimeMinutes?: number;
  deliveryAvailability?: boolean;
  rating: number;
  coverImageUrl?: string;
  distanceKm?: number;
  city?: string;
  status?: string;
  createdAt?: string;
  ownerId?: number;
}

export interface MenuItem {
  id: number;
  restaurantId: number;
  name: string;
  description: string;
  price: number;
  available: boolean;
  imageUrl?: string;
}

export interface RestaurantStaffProfile {
  id: number;
  userId: number;
  restaurantId: number;
  approvalStatus: string;
  createdAt?: string;
  approvedAt?: string;
}
