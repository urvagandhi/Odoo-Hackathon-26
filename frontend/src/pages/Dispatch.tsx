/**
 * Dispatch — Trip Dispatcher & Management
 * Trip creation, lifecycle (DRAFT → DISPATCHED → COMPLETED/CANCELLED)
 * Embedded Leaflet map with OpenRouteService routing for shortest path
 */
import { useState, useEffect } from "react";
import { useTranslation } from "react-i18next";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { motion, AnimatePresence } from "framer-motion";
import {
    Plus, X, Route, MapPin, Truck, User, Clock, CheckCircle2,
    XCircle, AlertTriangle, Search, ChevronRight,
} from "lucide-react";
import { MapContainer, TileLayer, Marker, Popup, Polyline, useMap } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import { fleetApi, hrApi, dispatchApi, type Trip } from "../api/client";
import { useTheme } from "../context/ThemeContext";
import { useToast } from "../hooks/useToast";
import { Select } from "../components/ui/Select";
import {
    AlertDialog,
    AlertDialogContent,
    AlertDialogHeader,
    AlertDialogTitle,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogCancel,
    AlertDialogAction,
} from "../components/ui/AlertDialog";
import { TripCompleteModal } from "../components/forms/TripCompleteModal";
import { TripCancelDialog } from "../components/forms/TripCancelDialog";

// Custom CSS-only markers — immune to Tailwind preflight img resets
const originIcon = L.divIcon({
    className: "",
    html: `<div style="position:relative;width:32px;height:32px">
        <div style="position:absolute;inset:0;border-radius:50%;background:#4ADE80;opacity:0.25;animation:ping 1.5s cubic-bezier(0,0,0.2,1) infinite"></div>
        <div style="position:absolute;top:4px;left:4px;width:24px;height:24px;border-radius:50%;background:#4ADE80;border:3px solid #fff;box-shadow:0 2px 8px rgba(0,0,0,0.4)"></div>
    </div>`,
    iconSize: [32, 32],
    iconAnchor: [16, 16],
    popupAnchor: [0, -16],
});
const destIcon = L.divIcon({
    className: "",
    html: `<div style="position:relative;width:32px;height:32px">
        <div style="position:absolute;inset:0;border-radius:50%;background:#F87171;opacity:0.25;animation:ping 1.5s cubic-bezier(0,0,0.2,1) infinite"></div>
        <div style="position:absolute;top:4px;left:4px;width:24px;height:24px;border-radius:50%;background:#F87171;border:3px solid #fff;box-shadow:0 2px 8px rgba(0,0,0,0.4)"></div>
    </div>`,
    iconSize: [32, 32],
    iconAnchor: [16, 16],
    popupAnchor: [0, -16],
});

const STATUS_CONFIG: Record<string, { labelKey: string; className: string; darkClassName: string; icon: React.ElementType; routeColor: string }> = {
    DRAFT: { labelKey: "dispatch.status.DRAFT", className: "bg-neutral-100 text-neutral-600", darkClassName: "bg-[#1E2B22] text-[#B0B8A8]", icon: Clock, routeColor: "#FBBF24" },
    DISPATCHED: { labelKey: "dispatch.status.DISPATCHED", className: "bg-emerald-100 text-emerald-700", darkClassName: "bg-[#162822] text-[#6EEAA0]", icon: Route, routeColor: "#3B82F6" },
    COMPLETED: { labelKey: "dispatch.status.COMPLETED", className: "bg-emerald-100 text-emerald-700", darkClassName: "bg-[#14332A] text-[#86EFAC]", icon: CheckCircle2, routeColor: "#4ADE80" },
    CANCELLED: { labelKey: "dispatch.status.CANCELLED", className: "bg-red-100 text-red-600", darkClassName: "bg-[#2D1518] text-[#FCA5A5]", icon: XCircle, routeColor: "#EF4444" },
};

const FIELD = "block w-full rounded-xl border px-3.5 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 transition-colors";

const geocodeCache = new Map<string, [number, number] | null>();
const routeCache = new Map<string, [number, number][]>();

// Geocode a location string using Nominatim
async function geocode(location: string): Promise<[number, number] | null> {
    const cached = geocodeCache.get(location);
    if (cached) return cached;               // only cache successes
    if (cached === undefined) { /* not cached yet */ }
    try {
        const res = await fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(location)}&limit=1&email=test@fleetflow.com`);
        if (!res.ok) { console.warn('[geocode] HTTP', res.status, location); return null; }
        const results = await res.json();
        if (results.length > 0) {
            const coord: [number, number] = [parseFloat(results[0].lat), parseFloat(results[0].lon)];
            geocodeCache.set(location, coord);
            return coord;
        }
        console.warn('[geocode] No results for:', location);
    } catch (err) {
        console.warn('[geocode] Error:', location, err);
    }
    // Do NOT cache failures — allow retries on next click
    return null;
}

// Fetch route from OpenRouteService (free tier, no key needed for basic)
async function getRoute(origin: [number, number], dest: [number, number]): Promise<[number, number][]> {
    const key = `${origin[0]},${origin[1]}-${dest[0]},${dest[1]}`;
    if (routeCache.has(key)) return routeCache.get(key) || [];
    
    // Try OSRM demo routing with full geometry
    try {
        const url = `https://router.project-osrm.org/route/v1/driving/${origin[1]},${origin[0]};${dest[1]},${dest[0]}?overview=full&geometries=geojson`;
        const res = await fetch(url);
        if (!res.ok) throw new Error(`OSRM HTTP ${res.status}`);
        const json = await res.json();
        if (json.routes && json.routes[0]) {
            const coords = json.routes[0].geometry.coordinates.map(([lng, lat]: [number, number]) => [lat, lng] as [number, number]);
            routeCache.set(key, coords);
            return coords;
        }
    } catch (err) {
        console.warn('[getRoute] OSRM failed, using straight line:', err);
    }
    // Fallback: straight line (do NOT cache — allow API retry later)
    return [origin, dest];
}


// Auto-fit map to route bounds + fix tile rendering on resize
function MapBounds({ bounds }: { bounds: [[number, number], [number, number]] | null }) {
    const map = useMap();
    // Invalidate size after mount to fix tiles in flex containers
    useEffect(() => {
        const timer = setTimeout(() => map.invalidateSize(), 200);
        return () => clearTimeout(timer);
    }, [map]);
    useEffect(() => {
        if (bounds) {
            map.invalidateSize();
            map.fitBounds(bounds, { padding: [40, 40], maxZoom: 14 });
        }
    }, [bounds, map]);
    return null;
}

export default function Dispatch() {
    const { isDark } = useTheme();
    const { t } = useTranslation();
    const toast = useToast();
    const queryClient = useQueryClient();
    const [showModal, setShowModal] = useState(false);
    const [selectedTrip, setSelectedTrip] = useState<Trip | null>(null);
    const [form, setForm] = useState<{
        vehicleId: string; driverId: string; origin: string; destination: string;
        distanceEstimated: number; cargoWeight: number; cargoDescription: string;
        clientName: string; revenue: number;
    }>({ vehicleId: "", driverId: "", origin: "", destination: "", distanceEstimated: 0, cargoWeight: 0, cargoDescription: "", clientName: "", revenue: 0 });
    const [formError, setFormError] = useState("");
    const [transitioning, setTransitioning] = useState<{ id: string, status: string } | null>(null);
    const [completeTripId, setCompleteTripId] = useState<string | null>(null);
    const [cancelTripId, setCancelTripId] = useState<string | null>(null);

    // Map state
    const [routeCoords, setRouteCoords] = useState<[number, number][]>([]);
    const [originCoord, setOriginCoord] = useState<[number, number] | null>(null);
    const [destCoord, setDestCoord] = useState<[number, number] | null>(null);
    const [mapBounds, setMapBounds] = useState<[[number, number], [number, number]] | null>(null);
    const [mapLoading, setMapLoading] = useState(false);
    const [mobileView, setMobileView] = useState<'list' | 'detail'>('list');

    /* ── Fetch Data using React Query ───────────────── */
    const { data: tripsData, isLoading: loadingTrips } = useQuery({
        queryKey: ['trips'],
        queryFn: async () => {
            const res = await dispatchApi.listTrips({ limit: 100 });
            return res.data ?? [];
        }
    });

    const { data: vehiclesData } = useQuery({
        queryKey: ['vehicles', 'available'],
        queryFn: async () => {
            const res = await fleetApi.listVehicles({ status: "AVAILABLE", limit: 100 });
            return res.data ?? [];
        }
    });

    const { data: driversData } = useQuery({
        queryKey: ['drivers', 'on_duty'],
        queryFn: async () => {
            const res = await hrApi.listDrivers({ status: "ON_DUTY", limit: 100 });
            return res.data ?? [];
        }
    });

    const trips = tripsData ?? [];
    const vehicles = vehiclesData ?? [];
    const drivers = driversData ?? [];
    const loading = loadingTrips;

    // Load route on trip select
    useEffect(() => {
        if (!selectedTrip) { setRouteCoords([]); setOriginCoord(null); setDestCoord(null); setMapBounds(null); return; }
        const loadRoute = async () => {
            setMapLoading(true);
            const [oc, dc] = await Promise.all([
                geocode(selectedTrip.origin),
                geocode(selectedTrip.destination),
            ]);
            if (oc && dc) {
                setOriginCoord(oc);
                setDestCoord(dc);
                const coords = await getRoute(oc, dc);
                setRouteCoords(coords);
                // Set bounds AFTER route coords so polyline renders at correct zoom
                setMapBounds([oc, dc]);
            } else {
                console.warn('[Dispatch] Geocoding failed — origin:', oc, 'dest:', dc);
            }
            setMapLoading(false);
        };
        loadRoute();
    }, [selectedTrip]);

    const [search, setSearch] = useState("");
    const [statusFilter, setStatusFilter] = useState("");

    const filtered = trips.filter(tr =>
        (!statusFilter || tr.status === statusFilter) &&
        (!search || tr.origin.toLowerCase().includes(search.toLowerCase()) ||
            tr.destination.toLowerCase().includes(search.toLowerCase()) ||
            tr.driver?.fullName?.toLowerCase().includes(search.toLowerCase()))
    );

    const createTripMutation = useMutation({
        mutationFn: (data: typeof form) => dispatchApi.createTrip({ ...data, distanceEstimated: data.distanceEstimated }),
        onSuccess: () => {
            setShowModal(false);
            setForm({ vehicleId: "", driverId: "", origin: "", destination: "", distanceEstimated: 0, cargoWeight: 0, cargoDescription: "", clientName: "", revenue: 0 });
            toast.success(t("dispatch.toast.created"));
        },
        onError: (err: any) => {
            setFormError(err?.response?.data?.message ?? "Failed to create trip");
        },
        onSettled: () => {
            queryClient.invalidateQueries({ queryKey: ['trips'] });
            queryClient.invalidateQueries({ queryKey: ['vehicles', 'available'] });
            queryClient.invalidateQueries({ queryKey: ['drivers', 'on_duty'] });
        }
    });

    const handleCreate = (e: React.FormEvent) => {
        e.preventDefault();
        setFormError("");
        const selectedVehicle = vehicles.find(v => v.id === form.vehicleId);
        if (selectedVehicle && form.cargoWeight > (Number(selectedVehicle.capacityWeight) || Infinity)) {
            setFormError(`Cargo weight (${form.cargoWeight} kg) exceeds vehicle capacity (${selectedVehicle.capacityWeight} kg)`);
            return;
        }
        createTripMutation.mutate(form);
    };

    const transitionMutation = useMutation({
        mutationFn: ({ tripId, status }: { tripId: string, status: "DISPATCHED" | "COMPLETED" | "CANCELLED" }) =>
            dispatchApi.transitionStatus(tripId, { status }),
        onMutate: async ({ tripId, status }) => {
            await queryClient.cancelQueries({ queryKey: ['trips'] });
            const previous = queryClient.getQueryData<Trip[]>(['trips']);
            queryClient.setQueryData<Trip[]>(['trips'], old =>
                (old ?? []).map(t => t.id === tripId ? { ...t, status } as Trip : t)
            );
            if (selectedTrip?.id === tripId) {
                setSelectedTrip(prev => prev ? { ...prev, status } as Trip : null);
            }
            setTransitioning(null);
            return { previous };
        },
        onSuccess: (_data, { status }) => {
            toast.success(t("dispatch.toast.transitioned", { status: status.toLowerCase() }));
        },
        onError: (_err, _vars, context) => {
            if (context?.previous) queryClient.setQueryData(['trips'], context.previous);
            toast.error(t("dispatch.toast.transitionFailed"));
        },
        onSettled: async (_data, _err, { tripId }) => {
            queryClient.invalidateQueries({ queryKey: ['trips'] });
            if (selectedTrip?.id === tripId) {
                const updated = await dispatchApi.getTrip(tripId);
                setSelectedTrip(updated);
            }
        }
    });

    const handleTransition = (trip: Trip, status: "DISPATCHED" | "COMPLETED" | "CANCELLED") => {
        transitionMutation.mutate({ tripId: trip.id, status });
    };

    const inputClass = `${FIELD} ${isDark ? "bg-[#1E2B22] border-[#1E2B22] text-[#E4E6DE] placeholder-[#4A5C4A]" : "bg-white border-neutral-200 text-neutral-900 placeholder-neutral-400"}`;



    return (
        <div className="max-w-[1600px] mx-auto h-full">
            <div className="flex items-center justify-between mb-5">
                <div>
                    <h1 className={`text-2xl font-bold ${isDark ? "text-[#E4E6DE]" : "text-neutral-900"}`}>{t("dispatch.title")}</h1>
                    <p className={`text-sm ${isDark ? "text-[#6B7C6B]" : "text-neutral-500"}`}>{t("dispatch.tripsTotal", { count: trips.length })}</p>
                </div>
                <button onClick={() => { setFormError(""); setShowModal(true); }} className={`flex items-center gap-2 px-4 py-2 rounded-[14px] text-sm font-semibold transition-all active:scale-[0.97] ${isDark ? "bg-gradient-to-r from-[#22C55E] to-[#16A34A] shadow-lg shadow-emerald-500/20 text-white" : "bg-emerald-500 text-white hover:bg-emerald-600"}`}>
                    <Plus className="w-4 h-4" /> {t("dispatch.newTrip")}
                </button>
            </div>

            {/* Mobile view toggle */}
            <div className={`flex lg:hidden mb-3 gap-1 p-1 rounded-[14px] ${isDark ? 'bg-[#111A15]' : 'bg-neutral-100'}`}>
                <button onClick={() => setMobileView('list')} className={`flex-1 flex items-center justify-center gap-2 px-3 py-2 rounded-lg text-sm font-semibold transition-colors ${mobileView === 'list' ? (isDark ? 'bg-[#1E2B22] text-emerald-400 shadow-sm' : 'bg-white text-emerald-600 shadow-sm') : (isDark ? 'text-[#4A5C4A]' : 'text-neutral-500')}`}>
                    <Route className="w-4 h-4" /> Trips
                </button>
                <button onClick={() => setMobileView('detail')} className={`flex-1 flex items-center justify-center gap-2 px-3 py-2 rounded-lg text-sm font-semibold transition-colors ${mobileView === 'detail' ? (isDark ? 'bg-[#1E2B22] text-emerald-400 shadow-sm' : 'bg-white text-emerald-600 shadow-sm') : (isDark ? 'text-[#4A5C4A]' : 'text-neutral-500')}`}>
                    <MapPin className="w-4 h-4" /> Map & Detail
                </button>
            </div>

            <div className="flex flex-col lg:flex-row gap-5 lg:h-[calc(100vh-220px)] lg:min-h-[600px]">
                {/* LEFT: Trip List */}
                <div className={`${mobileView === 'detail' ? 'hidden lg:flex' : 'flex'} w-full lg:w-[380px] shrink-0 flex-col rounded-[14px] border overflow-hidden max-h-[50vh] lg:max-h-none ${isDark ? "bg-[#111A15] border-[#1E2B22]" : "bg-white border-neutral-200 shadow-sm"}`}>
                    {/* Search & filter */}
                    <div className={`p-3 space-y-2 border-b ${isDark ? "border-[#1E2B22]" : "border-neutral-100"}`}>
                        <div className="relative">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-400" />
                            <input value={search} onChange={e => setSearch(e.target.value)} placeholder={t("dispatch.searchPlaceholder")} className={`${inputClass} pl-9`} />
                        </div>
                        <div className="flex gap-1 flex-wrap">
                            {["", "DRAFT", "DISPATCHED", "COMPLETED", "CANCELLED"].map(s => (
                                <button key={s} onClick={() => setStatusFilter(s)}
                                    className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition-colors ${statusFilter === s ? "bg-emerald-500 text-white" : isDark ? "text-[#6B7C6B] hover:bg-[#1E2B22]" : "text-neutral-500 hover:bg-neutral-100"}`}
                                >
                                    {s || t("common.all")}
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Trip list */}
                    <div className="flex-1 overflow-y-auto">
                        {loading ? (
                            <div className="flex flex-col">
                                {[1, 2, 3, 4, 5].map(i => (
                                    <div key={i} className={`w-full text-left p-4 border-b ${isDark ? "border-[#1E2B22]" : "border-neutral-50"}`}>
                                        <div className="flex items-start justify-between mb-2">
                                            <div className="flex items-start gap-2 w-2/3">
                                                <div className={`w-4 h-4 rounded-full mt-0.5 shrink-0 ${isDark ? "bg-[#1E2B22]" : "bg-neutral-200"}`} />
                                                <div className={`h-4 rounded overflow-hidden relative w-full ${isDark ? "bg-[#1E2B22]" : "bg-neutral-200"}`}>
                                                    <div className="absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent dark:via-white/5 via-white/20 to-transparent animate-shimmer" />
                                                </div>
                                            </div>
                                            <div className={`w-16 h-4 rounded overflow-hidden relative ${isDark ? "bg-[#1E2B22]" : "bg-neutral-200"}`}>
                                                <div className="absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent dark:via-white/5 via-white/20 to-transparent animate-shimmer" />
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-4 mt-3">
                                            <div className={`w-20 h-3 rounded overflow-hidden relative ${isDark ? "bg-[#1E2B22]" : "bg-neutral-200"}`}>
                                                <div className="absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent dark:via-white/5 via-white/20 to-transparent animate-shimmer" />
                                            </div>
                                            <div className={`w-24 h-3 rounded overflow-hidden relative ${isDark ? "bg-[#1E2B22]" : "bg-neutral-200"}`}>
                                                <div className="absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent dark:via-white/5 via-white/20 to-transparent animate-shimmer" />
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        ) : filtered.length === 0 ? (
                            <div className="flex flex-col items-center justify-center h-32 text-neutral-400">
                                <Route className="w-8 h-8 mb-2 opacity-30" />
                                <p className="text-sm">{t("dispatch.noTrips")}</p>
                            </div>
                        ) : filtered.map(trip => {
                            const cfg = STATUS_CONFIG[trip.status];
                            const isSelected = selectedTrip?.id === trip.id;
                            return (
                                <button key={trip.id} onClick={() => setSelectedTrip(prev => prev?.id === trip.id ? null : trip)}
                                    className={`w-full text-left p-4 border-b transition-all ${isDark ? "border-[#1E2B22] hover:bg-[#182420]" : "border-neutral-50 hover:bg-neutral-50"
                                        } ${isSelected ? (isDark ? "bg-emerald-500/10 border-l-2 border-l-emerald-500" : "bg-emerald-50 border-l-2 border-l-emerald-500") : ""}`}
                                >
                                    <div className="flex items-start justify-between mb-1.5">
                                        <div className="flex items-start gap-2">
                                            <MapPin className="w-4 h-4 text-emerald-500 mt-0.5 shrink-0" />
                                            <div>
                                                <p className={`text-sm font-bold leading-tight ${isDark ? "text-[#E4E6DE]" : "text-neutral-900"}`}>{trip.origin}</p>
                                                <p className={`text-xs ${isDark ? "text-[#6B7C6B]" : "text-neutral-500"}`}>→ {trip.destination}</p>
                                            </div>
                                        </div>
                                        <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${isDark ? cfg?.darkClassName : cfg?.className}`}>{t(cfg?.labelKey ?? "")}</span>
                                    </div>
                                    <div className={`flex items-center gap-3 text-xs ${isDark ? "text-[#6B7C6B]" : "text-neutral-500"}`}>
                                        <span className="flex items-center gap-1"><Truck className="w-3 h-3" />{trip.vehicle?.licensePlate ?? "—"}</span>
                                        <span className="flex items-center gap-1"><User className="w-3 h-3" />{trip.driver?.fullName?.split(" ")[0] ?? "—"}</span>
                                        {trip.distanceEstimated > 0 && <span>{trip.distanceEstimated} km</span>}
                                        <ChevronRight className="ml-auto w-3.5 h-3.5" />
                                    </div>
                                </button>
                            );
                        })}
                    </div>
                </div>

                {/* RIGHT: Detail + Map */}
                <div className={`flex-1 flex flex-col gap-5 ${mobileView === 'list' ? 'hidden lg:flex' : 'flex'}`}>
                    {selectedTrip ? (
                        <>
                            {/* Trip detail card */}
                            <div className={`rounded-[14px] border p-5 ${isDark ? "bg-[#111A15] border-[#1E2B22]" : "bg-white border-neutral-200 shadow-sm"}`}>
                                <div className="flex items-start justify-between mb-3">
                                    <div>
                                        <span className={`text-xs font-semibold px-2.5 py-1 rounded-full ${isDark ? STATUS_CONFIG[selectedTrip.status]?.darkClassName : STATUS_CONFIG[selectedTrip.status]?.className}`}>
                                            {t(STATUS_CONFIG[selectedTrip.status]?.labelKey ?? "")}
                                        </span>
                                        <h2 className={`text-base font-bold mt-1.5 ${isDark ? "text-[#E4E6DE]" : "text-neutral-900"}`}>
                                            {selectedTrip.origin} → {selectedTrip.destination}
                                        </h2>
                                        {selectedTrip.clientName && (
                                            <p className={`text-xs mt-0.5 ${isDark ? "text-[#6B7C6B]" : "text-neutral-500"}`}>
                                                {t("dispatch.detail.client")} {selectedTrip.clientName}
                                            </p>
                                        )}
                                    </div>
                                    <div className="flex items-center gap-2">
                                        {selectedTrip.status === "DRAFT" && (
                                            <AlertDialog
                                                open={transitioning?.id === selectedTrip.id && transitioning?.status === "DISPATCHED"}
                                                onOpenChange={(open) => !open && setTransitioning(null)}
                                            >
                                                <button onClick={() => setTransitioning({ id: selectedTrip.id, status: "DISPATCHED" })}
                                                    className="px-3 py-1.5 rounded-xl text-xs font-semibold bg-emerald-500 text-white hover:bg-emerald-600 transition-colors shadow-sm">
                                                    {t("dispatch.actions.dispatch")}
                                                </button>
                                                <AlertDialogContent>
                                                    <AlertDialogHeader>
                                                        <AlertDialogTitle>{t("dispatch.dispatchTrip")}</AlertDialogTitle>
                                                        <AlertDialogDescription>
                                                            {t("dispatch.dispatchTripDesc")}
                                                        </AlertDialogDescription>
                                                    </AlertDialogHeader>
                                                    <AlertDialogFooter>
                                                        <AlertDialogCancel>{t("common.cancel")}</AlertDialogCancel>
                                                        <AlertDialogAction onClick={() => handleTransition(selectedTrip, "DISPATCHED")}>
                                                            {t("dispatch.actions.dispatch")}
                                                        </AlertDialogAction>
                                                    </AlertDialogFooter>
                                                </AlertDialogContent>
                                            </AlertDialog>
                                        )}
                                        {selectedTrip.status === "DISPATCHED" && (
                                            <button onClick={() => setCompleteTripId(selectedTrip.id)}
                                                className="px-3 py-1.5 rounded-xl text-xs font-semibold bg-emerald-500 text-white hover:bg-emerald-600 transition-colors shadow-sm">
                                                {t("dispatch.actions.complete")}
                                            </button>
                                        )}
                                        {["DRAFT", "DISPATCHED"].includes(selectedTrip.status) && (
                                            <button onClick={() => setCancelTripId(selectedTrip.id)}
                                                className="px-3 py-1.5 rounded-xl text-xs font-semibold bg-red-50 text-red-600 hover:bg-red-100 border border-red-200 transition-colors">
                                                {t("dispatch.actions.cancel")}
                                            </button>
                                        )}
                                    </div>
                                </div>
                                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-sm">
                                    <InfoBox label={t("dispatch.detail.vehicle")} value={`${selectedTrip.vehicle?.year ?? ""} ${selectedTrip.vehicle?.make ?? "—"} ${selectedTrip.vehicle?.model ?? ""}`} sub={selectedTrip.vehicle?.licensePlate} isDark={isDark} />
                                    <InfoBox label={t("dispatch.detail.driver")} value={selectedTrip.driver?.fullName ?? "—"} sub={selectedTrip.driver?.licenseNumber} isDark={isDark} />
                                    <InfoBox label={t("dispatch.detail.cargo")} value={selectedTrip.cargoWeight ? `${selectedTrip.cargoWeight} kg` : "—"} sub={selectedTrip.cargoDescription} isDark={isDark} />
                                    {selectedTrip.distanceEstimated > 0 && <InfoBox label={t("dispatch.detail.distance")} value={`${selectedTrip.distanceEstimated} km`} isDark={isDark} />}
                                    {selectedTrip.revenue && <InfoBox label={t("dispatch.detail.revenue")} value={`₹${Number(selectedTrip.revenue).toLocaleString()}`} isDark={isDark} />}
                                    {selectedTrip.dispatchTime && <InfoBox label={t("dispatch.detail.dispatched")} value={new Date(selectedTrip.dispatchTime).toLocaleString("en-IN")} isDark={isDark} />}
                                </div>
                            </div>

                            {/* Leaflet Map */}
                            <div style={{ zIndex: 0, position: "relative" }} className={`flex-1 rounded-[14px] border overflow-clip relative min-h-[300px] ${isDark ? "border-[#1E2B22]" : "border-neutral-200 shadow-sm"}`}>
                                {mapLoading && (
                                    <div className={`absolute inset-0 z-10 flex items-center justify-center backdrop-blur-sm ${isDark ? "bg-[#090D0B]/80" : "bg-white/80"}`}>
                                        <div className="text-sm text-neutral-500 flex items-center gap-2">
                                            <Route className="w-4 h-4 animate-pulse text-emerald-500" /> {t("dispatch.map.calculatingRoute")}
                                        </div>
                                    </div>
                                )}
                                <MapContainer center={[20.5937, 78.9629]} zoom={5} className="w-full h-full" style={{ minHeight: "300px" }}>
                                    <TileLayer
                                        url={isDark ? "https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png" : "https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"}
                                        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>, &copy; <a href="https://carto.com/attributions">CARTO</a>'
                                    />
                                    {originCoord && (
                                        <Marker position={originCoord} icon={originIcon}>
                                            <Popup><b>Origin:</b> {selectedTrip.origin}</Popup>
                                        </Marker>
                                    )}
                                    {destCoord && (
                                        <Marker position={destCoord} icon={destIcon}>
                                            <Popup><b>Destination:</b> {selectedTrip.destination}</Popup>
                                        </Marker>
                                    )}
                                    {routeCoords.length > 1 && (
                                        <Polyline
                                            key={`${selectedTrip.id}-${selectedTrip.status}`}
                                            positions={routeCoords}
                                            color={STATUS_CONFIG[selectedTrip.status]?.routeColor ?? "#4ADE80"}
                                            weight={5}
                                            opacity={0.85}
                                            dashArray={selectedTrip.status === "CANCELLED" ? "10 8" : undefined}
                                        />
                                    )}
                                    <MapBounds bounds={mapBounds} />
                                </MapContainer>
                            </div>
                        </>
                    ) : (
                        <div className={`flex-1 rounded-[14px] border flex flex-col items-center justify-center gap-3 ${isDark ? "bg-[#111A15] border-[#1E2B22]" : "bg-white border-neutral-200 shadow-sm"}`}>
                            <div className="w-16 h-16 rounded-2xl bg-emerald-500/10 flex items-center justify-center">
                                <Route className="w-8 h-8 text-emerald-500" />
                            </div>
                            <div className="text-center">
                                <p className={`font-semibold ${isDark ? "text-[#E4E6DE]" : "text-neutral-900"}`}>{t("dispatch.map.selectTrip")}</p>
                                <p className={`text-sm mt-1 ${isDark ? "text-[#6B7C6B]" : "text-neutral-500"}`}>{t("dispatch.map.selectTripDesc")}</p>
                            </div>
                        </div>
                    )}
                </div>
            </div>

            {/* Create Trip Modal */}
            <AnimatePresence>
                {showModal && (
                    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                        className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4"
                        onClick={e => e.target === e.currentTarget && setShowModal(false)}
                    >
                        <motion.div initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.95, opacity: 0 }}
                            className={`w-full max-w-2xl rounded-3xl border p-6 shadow-2xl max-h-[90vh] overflow-y-auto ${isDark ? "bg-[#111A15] border-[#1E2B22]" : "bg-white"}`}
                        >
                            <div className="flex items-center justify-between mb-5">
                                <h2 className={`text-lg font-bold ${isDark ? "text-[#E4E6DE]" : "text-neutral-900"}`}>{t("dispatch.createTrip")}</h2>
                                <button onClick={() => setShowModal(false)} className="p-1.5 rounded-lg text-neutral-400 hover:bg-neutral-100 dark:hover:bg-[#1E2B22] transition-colors"><X className="w-4 h-4" /></button>
                            </div>

                            {formError && <div className={`mb-4 text-sm rounded-xl p-3 flex items-center gap-2 ${isDark ? "text-[#FCA5A5] bg-[#2D1518]/30 border border-[#2D1518]" : "text-red-600 bg-red-50 border border-red-100"}`}><AlertTriangle className="w-4 h-4 shrink-0" />{formError}</div>}

                            <form onSubmit={handleCreate} className="space-y-4">
                                {/* Step 1: Location FIRST — decide where before what vehicle */}
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                    <div>
                                        <label className={`block text-xs font-semibold mb-1.5 ${isDark ? "text-[#B0B8A8]" : "text-neutral-700"}`}>{t("dispatch.form.origin")}</label>
                                        <input required value={form.origin} onChange={e => setForm(f => ({ ...f, origin: e.target.value }))} className={inputClass} placeholder={t("dispatch.form.originPlaceholder")} />
                                    </div>
                                    <div>
                                        <label className={`block text-xs font-semibold mb-1.5 ${isDark ? "text-[#B0B8A8]" : "text-neutral-700"}`}>{t("dispatch.form.destination")}</label>
                                        <input required value={form.destination} onChange={e => setForm(f => ({ ...f, destination: e.target.value }))} className={inputClass} placeholder={t("dispatch.form.destinationPlaceholder")} />
                                    </div>
                                </div>
                                {/* Step 2: Vehicle (name first, then plate) + Driver */}
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                    <div>
                                        <label className={`block text-xs font-semibold mb-1.5 ${isDark ? "text-[#B0B8A8]" : "text-neutral-700"}`}>{t("dispatch.form.vehicle")}</label>
                                        <Select required value={form.vehicleId} onChange={e => setForm(f => ({ ...f, vehicleId: e.target.value }))} className={inputClass}>
                                            <option value="">{t("dispatch.form.selectVehicle")}</option>
                                            {vehicles.map(v => <option key={v.id} value={v.id}>{v.make} {v.model}{v.year ? ` (${v.year})` : ""} — {v.licensePlate}{v.capacityWeight ? ` · ${v.capacityWeight} kg` : ""}</option>)}
                                        </Select>
                                    </div>
                                    <div>
                                        <label className={`block text-xs font-semibold mb-1.5 ${isDark ? "text-[#B0B8A8]" : "text-neutral-700"}`}>{t("dispatch.form.driver")}</label>
                                        <Select required value={form.driverId} onChange={e => setForm(f => ({ ...f, driverId: e.target.value }))} className={inputClass}>
                                            <option value="">{t("dispatch.form.selectDriver")}</option>
                                            {drivers.map(d => <option key={d.id} value={d.id}>{d.fullName} ({d.licenseNumber})</option>)}
                                        </Select>
                                    </div>
                                </div>
                                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                                    <div>
                                        <label className={`block text-xs font-semibold mb-1.5 ${isDark ? "text-[#B0B8A8]" : "text-neutral-700"}`}>{t("dispatch.form.distance")}</label>
                                        <input type="number" min="0" step="0.1" value={form.distanceEstimated || ""} onChange={e => setForm(f => ({ ...f, distanceEstimated: +e.target.value }))} className={inputClass} placeholder="150" />
                                    </div>
                                    <div>
                                        <label className={`block text-xs font-semibold mb-1.5 ${isDark ? "text-[#B0B8A8]" : "text-neutral-700"}`}>{t("dispatch.form.cargoWeight")}</label>
                                        <input type="number" min="0" value={form.cargoWeight || ""} onChange={e => setForm(f => ({ ...f, cargoWeight: +e.target.value }))} className={inputClass} placeholder="1000" />
                                    </div>
                                    <div>
                                        <label className={`block text-xs font-semibold mb-1.5 ${isDark ? "text-[#B0B8A8]" : "text-neutral-700"}`}>{t("dispatch.form.revenue")}</label>
                                        <input type="number" min="0" value={form.revenue || ""} onChange={e => setForm(f => ({ ...f, revenue: +e.target.value }))} className={inputClass} placeholder="50000" />
                                    </div>
                                </div>
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                    <div>
                                        <label className={`block text-xs font-semibold mb-1.5 ${isDark ? "text-[#B0B8A8]" : "text-neutral-700"}`}>{t("dispatch.form.cargoDescription")}</label>
                                        <input value={form.cargoDescription} onChange={e => setForm(f => ({ ...f, cargoDescription: e.target.value }))} className={inputClass} placeholder="Electronics, perishables…" />
                                    </div>
                                    <div>
                                        <label className={`block text-xs font-semibold mb-1.5 ${isDark ? "text-[#B0B8A8]" : "text-neutral-700"}`}>{t("dispatch.form.clientName")}</label>
                                        <input value={form.clientName} onChange={e => setForm(f => ({ ...f, clientName: e.target.value }))} className={inputClass} placeholder="Acme Corp" />
                                    </div>
                                </div>
                                <div className="flex gap-3 pt-2">
                                    <button type="button" onClick={() => setShowModal(false)} className={`flex-1 py-2.5 rounded-xl text-sm font-semibold border transition-colors ${isDark ? "border-neutral-600 text-[#B0B8A8] hover:bg-[#1E2B22]" : "border-neutral-200 text-neutral-600 hover:bg-neutral-50"}`}>{t("common.cancel")}</button>
                                    <button type="submit" disabled={createTripMutation.isPending} className={`flex-1 py-2.5 rounded-xl text-sm font-semibold disabled:opacity-60 transition-colors ${isDark ? "bg-gradient-to-r from-[#22C55E] to-[#16A34A] shadow-lg shadow-emerald-500/20 text-white" : "bg-emerald-500 text-white hover:bg-emerald-600"}`}>
                                        {createTripMutation.isPending ? t("common.saving") : t("dispatch.createTrip")}
                                    </button>
                                </div>
                            </form>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>

            <TripCompleteModal
                open={!!completeTripId}
                tripId={completeTripId}
                onClose={() => setCompleteTripId(null)}
                onSuccess={() => {
                    queryClient.invalidateQueries({ queryKey: ['trips'] });
                    if (selectedTrip?.id === completeTripId) {
                        dispatchApi.getTrip(completeTripId).then(setSelectedTrip);
                    }
                    toast.success("Trip marked as completed.", { title: "Trip Completed" });
                }}
            />

            <TripCancelDialog
                open={!!cancelTripId}
                tripId={cancelTripId}
                onClose={() => setCancelTripId(null)}
                onSuccess={() => {
                    queryClient.invalidateQueries({ queryKey: ['trips'] });
                    if (selectedTrip?.id === cancelTripId) {
                        dispatchApi.getTrip(cancelTripId).then(setSelectedTrip);
                    }
                    toast.success("Trip has been cancelled.", { title: "Trip Cancelled" });
                }}
            />
        </div>
    );
}

function InfoBox({ label, value, sub, isDark }: { label: string; value: string; sub?: string; isDark: boolean }) {
    return (
        <div>
            <p className={`text-xs font-semibold mb-0.5 ${isDark ? "text-[#6B7C6B]" : "text-neutral-500"}`}>{label}</p>
            <p className={`text-sm font-bold ${isDark ? "text-[#E4E6DE]" : "text-neutral-900"}`}>{value}</p>
            {sub && <p className={`text-xs ${isDark ? "text-[#6B7C6B]" : "text-neutral-500"}`}>{sub}</p>}
        </div>
    );
}
