/**
 * Vehicle Type → Image mapping
 * Images sourced from Photos/vehicles/, copied to public/vehicles/
 * with semantic names.
 *
 * Mapping:
 *   truck.png  → truck-1.png,  truck1.png    → truck-2.png
 *   van.png    → van-1.png,    black_van.png → van-2.png
 *   bike.png   → bike-1.png,   activa.png    → bike-2.png
 *   car.png    → car-1.png
 */

export interface VehicleImageInfo {
  primary: string;
  alt: string;
  label: string;
  description: string;
  icon: string;
  gradient: string;
  gradientDark: string;
}

export const vehicleImageMap: Record<string, VehicleImageInfo> = {
  TRUCK: {
    primary: "/vehicles/truck-1.png",
    alt: "/vehicles/truck-2.png",
    label: "Heavy Truck",
    description: "Heavy-duty commercial freight truck",
    icon: "🚛",
    gradient: "from-amber-500/20 to-orange-500/20",
    gradientDark: "from-amber-500/10 to-orange-500/10",
  },
  VAN: {
    primary: "/vehicles/van-1.png",
    alt: "/vehicles/van-2.png",
    label: "Cargo Van",
    description: "Mid-size cargo & passenger van",
    icon: "🚐",
    gradient: "from-blue-500/20 to-cyan-500/20",
    gradientDark: "from-blue-500/10 to-cyan-500/10",
  },
  BIKE: {
    primary: "/vehicles/bike-1.png",
    alt: "/vehicles/bike-2.png",
    label: "Two-Wheeler",
    description: "Motorcycle & scooter for last-mile delivery",
    icon: "🏍️",
    gradient: "from-emerald-500/20 to-teal-500/20",
    gradientDark: "from-emerald-500/10 to-teal-500/10",
  },
  CAR: {
    primary: "/vehicles/car-1.png",
    alt: "/vehicles/car-1.png",
    label: "Car",
    description: "Sedan / hatchback for passenger transport",
    icon: "🚗",
    gradient: "from-violet-500/20 to-purple-500/20",
    gradientDark: "from-violet-500/10 to-purple-500/10",
  },
};

/**
 * Get the vehicle image info by vehicle type name.
 * Falls back to TRUCK if type is unknown.
 */
export function getVehicleImage(typeName?: string | null): VehicleImageInfo | null {
  if (!typeName) return null;
  const upper = typeName.toUpperCase();
  // Try exact match first, then partial match
  if (vehicleImageMap[upper]) return vehicleImageMap[upper];
  for (const [key, value] of Object.entries(vehicleImageMap)) {
    if (upper.includes(key) || key.includes(upper)) return value;
  }
  return null;
}
