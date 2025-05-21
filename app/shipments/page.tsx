'use client'

import React, { useState, useEffect } from 'react'
import { 
  TruckIcon, 
  ChartBarIcon, 
  CubeIcon, 
  ArrowRightOnRectangleIcon,
  UserCircleIcon,
  ArrowUpIcon,
  ArrowDownIcon,
  ClockIcon,
  CurrencyDollarIcon,
  MagnifyingGlassIcon,
  HomeIcon,
  ChartPieIcon,
  Cog6ToothIcon,
  BellIcon
} from '@heroicons/react/24/outline'
import { toast } from 'react-hot-toast'
import { Client, Databases, Query } from 'appwrite'
import { ID } from 'appwrite'
import Link from 'next/link'
import UserProfileInfo from '@/components/UserInfo'
import { usePathname } from 'next/navigation'
// import Footer from '@/components/Footer'

// Appwrite Configuration
const client = new Client()
  .setEndpoint(process.env.NEXT_PUBLIC_APPWRITE_ENDPOINT!)
  .setProject(process.env.NEXT_PUBLIC_APPWRITE_PROJECT_ID!)

const databases = new Databases(client)

// Types for better type safety
const PRODUCT_CATEGORIES = ['electronics', 'food'] as const
type ProductCategory = typeof PRODUCT_CATEGORIES[number]

export type Shipment = {
  $id: string
  tracking_id: string
  product_category: ProductCategory
  origin: string
  destination: string
  status: 'In Transit' | 'Processing' | 'Delivered' | 'Delayed'
  departure_date: string
  eta: string
  delivery_date?: string
  user_id: string
  cost: number
}

type ShipmentStats = {
  active_shipments: number
  delivered_today: number
  processing: number
  delayed: number
}

const ShipmentsPage: React.FC = () => {
  const pathname = usePathname()
  const [shipments, setShipments] = useState<Shipment[]>([]);
  const [isCreating, setIsCreating] = useState(false);
  const [stats, setStats] = useState<ShipmentStats>({
    active_shipments: 0,
    delivered_today: 0,
    processing: 0,
    delayed: 0
  });

  const [searchQuery, setSearchQuery] = useState('')
  const [statusFilter, setStatusFilter] = useState<Shipment['status'] | ''>('')

  const [newShipment, setNewShipment] = useState<Partial<Shipment>>({})

  // Modal state
  const [isModalOpen, setIsModalOpen] = useState(false)

  // Modal component
  const Modal: React.FC<{
    isOpen: boolean, 
    onClose: () => void, 
    children: React.ReactNode
  }> = ({ isOpen, onClose, children }) => {
    if (!isOpen) return null

    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
        <div className="bg-slate-800 rounded-lg p-6 relative w-96 max-w-md">
          <button 
            onClick={onClose} 
            className="absolute top-2 right-2 text-gray-400 hover:text-white text-2xl close-modal"
          >
            &times;
          </button>
          {children}
        </div>
      </div>
    )
  }

  const fetchShipments = async () => {
    try {
      // Fetch shipments
      const shipmentsResponse = await databases.listDocuments(
        process.env.NEXT_PUBLIC_APPWRITE_DATABASE_ID!,
        process.env.NEXT_PUBLIC_SHIPMENTS_COLLECTION_ID!,
        [
          Query.orderDesc('$createdAt'),
          Query.limit(10)
        ]
      )

      // Type guard and conversion
      const typedShipments = shipmentsResponse.documents.map(doc => ({
        $id: doc.$id,
        tracking_id: doc.tracking_id || '',
        product_category: PRODUCT_CATEGORIES.includes(doc.product_category) 
          ? doc.product_category 
          : 'electronics',
        origin: doc.origin || '',
        destination: doc.destination || '',
        status: doc.status || 'Processing',
        departure_date: doc.departure_date || '',
        eta: doc.eta || '',
        delivery_date: doc.delivery_date || '',
        user_id: doc.user_id || '',
        cost: doc.cost || 0
      } as Shipment))

      // Calculate stats
      const today = new Date()
      today.setHours(0, 0, 0, 0)

      const deliveredToday = typedShipments.filter(s => {
        if (s.status !== 'Delivered') return false
        const deliveryDate = new Date(s.delivery_date || '')
        deliveryDate.setHours(0, 0, 0, 0)
        return deliveryDate.getTime() === today.getTime()
      }).length

      const activeShipments = typedShipments.filter(
        s => s.status === 'In Transit'
      ).length

      const processingShipments = typedShipments.filter(
        s => s.status === 'Processing'
      ).length

      const delayedShipments = typedShipments.filter(
        s => s.status === 'Delayed'
      ).length

      setShipments(typedShipments)
      setStats({
        active_shipments: activeShipments,
        delivered_today: deliveredToday,
        processing: processingShipments,
        delayed: delayedShipments
      })
    } catch (error) {
      console.error('Failed to fetch shipments:', error)
      toast.error('Failed to fetch shipments')
    }
  }

  const createShipment = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsCreating(true)
    try {
      const trackingId = `SF-${Math.random().toString(36).substring(2, 10).toUpperCase()}`
      
      const shipmentData = {
        ...newShipment,
        tracking_id: trackingId,
        product_category: (newShipment.product_category && PRODUCT_CATEGORIES.includes(newShipment.product_category)) 
          ? newShipment.product_category 
          : 'electronics',
        user_id: '',
        cost: newShipment.cost || 0, // Add cost field
      }

      await databases.createDocument(
        process.env.NEXT_PUBLIC_APPWRITE_DATABASE_ID!,
        process.env.NEXT_PUBLIC_SHIPMENTS_COLLECTION_ID!,
        ID.unique(),
        shipmentData
      )

      toast.success(`Shipment created: ${trackingId}`)
      fetchShipments()
      setNewShipment({})
    } catch (error) {
      console.error('Failed to create shipment:', error)
      toast.error('Failed to create shipment')
    } finally {
      setIsCreating(false)
    }
  }

  useEffect(() => {
    fetchShipments()
  }, [])

  // Refetch when search or status changes
  useEffect(() => {
    fetchShipments()
  }, [searchQuery, statusFilter])

  const filteredShipments = shipments.filter(shipment => 
    (!searchQuery || Object.values(shipment).some(val => 
      val.toString().toLowerCase().includes(searchQuery.toLowerCase())
    )) &&
    (!statusFilter || shipment.status === statusFilter)
  )

  const navigation = [
    { name: 'Dashboard', href: '/dashboard', icon: HomeIcon },
    { name: 'Shipments', href: '/shipments', icon: TruckIcon },
    { name: 'Inventory', href: '/inventory', icon: CubeIcon },
    { name: 'Analytics', href: '/analytics', icon: ChartPieIcon },
    { name: 'Settings', href: '/settings', icon: Cog6ToothIcon },
  ]

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

            {/* Search Bar */}
            <div className="hidden md:flex flex-1 max-w-md mx-8">
              <div className="relative w-full">
                <input
                  type="text"
                  placeholder="Search..."
                  className="w-full bg-white/5 border border-white/10 rounded-lg py-2 pl-10 pr-4 text-sm text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                />
                <MagnifyingGlassIcon className="absolute left-3 top-2.5 h-5 w-5 text-gray-400" />
              </div>
            </div>

            {/* Right Side Actions */}
            <div className="flex items-center gap-4">
              {/* Notifications */}
              <button className="relative p-2 text-gray-400 hover:text-white transition-colors rounded-lg hover:bg-white/5">
                <BellIcon className="w-5 h-5" />
                <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full"></span>
              </button>

              {/* User Profile */}
              <UserProfileInfo />

              {/* Logout Button */}
              <button
                onClick={() => {/* handle logout */}}
                className="hidden md:flex items-center gap-1 text-gray-300 hover:text-white transition-colors text-sm px-3 py-2 rounded-lg hover:bg-white/5"
              >
                <ArrowRightOnRectangleIcon className="w-4 h-4" />
                Logout
              </button>
            </div>
          </div>
        </div>
      </nav>

      {/* Sidebar */}
      <div className="fixed left-0 top-16 h-[calc(100vh-4rem)] w-64 bg-[rgba(15,23,42,0.8)] backdrop-blur-lg border-r border-white/10">
        <div className="p-4">
          <nav className="space-y-1">
            {navigation.map((item) => {
              const isActive = pathname === item.href
              return (
                <Link
                  key={item.name}
                  href={item.href}
                  className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                    isActive 
                      ? 'bg-indigo-500/20 text-indigo-400' 
                      : 'text-gray-400 hover:text-white hover:bg-white/5'
                  }`}
                >
                  <item.icon className="w-5 h-5" />
                  {item.name}
                </Link>
              )
            })}
          </nav>
        </div>
      </div>

      {/* Main Content */}
      <main className="pt-16 pl-64">
        <div className="px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
          {/* Welcome Section */}
          <div className="mb-8">
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
              <div>
                <h1 className="text-2xl font-bold text-white">Shipments Dashboard</h1>
                <p className="text-gray-400 mt-1">Track and manage your shipments in real-time.</p>
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

            {/* Delivered Today Card */}
            <div className="bg-gradient-to-br from-green-500/10 to-green-600/10 p-6 rounded-xl backdrop-blur-lg border border-green-500/20">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-gray-400 text-sm font-medium">Delivered Today</h3>
                <ChartBarIcon className="w-5 h-5 text-green-500" />
              </div>
              <div className="flex items-baseline justify-between">
                <p className="text-3xl font-bold text-white">{stats.delivered_today}</p>
                <span className="flex items-center text-green-500 text-sm">
                  <ArrowUpIcon className="w-4 h-4 mr-1" />
                  8%
                </span>
              </div>
            </div>

            {/* Processing Shipments Card */}
            <div className="bg-gradient-to-br from-amber-500/10 to-amber-600/10 p-6 rounded-xl backdrop-blur-lg border border-amber-500/20">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-gray-400 text-sm font-medium">Processing</h3>
                <ClockIcon className="w-5 h-5 text-amber-500" />
              </div>
              <div className="flex items-baseline justify-between">
                <p className="text-3xl font-bold text-white">{stats.processing}</p>
                <span className="flex items-center text-amber-500 text-sm">
                  <ArrowUpIcon className="w-4 h-4 mr-1" />
                  5%
                </span>
              </div>
            </div>

            {/* Delayed Shipments Card */}
            <div className="bg-gradient-to-br from-red-500/10 to-red-600/10 p-6 rounded-xl backdrop-blur-lg border border-red-500/20">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-gray-400 text-sm font-medium">Delayed</h3>
                <ArrowDownIcon className="w-5 h-5 text-red-500" />
              </div>
              <div className="flex items-baseline justify-between">
                <p className="text-3xl font-bold text-white">{stats.delayed}</p>
                <span className="flex items-center text-red-500 text-sm">
                  <ArrowDownIcon className="w-4 h-4 mr-1" />
                  3%
                </span>
              </div>
            </div>
          </div>

          {/* Create Shipment Form */}
          <div className="bg-white/5 rounded-xl backdrop-blur-lg border border-white/10 overflow-hidden mb-8">
            <div className="p-6 border-b border-white/10">
              <h2 className="text-xl font-semibold text-white">Create New Shipment</h2>
              <p className="text-gray-400 text-sm mt-1">Add a new shipment to your tracking system</p>
            </div>
            <div className="p-6">
              <form onSubmit={createShipment} className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <select
                  value={newShipment.product_category || ''}
                  onChange={(e) => setNewShipment(prev => ({...prev, product_category: e.target.value as ProductCategory}))}
                  className="bg-gray-900/50 text-white p-2 rounded border border-white/10 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  required
                >
                  <option value="">Select Product Category</option>
                  {PRODUCT_CATEGORIES.map(category => (
                    <option key={category} value={category}>
                      {category.charAt(0).toUpperCase() + category.slice(1)}
                    </option>
                  ))}
                </select>
                <input
                  type="text"
                  placeholder="Origin"
                  value={newShipment.origin || ''}
                  onChange={(e) => setNewShipment(prev => ({...prev, origin: e.target.value}))}
                  className="bg-gray-900/50 text-white p-2 rounded border border-white/10 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  required
                />
                <input
                  type="text"
                  placeholder="Destination"
                  value={newShipment.destination || ''}
                  onChange={(e) => setNewShipment(prev => ({...prev, destination: e.target.value}))}
                  className="bg-gray-900/50 text-white p-2 rounded border border-white/10 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  required
                />
                <input
                  type="date"
                  value={newShipment.departure_date || ''}
                  onChange={(e) => setNewShipment(prev => ({...prev, departure_date: e.target.value}))}
                  className="bg-gray-900/50 text-white p-2 rounded border border-white/10 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  required
                />
                <input
                  type="date"
                  value={newShipment.eta || ''}
                  onChange={(e) => setNewShipment(prev => ({...prev, eta: e.target.value}))}
                  className="bg-gray-900/50 text-white p-2 rounded border border-white/10 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  required
                />
                <input
                  type="number"
                  placeholder="Cost"
                  value={newShipment.cost || ''}
                  onChange={(e) => setNewShipment(prev => ({...prev, cost: parseFloat(e.target.value)}))}
                  className="bg-gray-900/50 text-white p-2 rounded border border-white/10 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  required
                />
                <select
                  value={newShipment.status || ''}
                  onChange={(e) => setNewShipment(prev => ({...prev, status: e.target.value as Shipment['status']}))}
                  className="bg-gray-900/50 text-white p-2 rounded border border-white/10 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  required
                >
                  <option value="">Select Status</option>
                  <option value="Processing">Processing</option>
                  <option value="In Transit">In Transit</option>
                  <option value="Delivered">Delivered</option>
                  <option value="Delayed">Delayed</option>
                </select>
                {newShipment.status === 'Delivered' && (
                  <input
                    type="date"
                    placeholder="Delivery Date"
                    value={newShipment.delivery_date || ''}
                    onChange={(e) => setNewShipment(prev => ({...prev, delivery_date: e.target.value}))}
                    className="bg-gray-900/50 text-white p-2 rounded border border-white/10 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    required
                  />
                )}
                <button 
                  type="submit" 
                  disabled={isCreating}
                  className="bg-indigo-600 text-white p-2 rounded col-span-1 md:col-span-3 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center space-x-2 hover:bg-indigo-700 transition-colors"
                >
                  {isCreating ? (
                    <>
                      <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      <span>Creating Shipment...</span>
                    </>
                  ) : (
                    'Create Shipment'
                  )}
                </button>
              </form>
            </div>
          </div>

          {/* Shipments Table */}
          <div className="bg-white/5 rounded-xl backdrop-blur-lg border border-white/10 overflow-hidden">
            <div className="p-6 border-b border-white/10">
              <div className="flex flex-col md:flex-row justify-between items-center gap-4">
                <div>
                  <h2 className="text-xl font-semibold text-white">Recent Shipments</h2>
                  <p className="text-gray-400 text-sm mt-1">Track your latest shipments and their status</p>
                </div>
                <div className="flex flex-col md:flex-row gap-2">
                  <div className="relative">
                    <input
                      type="text"
                      placeholder="Search shipments..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="bg-gray-900/50 text-white pl-10 pr-4 py-2 rounded border border-white/10 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    />
                    <MagnifyingGlassIcon className="absolute left-3 top-2.5 h-5 w-5 text-gray-400" />
                  </div>
                  <select
                    value={statusFilter}
                    onChange={(e) => setStatusFilter(e.target.value as Shipment['status'] | '')}
                    className="bg-gray-900/50 text-white px-4 py-2 rounded border border-white/10 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  >
                    <option value="">All Statuses</option>
                    <option value="Processing">Processing</option>
                    <option value="In Transit">In Transit</option>
                    <option value="Delivered">Delivered</option>
                    <option value="Delayed">Delayed</option>
                  </select>
                </div>
              </div>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="text-left text-gray-400 border-b border-white/10">
                    <th className="px-6 py-4 font-medium">Tracking ID</th>
                    <th className="px-6 py-4 font-medium">Product</th>
                    <th className="px-6 py-4 font-medium">Origin</th>
                    <th className="px-6 py-4 font-medium">Destination</th>
                    <th className="px-6 py-4 font-medium">Status</th>
                    <th className="px-6 py-4 font-medium">Cost</th>
                    <th className="px-6 py-4 font-medium">Departure</th>
                    <th className="px-6 py-4 font-medium">ETA</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/10">
                  {filteredShipments.map(shipment => (
                    <tr key={shipment.tracking_id} className="hover:bg-white/5 transition-colors">
                      <td className="px-6 py-4 text-sm">{shipment.tracking_id}</td>
                      <td className="px-6 py-4 text-sm">{shipment.product_category}</td>
                      <td className="px-6 py-4 text-sm">{shipment.origin}</td>
                      <td className="px-6 py-4 text-sm">{shipment.destination}</td>
                      <td className="px-6 py-4">
                        <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                          shipment.status === 'In Transit' ? 'bg-indigo-500/20 text-indigo-400' :
                          shipment.status === 'Processing' ? 'bg-amber-500/20 text-amber-400' :
                          shipment.status === 'Delivered' ? 'bg-green-500/20 text-green-400' :
                          'bg-red-500/20 text-red-400'
                        }`}>
                          {shipment.status}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-sm">${shipment.cost}</td>
                      <td className="px-6 py-4 text-sm">{shipment.departure_date}</td>
                      <td className="px-6 py-4 text-sm">{shipment.eta}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </main>

      {/* Example Modal Usage */}
      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)}>
        <h2 className="text-xl font-bold mb-4">Shipment Details</h2>
        <p className="text-gray-300">This is a sample modal for shipment details.</p>
        <button 
          onClick={() => setIsModalOpen(false)} 
          className="mt-4 bg-indigo-600 text-white px-4 py-2 rounded"
        >
          Close
        </button>
      </Modal>

      {/* Footer */}
   
    </div>
  )
}

export default ShipmentsPage
