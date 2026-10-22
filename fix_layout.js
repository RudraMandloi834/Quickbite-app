const fs = require('fs');

let code = fs.readFileSync('frontend/src/app/restaurants/page.tsx', 'utf8');

// 1. Remove the middle column (Location Selector Top Bar) completely
const topBarRegex = /\s*\{\/\* Location Selector Top Bar \*\/\}[\s\S]*?(?=\{\/\* Main Content Area \*\/)/;
code = code.replace(topBarRegex, '\n          ');

// 2. Replace the old Location section in the sidebar with the new one
const oldLocationRegex = /\{\/\* Location \*\/\}[\s\S]*?(?=\s*<hr className="border-stone-100" \/>\s*\{\/\* Cuisine \*\/)/;

const newLocationUI = `{/* Location */}
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
                  <Navigation className={\`w-4 h-4 \${isLocating ? 'animate-pulse' : ''}\`} />
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
`;

code = code.replace(oldLocationRegex, newLocationUI);

fs.writeFileSync('frontend/src/app/restaurants/page.tsx', code);
