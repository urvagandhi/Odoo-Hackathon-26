/**
 * VehicleTypePreview — animated vehicle type photo card.
 *
 * Features:
 * - Shows vehicle type photo with gradient overlay
 * - Framer Motion scale + fade animation on type change
 * - Type label badge overlay
 * - Subtle hover tilt effect on desktop
 * - Responsive: full-width on mobile, fixed-size in form
 * - Dark mode support
 * - Lazy loading with skeleton placeholder
 */
import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { getVehicleImage } from "../../constants/vehicleImages";
import { useTheme } from "../../context/ThemeContext";

interface VehicleTypePreviewProps {
  /** Vehicle type name from the database (e.g. "Truck", "TRUCK", "Van") */
  typeName?: string | null;
  /** Size variant */
  size?: "sm" | "md" | "lg";
  /** Show description text below image */
  showDescription?: boolean;
  /** Custom class names */
  className?: string;
}

/**
 * Renders an animated vehicle photo card with gradient background, responsive sizing, optional description, and an optional alternate-image toggle.
 *
 * The component looks up vehicle media by `typeName`, shows a gradient-backed lazy image with a loading skeleton and badge (icon + label), and optionally displays descriptive text beneath the image. When no image info exists for `typeName`, nothing is rendered.
 *
 * @param typeName - Vehicle type identifier; may be `null` or `undefined`, in which case the component renders nothing.
 * @param size - Visual size variant: `"sm" | "md" | "lg"` (affects card height, border radius, and whether the alt-image toggle is shown).
 * @param showDescription - When `true`, renders the vehicle description below the image for non-`"sm"` sizes.
 * @param className - Additional CSS classes applied to the root card element.
 * @returns A JSX element displaying the vehicle type preview, or `null` if no image information is available for `typeName`.
 */
export function VehicleTypePreview({
  typeName,
  size = "md",
  showDescription = true,
  className = "",
}: VehicleTypePreviewProps) {
  const { isDark } = useTheme();
  const [imageLoaded, setImageLoaded] = useState(false);
  const [useAlt, setUseAlt] = useState(false);

  const info = getVehicleImage(typeName);

  if (!info) return null;

  const sizeClasses = {
    sm: "h-16 rounded-lg",
    md: "h-36 sm:h-44 rounded-2xl",
    lg: "h-48 sm:h-56 rounded-2xl",
  };

  const imgSrc = useAlt ? info.alt : info.primary;
  const gradient = isDark ? info.gradientDark : info.gradient;

  return (
    <AnimatePresence mode="wait">
      <motion.div
        key={typeName}
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        transition={{ duration: 0.3, ease: [0.4, 0, 0.2, 1] }}
        className={`group relative overflow-hidden ${sizeClasses[size]} ${className}`}
      >
        {/* Gradient background (shows while loading) */}
        <div
          className={`absolute inset-0 bg-gradient-to-br ${gradient} ${
            isDark ? "bg-neutral-800" : "bg-neutral-100"
          }`}
        />

        {/* Skeleton shimmer while loading */}
        {!imageLoaded && (
          <div className="absolute inset-0 overflow-hidden">
            <div className="absolute inset-0 -translate-x-full animate-shimmer bg-gradient-to-r from-transparent via-white/20 to-transparent" />
          </div>
        )}

        {/* Vehicle image */}
        <img
          src={imgSrc}
          alt={info.label}
          loading="lazy"
          onLoad={() => setImageLoaded(true)}
          onError={() => {
            if (!useAlt) setUseAlt(true);
          }}
          className={`absolute inset-0 w-full h-full object-cover transition-all duration-500 group-hover:scale-105 ${
            imageLoaded ? "opacity-100" : "opacity-0"
          }`}
        />

        {/* Gradient overlay for text readability */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />

        {/* Type badge */}
        <div className="absolute bottom-2.5 left-2.5 right-2.5 flex items-end justify-between gap-2">
          <div className="flex items-center gap-1.5">
            <span className="text-sm">{info.icon}</span>
            <span className="text-xs font-bold text-white drop-shadow-md uppercase tracking-wider">
              {info.label}
            </span>
          </div>

          {/* Swap image button (only for md/lg) */}
          {size !== "sm" && info.primary !== info.alt && (
            <button
              type="button"
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                setUseAlt((v) => !v);
                setImageLoaded(false);
              }}
              className="px-2 py-1 rounded-md bg-white/20 backdrop-blur-sm text-white text-[10px] font-semibold hover:bg-white/30 transition-colors"
            >
              Alt View
            </button>
          )}
        </div>
      </motion.div>

      {/* Description (below image) */}
      {showDescription && size !== "sm" && (
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.15 }}
          className={`text-xs mt-1.5 ${
            isDark ? "text-neutral-400" : "text-neutral-500"
          }`}
        >
          {info.description}
        </motion.p>
      )}
    </AnimatePresence>
  );
}

/**
 * Render a compact 8×8 vehicle thumbnail with a gradient background and optional image.
 *
 * Renders a rounded square that uses the vehicle type's gradient and primary image when available;
 * otherwise renders a neutral placeholder with a car emoji. Intended for inline use in tables and lists.
 *
 * @param typeName - Vehicle type identifier used to look up image, label, icon, and gradient; may be `undefined` or `null`
 * @param className - Additional CSS classes to apply to the container
 */
export function VehicleTypeThumbnail({
  typeName,
  className = "",
}: {
  typeName?: string | null;
  className?: string;
}) {
  const { isDark } = useTheme();
  const info = getVehicleImage(typeName);

  if (!info) {
    return (
      <div
        className={`w-8 h-8 rounded-lg flex items-center justify-center ${
          isDark ? "bg-neutral-700" : "bg-neutral-100"
        } ${className}`}
      >
        <span className="text-xs">🚗</span>
      </div>
    );
  }

  const gradient = isDark ? info.gradientDark : info.gradient;

  return (
    <div
      className={`w-8 h-8 rounded-lg overflow-hidden relative flex items-center justify-center bg-gradient-to-br ${gradient} ${className}`}
    >
      <img
        src={info.primary}
        alt={info.label}
        loading="lazy"
        className="absolute inset-0 w-full h-full object-cover"
      />
      <div className="absolute inset-0 bg-black/10" />
    </div>
  );
}
