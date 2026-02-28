/**
 * DriverDashboard — Mobile-first dedicated interface for Users with the DRIVER role.
 * Consumes `meApi` to allow drivers to view their current trip, update duty status,
 * and simulate live GPS location pings.
 */
import { useState, useEffect, useCallback, useRef } from "react";
import { useTranslation } from "react-i18next";
import { motion } from "framer-motion";
import {
  Power, Play, CheckCircle2, Navigation, Clock, Activity, Loader2
} from "lucide-react";
import { meApi } from "../api/client";
import type { Trip, Driver } from "../api/client";
import { useAuth } from "../context/AuthContext";
import { useTheme } from "../context/ThemeContext";
import { useToast } from "../hooks/useToast";

export default function DriverDashboard() {
  const { t } = useTranslation();
  const { isDark } = useTheme();
  const { user } = useAuth();
  const toast = useToast();
  
  const [profile, setProfile] = useState<Driver | null>(null);
  const [trips, setTrips] = useState<Trip[]>([]);
  const [loading, setLoading] = useState(true);
  const [isSimulatingTracking, setIsSimulatingTracking] = useState(false);
  const [lastPing, setLastPing] = useState<Date | null>(null);
  
  const simTimer = useRef<ReturnType<typeof setInterval> | null>(null);

  const loadData = useCallback(async () => {
    try {
      const [p, t] = await Promise.all([
        meApi.getDriverProfile(),
        meApi.getMyTrips()
      ]);
      setProfile(p);
      setTrips(t);
    } catch (err) {
      console.error("Failed to load driver data", err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
    // Poll for trip updates every 30s
    const timer = setInterval(loadData, 30000);
    return () => clearInterval(timer);
  }, [loadData]);

  // Clean up simulator on unmount
  useEffect(() => {
    return () => {
      if (simTimer.current) clearInterval(simTimer.current);
    };
  }, []);

  const handleToggleDuty = async () => {
    if (!profile) return;
    const newStatus = profile.status === "ON_DUTY" ? "OFF_DUTY" : "ON_DUTY";
    try {
      const updated = await meApi.updateStatus(newStatus);
      setProfile(updated);
      toast.success(`You are now ${newStatus.replace('_', ' ').toLowerCase()}.`, { title: t("driverDashboard.statusUpdated") });
    } catch (err) {
      toast.error(t("driverDashboard.statusUpdateFailed"), { title: t("driverDashboard.updateFailed") });
    }
  };

  const toggleGpsSimulation = () => {
    if (isSimulatingTracking) {
      if (simTimer.current) clearInterval(simTimer.current);
      simTimer.current = null;
      setIsSimulatingTracking(false);
    } else {
      setIsSimulatingTracking(true);
      // Fire immediately
      sendPing();
      // Fire every 5 seconds
      simTimer.current = setInterval(sendPing, 5000);
    }
  };

  const sendPing = async () => {
    try {
      // Simulate moving around Mumbai/Pune bounds
      const lat = 18.5 + Math.random() * 0.5;
      const lng = 72.8 + Math.random() * 0.5;
      const speed = 40 + Math.random() * 40;
      const heading = Math.floor(Math.random() * 360);
      
      await meApi.postLocation({ latitude: lat, longitude: lng, speed, heading });
      setLastPing(new Date());
    } catch (err) {
      console.error("Failed to post GPS ping", err);
    }
  };

  if (loading) {
    return (
      <div className="flex-1 flex items-center justify-center min-h-[500px]">
        <Loader2 className="w-8 h-8 animate-spin text-violet-500" />
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center p-6 text-center">
        <div className="w-16 h-16 rounded-full bg-red-100 flex items-center justify-center mb-4">
          <Activity className="w-8 h-8 text-red-600" />
        </div>
        <h2 className={`text-xl font-bold ${isDark ? "text-white" : "text-slate-900"}`}>{t("driverDashboard.accountUnlinked")}</h2>
        <p className={`mt-2 ${isDark ? "text-slate-400" : "text-slate-500"}`}>
          {t("driverDashboard.accountUnlinkedDesc", { email: user?.email })}
        </p>
      </div>
    );
  }

  const activeTrip = trips.find(t => t.status === "DISPATCHED");
  const pastTrips = trips.filter(t => t.status === "COMPLETED" || t.status === "CANCELLED").slice(0, 5);
  
  const isOnDuty = profile.status === "ON_DUTY";

  return (
    <div className="max-w-[800px] mx-auto space-y-6">
      <div className="flex items-start justify-between">
        <div>
          <h1 className={`text-2xl font-bold tracking-tight ${isDark ? "text-slate-100" : "text-slate-900"}`}>
            {t("driverDashboard.welcome", { name: profile.fullName.split(" ")[0] })}
          </h1>
          <p className={`text-sm mt-1 font-medium flex items-center gap-2 ${isDark ? "text-slate-400" : "text-slate-500"}`}>
            <span className={`w-2 h-2 rounded-full ${isOnDuty ? "bg-emerald-500" : "bg-red-500"}`} />
            {isOnDuty ? t("driverDashboard.onDuty") : t("driverDashboard.offDuty")} — {profile.licenseNumber}
          </p>
        </div>
        
        <button 
          onClick={handleToggleDuty}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-bold shadow-sm transition-transform active:scale-95 ${
            isOnDuty 
              ? isDark ? "bg-slate-800 text-slate-300 hover:bg-slate-700" : "bg-white border text-slate-700 hover:bg-slate-50"
              : "bg-emerald-500 text-white hover:bg-emerald-600 shadow-emerald-500/20"
          }`}
        >
          <Power className="w-4 h-4" />
          {isOnDuty ? t("driverDashboard.goOffDuty") : t("driverDashboard.goOnDuty")}
        </button>
      </div>

      {/* GPS Tracking Module */}
      {isOnDuty && (
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} 
          className={`rounded-3xl border p-6 flex flex-col md:flex-row md:items-center justify-between gap-4 ${
            isSimulatingTracking 
              ? isDark ? "bg-blue-900/20 border-blue-500/30" : "bg-blue-50 border-blue-200"
              : isDark ? "bg-slate-900/60 border-slate-700" : "bg-white border-slate-200"
          }`}
        >
          <div className="flex items-center gap-4">
            <div className={`w-12 h-12 rounded-2xl flex items-center justify-center shrink-0 ${
              isSimulatingTracking ? "bg-blue-500 text-white shadow-[0_0_20px_rgba(59,130,246,0.5)]" : "bg-slate-100 dark:bg-slate-800 text-slate-400"
            }`}>
              <Navigation className="w-6 h-6" />
            </div>
            <div>
              <h3 className={`font-bold ${isDark ? "text-slate-100" : "text-slate-900"}`}>{t("driverDashboard.gpsTracker")}</h3>
              <p className={`text-sm ${isSimulatingTracking ? "text-blue-600 dark:text-blue-400 font-medium" : "text-slate-500 dark:text-slate-400"}`}>
                {isSimulatingTracking ? (
                  <span className="flex items-center gap-1.5">
                    <span className="w-1.5 h-1.5 rounded-full bg-blue-500 animate-ping" />
                    {t("driverDashboard.broadcasting")}
                  </span>
                ) : (
                  t("driverDashboard.trackerPaused")
                )}
              </p>
            </div>
          </div>
          
          <div className="flex flex-col items-end gap-2">
            <button
              onClick={toggleGpsSimulation}
              className={`w-full md:w-auto flex items-center justify-center gap-2 px-6 py-2.5 rounded-xl font-bold text-sm transition-all active:scale-95 ${
                isSimulatingTracking
                  ? "bg-red-500 text-white hover:bg-red-600 shadow-lg shadow-red-500/20"
                  : "bg-blue-600 text-white hover:bg-blue-700 shadow-lg shadow-blue-500/20"
              }`}
            >
              {isSimulatingTracking ? <Power className="w-4 h-4" /> : <Play className="w-4 h-4" />}
              {isSimulatingTracking ? t("driverDashboard.stopTracker") : t("driverDashboard.startTracker")}
            </button>
            {lastPing && isSimulatingTracking && (
              <p className="text-[10px] text-slate-500 dark:text-slate-400">
                {t("driverDashboard.lastPing")} {lastPing.toLocaleTimeString()}
              </p>
            )}
          </div>
        </motion.div>
      )}

      {/* Active Trip Card */}
      <div className="space-y-3">
        <h2 className={`font-bold uppercase tracking-wider text-xs ${isDark ? "text-slate-400" : "text-slate-500"}`}>
          {t("driverDashboard.currentAssignment")}
        </h2>
        {activeTrip ? (
          <motion.div initial={{ opacity: 0, scale: 0.98 }} animate={{ opacity: 1, scale: 1 }} 
            className={`rounded-3xl border p-6 relative overflow-hidden shadow-xl ${
              isDark ? "bg-slate-900 border-slate-700 shadow-black/40" : "bg-white border-slate-200 shadow-slate-200/50"
            }`}
          >
            <div className="absolute top-0 left-0 w-2 h-full bg-blue-500" />
            <div className="flex items-start justify-between mb-6">
              <span className="px-3 py-1 bg-blue-100 text-blue-700 dark:bg-blue-500/10 dark:text-blue-400 text-xs font-bold rounded-full uppercase tracking-wide">
                {t("driverDashboard.dispatched")}
              </span>
              <span className={`text-sm font-medium ${isDark ? "text-slate-400" : "text-slate-500"}`}>
                {t("driverDashboard.vehicleLabel")} {activeTrip.vehicle?.licensePlate || "N/A"}
              </span>
            </div>
            
            <div className="relative pl-6 pb-6 border-l-2 border-dashed border-slate-200 dark:border-slate-700 ml-2 space-y-6">
              <div className="relative">
                <div className="absolute -left-[31px] w-4 h-4 rounded-full border-4 border-white dark:border-slate-900 bg-blue-500" />
                <p className={`text-xs font-semibold mb-1 ${isDark ? "text-slate-400" : "text-slate-500"}`}>{t("driverDashboard.origin")}</p>
                <p className={`font-bold text-lg ${isDark ? "text-white" : "text-slate-900"}`}>{activeTrip.origin}</p>
              </div>
              <div className="relative">
                <div className="absolute -left-[31px] w-4 h-4 rounded-full border-4 border-white dark:border-slate-900 bg-emerald-500" />
                <p className={`text-xs font-semibold mb-1 ${isDark ? "text-slate-400" : "text-slate-500"}`}>{t("driverDashboard.destination")}</p>
                <p className={`font-bold text-lg ${isDark ? "text-white" : "text-slate-900"}`}>{activeTrip.destination}</p>
              </div>
            </div>
            
            {(activeTrip.cargoWeight || activeTrip.cargoDescription) && (
              <div className={`mt-4 pt-4 border-t grid grid-cols-2 gap-4 ${isDark ? "border-slate-800" : "border-slate-100"}`}>
                {activeTrip.cargoWeight && (
                  <div>
                    <p className={`text-xs ${isDark ? "text-slate-400" : "text-slate-500"}`}>{t("driverDashboard.cargoWeight")}</p>
                    <p className={`font-semibold ${isDark ? "text-slate-200" : "text-slate-700"}`}>{activeTrip.cargoWeight} kg</p>
                  </div>
                )}
                {activeTrip.cargoDescription && (
                  <div>
                    <p className={`text-xs ${isDark ? "text-slate-400" : "text-slate-500"}`}>{t("driverDashboard.cargoDescription")}</p>
                    <p className={`font-semibold ${isDark ? "text-slate-200" : "text-slate-700"}`}>{activeTrip.cargoDescription}</p>
                  </div>
                )}
              </div>
            )}
          </motion.div>
        ) : (
          <div className={`rounded-3xl border border-dashed flex flex-col items-center justify-center p-8 text-center ${
            isDark ? "border-slate-700 bg-slate-900/50" : "border-slate-300 bg-slate-50"
          }`}>
            <div className="w-16 h-16 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center mb-4 text-slate-400">
              <Clock className="w-8 h-8" />
            </div>
            <h3 className={`font-bold text-lg mb-1 ${isDark ? "text-white" : "text-slate-900"}`}>{t("driverDashboard.noActiveTrips")}</h3>
            <p className="text-sm text-slate-500 dark:text-slate-400">
              {t("driverDashboard.noActiveTripsDesc")}
            </p>
          </div>
        )}
      </div>

      {/* Past Trips */}
      {pastTrips.length > 0 && (
        <div className="space-y-3">
          <h2 className={`font-bold uppercase tracking-wider text-xs ${isDark ? "text-slate-400" : "text-slate-500"}`}>
            {t("driverDashboard.recentHistory")}
          </h2>
          <div className={`rounded-3xl border overflow-hidden ${isDark ? "bg-slate-900 border-slate-700" : "bg-white border-slate-200"}`}>
            {pastTrips.map((trip, idx) => (
              <div key={trip.id} className={`p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 ${
                idx !== pastTrips.length - 1 ? (isDark ? "border-b border-slate-800" : "border-b border-slate-100") : ""
              }`}>
                <div className="flex items-center gap-3">
                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${
                    trip.status === "COMPLETED" 
                      ? isDark ? "bg-emerald-500/10 text-emerald-400" : "bg-emerald-50 text-emerald-600"
                      : isDark ? "bg-red-500/10 text-red-400" : "bg-red-50 text-red-600"
                  }`}>
                    <CheckCircle2 className="w-5 h-5" />
                  </div>
                  <div>
                    <p className={`font-semibold text-sm ${isDark ? "text-slate-200" : "text-slate-800"}`}>
                      {trip.origin.split(",")[0]} → {trip.destination.split(",")[0]}
                    </p>
                    <p className={`text-xs mt-0.5 ${isDark ? "text-slate-500" : "text-slate-400"}`}>
                      {new Date(trip.createdAt).toLocaleDateString()} — {trip.vehicle?.licensePlate || "Unknown Vehicle"}
                    </p>
                  </div>
                </div>
                <span className={`self-start sm:self-auto px-2.5 py-1 text-[10px] font-bold uppercase tracking-wide rounded-full ${
                  trip.status === "COMPLETED" 
                    ? isDark ? "bg-emerald-500/20 text-emerald-400 border border-emerald-500/30" : "bg-emerald-100 text-emerald-700"
                    : isDark ? "bg-red-500/20 text-red-400 border border-red-500/30" : "bg-red-100 text-red-700"
                }`}>
                  {trip.status}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

    </div>
  );
}
