const fs = require('fs');

let code = fs.readFileSync('frontend/src/app/restaurants/page.tsx', 'utf8');

const locationStates = `  // Location States
  const [availableCities, setAvailableCities] = useState<string[]>([]);
  const [citySearch, setCitySearch] = useState("");
  const [cityDropdownOpen, setCityDropdownOpen] = useState(false);
  const [isLocating, setIsLocating] = useState(false);`;

code = code.replace(/  \/\/ Location States[\s\S]*?const \[isLocating, setIsLocating\] = useState\(false\);/, locationStates);

const dropdownUI = `
              <div className="relative w-full sm:w-64">
                <Button 
                  variant="outline"
                  className="w-full h-14 justify-start px-4 text-left font-medium text-lg bg-stone-50 border-stone-200"
                  onClick={() => setCityDropdownOpen(!cityDropdownOpen)}
                >
                  <MapPin className="w-5 h-5 text-stone-400 mr-2 shrink-0" />
                  <span className="truncate flex-1">{(!isNearby && city) ? city : "Select City..."}</span>
                </Button>
                
                {cityDropdownOpen && (
                  <div className="absolute top-full left-0 mt-2 w-full sm:w-80 bg-white border border-stone-100 rounded-xl shadow-lg z-50 overflow-hidden">
                    <div className="p-3 border-b border-stone-100 bg-stone-50/50">
                      <div className="relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-stone-400" />
                        <input 
                          type="text" 
                          placeholder="Search city..." 
                          className="w-full pl-9 pr-3 py-2 bg-white border border-stone-200 rounded-lg text-sm focus:outline-none focus:border-brand-primary"
                          value={citySearch}
                          onChange={(e) => setCitySearch(e.target.value)}
                        />
                      </div>
                    </div>
                    <div className="max-h-60 overflow-y-auto p-1">
                      {availableCities.filter(c => c.toLowerCase().includes(citySearch.toLowerCase())).length === 0 ? (
                        <div className="p-4 text-center text-sm text-stone-500">No cities found</div>
                      ) : (
                        availableCities.filter(c => c.toLowerCase().includes(citySearch.toLowerCase())).map(c => (
                          <button
                            key={c}
                            className="w-full text-left px-4 py-2.5 text-sm hover:bg-stone-50 rounded-lg transition-colors text-stone-700 font-medium"
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
              </div>`;

code = code.replace(/<div className="relative w-full sm:w-64">[\s\S]*?<\/select>\n              <\/div>/, dropdownUI);

fs.writeFileSync('frontend/src/app/restaurants/page.tsx', code);
