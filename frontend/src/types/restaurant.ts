export interface Restaurant {
  id: number;
  name: string;
  cuisine: string;
  location: string;
  rating: number;
  coverImageUrl?: string;
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
