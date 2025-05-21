"use client";

import React, { useState, useEffect, useCallback } from "react";
import dynamic from "next/dynamic";
import { 
  TruckIcon, 
  CheckCircleIcon, 
  ExclamationTriangleIcon, 
  CubeIcon, 
  MapIcon 
} from "@heroicons/react/24/solid";
import { databases } from "@/lib/appwrite";
import { Query } from "appwrite";
import { LatLngExpression } from "leaflet";
import L from "leaflet";
import LeafletStyles from "@/components/LeafletStyles";
import LogoutButton from "@/components/LogoutButton";
import UserInfo from "@/components/UserInfo";


// Dynamically import Leaflet components to avoid SSR issues
const MapContainer = dynamic(() => import("react-leaflet").then(mod => mod.MapContainer), { ssr: false });
const TileLayer = dynamic(() => import("react-leaflet").then(mod => mod.TileLayer), { ssr: false });
const Marker = dynamic(() => import("react-leaflet").then(mod => mod.Marker), { ssr: false });
const Polyline = dynamic(() => import("react-leaflet").then(mod => mod.Polyline), { ssr: false });

type Shipment = {
  $id: string;
  tracking_id: string;
  status: string;
  origin: string;
  destination: string;
  cost: number;
  created_at: string;
  transitTime?: number;
  location?: { lat: number; lng: number } | null;
};

type AnalyticsData = {
  activeShipments: number;
  deliveredThisMonth: number;
  delayedShipments: number;
  totalInventoryValue: number;
  recentShipments: Shipment[];
  liveLocation?: {
    lat: number;
    lng: number;
  };
};

// --- Custom Marker Icons ---
const originIcon = new L.Icon({
  iconUrl: "/origin.png",
  iconSize: [36, 36],
  iconAnchor: [18, 36],
});
const destinationIcon = new L.Icon({
  iconUrl: "/destination.png",
  iconSize: [36, 36],
  iconAnchor: [18, 36],
});
const vesselIcon = new L.Icon({
  iconUrl: "/vessel.png",
  iconSize: [36, 36],
  iconAnchor: [18, 36],
});

// --- Geocoding (OpenStreetMap Nominatim) ---
async function geocode(address: string): Promise<{ lat: number; lng: number } | null> {
  const res = await fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(address)}`);
  const data = await res.json();
  if (data && data.length > 0) {
    return { lat: parseFloat(data[0].lat), lng: parseFloat(data[0].lon) };
  }
  return null;
}

// --- Fetch Driving Route from OpenRouteService ---
async function getRoute(
  from: { lat: number; lng: number },
  to: { lat: number; lng: number }
): Promise<[number, number][]> {
  const apiKey = process.env.NEXT_PUBLIC_ORS_API_KEY;
  const url = `https://api.openrouteservice.org/v2/directions/driving-car?api_key=${apiKey}&start=${from.lng},${from.lat}&end=${to.lng},${to.lat}`;
  const res = await fetch(url);
  if (!res.ok) throw new Error("Route fetch failed");
  const data = await res.json();
  // Decode geometry (polyline)
  return data.features[0].geometry.coordinates.map(([lng, lat]: [number, number]) => [lat, lng]);
}

// --- Analytics Data Fetch ---
async function fetchAnalyticsData(): Promise<AnalyticsData | null> {
  try {
    const shipmentResponse = await databases.listDocuments(
      process.env.NEXT_PUBLIC_APPWRITE_DATABASE_ID!,
      process.env.NEXT_PUBLIC_SHIPMENTS_COLLECTION_ID!,
      [Query.limit(1000)]
    );

    const shipments = shipmentResponse.documents as unknown as Shipment[];

    const now = new Date();
    const currentMonth = now.getMonth();
    const currentYear = now.getFullYear();

    const activeShipments = shipments.filter(s =>
      ["In Transit", "Processing"].includes(s.status)
    ).length;

    const deliveredThisMonth = shipments.filter(s => {
      const createdDate = new Date(s.created_at);
      return s.status === "Delivered" &&
        createdDate.getMonth() === currentMonth &&
        createdDate.getFullYear() === currentYear;
    }).length;

    const delayedShipments = shipments.filter(s => s.status === "Delayed").length;

    const totalInventoryValue = shipments.reduce((acc, s) => acc + (s.cost || 0), 0);

    const recentShipments = shipments
      .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
      .slice(0, 5);

    // Example static live location
    const liveLocation = recentShipments.length > 0
      ? { lat: -22.9068, lng: -43.1729 }
      : undefined;

    return {
      activeShipments,
      deliveredThisMonth,
      delayedShipments,
      totalInventoryValue,
      recentShipments,
      liveLocation
    };
  } catch (error) {
    console.error("Analytics data fetch error:", error);
    return null;
  }
}

export default function Dashboard() {
  // Analytics
  const [analyticsData, setAnalyticsData] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);

  // Live tracking
  const [trackingShipment, setTrackingShipment] = useState<Shipment | null>(null);
  const [liveLocation, setLiveLocation] = useState<{ lat: number; lng: number } | null>(null);
  const [loadingLocation, setLoadingLocation] = useState(false);

  // Origin/destination & routing
  const [originInput, setOriginInput] = useState("");
  const [destinationInput, setDestinationInput] = useState("");
  const [originCoord, setOriginCoord] = useState<{ lat: number; lng: number } | null>(null);
  const [destinationCoord, setDestinationCoord] = useState<{ lat: number; lng: number } | null>(null);
  const [route, setRoute] = useState<[number, number][]>([]);
  const [geocodeError, setGeocodeError] = useState<string | null>(null);
  const [geocoding, setGeocoding] = useState(false);

  // Vessel animation state
  const [vesselIndex, setVesselIndex] = useState(0);
  const [isAnimating, setIsAnimating] = useState(false);

  // Fetch analytics
  const loadData = useCallback(async () => {
    try {
      const data = await fetchAnalyticsData();
      setAnalyticsData(data);
      setLoading(false);
    } catch (error) {
      console.error("Dashboard data loading error:", error);
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // Live location modal logic
  const fetchLiveLocation = useCallback(async (trackingId: string) => {
    setLoadingLocation(true);
    try {
      const res = await fetch(`/api/location?trackingId=${trackingId}`);
      if (!res.ok) throw new Error("Failed to fetch location");
      const data = await res.json();
      setLiveLocation({ lat: data.lat, lng: data.lng });
    } catch (error) {
      console.error("Live location fetch error:", error);
      setLiveLocation(null);
    } finally {
      setLoadingLocation(false);
    }
  }, []);

  const onTrackClick = useCallback((shipment: Shipment) => {
    setTrackingShipment(shipment);
    fetchLiveLocation(shipment.tracking_id);
  }, [fetchLiveLocation]);

  const resetTracking = useCallback(() => {
    setTrackingShipment(null);
    setLiveLocation(null);
  }, []);

  // Handle user origin/destination geocoding and routing
  async function handleShowOnMap(e: React.FormEvent) {
    e.preventDefault();
    setGeocoding(true);
    setGeocodeError(null);
    setRoute([]);
    try {
      const [origin, dest] = await Promise.all([
        geocode(originInput),
        geocode(destinationInput)
      ]);
      setOriginCoord(origin);
      setDestinationCoord(dest);
      if (!origin || !dest) {
        setGeocodeError("Could not find one or both locations.");
        setGeocoding(false);
        return;
      }
      // Fetch the real driving route
      const routeCoords = await getRoute(origin, dest);
      setRoute(routeCoords);
    } catch (_) {
      setGeocodeError("Error geocoding or routing.");
    }
    setGeocoding(false);
  }

  // Vessel animation effect
  useEffect(() => {
    if (route.length > 0 && isAnimating) {
      if (vesselIndex < route.length - 1) {
        const timer = setTimeout(() => {
          setVesselIndex(vesselIndex + 1);
        }, 100); // Adjust speed (ms)
        return () => clearTimeout(timer);
      } else {
        setIsAnimating(false);
      }
    }
  }, [route, vesselIndex, isAnimating]);

  // Reset animation when new route is set
  useEffect(() => {
    setVesselIndex(0);
    setIsAnimating(false);
  }, [route]);

  if (loading) return (
    <div className="min-h-screen bg-gray-900 flex items-center justify-center text-white">
      Loading dashboard...
    </div>
  );
  if (!analyticsData) return (
    <div className="min-h-screen bg-gray-900 flex items-center justify-center text-white">
      Error loading dashboard
    </div>
  );

  const {
    activeShipments,
    deliveredThisMonth,
    delayedShipments,
    totalInventoryValue,
    recentShipments
  } = analyticsData;

  return (
    <div className="min-h-screen bg-gray-900 text-white">
      {/* --- NAVIGATION BAR --- */}
      <nav className="bg-gray-950 shadow">
        <div className="container mx-auto px-4 py-3 flex justify-between items-center">
          <a href="dashboard.php" className="flex items-center gap-2 font-bold text-2xl text-indigo-400">
            <i className="fas fa-box"></i>
            Supply<span className="text-white">Flow</span>
          </a>
          <div className="flex gap-6">
            <a href="dashboard" className="text-indigo-400 font-semibold border-b-2 border-indigo-400 pb-1">Dashboard</a>
            <a href="shipments" className="hover:text-indigo-400">Shipments</a>
            <a href="inventory" className="hover:text-indigo-400">Inventory</a>
            <a href="analytics" className="hover:text-indigo-400">Analytics</a>
            <a href="products" className="hover:text-indigo-400">Products</a>
            <a href="settings" className="hover:text-indigo-400">Settings</a>
            <LogoutButton />
            <UserInfo />
          </div>
        </div>
      </nav>

      <LeafletStyles />

      {/* --- MAIN DASHBOARD LAYOUT (Sidebar + Main Content) --- */}
      <div className="flex">
        {/* --- SIDEBAR --- */}
        <aside className="bg-gray-800 w-64 min-h-screen py-8 px-4 hidden md:block">
          <ul className="space-y-2">
            <li>
              <a href="#" className="flex items-center gap-3 px-4 py-2 rounded bg-gray-900 text-indigo-400 font-semibold">
                <i className="fas fa-tachometer-alt"></i> Overview
              </a>
            </li>
            <li>
              <a href="shipments.php" className="flex items-center gap-3 px-4 py-2 rounded hover:bg-gray-900 hover:text-indigo-400">
                <i className="fas fa-truck"></i> Shipments
              </a>
            </li>
            <li>
              <a href="inventory.php" className="flex items-center gap-3 px-4 py-2 rounded hover:bg-gray-900 hover:text-indigo-400">
                <i className="fas fa-boxes"></i> Inventory
              </a>
            </li>
            <li>
              <a href="analytics.html" className="flex items-center gap-3 px-4 py-2 rounded hover:bg-gray-900 hover:text-indigo-400">
                <i className="fas fa-chart-line"></i> Analytics
              </a>
            </li>
          </ul>
        </aside>

        {/* --- MAIN CONTENT --- */}
        <main className="flex-1 p-6 space-y-6">
          {/* Origin/Destination Form */}
          <div className="bg-gray-800 rounded-lg p-6 shadow-lg mb-6">
            <h2 className="text-xl font-bold mb-4">Show Route on Map</h2>
            <form onSubmit={handleShowOnMap} className="flex flex-col md:flex-row gap-4 items-center">
              <input
                type="text"
                placeholder="Origin (e.g. New York)"
                value={originInput}
                onChange={e => setOriginInput(e.target.value)}
                className="px-3 py-2 rounded border border-gray-600 bg-gray-900 text-white w-full md:w-1/3"
                required
              />
              <input
                type="text"
                placeholder="Destination (e.g. Boston)"
                value={destinationInput}
                onChange={e => setDestinationInput(e.target.value)}
                className="px-3 py-2 rounded border border-gray-600 bg-gray-900 text-white w-full md:w-1/3"
                required
              />
              <button
                type="submit"
                className="px-4 py-2 bg-indigo-600 text-white rounded"
                disabled={geocoding}
              >
                {geocoding ? "Locating..." : "Show on Map"}
              </button>
            </form>
            {geocodeError && <div className="text-red-500 mt-2">{geocodeError}</div>}
          </div>

          {/* Show Map if Both Locations Are Set and Route is Ready */}
          {originCoord && destinationCoord && route.length > 0 && (
            <div className="bg-gray-800 rounded-lg p-4 shadow-lg mb-6">
              {/* Vessel Animation Button */}
              {!isAnimating && (
                <button
                  className="mb-2 px-4 py-2 bg-green-600 text-white rounded"
                  onClick={() => {
                    setVesselIndex(0);
                    setIsAnimating(true);
                  }}
                >
                  Start Vessel Animation
                </button>
              )}
              <MapContainer
                center={route[Math.floor(route.length / 2)] as LatLngExpression}
                zoom={7}
                style={{ height: 350, width: "100%" }}
              >
                <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
                <Marker position={[originCoord.lat, originCoord.lng]} icon={originIcon} />
                <Marker position={[destinationCoord.lat, destinationCoord.lng]} icon={destinationIcon} />
                <Polyline positions={route} color="blue" />
                {/* Vessel Marker */}
                {route.length > 0 && (
                  <Marker
                    position={route[vesselIndex]}
                    icon={vesselIcon}
                  />
                )}
              </MapContainer>
            </div>
          )}

          {/* Statistics Cards */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            <div className="bg-gray-800 p-6 rounded-lg shadow-lg flex flex-col">
              <div className="flex justify-between items-center mb-4">
                <TruckIcon className="h-8 w-8 text-indigo-500" />
                <span className="text-sm text-gray-400">Active Shipments</span>
              </div>
              <div className="text-3xl font-bold text-white">{activeShipments}</div>
              <div className="text-sm text-green-500 mt-2">+12% from last week</div>
            </div>
            <div className="bg-gray-800 p-6 rounded-lg shadow-lg flex flex-col">
              <div className="flex justify-between items-center mb-4">
                <CheckCircleIcon className="h-8 w-8 text-green-500" />
                <span className="text-sm text-gray-400">Delivered This Month</span>
              </div>
              <div className="text-3xl font-bold text-white">{deliveredThisMonth}</div>
              <div className="text-sm text-green-500 mt-2">+5% from last month</div>
            </div>
            <div className="bg-gray-800 p-6 rounded-lg shadow-lg flex flex-col">
              <div className="flex justify-between items-center mb-4">
                <ExclamationTriangleIcon className="h-8 w-8 text-red-500" />
                <span className="text-sm text-gray-400">Delayed Shipments</span>
              </div>
              <div className="text-3xl font-bold text-white">{delayedShipments}</div>
              <div className="text-sm text-red-500 mt-2">-2 from yesterday</div>
            </div>
            <div className="bg-gray-800 p-6 rounded-lg shadow-lg flex flex-col">
              <div className="flex justify-between items-center mb-4">
                <CubeIcon className="h-8 w-8 text-blue-500" />
                <span className="text-sm text-gray-400">Total Inventory Value</span>
              </div>
              <div className="text-3xl font-bold text-white">${totalInventoryValue.toLocaleString()}</div>
              <div className="text-sm text-green-500 mt-2">+7% from last week</div>
            </div>
          </div>

          {/* Recent Shipments Table */}
          <div className="bg-gray-800 rounded-lg p-6 shadow-lg">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-bold">Recent Shipments</h2>
              <a href="/shipments" className="text-indigo-500 hover:underline">View All</a>
            </div>
            <table className="w-full text-left">
              <thead className="border-b border-gray-700">
                <tr>
                  <th className="py-3 px-4 text-gray-400">Tracking ID</th>
                  <th className="py-3 px-4 text-gray-400">Origin</th>
                  <th className="py-3 px-4 text-gray-400">Destination</th>
                  <th className="py-3 px-4 text-gray-400">Status</th>
                  <th className="py-3 px-4 text-gray-400">Cost</th>
                  <th className="py-3 px-4 text-gray-400">Actions</th>
                </tr>
              </thead>
              <tbody>
                {recentShipments.map((shipment: Shipment) => (
                  <tr key={shipment.$id} className="border-b border-gray-700 hover:bg-gray-700/50">
                    <td className="py-3 px-4">{shipment.tracking_id}</td>
                    <td className="py-3 px-4">{shipment.origin}</td>
                    <td className="py-3 px-4">{shipment.destination}</td>
                    <td className="py-3 px-4">
                      <span className={`
                        px-2 py-1 rounded text-xs font-semibold
                        ${shipment.status === "Delivered" ? "bg-green-500/20 text-green-500" :
                          shipment.status === "Delayed" ? "bg-red-500/20 text-red-500" :
                            "bg-yellow-500/20 text-yellow-500"}
                      `}>
                        {shipment.status}
                      </span>
                    </td>
                    <td className="py-3 px-4">${(shipment.cost || 0).toLocaleString()}</td>
                    <td className="py-3 px-4">
                      <button
                        onClick={() => onTrackClick(shipment)}
                        className="flex items-center gap-1 text-indigo-500 hover:underline"
                        disabled={loadingLocation && trackingShipment?.tracking_id === shipment.tracking_id}
                      >
                        <MapIcon className="h-4 w-4" />
                        {loadingLocation && trackingShipment?.tracking_id === shipment.tracking_id ? "Loading..." : "Track"}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Live Location Modal */}
          {trackingShipment && (
            <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50">
              <div className="bg-white rounded-lg p-6 w-[400px]">
                <h2 className="text-xl font-bold mb-2 text-black">
                  Live Location: {trackingShipment.tracking_id}
                </h2>
                {loadingLocation && <p className="text-black">Loading location...</p>}
                {!loadingLocation && liveLocation && (
                  <MapContainer
                    center={[liveLocation.lat, liveLocation.lng] as LatLngExpression}
                    zoom={13}
                    style={{ height: 300, width: "100%" }}
                  >
                    <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
                    <Marker position={[liveLocation.lat, liveLocation.lng] as LatLngExpression} />
                  </MapContainer>
                )}
                {!loadingLocation && !liveLocation && <p className="text-black">Location not available.</p>}
                <button
                  className="mt-4 px-4 py-2 bg-indigo-600 text-white rounded"
                  onClick={resetTracking}
                >
                  Close
                </button>
              </div>
            </div>
          )}
        </main>
      </div>
    </div>
  );
}
