export const DEFAULT_COUNTRY = "India";
export const DEFAULT_CITY = "Mumbai";

export const INDIAN_CITIES = [
  "Mumbai",
  "Delhi",
  "Bengaluru",
  "Hyderabad",
  "Chennai",
  "Kolkata",
  "Pune",
  "Ahmedabad",
  "Jaipur",
  "Lucknow",
  "Indore",
  "Bhopal",
  "Chandigarh",
  "Surat",
  "Nagpur",
  "Patna",
  "Kochi",
  "Coimbatore",
  "Vadodara",
  "Visakhapatnam",
  "Nashik",
  "Mysuru",
  "Goa",
  "Bhubaneswar",
  "Guwahati",
  "Dehradun",
  "Amritsar",
  "Rajkot",
] as const;

const LOCATION_STORAGE_KEY = "quickbite_selected_location";

export interface UserLocation {
  city: string;
  country: string;
}

export function getStoredLocation(): UserLocation {
  if (typeof window === "undefined") {
    return { city: DEFAULT_CITY, country: DEFAULT_COUNTRY };
  }
  try {
    const raw = localStorage.getItem(LOCATION_STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (parsed && typeof parsed.city === "string" && parsed.city.trim()) {
        return {
          city: parsed.city.trim(),
          country: DEFAULT_COUNTRY,
        };
      }
    }
  } catch {
    // fallback
  }
  return { city: DEFAULT_CITY, country: DEFAULT_COUNTRY };
}

export function setStoredLocation(city: string): void {
  if (typeof window === "undefined") return;
  try {
    const location: UserLocation = {
      city: city.trim() || DEFAULT_CITY,
      country: DEFAULT_COUNTRY,
    };
    localStorage.setItem(LOCATION_STORAGE_KEY, JSON.stringify(location));
  } catch {
    // ignore
  }
}
