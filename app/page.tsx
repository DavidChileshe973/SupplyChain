"use client";
import Link from "next/link";
import { motion } from "framer-motion";
import { 
  ChartBarIcon, 
  TruckIcon, 
  CubeIcon, 
  ArrowRightOnRectangleIcon,
  UserCircleIcon,
  ArrowUpIcon,
  ArrowDownIcon,
  ClockIcon,
  CurrencyDollarIcon,
  GlobeAltIcon,
  ShieldCheckIcon,
  ChartPieIcon,
  BoltIcon,
  MapIcon
} from "@heroicons/react/24/outline";
import "leaflet/dist/leaflet.css";


export default function LandingPage() {
  return (
    <div className="min-h-screen bg-[#0f172a] text-white">
      {/* Navigation Bar */}
      <motion.nav 
        initial={{ y: -100 }}
        animate={{ y: 0 }}
        transition={{ duration: 0.5 }}
        className="fixed top-0 left-0 right-0 bg-[rgba(15,23,42,0.8)] backdrop-blur-lg border-b border-white/10 z-50"
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            {/* Logo and Brand */}
            <motion.div 
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.2 }}
              className="flex items-center gap-2"
            >
              <TruckIcon className="w-8 h-8 text-indigo-500" />
              <span className="text-2xl font-bold">
                Supply<span className="text-green-500">Flow</span>
              </span>
            </motion.div>

            {/* Navigation Links */}
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.3 }}
              className="hidden md:flex items-center space-x-4"
            >
              <a href="/pages/features" className="text-gray-300 hover:text-white transition-colors">Features</a>
              <a href="/#" className="text-gray-300 hover:text-white transition-colors">Pricing</a>
              <a href="/pages/about" className="text-gray-300 hover:text-white transition-colors">About</a>
            </motion.div>

            {/* Auth Buttons */}
            <motion.div 
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.4 }}
              className="flex items-center gap-4"
            >
              <Link 
                href="/auth/login" 
                className="text-gray-300 hover:text-white transition-colors"
              >
                Login
              </Link>
              <Link 
                href="/auth/signup" 
                className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-md transition-colors"
              >
                Get Started
              </Link>
            </motion.div>
          </div>
        </div>
      </motion.nav>

      {/* Hero Section */}
      <main className="pt-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            className="py-20 md:py-32"
          >
            <div className="text-center">
              <motion.h1 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
                className="text-4xl md:text-6xl font-bold mb-6"
              >
                Streamline Your Supply Chain with
                <span className="text-green-500"> SupplyFlow</span>
              </motion.h1>
              <motion.p 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.4 }}
                className="text-xl text-gray-400 mb-8 max-w-3xl mx-auto"
              >
                Modern supply chain management solution that helps you track shipments, manage inventory, and optimize your logistics operations.
              </motion.p>
              <motion.div 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.6 }}
                className="flex justify-center gap-4"
              >
                <Link 
                  href="/auth/signup" 
                  className="bg-indigo-600 hover:bg-indigo-700 text-white px-8 py-3 rounded-md text-lg font-medium transition-colors"
                >
                  Start Free Trial
                </Link>
                <Link 
                  href="/pages/demo" 
                  className="bg-white/10 hover:bg-white/20 text-white px-8 py-3 rounded-md text-lg font-medium transition-colors"
                >
                  Watch Demo
                </Link>
              </motion.div>
            </div>
          </motion.div>

          {/* Features Section */}
          <motion.div 
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8 }}
            id="features" 
            className="py-20"
          >
            <h2 className="text-3xl font-bold text-center mb-12">Key Features</h2>
            <div className="grid md:grid-cols-3 gap-8">
              <motion.div 
                whileHover={{ scale: 1.05 }}
                className="bg-white/5 rounded-xl p-6 backdrop-blur-lg border border-white/10"
              >
                <div className="flex items-center gap-4 mb-4">
                  <TruckIcon className="w-12 h-12 text-indigo-500" />
                  <MapIcon className="w-8 h-8 text-indigo-400" />
                </div>
                <h3 className="text-xl font-semibold mb-2">Real-time Tracking</h3>
                <p className="text-gray-400">Monitor your shipments in real-time with advanced tracking capabilities.</p>
              </motion.div>
              <motion.div 
                whileHover={{ scale: 1.05 }}
                className="bg-white/5 rounded-xl p-6 backdrop-blur-lg border border-white/10"
              >
                <div className="flex items-center gap-4 mb-4">
                  <CubeIcon className="w-12 h-12 text-green-500" />
                  <ShieldCheckIcon className="w-8 h-8 text-green-400" />
                </div>
                <h3 className="text-xl font-semibold mb-2">Inventory Management</h3>
                <p className="text-gray-400">Efficiently manage your inventory with automated tracking and alerts.</p>
              </motion.div>
              <motion.div 
                whileHover={{ scale: 1.05 }}
                className="bg-white/5 rounded-xl p-6 backdrop-blur-lg border border-white/10"
              >
                <div className="flex items-center gap-4 mb-4">
                  <ChartBarIcon className="w-12 h-12 text-amber-500" />
                  <BoltIcon className="w-8 h-8 text-amber-400" />
                </div>
                <h3 className="text-xl font-semibold mb-2">Analytics Dashboard</h3>
                <p className="text-gray-400">Get insights into your supply chain performance with detailed analytics.</p>
              </motion.div>
            </div>
          </motion.div>

          {/* CTA Section */}
          <motion.div 
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8 }}
            className="py-20 text-center"
          >
            <h2 className="text-3xl font-bold mb-6">Ready to Transform Your Supply Chain?</h2>
            <p className="text-gray-400 mb-8 max-w-2xl mx-auto">
              Join thousands of businesses that trust SupplyFlow for their supply chain management needs.
            </p>
            <motion.div
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              <Link 
                href="/auth/signup" 
                className="bg-indigo-600 hover:bg-indigo-700 text-white px-8 py-3 rounded-md text-lg font-medium transition-colors inline-block"
              >
                Get Started Now
              </Link>
            </motion.div>
          </motion.div>
        </div>
      </main>

      {/* Footer */}
      <motion.footer 
        initial={{ opacity: 0 }}
        whileInView={{ opacity: 1 }}
        viewport={{ once: true }}
        transition={{ duration: 0.8 }}
        className="bg-[rgba(15,23,42,0.8)] backdrop-blur-lg border-t border-white/10"
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="grid md:grid-cols-4 gap-8">
            <div>
              <motion.div 
                whileHover={{ scale: 1.05 }}
                className="flex items-center gap-2 mb-4"
              >
                <TruckIcon className="w-6 h-6 text-indigo-500" />
                <span className="text-xl font-bold">
                  Supply<span className="text-green-500">Flow</span>
                </span>
              </motion.div>
              <p className="text-gray-400">Modern supply chain management solution for businesses of all sizes.</p>
            </div>
            <div>
              <h3 className="font-semibold mb-4">Product</h3>
              <ul className="space-y-2 text-gray-400">
                <motion.li whileHover={{ x: 5 }}><a href="/pages/features" className="hover:text-white transition-colors">Features</a></motion.li>
                <motion.li whileHover={{ x: 5 }}><a href="/#" className="hover:text-white transition-colors">Pricing</a></motion.li>
                <motion.li whileHover={{ x: 5 }}><a href="/pages/demo" className="hover:text-white transition-colors">Demo</a></motion.li>
              </ul>
            </div>
            <div>
              <h3 className="font-semibold mb-4">Company</h3>
              <ul className="space-y-2 text-gray-400">
                <motion.li whileHover={{ x: 5 }}><a href="/pages/about" className="hover:text-white transition-colors">About</a></motion.li>
                <motion.li whileHover={{ x: 5 }}><a href="/pages/contact" className="hover:text-white transition-colors">Contact</a></motion.li>
                <motion.li whileHover={{ x: 5 }}><a href="/pages/careers" className="hover:text-white transition-colors">Careers</a></motion.li>
              </ul>
            </div>
            <div>
              <h3 className="font-semibold mb-4">Legal</h3>
              <ul className="space-y-2 text-gray-400">
                <motion.li whileHover={{ x: 5 }}><a href="/pages/privacy" className="hover:text-white transition-colors">Privacy</a></motion.li>
                <motion.li whileHover={{ x: 5 }}><a href="#terms" className="hover:text-white transition-colors">Terms</a></motion.li>
                <motion.li whileHover={{ x: 5 }}><a href="#security" className="hover:text-white transition-colors">Security</a></motion.li>
              </ul>
            </div>
          </div>
          <div className="mt-12 pt-8 border-t border-white/10 text-center text-gray-400">
            <p>&copy; {new Date().getFullYear()} SupplyFlow. All rights reserved.</p>
          </div>
        </div>
      </motion.footer>
    </div>
  );
}

