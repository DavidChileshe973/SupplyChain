"use client";

import React, { useState, useEffect } from "react";
import {
  ArrowTrendingUpIcon,
  ClockIcon,
  ChartBarIcon,
  CurrencyDollarIcon,
} from "@heroicons/react/24/solid";
import { Line, Bar, Doughnut, Radar } from "react-chartjs-2";
import { databases } from "@/lib/appwrite";
import { Query } from "appwrite";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  RadarController,
  Title,
  Tooltip,
  Legend,
  ArcElement,
  RadialLinearScale,
} from "chart.js";

// Chart.js registration
ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  RadarController,
  Title,
  Tooltip,
  Legend,
  ArcElement,
  RadialLinearScale
);

// --- Types ---

export type ShipmentStatus =
  | "pending"
  | "in_transit"
  | "delivered"
  | "delayed"
  | "cancelled"; // Adjust as needed

export type ProductCategory =
  | "electronics"
  | "fashion"
  | "food"
  | "furniture"
  | "other"; // Adjust as needed

export interface Shipment {
  user_id: string;
  tracking_id: string;
  product_category: ProductCategory;
  origin: string;
  destination: string;
  eta: string; // ISO 8601
  delivery_date: string; // ISO 8601
  status: ShipmentStatus;
  created_at: string; // ISO 8601
  updated_at: string; // ISO 8601
  departure_date: string; // ISO 8601
  // Optionally, cost fields if you have them
  cost?: number;
  shippingCost?: number;
  handlingCost?: number;
  storageCost?: number;
  transportationCost?: number;
  otherCost?: number;
}

type AnalyticsData = {
  metrics: {
    onTimeDeliveryRate: number;
    averageTransitTime: number;
    costPerShipment: number;
    totalShipments: number;
  };
  chartData: {
    shipmentVolume: { labels: string[]; data: number[] };
    deliveryPerformance: { labels: string[]; data: number[] };
    costAnalysis: { labels: string[]; data: number[] };
    routeEfficiency: number[];
  };
};

// --- Data Fetching & Analytics ---

export const fetchAnalyticsData = async (): Promise<AnalyticsData | null> => {
  try {

    const shipmentResponse = await databases.listDocuments(
      process.env.NEXT_PUBLIC_APPWRITE_DATABASE_ID!,
      process.env.NEXT_PUBLIC_SHIPMENTS_COLLECTION_ID!,
      [Query.limit(1000)]
    );

    const shipments = shipmentResponse.documents as unknown as Shipment[];

    const totalShipments = shipments.length;
    const onTimeShipments = shipments.filter(
      (s) => s.status === "delivered" && s.delivery_date && s.eta &&
        new Date(s.delivery_date) <= new Date(s.eta)
    ).length;
    const onTimeDeliveryRate =
      totalShipments > 0 ? (onTimeShipments / totalShipments) * 100 : 0;

    // Calculate average transit time (in days)
    const averageTransitTime =
      totalShipments > 0
        ? shipments.reduce((acc, s) => {
            if (s.departure_date && s.delivery_date) {
              const dep = new Date(s.departure_date).getTime();
              const del = new Date(s.delivery_date).getTime();
              return acc + Math.max(0, (del - dep) / (1000 * 60 * 60 * 24));
            }
            return acc;
          }, 0) / totalShipments
        : 0;

    // Calculate cost per shipment (if cost exists)
    const costPerShipment =
      totalShipments > 0
        ? shipments.reduce((acc, s) => acc + (s.cost || 0), 0) / totalShipments
        : 0;

    // Monthly shipment volume (by created_at)
    const monthlyShipments = shipments.reduce(
      (acc: Record<string, number>, shipment) => {
        const month = new Date(shipment.created_at).toLocaleString("default", {
          month: "short",
          year: "numeric",
        });
        acc[month] = (acc[month] || 0) + 1;
        return acc;
      },
      {}
    );

    const shipmentVolume = {
      labels: Object.keys(monthlyShipments),
      data: Object.values(monthlyShipments),
    };

    // Delivery status distribution
    const deliveryStatusCounts = shipments.reduce(
      (acc: Record<string, number>, shipment) => {
        acc[shipment.status] = (acc[shipment.status] || 0) + 1;
        return acc;
      },
      {}
    );

    const deliveryPerformance = {
      labels: Object.keys(deliveryStatusCounts),
      data: Object.values(deliveryStatusCounts),
    };

    // Cost breakdown (if you have these fields)
    const costBreakdown = {
      shipping: shipments.reduce((acc, s) => acc + (s.shippingCost || 0), 0),
      handling: shipments.reduce((acc, s) => acc + (s.handlingCost || 0), 0),
      storage: shipments.reduce((acc, s) => acc + (s.storageCost || 0), 0),
      transportation: shipments.reduce(
        (acc, s) => acc + (s.transportationCost || 0),
        0
      ),
      other: shipments.reduce((acc, s) => acc + (s.otherCost || 0), 0),
    };

    const costAnalysis = {
      labels: ["Shipping", "Handling", "Storage", "Transportation", "Other"],
      data: [
        costBreakdown.shipping,
        costBreakdown.handling,
        costBreakdown.storage,
        costBreakdown.transportation,
        costBreakdown.other,
      ],
    };

    // Route efficiency (example logic)
    const routeEfficiency = [
      (onTimeDeliveryRate / 100) * 5, // Speed (normalized to 5)
      (1 - costPerShipment / 1000) * 5, // Cost (normalized to 5, assuming max cost $1000)
      totalShipments > 0 ? (onTimeShipments / totalShipments) * 5 : 0, // Reliability
      averageTransitTime > 0 ? (1 / averageTransitTime) * 5 : 0, // Capacity
      0.7 * 5, // Placeholder for Flexibility
    ];

    return {
      metrics: {
        onTimeDeliveryRate: Number(onTimeDeliveryRate.toFixed(1)),
        averageTransitTime: Number(averageTransitTime.toFixed(1)),
        costPerShipment: Number(costPerShipment.toFixed(2)),
        totalShipments,
      },
      chartData: {
        shipmentVolume,
        deliveryPerformance,
        costAnalysis,
        routeEfficiency,
      },
    };
  } catch (error) {
    console.error("Error fetching analytics data:", error);
    return null;
  }
};

// --- Main Page ---

export default function AnalyticsPage() {
  const [analyticsData, setAnalyticsData] = useState<AnalyticsData | null>(null);

  useEffect(() => {
    const loadAnalyticsData = async () => {
      const data = await fetchAnalyticsData();
      if (data) setAnalyticsData(data);
    };
    loadAnalyticsData();
  }, []);

  if (!analyticsData) {
    return (
      <div className="min-h-screen bg-slate-900 text-white flex items-center justify-center">
        Loading analytics...
      </div>
    );
  }

  const { metrics, chartData } = analyticsData;

  return (
    <div className="min-h-screen bg-slate-900 text-white">
      {/* Navigation */}
      <nav className="fixed w-full bg-slate-800/80 backdrop-blur-md z-50 border-b border-slate-700">
        <div className="container mx-auto px-4 py-3 flex justify-between items-center">
          <div className="flex items-center space-x-2">
            <ChartBarIcon className="h-8 w-8 text-indigo-500" />
            <span className="text-xl font-bold">
              Supply<span className="text-emerald-500">Flow</span>
            </span>
          </div>
          <div className="space-x-4">
            {[
              "Dashboard",
              "Shipments",
              "Inventory",
              "Analytics",
              "Products",
              "Settings",
            ].map((item) => (
              <a
                key={item}
                href={`/${item.toLowerCase()}`}
                className={`text-sm font-medium ${
                  item === "Analytics"
                    ? "bg-gradient-to-r from-indigo-600 to-emerald-600 px-3 py-2 rounded-md"
                    : "hover:text-indigo-400 transition-colors"
                }`}
              >
                {item}
              </a>
            ))}
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <main className="container mx-auto px-4 pt-24 pb-12">
        <header className="mb-8">
          <h1 className="text-3xl font-bold mb-2">Analytics Dashboard</h1>
          <p className="text-slate-400">
            Comprehensive insights into your supply chain performance
          </p>
        </header>

        {/* Key Metrics */}
        <section className="grid md:grid-cols-4 gap-6 mb-12">
          {[
            {
              title: "On-Time Delivery",
              value: `${metrics.onTimeDeliveryRate}%`,
              icon: <ArrowTrendingUpIcon className="h-6 w-6 text-emerald-500" />,
            },
            {
              title: "Avg Transit Time",
              value: `${metrics.averageTransitTime} days`,
              icon: <ClockIcon className="h-6 w-6 text-indigo-500" />,
            },
            {
              title: "Cost per Shipment",
              value: `$${metrics.costPerShipment}`,
              icon: <CurrencyDollarIcon className="h-6 w-6 text-green-500" />,
            },
            {
              title: "Total Shipments",
              value: `${metrics.totalShipments}`,
              icon: <ChartBarIcon className="h-6 w-6 text-purple-500" />,
            },
          ].map(({ title, value, icon }) => (
            <div
              key={title}
              className="bg-slate-800 rounded-xl p-6 flex items-center justify-between hover:bg-slate-700/50 transition-all"
            >
              <div>
                <p className="text-slate-400 text-sm mb-2">{title}</p>
                <h3 className="text-2xl font-bold">{value}</h3>
              </div>
              {icon}
            </div>
          ))}
        </section>

        {/* Charts */}
        <section className="grid md:grid-cols-2 gap-8">
          {/* Shipment Volume */}
          <div className="bg-slate-800 rounded-xl p-6">
            <h2 className="text-xl font-semibold mb-4">Shipment Volume</h2>
            <Line
              data={{
                labels: chartData.shipmentVolume.labels,
                datasets: [
                  {
                    label: "Shipments",
                    data: chartData.shipmentVolume.data,
                    borderColor: "rgb(99, 102, 241)",
                    backgroundColor: "rgba(99, 102, 241, 0.2)",
                    tension: 0.4,
                  },
                ],
              }}
              options={{
                responsive: true,
                plugins: { legend: { display: false } },
              }}
            />
          </div>

          {/* Delivery Performance */}
          <div className="bg-slate-800 rounded-xl p-6">
            <h2 className="text-xl font-semibold mb-4">Delivery Performance</h2>
            <Bar
              data={{
                labels: chartData.deliveryPerformance.labels,
                datasets: [
                  {
                    data: chartData.deliveryPerformance.data,
                    backgroundColor: [
                      "rgb(16, 185, 129)",
                      "rgb(99, 102, 241)",
                      "rgb(245, 158, 11)",
                      "rgb(239, 68, 68)",
                    ],
                  },
                ],
              }}
              options={{
                responsive: true,
                plugins: { legend: { display: false } },
              }}
            />
          </div>

          {/* Cost Analysis */}
          <div className="bg-slate-800 rounded-xl p-6">
            <h2 className="text-xl font-semibold mb-4">Cost Analysis</h2>
            <Doughnut
              data={{
                labels: chartData.costAnalysis.labels,
                datasets: [
                  {
                    data: chartData.costAnalysis.data,
                    backgroundColor: [
                      "rgb(99, 102, 241)",
                      "rgb(16, 185, 129)",
                      "rgb(245, 158, 11)",
                      "rgb(239, 68, 68)",
                      "rgb(156, 163, 175)",
                    ],
                  },
                ],
              }}
              options={{ responsive: true }}
            />
          </div>

          {/* Route Efficiency */}
          <div className="bg-slate-800 rounded-xl p-6">
            <h2 className="text-xl font-semibold mb-4">Route Efficiency</h2>
            <Radar
              data={{
                labels: [
                  "Speed",
                  "Cost",
                  "Reliability",
                  "Capacity",
                  "Flexibility",
                ],
                datasets: [
                  {
                    data: chartData.routeEfficiency,
                    backgroundColor: "rgba(99, 102, 241, 0.2)",
                    borderColor: "rgb(99, 102, 241)",
                  },
                ],
              }}
              options={{
                responsive: true,
                scales: {
                  r: {
                    beginAtZero: true,
                    max: 5,
                  },
                },
              }}
            />
          </div>
        </section>

        {/* Insights Section */}
        <section className="mt-12 bg-slate-800 rounded-xl p-8">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-2xl font-bold">Key Insights</h2>
            <button className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 rounded-md transition-colors">
              View All
            </button>
          </div>
          <div className="grid md:grid-cols-2 gap-6">
            {[
              {
                icon: "📈",
                title: "Increased Efficiency in Asia-Pacific Routes",
                description:
                  "Average transit time decreased by 12% on routes between China and Australia.",
              },
              {
                icon: "⚠️",
                title: "Potential Delays in European Routes",
                description:
                  "Weather disruptions expected to impact shipments to Germany and France.",
              },
            ].map(({ icon, title, description }) => (
              <div
                key={title}
                className="bg-slate-700 rounded-lg p-6 flex items-start space-x-4"
              >
                <div className="text-3xl">{icon}</div>
                <div>
                  <h3 className="font-semibold text-lg mb-1">{title}</h3>
                  <p className="text-slate-400">{description}</p>
                </div>
              </div>
            ))}
          </div>
        </section>
      </main>
    </div>
  );
}
