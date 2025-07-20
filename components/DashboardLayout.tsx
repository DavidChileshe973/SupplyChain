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
  ChartPieIcon,
  Cog6ToothIcon,
  ShoppingBagIcon
} from "@heroicons/react/24/outline";
import "leaflet/dist/leaflet.css";


export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [user, setUser] = useState<any>(null);

  useEffect(() => {
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

  if (!isAuthenticated) {
    return null;
  }

  return (
    <div className="min-h-screen bg-[#0f172a] text-white">
      {/* Navigation Bar */}
      <nav className="fixed top-0 left-0 right-0 bg-[rgba(15,23,42,0.8)] backdrop-blur-lg border-b border-white/10 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-14">
            {/* Logo and Brand */}
            <div className="flex items-center gap-2">
              <TruckIcon className="w-6 h-6 text-indigo-500" />
              <span className="text-xl font-bold">
                Supply<span className="text-green-500">Flow</span>
              </span>
            </div>

            {/* Navigation Links */}
            <div className="hidden md:flex items-center space-x-1">
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
              <Link 
                href="/analytics" 
                className="flex items-center gap-1 text-gray-300 hover:text-white transition-colors text-xs px-2 py-1 rounded hover:bg-gray-800/30"
              >
                <ChartPieIcon className="w-3.5 h-3.5" />
                Analytics
              </Link>
              <Link 
                href="/products" 
                className="flex items-center gap-1 text-gray-300 hover:text-white transition-colors text-xs px-2 py-1 rounded hover:bg-gray-800/30"
              >
                <ShoppingBagIcon className="w-3.5 h-3.5" />
                Products
              </Link>
              <Link 
                href="/settings" 
                className="flex items-center gap-1 text-gray-300 hover:text-white transition-colors text-xs px-2 py-1 rounded hover:bg-gray-800/30"
              >
                <Cog6ToothIcon className="w-3.5 h-3.5" />
                Settings
              </Link>
            </div>

            {/* User Menu */}
            <div className="flex items-center gap-2">
              <UserProfileInfo />
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

      {/* Main Layout */}
      <div className="flex pt-14">
        {/* Sidebar */}
        <aside className="fixed left-0 top-14 h-[calc(100vh-3.5rem)] w-64 bg-[rgba(15,23,42,0.8)] backdrop-blur-lg border-r border-white/10 hidden md:block">
          <div className="p-4">
            <ul className="space-y-1">
              <li>
                <Link
                  href="/dashboard"
                  className="flex items-center gap-2 px-3 py-2 rounded text-sm text-gray-300 hover:text-white hover:bg-gray-800/30 transition-colors"
                >
                  <ChartBarIcon className="w-4 h-4" />
                  Overview
                </Link>
              </li>
              <li>
                <Link
                  href="/shipments"
                  className="flex items-center gap-2 px-3 py-2 rounded text-sm text-gray-300 hover:text-white hover:bg-gray-800/30 transition-colors"
                >
                  <TruckIcon className="w-4 h-4" />
                  Shipments
                </Link>
              </li>
              <li>
                <Link
                  href="/inventory"
                  className="flex items-center gap-2 px-3 py-2 rounded text-sm text-gray-300 hover:text-white hover:bg-gray-800/30 transition-colors"
                >
                  <CubeIcon className="w-4 h-4" />
                  Inventory
                </Link>
              </li>
              <li>
                <Link
                  href="/analytics"
                  className="flex items-center gap-2 px-3 py-2 rounded text-sm text-gray-300 hover:text-white hover:bg-gray-800/30 transition-colors"
                >
                  <ChartPieIcon className="w-4 h-4" />
                  Analytics
                </Link>
              </li>
            </ul>
          </div>
        </aside>

        {/* Main Content */}
        <main className="flex-1 md:ml-64 p-4 sm:p-6">
          {children}
        </main>
      </div>
    </div>
  );
} 