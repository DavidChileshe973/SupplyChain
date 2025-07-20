"use client";
import { motion } from "framer-motion";
import { 
  UserGroupIcon,
  GlobeAltIcon,
  TrophyIcon,
  HeartIcon,
  LightBulbIcon,
  ShieldCheckIcon
} from "@heroicons/react/24/outline";

const teamMembers = [
  {
    name: "John Smith",
    role: "CEO & Founder",
    image: "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?ixlib=rb-1.2.1&ixid=eyJhcHBfaWQiOjEyMDd9&auto=format&fit=facearea&facepad=2&w=256&h=256&q=80"
  },
  {
    name: "Sarah Johnson",
    role: "CTO",
    image: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?ixlib=rb-1.2.1&ixid=eyJhcHBfaWQiOjEyMDd9&auto=format&fit=facearea&facepad=2&w=256&h=256&q=80"
  },
  {
    name: "Michael Chen",
    role: "Head of Operations",
    image: "https://images.unsplash.com/photo-1519244703995-f4e0f30006d5?ixlib=rb-1.2.1&ixid=eyJhcHBfaWQiOjEyMDd9&auto=format&fit=facearea&facepad=2&w=256&h=256&q=80"
  }
];

const values = [
  {
    title: "Innovation",
    description: "Constantly pushing boundaries to deliver cutting-edge solutions",
    icon: LightBulbIcon,
    color: "indigo"
  },
  {
    title: "Integrity",
    description: "Building trust through transparency and ethical practices",
    icon: ShieldCheckIcon,
    color: "green"
  },
  {
    title: "Customer Success",
    description: "Dedicated to helping our customers achieve their goals",
    icon: HeartIcon,
    color: "red"
  }
];

export default function AboutPage() {
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
            About SupplyFlow
          </h1>
          <p className="text-xl text-gray-400 max-w-3xl mx-auto">
            We're on a mission to revolutionize supply chain management through technology and innovation
          </p>
        </motion.div>
      </div>

      {/* Story Section */}
      <div className="py-20 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
        <motion.div
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          className="grid md:grid-cols-2 gap-12 items-center"
        >
          <div>
            <h2 className="text-3xl font-bold mb-6">Our Story</h2>
            <p className="text-gray-400 mb-4">
              Founded in 2020, SupplyFlow emerged from a simple observation: supply chain management was ripe for innovation. 
              We saw businesses struggling with outdated systems and complex logistics, and we knew we could make a difference.
            </p>
            <p className="text-gray-400">
              Today, we're proud to serve thousands of businesses worldwide, helping them streamline their operations 
              and achieve greater efficiency in their supply chains.
            </p>
          </div>
          <div className="relative aspect-video bg-white/5 rounded-xl overflow-hidden">
            <div className="absolute inset-0 flex items-center justify-center">
              <GlobeAltIcon className="w-32 h-32 text-indigo-500/20" />
            </div>
          </div>
        </motion.div>
      </div>

      {/* Values Section */}
      <div className="py-20 bg-white/5">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-3xl font-bold text-center mb-12">Our Values</h2>
          <div className="grid md:grid-cols-3 gap-8">
            {values.map((value, index) => (
              <motion.div
                key={value.title}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.1 }}
                className="bg-white/5 rounded-xl p-6 backdrop-blur-lg border border-white/10"
              >
                <value.icon className={`w-12 h-12 text-${value.color}-500 mb-4`} />
                <h3 className="text-xl font-semibold mb-2">{value.title}</h3>
                <p className="text-gray-400">{value.description}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </div>

      {/* Team Section */}
      <div className="py-20 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
        <h2 className="text-3xl font-bold text-center mb-12">Our Leadership Team</h2>
        <div className="grid md:grid-cols-3 gap-8">
          {teamMembers.map((member, index) => (
            <motion.div
              key={member.name}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: index * 0.1 }}
              className="text-center"
            >
              <div className="relative w-48 h-48 mx-auto mb-4">
                <img
                  src={member.image}
                  alt={member.name}
                  className="rounded-full object-cover w-full h-full"
                />
              </div>
              <h3 className="text-xl font-semibold mb-1">{member.name}</h3>
              <p className="text-gray-400">{member.role}</p>
            </motion.div>
          ))}
        </div>
      </div>

      {/* Stats Section */}
      <div className="py-20 bg-white/5">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid md:grid-cols-4 gap-8 text-center">
            {[
              { label: "Customers", value: "10,000+" },
              { label: "Countries", value: "50+" },
              { label: "Shipments", value: "1M+" },
              { label: "Team Members", value: "100+" }
            ].map((stat, index) => (
              <motion.div
                key={stat.label}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.1 }}
              >
                <div className="text-4xl font-bold mb-2">{stat.value}</div>
                <div className="text-gray-400">{stat.label}</div>
              </motion.div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
} 