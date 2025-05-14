"use client";
import { useEffect, useState } from "react";

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
  const [stats, setStats] = useState<ShipmentStats>({
    active_shipments: 0,
    delivered_month: 0,
    delayed_shipments: 0,
    total_inventory_value: 0
  });

  const [shipments, setShipments] = useState<Shipment[]>([]);

  // Mock data for demonstration
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

  return (
    <div className="min-h-screen bg-[#0f172a] text-white p-8">
      <nav className="fixed top-0 left-0 right-0 bg-[rgba(15,23,42,0.8)] backdrop-blur-lg border-b border-white/20 p-4">
        <div className="max-w-7xl mx-auto flex justify-between items-center">
          <div className="flex items-center gap-2">
            <i className="fas fa-box text-[#6366f1]"></i>
            <span className="text-2xl font-bold">Supply<span className="text-[#10b981]">Flow</span></span>
          </div>
          <div className="flex gap-8">
            <a href="dashboard" className="hover:text-[#6366f1] transition-colors">Dashboard</a>
            <a href="shipments" className="hover:text-[#6366f1] transition-colors">Shipments</a>
            <a href="inventory" className="hover:text-[#6366f1] transition-colors">Inventory</a>
          </div>
        </div>
      </nav>

      <main className="pt-24 max-w-7xl mx-auto">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <div className="bg-white/10 p-6 rounded-lg backdrop-blur-lg">
            <h3 className="text-gray-400 mb-2">Active Shipments</h3>
            <p className="text-3xl font-bold">{stats.active_shipments}</p>
          </div>
          <div className="bg-white/10 p-6 rounded-lg backdrop-blur-lg">
            <h3 className="text-gray-400 mb-2">Delivered This Month</h3>
            <p className="text-3xl font-bold">{stats.delivered_month}</p>
          </div>
          <div className="bg-white/10 p-6 rounded-lg backdrop-blur-lg">
            <h3 className="text-gray-400 mb-2">Delayed Shipments</h3>
            <p className="text-3xl font-bold text-[#f59e0b]">{stats.delayed_shipments}</p>
          </div>
          <div className="bg-white/10 p-6 rounded-lg backdrop-blur-lg">
            <h3 className="text-gray-400 mb-2">Total Inventory Value</h3>
            <p className="text-3xl font-bold">${stats.total_inventory_value.toLocaleString()}</p>
          </div>
        </div>

        <div className="bg-white/10 rounded-lg backdrop-blur-lg p-6">
          <h2 className="text-xl font-semibold mb-4">Recent Shipments</h2>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="text-left text-gray-400 border-b border-white/10">
                  <th className="pb-3">Tracking ID</th>
                  <th className="pb-3">Category</th>
                  <th className="pb-3">Origin</th>
                  <th className="pb-3">Destination</th>
                  <th className="pb-3">Departure</th>
                  <th className="pb-3">ETA</th>
                  <th className="pb-3">Status</th>
                </tr>
              </thead>
              <tbody>
                {shipments.map((shipment) => (
                  <tr key={shipment.tracking_id} className="border-b border-white/10">
                    <td className="py-4">{shipment.tracking_id}</td>
                    <td className="py-4">{shipment.product_category}</td>
                    <td className="py-4">{shipment.origin}</td>
                    <td className="py-4">{shipment.destination}</td>
                    <td className="py-4">{shipment.departure_date}</td>
                    <td className="py-4">{shipment.eta}</td>
                    <td className="py-4">
                      <span className={`px-2 py-1 rounded-full text-sm ${
                        shipment.status === 'In Transit' ? 'bg-[#6366f1]/20 text-[#6366f1]' :
                        shipment.status === 'Delivered' ? 'bg-[#10b981]/20 text-[#10b981]' :
                        'bg-[#f59e0b]/20 text-[#f59e0b]'
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

