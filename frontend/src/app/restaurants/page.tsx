"use client";

import { useState, useEffect, useCallback, Suspense } from "react";
import { useSearchParams, useRouter, usePathname } from "next/navigation";
import Link from "next/link";
import { Container } from "@/components/Container";
import { Card, CardContent } from "@/components/Card";
import { Input } from "@/components/Input";
import { Badge } from "@/components/Badge";
import { Button } from "@/components/Button";
import { Skeleton } from "@/components/Skeleton";
import { ImageWithFallback } from "@/components/ImageWithFallback";
import { getRestaurants, getNearbyRestaurants, getCities, Page } from "@/lib/api";
import { Navigation } from "lucide-react";
import { Restaurant } from "@/types/restaurant";
import { MapPin, Search, Star, Clock, Heart, SlidersHorizontal, ChevronLeft, ChevronRight, X, AlertCircle } from "lucide-react";

// Wrap the main content in a Suspense boundary for useSearchParams
export default function RestaurantsPage() {
  return (
    <Suspense fallback={<RestaurantsLoadingFallback />}>
      <RestaurantsContent />
    </Suspense>
  );
}

function RestaurantsLoadingFallback() {
  return (
    <div className="min-h-screen bg-brand-bg pt-24 pb-20">
      <Container>
        <div className="flex flex-col md:flex-row gap-6 lg:gap-8">
          <div className="w-full md:w-64 lg:w-72 shrink-0 hidden md:block">
            <Skeleton className="w-full h-[500px] rounded-xl" />
          </div>
          <div className="flex-1">
            <Skeleton className="w-full h-12 rounded-lg mb-6" />
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {[...Array(6)].map((_, i) => (
                <Skeleton key={i} className="w-full h-72 rounded-xl" />
              ))}
            </div>
          </div>
        </div>
      </Container>
    </div>
  );
}

function RestaurantsContent() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  // Filters State mapped to URL params
  const [page, setPage] = useState(Number(searchParams.get("page")) || 0);
  const [search, setSearch] = useState(searchParams.get("search") || "");
  const [city, setCity] = useState(searchParams.get("city") || "");
  const [locality, setLocality] = useState(searchParams.get("locality") || "");
  const [cuisine, setCuisine] = useState(searchParams.get("cuisine") || "");
  const [minRating, setMinRating] = useState(searchParams.get("minRating") || "");
  const [priceRange, setPriceRange] = useState(searchParams.get("priceRange") || "");
  const [sort, setSort] = useState(searchParams.get("sort") || "rating,desc");
  const [isNearby, setIsNearby] = useState(searchParams.get("isNearby") === "true");
  const [lat, setLat] = useState(searchParams.get("lat") || "");
  const [lng, setLng] = useState(searchParams.get("lng") || "");
  const [radius, setRadius] = useState(searchParams.get("radius") || "20");
  
  // Location States
  const [availableCities, setAvailableCities] = useState<string[]>([]);
  const [citySearch, setCitySearch] = useState("");
  const [cityDropdownOpen, setCityDropdownOpen] = useState(false);
  const [isLocating, setIsLocating] = useState(false);
  const [locationDenied, setLocationDenied] = useState(false);

  useEffect(() => {
    getCities().then(cities => setAvailableCities(cities)).catch(() => {});
  }, []);
  
  // Mobile filters open state
  const [mobileFiltersOpen, setMobileFiltersOpen] = useState(false);

  // Data State
  const [data, setData] = useState<Page<Restaurant> | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // Sync state to URL
  const createQueryString = useCallback(
    (updates: Record<string, string | null>) => {
      const params = new URLSearchParams(searchParams.toString());
      Object.entries(updates).forEach(([name, value]) => {
        if (value === null || value === "") {
          params.delete(name);
        } else {
          params.set(name, value);
        }
      });
      return params.toString();
    },
    [searchParams]
  );

  const updateFilters = (updates: Record<string, string | null>) => {
    const newQueryString = createQueryString({ ...updates, page: "0" }); // Reset to page 0 on filter change
    router.push(pathname + "?" + newQueryString, { scroll: false });
    // Update local state immediately for fast feedback
    if (updates.search !== undefined) setSearch(updates.search || "");
    if (updates.city !== undefined) setCity(updates.city || "");
    if (updates.locality !== undefined) setLocality(updates.locality || "");
    if (updates.cuisine !== undefined) setCuisine(updates.cuisine || "");
    if (updates.minRating !== undefined) setMinRating(updates.minRating || "");
    if (updates.priceRange !== undefined) setPriceRange(updates.priceRange || "");
    if (updates.sort !== undefined) setSort(updates.sort || "rating,desc");
    if (updates.isNearby !== undefined) setIsNearby(updates.isNearby === "true");
    if (updates.lat !== undefined) setLat(updates.lat || "");
    if (updates.lng !== undefined) setLng(updates.lng || "");
    if (updates.radius !== undefined) setRadius(updates.radius || "20");
    if (updates.page !== undefined) setPage(Number(updates.page) || 0);
    else setPage(0);
  };

  const handleUseMyLocation = () => {
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

  const handlePageChange = (newPage: number) => {
    if (newPage < 0 || (data && newPage >= data.totalPages)) return;
    const newQueryString = createQueryString({ page: newPage.toString() });
    router.push(pathname + "?" + newQueryString);
    setPage(newPage);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  useEffect(() => {
    let ignore = false;
    async function fetchData() {
      setLoading(true);
      setError("");
      try {
        let responseData: Page<Restaurant>;
        if (isNearby && lat && lng) {
          responseData = await getNearbyRestaurants(parseFloat(lat), parseFloat(lng), parseFloat(radius || "20"), page, 16);
        } else {
          const params: Record<string, string> = { page: page.toString(), size: "16", sort };
          if (search) params.search = search;
          if (city) params.city = city;
          if (locality) params.locality = locality;
          if (cuisine) params.cuisine = cuisine;
          if (minRating) params.minRating = minRating;
          if (priceRange) params.priceRange = priceRange;
          
          responseData = await getRestaurants(params);
        }
        
        if (!ignore) {
          setData(responseData);
          setLoading(false);
        }
      } catch (err: unknown) {
        if (!ignore) {
          setError((err as Error).message || "Failed to load restaurants. Please try again.");
          setLoading(false);
        }
      }
    }
    fetchData();
    return () => { ignore = true; };
  }, [page, search, city, locality, cuisine, minRating, priceRange, sort, isNearby, lat, lng, radius]);

  return (
    <div className="min-h-screen bg-brand-bg pt-24 pb-20">
      <Container>
        <div className="flex flex-col md:flex-row gap-6 lg:gap-8">
          
          {/* Mobile Filter Toggle & Search Header */}
          <div className="md:hidden flex flex-col gap-4">
            <div className="relative w-full">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-stone-400" />
              <Input
                placeholder="Search restaurants or cuisines..."
                value={search}
                onChange={(e) => updateFilters({ search: e.target.value })}
                className="w-full pl-12 h-14 bg-white border-none shadow-sm rounded-xl text-lg font-medium"
              />
            </div>
            <Button 
              variant="outline" 
              className="w-full justify-between bg-white"
              onClick={() => setMobileFiltersOpen(!mobileFiltersOpen)}
            >
              <span className="flex items-center gap-2"><SlidersHorizontal className="w-4 h-4" /> Filters & Sort</span>
              {mobileFiltersOpen ? <X className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
            </Button>
          </div>

          {/* Desktop Filters Sidebar / Mobile Expandable Filters */}
          <div className={`w-full md:w-64 lg:w-72 shrink-0 ${mobileFiltersOpen ? 'block' : 'hidden md:block'}`}>
            <div className="bg-white rounded-xl shadow-sm p-6 sticky top-24 space-y-8">
              
              <div className="hidden md:block relative w-full mb-6">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-stone-400" />
                <Input
                  placeholder="Search..."
                  value={search}
                  onChange={(e) => updateFilters({ search: e.target.value })}
                  className="w-full pl-10 h-10 bg-stone-50 border-stone-200"
                />
              </div>

              {/* Sort By */}
              <div>
                <h3 className="font-bold text-stone-800 mb-3 flex items-center gap-2">Sort By</h3>
                <div className="flex flex-col gap-2">
                  {[
                    { label: "Rating (High to Low)", value: "rating,desc" },
                    { label: "Delivery Time (Fastest)", value: "deliveryTimeMinutes,asc" },
                    { label: "A to Z", value: "name,asc" },
                  ].map(option => (
                    <label key={option.value} className="flex items-center gap-3 cursor-pointer group">
                      <input 
                        type="radio" 
                        name="sort" 
                        className="w-4 h-4 text-brand-primary border-stone-300 focus:ring-brand-primary"
                        checked={sort === option.value}
                        onChange={() => updateFilters({ sort: option.value })}
                      />
                      <span className="text-stone-600 group-hover:text-stone-900 transition-colors">{option.label}</span>
                    </label>
                  ))}
                </div>
              </div>

              <hr className="border-stone-100" />

              {/* Location */}
              <div className="space-y-4">
                <h3 className="font-bold text-stone-800 flex items-center gap-2">Location</h3>
                
                {/* Select City Dropdown */}
                <div className="relative w-full">
                  <Button 
                    variant="outline"
                    className="w-full h-10 justify-start px-3 text-left font-medium text-sm bg-stone-50 border-stone-200"
                    onClick={() => setCityDropdownOpen(!cityDropdownOpen)}
                  >
                    <MapPin className="w-4 h-4 text-stone-400 mr-2 shrink-0" />
                    <span className="truncate flex-1">{(!isNearby && city) ? city : "Select City..."}</span>
                  </Button>
                  
                  {cityDropdownOpen && (
                    <div className="absolute top-full left-0 mt-2 w-full bg-white border border-stone-100 rounded-xl shadow-lg z-50 overflow-hidden">
                      <div className="p-2 border-b border-stone-100 bg-stone-50/50">
                        <div className="relative">
                          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-stone-400" />
                          <input 
                            type="text" 
                            placeholder="Search..." 
                            className="w-full pl-8 pr-2 py-1.5 bg-white border border-stone-200 rounded-md text-sm focus:outline-none focus:border-brand-primary"
                            value={citySearch}
                            onChange={(e) => setCitySearch(e.target.value)}
                          />
                        </div>
                      </div>
                      <div className="max-h-48 overflow-y-auto p-1">
                        {availableCities.filter(c => c.toLowerCase().includes(citySearch.toLowerCase())).length === 0 ? (
                          <div className="p-3 text-center text-xs text-stone-500">No cities found</div>
                        ) : (
                          availableCities.filter(c => c.toLowerCase().includes(citySearch.toLowerCase())).map(c => (
                            <button
                              key={c}
                              className="w-full text-left px-3 py-2 text-sm hover:bg-stone-50 rounded-md transition-colors text-stone-700 font-medium"
                              onClick={() => {
                                handleCitySelect(c);
                                setCityDropdownOpen(false);
                                setCitySearch("");
                              }}
                            >
                              {c}
                            </button>
                          ))
                        )}
                      </div>
                    </div>
                  )}
                </div>

                {/* Locality Input */}
                <Input 
                  placeholder="Locality (e.g. Andheri)" 
                  value={locality}
                  onChange={(e) => updateFilters({ locality: e.target.value })}
                  className="h-10 text-sm"
                  disabled={isNearby}
                />

                {/* OR divider */}
                <div className="flex items-center gap-2">
                  <div className="flex-1 h-px bg-stone-100"></div>
                  <span className="text-xs font-medium text-stone-400">OR</span>
                  <div className="flex-1 h-px bg-stone-100"></div>
                </div>

                {/* Use My Location Button */}
                <Button 
                  onClick={handleUseMyLocation} 
                  variant={isNearby ? "primary" : "outline"} 
                  className="w-full h-10 flex items-center justify-center gap-2 text-sm bg-white"
                  disabled={isLocating}
                >
                  <Navigation className={`w-4 h-4 ${isLocating ? 'animate-pulse' : ''}`} />
                  {isLocating ? "Detecting..." : (isNearby ? "Using your location" : "Use My Location")}
                </Button>
                
                {isNearby && (
                  <div className="flex items-center justify-between gap-2 text-sm mt-2">
                    <span className="text-stone-600 font-medium">Radius:</span>
                    <select 
                      className="h-8 px-2 bg-stone-50 border border-stone-200 rounded-md focus:outline-none"
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
                  <div className="text-red-500 text-xs font-medium text-center">
                    Location permission denied.
                  </div>
                )}
              </div>


              <hr className="border-stone-100" />

              {/* Cuisine */}
              <div>
                <h3 className="font-bold text-stone-800 mb-3 flex items-center gap-2">Popular Cuisines</h3>
                <div className="flex flex-col gap-2">
                  {["North Indian", "South Indian", "Chinese", "Biryani", "Desserts", "Beverages"].map(c => (
                    <label key={c} className="flex items-center gap-3 cursor-pointer group">
                      <input 
                        type="radio" 
                        name="cuisine"
                        className="w-4 h-4 text-brand-primary border-stone-300 focus:ring-brand-primary"
                        checked={cuisine === c}
                        onChange={() => updateFilters({ cuisine: c })}
                      />
                      <span className="text-stone-600 group-hover:text-stone-900 transition-colors">{c}</span>
                    </label>
                  ))}
                  <label className="flex items-center gap-3 cursor-pointer group mt-2">
                    <input 
                      type="radio" 
                      name="cuisine"
                      className="w-4 h-4 text-brand-primary border-stone-300 focus:ring-brand-primary"
                      checked={cuisine === ""}
                      onChange={() => updateFilters({ cuisine: null })}
                    />
                    <span className="text-stone-500 italic">Clear Cuisine</span>
                  </label>
                </div>
              </div>

              <hr className="border-stone-100" />

              {/* Rating */}
              <div>
                <h3 className="font-bold text-stone-800 mb-3 flex items-center gap-2">Rating</h3>
                <div className="flex flex-col gap-2">
                  {[
                    { label: "4.5 & Above", value: "4.5" },
                    { label: "4.0 & Above", value: "4.0" },
                    { label: "3.0 & Above", value: "3.0" },
                    { label: "Any Rating", value: "" },
                  ].map(r => (
                    <label key={r.label} className="flex items-center gap-3 cursor-pointer group">
                      <input 
                        type="radio" 
                        name="rating"
                        className="w-4 h-4 text-brand-primary border-stone-300 focus:ring-brand-primary"
                        checked={minRating === r.value}
                        onChange={() => updateFilters({ minRating: r.value || null })}
                      />
                      <span className="text-stone-600 group-hover:text-stone-900 transition-colors">{r.label}</span>
                    </label>
                  ))}
                </div>
              </div>
              <hr className="border-stone-100" />

              {/* Price */}
              <div>
                <h3 className="font-bold text-stone-800 mb-3 flex items-center gap-2">Price</h3>
                <div className="flex flex-col gap-2">
                  {[
                    { label: "₹ (Budget)", value: "1" },
                    { label: "₹₹ (Mid-range)", value: "2" },
                    { label: "₹₹₹ (Premium)", value: "3" },
                    { label: "Any Price", value: "" },
                  ].map(p => (
                    <label key={p.label} className="flex items-center gap-3 cursor-pointer group">
                      <input 
                        type="radio" 
                        name="price"
                        className="w-4 h-4 text-brand-primary border-stone-300 focus:ring-brand-primary"
                        checked={priceRange === p.value}
                        onChange={() => updateFilters({ priceRange: p.value || null })}
                      />
                      <span className="text-stone-600 group-hover:text-stone-900 transition-colors">{p.label}</span>
                    </label>
                  ))}
                </div>
              </div>

              {/* Reset All */}
              <Button 
                variant="outline" 
                className="w-full mt-4"
                onClick={() => router.push(pathname)}
              >
                Reset All Filters
              </Button>

            </div>
          </div>
          {/* Main Content Area */}
          <div className="flex-1">
            <div className="mb-6 flex justify-between items-end">
              <div>
                <h1 className="text-2xl md:text-3xl font-extrabold text-stone-900 mb-2">
                  {search ? `Search results for "${search}"` : (city ? `Restaurants in ${city}` : "All Restaurants")}
                </h1>
                <p className="text-stone-500 font-medium">
                  {data ? `${data.totalElements} results found` : "Loading..."}
                </p>
              </div>
            </div>

            {error && (
              <div className="bg-red-50 border border-red-200 text-red-700 p-6 rounded-xl flex flex-col items-center justify-center text-center">
                <AlertCircle className="w-10 h-10 mb-3 text-red-400" />
                <h3 className="font-bold text-lg mb-1">Oops! Something went wrong</h3>
                <p className="mb-4">{error}</p>
                <Button onClick={() => window.location.reload()} variant="primary">Try Again</Button>
              </div>
            )}

            {loading && !error && (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                {[...Array(6)].map((_, i) => (
                  <div key={i} className="flex flex-col gap-3">
                    <Skeleton className="w-full h-48 rounded-2xl" />
                    <Skeleton className="w-3/4 h-6 rounded" />
                    <Skeleton className="w-1/2 h-4 rounded" />
                    <Skeleton className="w-1/4 h-4 rounded" />
                  </div>
                ))}
              </div>
            )}

            {!loading && !error && data && data.content.length === 0 && (
              <div className="bg-white border border-stone-100 rounded-2xl p-12 flex flex-col items-center justify-center text-center shadow-sm">
                <div className="w-20 h-20 bg-stone-50 rounded-full flex items-center justify-center mb-4">
                  <Search className="w-10 h-10 text-stone-300" />
                </div>
                <h3 className="text-xl font-bold text-stone-800 mb-2">{isNearby ? 'No restaurants found nearby' : 'No restaurants found'}</h3>
                <p className="text-stone-500 max-w-md mx-auto mb-6">
                  We couldn&apos;t find any restaurants matching your current filters. Try adjusting your search or location.
                </p>
                <Button onClick={() => router.push(pathname)} variant="outline">Clear All Filters</Button>
              </div>
            )}

            {!loading && !error && data && data.content.length > 0 && (
              <>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                  {data.content.map((restaurant) => (
                    <Link href={`/restaurants/${restaurant.id}`} key={restaurant.id} className="group block h-full">
                      <Card noPadding className="h-full flex flex-col border-none shadow-card hover:shadow-hover transition-all bg-white relative top-0 group-hover:-top-2 rounded-2xl overflow-hidden">
                        
                        {/* Image Container (Responsive Mobile horizontal, Desktop vertical) */}
                        <div className="relative h-48 w-full shrink-0 bg-stone-100 overflow-hidden">
                          <ImageWithFallback
                            src={restaurant.coverImageUrl || ""}
                            alt={restaurant.name}
                            className="absolute inset-0 w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                          />
                          {(restaurant as Restaurant & { distanceKm?: number }).distanceKm && (
                            <div className="absolute top-3 left-3 bg-white/90 backdrop-blur-sm text-stone-800 px-2 py-1 rounded-md text-xs font-bold shadow-sm flex items-center gap-1">
                              <MapPin className="w-3 h-3" /> {((restaurant as Restaurant & { distanceKm?: number }).distanceKm)?.toFixed(1)} km
                            </div>
                          )}
                          <div className="absolute bottom-3 right-3 bg-white/90 backdrop-blur-sm px-2 py-1 rounded-md text-xs font-bold shadow-sm flex items-center gap-1">
                            <Clock className="w-3 h-3 text-stone-600" /> {restaurant.deliveryTimeMinutes || 30} mins
                          </div>
                        </div>

                        {/* Content */}
                        <div className="p-4 flex-1 flex flex-col justify-between">
                          <div>
                            <div className="flex justify-between items-start mb-1">
                              <h3 className="font-extrabold text-stone-900 text-lg leading-tight line-clamp-1 group-hover:text-brand-primary transition-colors">
                                {restaurant.name}
                              </h3>
                              <div className="flex items-center gap-1 bg-green-50 text-green-700 px-1.5 py-0.5 rounded text-sm font-bold shrink-0">
                                <Star className="w-3 h-3 fill-current" /> {restaurant.rating.toFixed(1)}
                              </div>
                            </div>
                            <p className="text-stone-500 text-sm font-medium line-clamp-1 mb-2">
                              {restaurant.cuisine}
                            </p>
                          </div>
                          
                          <div className="flex flex-col gap-2 mt-2 pt-2 border-t border-stone-100">
                            <div className="flex items-center justify-between text-xs text-stone-500">
                              <span className="flex items-center gap-1.5 truncate">
                                <MapPin className="w-3.5 h-3.5 text-stone-400 shrink-0" />
                                <span className="truncate">{restaurant.location}, {restaurant.city}</span>
                              </span>
                              <span className="font-medium bg-stone-100 px-2 py-1 rounded-md text-stone-600">
                                {restaurant.priceRange === 2 ? "₹₹" : (restaurant.priceRange === 3 ? "₹₹₹" : "₹")}
                              </span>
                            </div>
                          </div>
                        </div>
                      </Card>
                    </Link>
                  ))}
                </div>

                {/* Pagination Control */}
                {data.totalPages > 1 && (
                  <div className="mt-12 flex justify-center items-center gap-4">
                    <Button 
                      variant="outline" 
                      onClick={() => handlePageChange(data.number - 1)}
                      disabled={data.number === 0}
                      className="bg-white"
                    >
                      <ChevronLeft className="w-4 h-4 mr-2" /> Previous
                    </Button>
                    <div className="text-sm font-bold text-stone-600 bg-white px-4 py-2 rounded-lg shadow-sm border border-stone-100">
                      Page {data.number + 1} of {data.totalPages}
                    </div>
                    <Button 
                      variant="outline" 
                      onClick={() => handlePageChange(data.number + 1)}
                      disabled={data.number >= data.totalPages - 1}
                      className="bg-white"
                    >
                      Next <ChevronRight className="w-4 h-4 ml-2" />
                    </Button>
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      </Container>
    </div>
  );
}
