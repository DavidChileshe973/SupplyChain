"use client";
import { motion } from "framer-motion";
import { 
  BriefcaseIcon,
  BuildingOfficeIcon,
  ChartBarIcon,
  GlobeAltIcon,
  HeartIcon,
  SparklesIcon
} from "@heroicons/react/24/outline";

const benefits = [
  {
    title: "Health & Wellness",
    description: "Comprehensive health coverage, mental health support, and wellness programs.",
    icon: HeartIcon,
    color: "text-red-500"
  },
  {
    title: "Learning & Development",
    description: "Continuous learning opportunities, conference attendance, and professional development budget.",
    icon: ChartBarIcon,
    color: "text-blue-500"
  },
  {
    title: "Work-Life Balance",
    description: "Flexible work arrangements, unlimited PTO, and remote work options.",
    icon: GlobeAltIcon,
    color: "text-green-500"
  },
  {
    title: "Career Growth",
    description: "Clear career paths, mentorship programs, and internal mobility opportunities.",
    icon: SparklesIcon,
    color: "text-purple-500"
  }
];

const openPositions = [
  {
    title: "Senior Software Engineer",
    department: "Engineering",
    location: "San Francisco, CA",
    type: "Full-time",
    description: "Join our core engineering team to build and scale our supply chain platform."
  },
  {
    title: "Product Manager",
    department: "Product",
    location: "Remote",
    type: "Full-time",
    description: "Lead product initiatives and drive the development of new features."
  },
  {
    title: "Sales Representative",
    department: "Sales",
    location: "London, UK",
    type: "Full-time",
    description: "Drive revenue growth by acquiring and managing enterprise clients."
  },
  {
    title: "UX Designer",
    department: "Design",
    location: "Singapore",
    type: "Full-time",
    description: "Create intuitive and beautiful user experiences for our platform."
  }
];

export default function CareersPage() {
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
            Join Our Team
          </h1>
          <p className="text-xl text-gray-400 max-w-3xl mx-auto">
            Help us transform the future of supply chain management. We're looking for passionate individuals who want to make a difference.
          </p>
        </motion.div>
      </div>

      {/* Culture Section */}
      <div className="py-20 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
        <motion.div
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          className="text-center mb-16"
        >
          <h2 className="text-3xl font-bold mb-6">Our Culture</h2>
          <p className="text-xl text-gray-400 max-w-3xl mx-auto">
            At SupplyFlow, we believe in creating an environment where innovation thrives and people can do their best work.
          </p>
        </motion.div>

        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
          {benefits.map((benefit, index) => (
            <motion.div
              key={benefit.title}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: index * 0.1 }}
              className="bg-white/5 rounded-xl p-6 backdrop-blur-lg border border-white/10"
            >
              <benefit.icon className={`w-12 h-12 ${benefit.color} mb-4`} />
              <h3 className="text-xl font-semibold mb-2">{benefit.title}</h3>
              <p className="text-gray-400">{benefit.description}</p>
            </motion.div>
          ))}
        </div>
      </div>

      {/* Open Positions */}
      <div className="py-20 bg-white/5">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            className="text-center mb-16"
          >
            <h2 className="text-3xl font-bold mb-6">Open Positions</h2>
            <p className="text-xl text-gray-400 max-w-3xl mx-auto">
              Explore our current openings and find the perfect role for you.
            </p>
          </motion.div>

          <div className="grid md:grid-cols-2 gap-8">
            {openPositions.map((position, index) => (
              <motion.div
                key={position.title}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.1 }}
                className="bg-white/5 rounded-xl p-6 backdrop-blur-lg border border-white/10"
              >
                <div className="flex items-start gap-4">
                  <BriefcaseIcon className="w-6 h-6 text-indigo-500 flex-shrink-0 mt-1" />
                  <div>
                    <h3 className="text-xl font-semibold mb-2">{position.title}</h3>
                    <div className="space-y-2 text-gray-400">
                      <p className="flex items-center gap-2">
                        <BuildingOfficeIcon className="w-5 h-5" />
                        {position.department}
                      </p>
                      <p>{position.location}</p>
                      <p>{position.type}</p>
                      <p className="mt-4">{position.description}</p>
                    </div>
                    <motion.button
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      className="mt-6 bg-indigo-600 hover:bg-indigo-700 text-white px-6 py-2 rounded-md font-medium transition-colors"
                    >
                      Apply Now
                    </motion.button>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </div>

      {/* CTA Section */}
      <motion.div
        initial={{ opacity: 0 }}
        whileInView={{ opacity: 1 }}
        viewport={{ once: true }}
        className="py-20 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto text-center"
      >
        <h2 className="text-3xl font-bold mb-6">Don't see the right role?</h2>
        <p className="text-xl text-gray-400 max-w-3xl mx-auto mb-8">
          We're always looking for talented individuals. Send us your resume and we'll keep you in mind for future opportunities.
        </p>
        <motion.button
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          className="bg-indigo-600 hover:bg-indigo-700 text-white px-8 py-3 rounded-md font-medium transition-colors"
        >
          Submit Resume
        </motion.button>
      </motion.div>
    </div>
  );
} 