const fs = require('fs');

const original = fs.readFileSync('frontend/src/app/restaurants/page.tsx', 'utf8');

// We will inject the new imports
let code = original.replace(
  'import { getRestaurants, getNearbyRestaurants, Page } from "@/lib/api";',
  'import { getRestaurants, getNearbyRestaurants, getCities, Page } from "@/lib/api";\nimport { Navigation } from "lucide-react";'
);

// Inject state variables
code = code.replace(
  'const [isNearby, setIsNearby] = useState(searchParams.get("isNearby") === "true");',
  `const [isNearby, setIsNearby] = useState(searchParams.get("isNearby") === "true");
  const [lat, setLat] = useState(searchParams.get("lat") || "");
  const [lng, setLng] = useState(searchParams.get("lng") || "");
  const [radius, setRadius] = useState(searchParams.get("radius") || "20");
  
  // Location States
  const [availableCities, setAvailableCities] = useState<string[]>([]);
  const [isLocating, setIsLocating] = useState(false);
  const [locationDenied, setLocationDenied] = useState(false);

  useEffect(() => {
    getCities().then(cities => setAvailableCities(cities)).catch(() => {});
  }, []);`
);

// Update updateFilters
code = code.replace(
  'if (updates.isNearby !== undefined) setIsNearby(updates.isNearby === "true");',
  `if (updates.isNearby !== undefined) setIsNearby(updates.isNearby === "true");
    if (updates.lat !== undefined) setLat(updates.lat || "");
    if (updates.lng !== undefined) setLng(updates.lng || "");
    if (updates.radius !== undefined) setRadius(updates.radius || "20");`
);

// Add handleUseMyLocation
code = code.replace(
  'const handlePageChange',
  `const handleUseMyLocation = () => {
    if (!navigator.geolocation) {
      alert("Geolocation is not supported by your browser");
      return;
    }
    setIsLocating(true);
    setLocationDenied(false);
    navigator.geolocation.getCurrentPosition(
      (position) => {
        setIsLocating(false);
        updateFilters({
          isNearby: "true",
          lat: position.coords.latitude.toString(),
          lng: position.coords.longitude.toString(),
          radius: radius || "20",
          city: null
        });
      },
      (error) => {
        setIsLocating(false);
        setLocationDenied(true);
      }
    );
  };

  const handleCitySelect = (selectedCity: string) => {
    updateFilters({
      city: selectedCity,
      isNearby: null,
      lat: null,
      lng: null,
      radius: null
    });
  };

  const handlePageChange`
);

// Fix fetchData
code = code.replace(
  `if (isNearby) {
          // Default location for testing nearby (Delhi) if geolocation fails or just mock coordinates for now
          // In a real app, you'd get the user's lat/lng
          responseData = await getNearbyRestaurants(28.6139, 77.2090, 20, page, 16);
        } else {`,
  `if (isNearby && lat && lng) {
          responseData = await getNearbyRestaurants(parseFloat(lat), parseFloat(lng), parseFloat(radius || "20"), page, 16);
        } else {`
);

code = code.replace(
  `[page, search, city, locality, cuisine, minRating, priceRange, sort, isNearby]`,
  `[page, search, city, locality, cuisine, minRating, priceRange, sort, isNearby, lat, lng, radius]`
);

// Add the Location UI
const locationUI = `
          {/* Location Selector Top Bar */}
          <div className="bg-white p-6 rounded-2xl shadow-sm border border-stone-100 mb-6 flex flex-col md:flex-row gap-4 justify-between items-center">
            
            <div className="flex flex-col sm:flex-row items-center gap-4 w-full md:w-auto">
              <div className="relative w-full sm:w-64">
                <MapPin className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-stone-400" />
                <select 
                  className="w-full pl-12 pr-4 h-14 bg-stone-50 border border-stone-200 shadow-sm rounded-xl text-lg font-medium appearance-none focus:outline-none focus:ring-2 focus:ring-brand-primary/50 cursor-pointer"
                  value={(!isNearby && city) ? city : ""}
                  onChange={(e) => handleCitySelect(e.target.value)}
                >
                  <option value="" disabled>Select City...</option>
                  {availableCities.map(c => (
                    <option key={c} value={c}>{c}</option>
                  ))}
                </select>
              </div>

              <div className="text-stone-400 font-medium">OR</div>

              <Button 
                onClick={handleUseMyLocation} 
                variant={isNearby ? "primary" : "outline"} 
                className="h-14 px-6 w-full sm:w-auto flex items-center justify-center gap-2"
                disabled={isLocating}
              >
                <Navigation className={\`w-5 h-5 \${isLocating ? 'animate-pulse' : ''}\`} />
                {isLocating ? "Detecting location..." : (isNearby ? "Near You" : "Use My Location")}
              </Button>
            </div>

            {isNearby && (
              <div className="flex items-center gap-3 w-full md:w-auto mt-4 md:mt-0">
                <span className="text-sm font-bold text-stone-600">Radius:</span>
                <select 
                  className="h-12 px-4 bg-stone-50 border border-stone-200 rounded-lg focus:outline-none font-medium"
                  value={radius}
                  onChange={(e) => updateFilters({ radius: e.target.value })}
                >
                  <option value="5">5 km</option>
                  <option value="10">10 km</option>
                  <option value="20">20 km</option>
                  <option value="30">30 km</option>
                </select>
              </div>
            )}
            
            {locationDenied && (
              <div className="text-red-500 text-sm font-bold w-full md:w-auto mt-2 md:mt-0 text-center md:text-right">
                Location permission was denied. Please select a city instead.
              </div>
            )}
          </div>
`;

code = code.replace(
  '{/* Main Content Area */}',
  locationUI + '\n          {/* Main Content Area */}'
);

fs.writeFileSync('frontend/src/app/restaurants/page.tsx', code);
