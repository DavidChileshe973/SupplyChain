"use client";
import { motion } from "framer-motion";
import { useState } from "react";
import { 
  EnvelopeIcon,
  PhoneIcon,
  MapPinIcon,
  BuildingOfficeIcon
} from "@heroicons/react/24/outline";

const offices = [
  {
    city: "San Francisco",
    address: "100 Market Street, Suite 300",
    phone: "+1 (415) 555-0123",
    email: "sf@supplyflow.com"
  },
  {
    city: "London",
    address: "20 St Mary Axe, 30th Floor",
    phone: "+44 20 7123 4567",
    email: "london@supplyflow.com"
  },
  {
    city: "Singapore",
    address: "71 Robinson Road, #14-01",
    phone: "+65 6123 4567",
    email: "singapore@supplyflow.com"
  }
];

export default function ContactPage() {
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    company: "",
    message: ""
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // Handle form submission
    console.log(formData);
  };

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
            Get in Touch
          </h1>
          <p className="text-xl text-gray-400 max-w-3xl mx-auto">
            Have questions? We're here to help. Reach out to our team and we'll get back to you as soon as possible.
          </p>
        </motion.div>
      </div>

      {/* Contact Form and Offices */}
      <div className="py-20 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
        <div className="grid md:grid-cols-2 gap-12">
          {/* Contact Form */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            className="bg-white/5 rounded-xl p-8 backdrop-blur-lg border border-white/10"
          >
            <h2 className="text-2xl font-bold mb-6">Send us a Message</h2>
            <form onSubmit={handleSubmit} className="space-y-6">
              <div>
                <label htmlFor="name" className="block text-sm font-medium mb-2">
                  Name
                </label>
                <input
                  type="text"
                  id="name"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full px-4 py-2 bg-white/5 border border-white/10 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  required
                />
              </div>
              <div>
                <label htmlFor="email" className="block text-sm font-medium mb-2">
                  Email
                </label>
                <input
                  type="email"
                  id="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  className="w-full px-4 py-2 bg-white/5 border border-white/10 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  required
                />
              </div>
              <div>
                <label htmlFor="company" className="block text-sm font-medium mb-2">
                  Company
                </label>
                <input
                  type="text"
                  id="company"
                  value={formData.company}
                  onChange={(e) => setFormData({ ...formData, company: e.target.value })}
                  className="w-full px-4 py-2 bg-white/5 border border-white/10 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>
              <div>
                <label htmlFor="message" className="block text-sm font-medium mb-2">
                  Message
                </label>
                <textarea
                  id="message"
                  value={formData.message}
                  onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                  rows={4}
                  className="w-full px-4 py-2 bg-white/5 border border-white/10 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  required
                />
              </div>
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                type="submit"
                className="w-full bg-indigo-600 hover:bg-indigo-700 text-white py-3 rounded-md font-medium transition-colors"
              >
                Send Message
              </motion.button>
            </form>
          </motion.div>

          {/* Office Locations */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            className="space-y-8"
          >
            <h2 className="text-2xl font-bold mb-6">Our Offices</h2>
            {offices.map((office, index) => (
              <motion.div
                key={office.city}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.1 }}
                className="bg-white/5 rounded-xl p-6 backdrop-blur-lg border border-white/10"
              >
                <div className="flex items-start gap-4">
                  <BuildingOfficeIcon className="w-6 h-6 text-indigo-500 flex-shrink-0 mt-1" />
                  <div>
                    <h3 className="text-xl font-semibold mb-2">{office.city}</h3>
                    <div className="space-y-2 text-gray-400">
                      <p className="flex items-center gap-2">
                        <MapPinIcon className="w-5 h-5" />
                        {office.address}
                      </p>
                      <p className="flex items-center gap-2">
                        <PhoneIcon className="w-5 h-5" />
                        {office.phone}
                      </p>
                      <p className="flex items-center gap-2">
                        <EnvelopeIcon className="w-5 h-5" />
                        {office.email}
                      </p>
                    </div>
                  </div>
                </div>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </div>

      {/* FAQ Section */}
      <motion.div
        initial={{ opacity: 0 }}
        whileInView={{ opacity: 1 }}
        viewport={{ once: true }}
        className="py-20 bg-white/5"
      >
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-3xl font-bold text-center mb-12">Frequently Asked Questions</h2>
          <div className="space-y-8">
            {[
              {
                question: "What is your typical response time?",
                answer: "We aim to respond to all inquiries within 24 hours during business days."
              },
              {
                question: "Do you offer support outside business hours?",
                answer: "Yes, we provide 24/7 support for our enterprise customers."
              },
              {
                question: "How can I schedule a demo?",
                answer: "You can schedule a demo through our website or by contacting our sales team directly."
              }
            ].map((faq, index) => (
              <motion.div
                key={faq.question}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.1 }}
                className="bg-white/5 rounded-lg p-6"
              >
                <h3 className="text-xl font-semibold mb-2">{faq.question}</h3>
                <p className="text-gray-400">{faq.answer}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </motion.div>
    </div>
  );
} 