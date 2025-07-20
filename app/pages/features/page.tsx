"use client";
import { motion } from "framer-motion";
import { 
  TruckIcon, 
  CubeIcon, 
  ChartBarIcon,
  MapIcon,
  ShieldCheckIcon,
  BoltIcon,
  GlobeAltIcon,
  CurrencyDollarIcon,
  ClockIcon,
  BellIcon
} from "@heroicons/react/24/outline";

const features = [
  {
    title: "Real-time Shipment Tracking",
    description: "Track your shipments in real-time with GPS integration and automated status updates.",
    icon: TruckIcon,
    subIcon: MapIcon,
    color: "indigo"
  },
  {
    title: "Inventory Management",
    description: "Comprehensive inventory tracking with automated reorder points and stock level alerts.",
    icon: CubeIcon,
    subIcon: ShieldCheckIcon,
    color: "green"
  },
  {
    title: "Advanced Analytics",
    description: "Get detailed insights into your supply chain performance with customizable dashboards.",
    icon: ChartBarIcon,
    subIcon: BoltIcon,
    color: "amber"
  },
  {
    title: "Global Logistics Network",
    description: "Access a vast network of logistics partners and shipping routes worldwide.",
    icon: GlobeAltIcon,
    subIcon: MapIcon,
    color: "blue"
  },
  {
    title: "Cost Optimization",
    description: "Automated cost analysis and optimization recommendations for your supply chain.",
    icon: CurrencyDollarIcon,
    subIcon: BoltIcon,
    color: "emerald"
  },
  {
    title: "Smart Notifications",
    description: "Real-time alerts and notifications for shipment status, delays, and important updates.",
    icon: BellIcon,
    subIcon: ClockIcon,
    color: "purple"
  }
];

export default function FeaturesPage() {
  return (
    <div className="min-h-screen bg-[#0f172a] text-white">
      {/* Hero Section */}
      <div className="pt-32 pb-20 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          className="text-center"
        >
          <h1 className="text-4xl md:text-6xl font-bold mb-6">
            Powerful Features for Modern Supply Chain
          </h1>
          <p className="text-xl text-gray-400 max-w-3xl mx-auto">
            Discover how SupplyFlow's comprehensive feature set can transform your supply chain operations
          </p>
        </motion.div>
      </div>

      {/* Features Grid */}
      <div className="py-20 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
          {features.map((feature, index) => (
            <motion.div
              key={feature.title}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: index * 0.1 }}
              whileHover={{ scale: 1.02 }}
              className={`bg-white/5 rounded-xl p-6 backdrop-blur-lg border border-white/10`}
            >
              <div className="flex items-center gap-4 mb-4">
                <feature.icon className={`w-12 h-12 text-${feature.color}-500`} />
                <feature.subIcon className={`w-8 h-8 text-${feature.color}-400`} />
              </div>
              <h3 className="text-xl font-semibold mb-2">{feature.title}</h3>
              <p className="text-gray-400">{feature.description}</p>
            </motion.div>
          ))}
        </div>
      </div>

      {/* CTA Section */}
      <motion.div
        initial={{ opacity: 0 }}
        whileInView={{ opacity: 1 }}
        viewport={{ once: true }}
        className="py-20 text-center bg-white/5"
      >
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-3xl font-bold mb-6">Ready to Get Started?</h2>
          <p className="text-gray-400 mb-8">
            Join thousands of businesses that trust SupplyFlow for their supply chain management needs.
          </p>
          <motion.div
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            <a
              href="/auth/signup"
              className="bg-indigo-600 hover:bg-indigo-700 text-white px-8 py-3 rounded-md text-lg font-medium transition-colors inline-block"
            >
              Start Free Trial
            </a>
          </motion.div>
        </div>
      </motion.div>
    </div>
  );
} 