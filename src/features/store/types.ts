export type StoreLocation = {
  id: string;
  name: string;
  address: string;
  businessHours?: string;
  consultServices?: string[];
  phone: string;
  providedServices?: string[];
  lat: number;
  lng: number;
  distanceText?: string;
};

export type StoreRoutePoint = {
  lat: number;
  lng: number;
};

export type StoreRoute = {
  distanceMeters: number;
  durationSeconds: number;
  mode: "walk";
  path: StoreRoutePoint[];
};
