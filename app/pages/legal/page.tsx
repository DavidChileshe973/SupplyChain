"use client";
import { motion } from "framer-motion";
import { 
  ShieldCheckIcon,
  DocumentTextIcon,
  LockClosedIcon,
  UserGroupIcon
} from "@heroicons/react/24/outline";

const legalSections = [
  {
    title: "Privacy Policy",
    icon: UserGroupIcon,
    color: "text-blue-500",
    content: [
      {
        heading: "Information We Collect",
        text: "We collect information that you provide directly to us, including your name, email address, and company information. We also collect information about your use of our services and your interactions with our platform."
      },
      {
        heading: "How We Use Your Information",
        text: "We use the information we collect to provide, maintain, and improve our services, to develop new features, and to protect SupplyFlow and our users."
      },
      {
        heading: "Information Sharing",
        text: "We do not share your personal information with third parties except as described in this policy. We may share information with your consent or to comply with legal obligations."
      }
    ]
  },
  {
    title: "Terms of Service",
    icon: DocumentTextIcon,
    color: "text-green-500",
    content: [
      {
        heading: "Acceptance of Terms",
        text: "By accessing or using SupplyFlow, you agree to be bound by these Terms of Service and all applicable laws and regulations."
      },
      {
        heading: "User Responsibilities",
        text: "You are responsible for maintaining the confidentiality of your account and for all activities that occur under your account."
      },
      {
        heading: "Service Modifications",
        text: "We reserve the right to modify or discontinue, temporarily or permanently, the Service with or without notice."
      }
    ]
  },
  {
    title: "Security",
    icon: ShieldCheckIcon,
    color: "text-purple-500",
    content: [
      {
        heading: "Data Protection",
        text: "We implement appropriate technical and organizational measures to protect your personal data against unauthorized access, alteration, disclosure, or destruction."
      },
      {
        heading: "Security Measures",
        text: "Our security measures include encryption, secure servers, regular security assessments, and strict access controls."
      },
      {
        heading: "Incident Response",
        text: "We have established procedures to handle security incidents and will notify affected users in accordance with applicable laws."
      }
    ]
  },
  {
    title: "Compliance",
    icon: LockClosedIcon,
    color: "text-red-500",
    content: [
      {
        heading: "GDPR Compliance",
        text: "We comply with the General Data Protection Regulation (GDPR) and other applicable data protection laws."
      },
      {
        heading: "Data Processing",
        text: "We process personal data in accordance with applicable laws and regulations, and we maintain appropriate records of our processing activities."
      },
      {
        heading: "User Rights",
        text: "You have the right to access, correct, or delete your personal data, and to object to or restrict certain processing of your data."
      }
    ]
  }
];

export default function LegalPage() {
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
            Legal Information
          </h1>
          <p className="text-xl text-gray-400 max-w-3xl mx-auto">
            Important information about our policies, terms, and security measures.
          </p>
        </motion.div>
      </div>

      {/* Legal Sections */}
      <div className="py-20 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
        <div className="grid md:grid-cols-2 gap-12">
          {legalSections.map((section, index) => (
            <motion.div
              key={section.title}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: index * 0.1 }}
              className="bg-white/5 rounded-xl p-8 backdrop-blur-lg border border-white/10"
            >
              <div className="flex items-center gap-4 mb-6">
                <section.icon className={`w-8 h-8 ${section.color}`} />
                <h2 className="text-2xl font-bold">{section.title}</h2>
              </div>
              <div className="space-y-6">
                {section.content.map((item, itemIndex) => (
                  <motion.div
                    key={item.heading}
                    initial={{ opacity: 0, x: -20 }}
                    whileInView={{ opacity: 1, x: 0 }}
                    viewport={{ once: true }}
                    transition={{ delay: itemIndex * 0.1 }}
                  >
                    <h3 className="text-xl font-semibold mb-2">{item.heading}</h3>
                    <p className="text-gray-400">{item.text}</p>
                  </motion.div>
                ))}
              </div>
            </motion.div>
          ))}
        </div>
      </div>

      {/* Last Updated Section */}
      <motion.div
        initial={{ opacity: 0 }}
        whileInView={{ opacity: 1 }}
        viewport={{ once: true }}
        className="py-20 bg-white/5"
      >
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <p className="text-gray-400">
            Last updated: {new Date().toLocaleDateString()}
          </p>
          <p className="text-gray-400 mt-4">
            For any questions regarding our legal policies, please contact our legal team at legal@supplyflow.com
          </p>
        </div>
      </motion.div>
    </div>
  );
} 