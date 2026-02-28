/**
 * Dispatch — Trip Dispatcher & Management
 * Trip creation, lifecycle (DRAFT → DISPATCHED → COMPLETED/CANCELLED)
 * Embedded Leaflet map with OpenRouteService routing for shortest path
 */
import { useState, useEffect, useCallback } from "react";
import { useTranslation } from "react-i18next";
import { motion, AnimatePresence } from "framer-motion";
import {
    Plus, X, Route, MapPin, Truck, User, Clock, CheckCircle2,
    XCircle, AlertTriangle, Search, ChevronRight,
} from "lucide-react";
import { MapContainer, TileLayer, Marker, Popup, Polyline, useMap } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import { fleetApi, hrApi, dispatchApi, type Trip, type Vehicle, type Driver } from "../api/client";
import { useTheme } from "../context/ThemeContext";
import { useToast } from "../hooks/useToast";
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

// Fix Leaflet default icon paths (Vite asset bundling issue)
delete (L.Icon.Default.prototype as unknown as Record<string, unknown>)._getIconUrl;
L.Icon.Default.mergeOptions({
    iconRetinaUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png",
    iconUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png",
    shadowUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png",
});

const STATUS_CONFIG: Record<string, { labelKey: string; className: string; icon: React.ElementType }> = {
    DRAFT: { labelKey: "dispatch.status.DRAFT", className: "bg-neutral-100 text-neutral-600", icon: Clock },
    DISPATCHED: { labelKey: "dispatch.status.DISPATCHED", className: "bg-blue-100 text-blue-700", icon: Route },
    COMPLETED: { labelKey: "dispatch.status.COMPLETED", className: "bg-emerald-100 text-emerald-700", icon: CheckCircle2 },
    CANCELLED: { labelKey: "dispatch.status.CANCELLED", className: "bg-red-100 text-red-600", icon: XCircle },
};

const FIELD = "block w-full rounded-xl border px-3.5 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 transition-colors";

const geocodeCache = new Map<string, [number, number] | null>();
const routeCache = new Map<string, [number, number][]>();

// Geocode a location string using Nominatim
async function geocode(location: string): Promise<[number, number] | null> {
    if (geocodeCache.has(location)) return geocodeCache.get(location) || null;
    try {
        const res = await fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(location)}&limit=1&email=test@fleetflow.com`);
        const results = await res.json();
        if (results.length > 0) {
            const coord: [number, number] = [parseFloat(results[0].lat), parseFloat(results[0].lon)];
            geocodeCache.set(location, coord);
            return coord;
        }
    } catch { }
    geocodeCache.set(location, null);
    return null;
}

// Fetch route from OpenRouteService (free tier, no key needed for basic)
async function getRoute(origin: [number, number], dest: [number, number]): Promise<[number, number][]> {
    const key = `${origin[0]},${origin[1]}-${dest[0]},${dest[1]}`;
    if (routeCache.has(key)) return routeCache.get(key) || [];
    
    // Fallback: use OSRM demo routing
    try {
        const url = `https://router.project-osrm.org/route/v1/driving/${origin[1]},${origin[0]};${dest[1]},${dest[0]}?overview=simplified&geometries=geojson`;
        const res = await fetch(url);
        const json = await res.json();
        if (json.routes && json.routes[0]) {
            const coords = json.routes[0].geometry.coordinates.map(([lng, lat]: [number, number]) => [lat, lng] as [number, number]);
            routeCache.set(key, coords);
            return coords;
        }
    } catch { }
    // Fallback: straight line
    const fallback: [number, number][] = [origin, dest];
    routeCache.set(key, fallback);
    return fallback;
}


// Auto-fit map to route bounds
function MapBounds({ bounds }: { bounds: [[number, number], [number, number]] | null }) {
    const map = useMap();
    useEffect(() => {
        if (bounds) map.fitBounds(bounds, { padding: [40, 40] });
    }, [bounds, map]);
    return null;
}

export default function Dispatch() {
    const { isDark } = useTheme();
    const { t } = useTranslation();
    const toast = useToast();
    const [trips, setTrips] = useState<Trip[]>([]);
    const [vehicles, setVehicles] = useState<Vehicle[]>([]);
    const [drivers, setDrivers] = useState<Driver[]>([]);
    const [loading, setLoading] = useState(true);
    const [statusFilter, setStatusFilter] = useState("");
    const [search, setSearch] = useState("");
    const [showModal, setShowModal] = useState(false);
    const [selectedTrip, setSelectedTrip] = useState<Trip | null>(null);
    const [form, setForm] = useState<{
        vehicleId: string; driverId: string; origin: string; destination: string;
        distanceEstimated: number; cargoWeight: number; cargoDescription: string;
        clientName: string; revenue: number;
    }>({ vehicleId: "", driverId: "", origin: "", destination: "", distanceEstimated: 0, cargoWeight: 0, cargoDescription: "", clientName: "", revenue: 0 });
    const [saving, setSaving] = useState(false);
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

    const load = useCallback(async () => {
        setLoading(true);
        try {
            const [tripsRes, vRes, dRes] = await Promise.all([
                dispatchApi.listTrips({ limit: 100 }),
                fleetApi.listVehicles({ status: "AVAILABLE", limit: 100 }),
                hrApi.listDrivers({ status: "ON_DUTY", limit: 100 }),
            ]);
            setTrips(tripsRes.data ?? []);
            setVehicles(vRes.data ?? []);
            setDrivers(dRes.data ?? []);
        } finally { setLoading(false); }
    }, []);

    useEffect(() => { load(); }, [load]);

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
                setMapBounds([oc, dc]);
                const coords = await getRoute(oc, dc);
                setRouteCoords(coords);
            }
            setMapLoading(false);
        };
        loadRoute();
    }, [selectedTrip]);

    const filtered = trips.filter(tr =>
        (!statusFilter || tr.status === statusFilter) &&
        (!search || tr.origin.toLowerCase().includes(search.toLowerCase()) ||
            tr.destination.toLowerCase().includes(search.toLowerCase()) ||
            tr.driver?.fullName?.toLowerCase().includes(search.toLowerCase()))
    );

    const handleCreate = async (e: React.FormEvent) => {
        e.preventDefault();
        setSaving(true); setFormError("");
        try {
            const selectedVehicle = vehicles.find(v => v.id === form.vehicleId);
            if (selectedVehicle && form.cargoWeight > (Number(selectedVehicle.capacityWeight) || Infinity)) {
                setFormError(`Cargo weight (${form.cargoWeight} kg) exceeds vehicle capacity (${selectedVehicle.capacityWeight} kg)`);
                return;
            }
            await dispatchApi.createTrip({ ...form, distanceEstimated: form.distanceEstimated });
            toast.success(t("dispatch.toast.created"));
            setShowModal(false);
            load();
        } catch (err: unknown) {
            setFormError((err as { response?: { data?: { message?: string } } })?.response?.data?.message ?? "Failed to create trip");
        } finally { setSaving(false); }
    };

    const handleTransition = async (trip: Trip, status: "DISPATCHED" | "COMPLETED" | "CANCELLED") => {
        try {
            await dispatchApi.transitionStatus(trip.id, { status });
            toast.success(t("dispatch.toast.transitioned", { status: status.toLowerCase() }));
            load();
            if (selectedTrip?.id === trip.id) {
                const updated = await dispatchApi.getTrip(trip.id);
                setSelectedTrip(updated);
            }
        } catch (err: unknown) {
            toast.error((err as { response?: { data?: { message?: string } } })?.response?.data?.message ?? t("dispatch.toast.transitionFailed"));
        }
        setTransitioning(null);
    };

    const inputClass = `${FIELD} ${isDark ? "bg-neutral-700 border-neutral-600 text-white placeholder-neutral-400" : "bg-white border-neutral-200 text-neutral-900 placeholder-neutral-400"}`;

    return (
        <div className="max-w-[1600px] mx-auto h-full">
            <div className="flex items-center justify-between mb-5">
                <div>
                    <h1 className={`text-2xl font-bold ${isDark ? "text-white" : "text-neutral-900"}`}>{t("dispatch.title")}</h1>
                    <p className={`text-sm ${isDark ? "text-neutral-400" : "text-neutral-500"}`}>{t("dispatch.tripsTotal", { count: trips.length })}</p>
                </div>
                <button onClick={() => { setFormError(""); setShowModal(true); }} className="flex items-center gap-2 px-4 py-2 rounded-xl bg-emerald-500 text-white text-sm font-semibold hover:bg-emerald-600 transition-all active:scale-[0.97]">
                    <Plus className="w-4 h-4" /> {t("dispatch.newTrip")}
                </button>
            </div>

            {/* Mobile view toggle */}
            <div className={`flex lg:hidden mb-3 gap-1 p-1 rounded-xl ${isDark ? 'bg-neutral-800' : 'bg-neutral-100'}`}>
                <button onClick={() => setMobileView('list')} className={`flex-1 flex items-center justify-center gap-2 px-3 py-2 rounded-lg text-sm font-semibold transition-colors ${mobileView === 'list' ? (isDark ? 'bg-neutral-700 text-emerald-400 shadow-sm' : 'bg-white text-emerald-600 shadow-sm') : (isDark ? 'text-neutral-500' : 'text-neutral-500')}`}>
                    <Route className="w-4 h-4" /> Trips
                </button>
                <button onClick={() => setMobileView('detail')} className={`flex-1 flex items-center justify-center gap-2 px-3 py-2 rounded-lg text-sm font-semibold transition-colors ${mobileView === 'detail' ? (isDark ? 'bg-neutral-700 text-emerald-400 shadow-sm' : 'bg-white text-emerald-600 shadow-sm') : (isDark ? 'text-neutral-500' : 'text-neutral-500')}`}>
                    <MapPin className="w-4 h-4" /> Map & Detail
                </button>
            </div>

            <div className="flex flex-col lg:flex-row gap-5 lg:h-[calc(100vh-220px)] lg:min-h-[600px]">
                {/* LEFT: Trip List */}
                <div className={`${mobileView === 'detail' ? 'hidden lg:flex' : 'flex'} w-full lg:w-[380px] shrink-0 flex-col rounded-2xl border overflow-hidden max-h-[50vh] lg:max-h-none ${isDark ? "bg-neutral-800 border-neutral-700" : "bg-white border-neutral-200 shadow-sm"}`}>
                    {/* Search & filter */}
                    <div className={`p-3 space-y-2 border-b ${isDark ? "border-neutral-700" : "border-neutral-100"}`}>
                        <div className="relative">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-400" />
                            <input value={search} onChange={e => setSearch(e.target.value)} placeholder={t("dispatch.searchPlaceholder")} className={`${inputClass} pl-9`} />
                        </div>
                        <div className="flex gap-1 flex-wrap">
                            {["", "DRAFT", "DISPATCHED", "COMPLETED", "CANCELLED"].map(s => (
                                <button key={s} onClick={() => setStatusFilter(s)}
                                    className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition-colors ${statusFilter === s ? "bg-emerald-500 text-white" : isDark ? "text-neutral-400 hover:bg-neutral-700" : "text-neutral-500 hover:bg-neutral-100"}`}
                                >
                                    {s || t("common.all")}
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Trip list */}
                    <div className="flex-1 overflow-y-auto">
                        {loading ? (
                            <div className="flex items-center justify-center h-32 text-neutral-400">{t("common.loading")}</div>
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
                                    className={`w-full text-left p-4 border-b transition-all ${isDark ? "border-neutral-700 hover:bg-neutral-700/40" : "border-neutral-50 hover:bg-neutral-50"
                                        } ${isSelected ? (isDark ? "bg-emerald-500/10 border-l-2 border-l-emerald-500" : "bg-emerald-50 border-l-2 border-l-emerald-500") : ""}`}
                                >
                                    <div className="flex items-start justify-between mb-1.5">
                                        <div className="flex items-start gap-2">
                                            <MapPin className="w-4 h-4 text-emerald-500 mt-0.5 shrink-0" />
                                            <div>
                                                <p className={`text-sm font-bold leading-tight ${isDark ? "text-white" : "text-neutral-900"}`}>{trip.origin}</p>
                                                <p className={`text-xs ${isDark ? "text-neutral-400" : "text-neutral-500"}`}>→ {trip.destination}</p>
                                            </div>
                                        </div>
                                        <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${cfg?.className}`}>{t(cfg?.labelKey ?? "")}</span>
                                    </div>
                                    <div className={`flex items-center gap-3 text-xs ${isDark ? "text-neutral-400" : "text-neutral-500"}`}>
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
                            <div className={`rounded-2xl border p-5 ${isDark ? "bg-neutral-800 border-neutral-700" : "bg-white border-neutral-200 shadow-sm"}`}>
                                <div className="flex items-start justify-between mb-3">
                                    <div>
                                        <span className={`text-xs font-semibold px-2.5 py-1 rounded-full ${STATUS_CONFIG[selectedTrip.status]?.className}`}>
                                            {t(STATUS_CONFIG[selectedTrip.status]?.labelKey ?? "")}
                                        </span>
                                        <h2 className={`text-base font-bold mt-1.5 ${isDark ? "text-white" : "text-neutral-900"}`}>
                                            {selectedTrip.origin} → {selectedTrip.destination}
                                        </h2>
                                        {selectedTrip.clientName && (
                                            <p className={`text-xs mt-0.5 ${isDark ? "text-neutral-400" : "text-neutral-500"}`}>
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
                                                    className="px-3 py-1.5 rounded-xl text-xs font-semibold bg-blue-500 text-white hover:bg-blue-600 transition-colors shadow-sm">
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
                            <div className={`flex-1 rounded-2xl border overflow-hidden relative min-h-[300px] ${isDark ? "border-neutral-700" : "border-neutral-200 shadow-sm"}`}>
                                {mapLoading && (
                                    <div className="absolute inset-0 z-10 flex items-center justify-center bg-white/80 backdrop-blur-sm">
                                        <div className="text-sm text-neutral-500 flex items-center gap-2">
                                            <Route className="w-4 h-4 animate-pulse text-emerald-500" /> {t("dispatch.map.calculatingRoute")}
                                        </div>
                                    </div>
                                )}
                                <MapContainer center={[20.5937, 78.9629]} zoom={5} className="w-full h-full" style={{ minHeight: "300px" }}>
                                    <TileLayer
                                        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                                        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
                                    />
                                    {originCoord && (
                                        <Marker position={originCoord}>
                                            <Popup><b>Origin:</b> {selectedTrip.origin}</Popup>
                                        </Marker>
                                    )}
                                    {destCoord && (
                                        <Marker position={destCoord}>
                                            <Popup><b>Destination:</b> {selectedTrip.destination}</Popup>
                                        </Marker>
                                    )}
                                    {routeCoords.length > 1 && (
                                        <Polyline positions={routeCoords} color="#3b82f6" weight={5} opacity={0.85} />
                                    )}
                                    <MapBounds bounds={mapBounds} />
                                </MapContainer>
                            </div>
                        </>
                    ) : (
                        <div className={`flex-1 rounded-2xl border flex flex-col items-center justify-center gap-3 ${isDark ? "bg-neutral-800 border-neutral-700" : "bg-white border-neutral-200 shadow-sm"}`}>
                            <div className="w-16 h-16 rounded-2xl bg-emerald-500/10 flex items-center justify-center">
                                <Route className="w-8 h-8 text-emerald-500" />
                            </div>
                            <div className="text-center">
                                <p className={`font-semibold ${isDark ? "text-white" : "text-neutral-900"}`}>{t("dispatch.map.selectTrip")}</p>
                                <p className={`text-sm mt-1 ${isDark ? "text-neutral-400" : "text-neutral-500"}`}>{t("dispatch.map.selectTripDesc")}</p>
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
                            className={`w-full max-w-2xl rounded-3xl border p-6 shadow-2xl max-h-[90vh] overflow-y-auto ${isDark ? "bg-neutral-800 border-neutral-700" : "bg-white"}`}
                        >
                            <div className="flex items-center justify-between mb-5">
                                <h2 className={`text-lg font-bold ${isDark ? "text-white" : "text-neutral-900"}`}>{t("dispatch.createTrip")}</h2>
                                <button onClick={() => setShowModal(false)} className="p-1.5 rounded-lg text-neutral-400 hover:bg-neutral-100 dark:hover:bg-neutral-700 transition-colors"><X className="w-4 h-4" /></button>
                            </div>

                            {formError && <div className="mb-4 text-red-600 text-sm bg-red-50 border border-red-100 rounded-xl p-3 flex items-center gap-2"><AlertTriangle className="w-4 h-4 shrink-0" />{formError}</div>}

                            <form onSubmit={handleCreate} className="space-y-4">
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                    <div>
                                        <label className={`block text-xs font-semibold mb-1.5 ${isDark ? "text-neutral-300" : "text-neutral-700"}`}>{t("dispatch.form.vehicle")}</label>
                                        <select required value={form.vehicleId} onChange={e => setForm(f => ({ ...f, vehicleId: e.target.value }))} className={inputClass}>
                                            <option value="">{t("dispatch.form.selectVehicle")}</option>
                                            {vehicles.map(v => <option key={v.id} value={v.id}>{v.licensePlate} — {v.make} {v.model}{v.capacityWeight ? ` (${v.capacityWeight} kg max)` : ""}</option>)}
                                        </select>
                                    </div>
                                    <div>
                                        <label className={`block text-xs font-semibold mb-1.5 ${isDark ? "text-neutral-300" : "text-neutral-700"}`}>{t("dispatch.form.driver")}</label>
                                        <select required value={form.driverId} onChange={e => setForm(f => ({ ...f, driverId: e.target.value }))} className={inputClass}>
                                            <option value="">{t("dispatch.form.selectDriver")}</option>
                                            {drivers.map(d => <option key={d.id} value={d.id}>{d.fullName} ({d.licenseNumber})</option>)}
                                        </select>
                                    </div>
                                </div>
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                    <div>
                                        <label className={`block text-xs font-semibold mb-1.5 ${isDark ? "text-neutral-300" : "text-neutral-700"}`}>{t("dispatch.form.origin")}</label>
                                        <input required value={form.origin} onChange={e => setForm(f => ({ ...f, origin: e.target.value }))} className={inputClass} placeholder={t("dispatch.form.originPlaceholder")} />
                                    </div>
                                    <div>
                                        <label className={`block text-xs font-semibold mb-1.5 ${isDark ? "text-neutral-300" : "text-neutral-700"}`}>{t("dispatch.form.destination")}</label>
                                        <input required value={form.destination} onChange={e => setForm(f => ({ ...f, destination: e.target.value }))} className={inputClass} placeholder={t("dispatch.form.destinationPlaceholder")} />
                                    </div>
                                </div>
                                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                                    <div>
                                        <label className={`block text-xs font-semibold mb-1.5 ${isDark ? "text-neutral-300" : "text-neutral-700"}`}>{t("dispatch.form.distance")}</label>
                                        <input type="number" min="0" step="0.1" value={form.distanceEstimated || ""} onChange={e => setForm(f => ({ ...f, distanceEstimated: +e.target.value }))} className={inputClass} placeholder="150" />
                                    </div>
                                    <div>
                                        <label className={`block text-xs font-semibold mb-1.5 ${isDark ? "text-neutral-300" : "text-neutral-700"}`}>{t("dispatch.form.cargoWeight")}</label>
                                        <input type="number" min="0" value={form.cargoWeight || ""} onChange={e => setForm(f => ({ ...f, cargoWeight: +e.target.value }))} className={inputClass} placeholder="1000" />
                                    </div>
                                    <div>
                                        <label className={`block text-xs font-semibold mb-1.5 ${isDark ? "text-neutral-300" : "text-neutral-700"}`}>{t("dispatch.form.revenue")}</label>
                                        <input type="number" min="0" value={form.revenue || ""} onChange={e => setForm(f => ({ ...f, revenue: +e.target.value }))} className={inputClass} placeholder="50000" />
                                    </div>
                                </div>
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                    <div>
                                        <label className={`block text-xs font-semibold mb-1.5 ${isDark ? "text-neutral-300" : "text-neutral-700"}`}>{t("dispatch.form.cargoDescription")}</label>
                                        <input value={form.cargoDescription} onChange={e => setForm(f => ({ ...f, cargoDescription: e.target.value }))} className={inputClass} placeholder="Electronics, perishables…" />
                                    </div>
                                    <div>
                                        <label className={`block text-xs font-semibold mb-1.5 ${isDark ? "text-neutral-300" : "text-neutral-700"}`}>{t("dispatch.form.clientName")}</label>
                                        <input value={form.clientName} onChange={e => setForm(f => ({ ...f, clientName: e.target.value }))} className={inputClass} placeholder="Acme Corp" />
                                    </div>
                                </div>
                                <div className="flex gap-3 pt-2">
                                    <button type="button" onClick={() => setShowModal(false)} className={`flex-1 py-2.5 rounded-xl text-sm font-semibold border transition-colors ${isDark ? "border-neutral-600 text-neutral-300 hover:bg-neutral-700" : "border-neutral-200 text-neutral-600 hover:bg-neutral-50"}`}>{t("common.cancel")}</button>
                                    <button type="submit" disabled={saving} className="flex-1 py-2.5 rounded-xl text-sm font-semibold bg-emerald-500 text-white hover:bg-emerald-600 disabled:opacity-60 transition-colors">
                                        {saving ? t("common.saving") : t("dispatch.createTrip")}
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
                    load();
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
                    load();
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
            <p className={`text-xs font-semibold mb-0.5 ${isDark ? "text-neutral-400" : "text-neutral-500"}`}>{label}</p>
            <p className={`text-sm font-bold ${isDark ? "text-white" : "text-neutral-900"}`}>{value}</p>
            {sub && <p className={`text-xs ${isDark ? "text-neutral-400" : "text-neutral-500"}`}>{sub}</p>}
        </div>
    );
}
