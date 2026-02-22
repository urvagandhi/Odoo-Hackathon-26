/**
 * Reusable Logo component for premium branding.
 * Replaces the legacy Truck icon.
 */
import React from "react";

interface LogoProps {
  className?: string;
  size?: "sm" | "md" | "lg" | "xl";
  variant?: "light" | "dark" | "auto";
}

const Logo: React.FC<LogoProps> = ({ className = "", size = "md" }) => {
  const sizeMap = {
    sm: "w-6 h-6",
    md: "w-10 h-10",
    lg: "w-16 h-16",
    xl: "w-24 h-24",
  };

  return (
    <div className={`rounded-xl flex items-center justify-center shadow-lg overflow-hidden bg-white ${sizeMap[size]} ${className}`}>
      <img src="/logo-premium.png" alt="FleetFlow Logo" className="w-full h-full object-cover" />
    </div>
  );
};

export const LogoIcon: React.FC<{ className?: string }> = ({ className = "" }) => (
  <img src="/logo-premium.png" alt="FF" className={`object-cover rounded-sm ${className}`} />
);

export default Logo;
