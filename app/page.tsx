"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { account } from "@/lib/appwrite";
import UserProfileInfo from "@/components/UserInfo";
import { 
  ChartBarIcon, 
  TruckIcon, 
  CubeIcon, 
  ArrowRightOnRectangleIcon,
  UserCircleIcon,
  ArrowUpIcon,
  ArrowDownIcon,
  ClockIcon,
  CurrencyDollarIcon
} from "@heroicons/react/24/outline";

interface ShipmentStats {
  active_shipments: number;
  delivered_month: number;
  delayed_shipments: number;
  total_inventory_value: number;
}

interface Shipment {
  tracking_id: string;
  product_category: string;
  origin: string;
  destination: string;
  departure_date: string;
  eta: string;
  status: string;
}

export default function Dashboard() {
  const router = useRouter();
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [user, setUser] = useState<any>(null);
  const [stats, setStats] = useState<ShipmentStats>({
    active_shipments: 0,
    delivered_month: 0,
    delayed_shipments: 0,
    total_inventory_value: 0
  });

  const [shipments, setShipments] = useState<Shipment[]>([]);

  useEffect(() => {
    // Check authentication status
    const checkAuth = async () => {
      try {
        const session = await account.getSession('current');
        if (session) {
          const userData = await account.get();
          setUser(userData);
          setIsAuthenticated(true);
        } else {
          router.push('/auth/login');
        }
      } catch (error) {
        console.error('Auth check failed:', error);
        router.push('/auth/login');
      }
    };

    checkAuth();
  }, [router]);

  const handleLogout = async () => {
    try {
      await account.deleteSession('current');
      localStorage.removeItem('user');
      router.push('/auth/login');
    } catch (error) {
      console.error('Logout failed:', error);
    }
  };

  useEffect(() => {
    // In a real application, this would be an API call
    setStats({
      active_shipments: 12,
      delivered_month: 45,
      delayed_shipments: 3,
      total_inventory_value: 125000.00
    });

    setShipments([
      {
        tracking_id: "TRK123456",
        product_category: "Electronics",
        origin: "Shanghai",
        destination: "Los Angeles",
        departure_date: "2024-01-15",
        eta: "2024-02-01",
        status: "In Transit"
      },
      // Add more mock shipments as needed
    ]);
  }, []);

  if (!isAuthenticated) {
    return null; // or a loading spinner
  }

  return (
    <div className="min-h-screen bg-[#0f172a] text-white">
      {/* Navigation Bar */}
      <nav className="fixed top-0 left-0 right-0 bg-[rgba(15,23,42,0.8)] backdrop-blur-lg border-b border-white/10 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            {/* Logo and Brand */}
          <div className="flex items-center gap-2">
              <TruckIcon className="w-8 h-8 text-indigo-500" />
              <span className="text-2xl font-bold">
                Supply<span className="text-green-500">Flow</span>
              </span>
            </div>

            {/* Navigation Links */}
            <div className="hidden md:flex items-center space-x-2">
              <Link 
                href="/dashboard" 
                className="flex items-center gap-1 text-gray-300 hover:text-white transition-colors text-xs px-2 py-1 rounded hover:bg-gray-800/30"
              >
                <ChartBarIcon className="w-3.5 h-3.5" />
                Dashboard
              </Link>
              <Link 
                href="/shipments" 
                className="flex items-center gap-1 text-gray-300 hover:text-white transition-colors text-xs px-2 py-1 rounded hover:bg-gray-800/30"
              >
                <TruckIcon className="w-3.5 h-3.5" />
                Shipments
              </Link>
              <Link 
                href="/inventory" 
                className="flex items-center gap-1 text-gray-300 hover:text-white transition-colors text-xs px-2 py-1 rounded hover:bg-gray-800/30"
              >
                <CubeIcon className="w-3.5 h-3.5" />
                Inventory
              </Link>
            </div>

            {/* User Menu */}
            <div className="flex items-center gap-2">
              <button
                onClick={handleLogout}
                className="flex items-center gap-1 text-gray-300 hover:text-white transition-colors text-xs px-2 py-1 rounded hover:bg-gray-800/30"
              >
                <ArrowRightOnRectangleIcon className="w-3.5 h-3.5" />
                <span className="hidden md:inline">Logout</span>
              </button>
            </div>
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <main className="pt-16 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
        {/* Welcome Section */}
        <div className="mb-8">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div>
              <h1 className="text-2xl font-bold text-white">Welcome back, {user?.name || 'User'}!</h1>
              <p className="text-gray-400 mt-1">Here's what's happening with your shipments today.</p>
            </div>
            <UserProfileInfo />
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {/* Active Shipments Card */}
          <div className="bg-gradient-to-br from-indigo-500/10 to-indigo-600/10 p-6 rounded-xl backdrop-blur-lg border border-indigo-500/20">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-gray-400 text-sm font-medium">Active Shipments</h3>
              <TruckIcon className="w-5 h-5 text-indigo-500" />
            </div>
            <div className="flex items-baseline justify-between">
              <p className="text-3xl font-bold text-white">{stats.active_shipments}</p>
              <span className="flex items-center text-green-500 text-sm">
                <ArrowUpIcon className="w-4 h-4 mr-1" />
                12%
              </span>
            </div>
          </div>

          {/* Delivered This Month Card */}
          <div className="bg-gradient-to-br from-green-500/10 to-green-600/10 p-6 rounded-xl backdrop-blur-lg border border-green-500/20">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-gray-400 text-sm font-medium">Delivered This Month</h3>
              <ChartBarIcon className="w-5 h-5 text-green-500" />
            </div>
            <div className="flex items-baseline justify-between">
              <p className="text-3xl font-bold text-white">{stats.delivered_month}</p>
              <span className="flex items-center text-green-500 text-sm">
                <ArrowUpIcon className="w-4 h-4 mr-1" />
                8%
              </span>
            </div>
          </div>

          {/* Delayed Shipments Card */}
          <div className="bg-gradient-to-br from-amber-500/10 to-amber-600/10 p-6 rounded-xl backdrop-blur-lg border border-amber-500/20">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-gray-400 text-sm font-medium">Delayed Shipments</h3>
              <ClockIcon className="w-5 h-5 text-amber-500" />
            </div>
            <div className="flex items-baseline justify-between">
              <p className="text-3xl font-bold text-white">{stats.delayed_shipments}</p>
              <span className="flex items-center text-red-500 text-sm">
                <ArrowDownIcon className="w-4 h-4 mr-1" />
                3%
              </span>
            </div>
          </div>

          {/* Total Inventory Value Card */}
          <div className="bg-gradient-to-br from-emerald-500/10 to-emerald-600/10 p-6 rounded-xl backdrop-blur-lg border border-emerald-500/20">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-gray-400 text-sm font-medium">Total Inventory Value</h3>
              <CurrencyDollarIcon className="w-5 h-5 text-emerald-500" />
            </div>
            <div className="flex items-baseline justify-between">
              <p className="text-3xl font-bold text-white">${stats.total_inventory_value.toLocaleString()}</p>
              <span className="flex items-center text-green-500 text-sm">
                <ArrowUpIcon className="w-4 h-4 mr-1" />
                5%
              </span>
            </div>
          </div>
        </div>

        {/* Recent Shipments Table */}
        <div className="bg-white/5 rounded-xl backdrop-blur-lg border border-white/10 overflow-hidden">
          <div className="p-6 border-b border-white/10">
            <h2 className="text-xl font-semibold text-white">Recent Shipments</h2>
            <p className="text-gray-400 text-sm mt-1">Track your latest shipments and their status</p>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="text-left text-gray-400 border-b border-white/10">
                  <th className="px-6 py-4 font-medium">Tracking ID</th>
                  <th className="px-6 py-4 font-medium">Category</th>
                  <th className="px-6 py-4 font-medium">Origin</th>
                  <th className="px-6 py-4 font-medium">Destination</th>
                  <th className="px-6 py-4 font-medium">Departure</th>
                  <th className="px-6 py-4 font-medium">ETA</th>
                  <th className="px-6 py-4 font-medium">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/10">
                {shipments.map((shipment) => (
                  <tr key={shipment.tracking_id} className="hover:bg-white/5 transition-colors">
                    <td className="px-6 py-4 text-sm">{shipment.tracking_id}</td>
                    <td className="px-6 py-4 text-sm">{shipment.product_category}</td>
                    <td className="px-6 py-4 text-sm">{shipment.origin}</td>
                    <td className="px-6 py-4 text-sm">{shipment.destination}</td>
                    <td className="px-6 py-4 text-sm">{shipment.departure_date}</td>
                    <td className="px-6 py-4 text-sm">{shipment.eta}</td>
                    <td className="px-6 py-4">
                      <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                        shipment.status === 'In Transit' ? 'bg-indigo-500/20 text-indigo-400' :
                        shipment.status === 'Delivered' ? 'bg-green-500/20 text-green-400' :
                        'bg-amber-500/20 text-amber-400'
                      }`}>
                        {shipment.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </main>
    </div>
  );
}

