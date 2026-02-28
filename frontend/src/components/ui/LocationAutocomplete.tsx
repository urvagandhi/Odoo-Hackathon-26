import { useState, useEffect, useRef } from "react";
import { MapPin } from "lucide-react";
import { useTranslation } from "react-i18next";
import { useTheme } from "../../context/ThemeContext";

interface LocationAutocompleteProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  className?: string;
}

interface NominatimResult {
  place_id: number;
  display_name: string;
  lat: string;
  lon: string;
}

export function LocationAutocomplete({ value, onChange, placeholder, className }: LocationAutocompleteProps) {
  const { isDark } = useTheme();
  const { t } = useTranslation();
  
  const [inputValue, setInputValue] = useState(value);
  const [results, setResults] = useState<NominatimResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [showDropdown, setShowDropdown] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  
  // Update internal value ONLY if it's changing from outside and we aren't currently editing it.
  // Otherwise, the parent state update overwrites our typing, causing bugs.
  useEffect(() => {
    if (value !== inputValue && !showDropdown) {
      setInputValue(value);
    }
  }, [value]);

  // Click outside to close dropdown
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setShowDropdown(false);
      }
    }
    if (showDropdown) {
      document.addEventListener("mousedown", handleClickOutside);
    }
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [showDropdown]);

  // Debounced search
  useEffect(() => {
    const timer = setTimeout(async () => {
      // Only search if user has typed something and it differs from the current true 'value'
      // (to prevent searching right after selecting an option)
      if (inputValue.length > 2 && inputValue !== value) {
        setLoading(true);
        try {
          // Nominatim requires identification. We use the 'email' query param instead of 
          // custom headers, because custom headers trigger a CORS preflight that fails.
          const res = await fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(inputValue)}&limit=5&addressdetails=1&email=test@fleetflow.com`);
          if (!res.ok) throw new Error("Failed to fetch");
          const data: NominatimResult[] = await res.json();
          setResults(data);
          setShowDropdown(data.length > 0);
        } catch (err) {
          console.error("Failed to fetch locations", err);
        } finally {
          setLoading(false);
        }
      } else if (inputValue.length <= 2) {
        setResults([]);
        setShowDropdown(false);
      }
    }, 500);

    return () => clearTimeout(timer);
  }, [inputValue, value]);

  const handleSelect = (place: NominatimResult) => {
    // Simplify the display name (Nominatim often returns very long strings)
    // We'll just use the full string but let the user edit if they want, 
    // or we can just pass the first few parts if we want to be fancy.
    // For now we'll pass the full display_name for maximum accuracy.
    const selectedName = place.display_name;
    setInputValue(selectedName);
    onChange(selectedName);
    setShowDropdown(false);
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setInputValue(e.target.value);
    onChange(e.target.value); // Also update the parent state immediately so validation works
  };

  return (
    <div className="relative" ref={dropdownRef}>
      <div className="relative">
        <input
          className={className}
          placeholder={placeholder}
          value={inputValue}
          onChange={handleInputChange}
          onFocus={() => {
            if (results.length > 0) setShowDropdown(true);
          }}
        />
        {loading && (
          <div className="absolute right-3 top-1/2 -translate-y-1/2">
            <span className={`text-xs ${isDark ? "text-neutral-400" : "text-slate-400"}`}>{t("common.loading")}</span>
          </div>
        )}
      </div>

      {showDropdown && results.length > 0 && (
        <div 
          className={`absolute z-50 w-full mt-1 rounded-xl shadow-lg border overflow-hidden ${
            isDark ? "bg-neutral-800 border-neutral-700 shadow-black/50" : "bg-white border-slate-200 shadow-slate-200"
          }`}
        >
          <ul className="max-h-60 overflow-y-auto">
            {results.map((place) => (
              <li 
                key={place.place_id}
                onClick={() => handleSelect(place)}
                className={`px-4 py-2.5 text-sm cursor-pointer flex items-start gap-3 transition-colors ${
                  isDark ? "hover:bg-neutral-700 text-neutral-200" : "hover:bg-slate-50 text-slate-700"
                }`}
              >
                <MapPin className={`w-4 h-4 shrink-0 mt-0.5 ${isDark ? "text-neutral-500" : "text-slate-400"}`} />
                <span className="line-clamp-2">{place.display_name}</span>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
