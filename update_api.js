const fs = require('fs');

let api = fs.readFileSync('frontend/src/lib/api.ts', 'utf8');

api = api.replace(
  'export const applyForRestaurant = async (data: any): Promise<Restaurant> => {',
  `export interface CreateRestaurantRequest {
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

export const applyForRestaurant = async (data: CreateRestaurantRequest): Promise<Restaurant> => {`
);

fs.writeFileSync('frontend/src/lib/api.ts', api);
