'use client'

import React, { useState, useEffect } from 'react'
import { TruckIcon } from '@heroicons/react/24/solid'
import { toast } from 'react-hot-toast'
import { Client, Databases, Query } from 'appwrite'
import { ID } from 'appwrite'
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

  return (
    <div className="flex flex-col min-h-screen bg-slate-950 text-white">
      {/* Navbar */}
      <div className="navbar bg-slate-800/80 backdrop-blur-md fixed w-full top-0 z-50 border-b border-slate-700">
        <div className="container nav-content flex justify-between items-center p-4">
          <a href="#" className="nav-logo flex items-center space-x-2">
            <TruckIcon className="h-8 w-8 text-indigo-500" />
            <span className="text-2xl font-bold text-white">SupplyFlow</span>
          </a>
          <div className="nav-links space-x-4">
            <a href="dashboard" className="text-white hover:text-indigo-300 active:bg-gradient-to-r from-indigo-500 to-emerald-500 px-3 py-2 rounded">Dashboard</a>
            <a href="/logout" className="text-white hover:text-indigo-300">
              <i className="fa-solid fa-sign-out-alt mr-2"></i>Logout
            </a>
          </div>
        </div>
      </div>

      {/* Dashboard Container */}
      <div className="container dashboard grid grid-cols-1 md:grid-cols-[250px_1fr] gap-8 pt-20 px-4 flex-grow">
        {/* Sidebar */}
        <div className="sidebar bg-white/5 rounded-xl p-5 h-auto md:h-[calc(100vh-120px)] md:sticky md:top-24">
          <ul className="sidebar-menu space-y-2">
            {[
              { name: 'Shipments', href: '#', icon: 'fa-truck', active: true },
              { name: 'Analytics', href: '/analytics', icon: 'fa-chart-line' },
              { name: 'Blockchain', href: '/blockchain', icon: 'fa-cubes' },
              { name: 'Profile', href: '/profile', icon: 'fa-user' }
            ].map((item) => (
              <li key={item.name}>
                <a 
                  href={item.href} 
                  className={`
                    block p-3 text-white rounded-lg transition-all flex items-center space-x-2
                    ${item.active ? 'bg-gradient-to-r from-indigo-500 to-emerald-500' : 'hover:bg-white/10'}
                  `}
                >
                  <i className={`fa-solid ${item.icon}`}></i>
                  <span>{item.name}</span>
                </a>
              </li>
            ))}
          </ul>
        </div>

        {/* Main Content */}
        <div className="main-content">
          {/* Page Header */}
          <div className="page-header mb-8">
            <div>
              <div className="page-title text-3xl font-bold mb-2">Shipments Dashboard</div>
              <div className="page-subtitle text-gray-400">Welcome, User!</div>
            </div>
          </div>

          {/* Statistics Cards */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
            {Object.entries(stats).map(([key, value]) => (
              <div key={key} className="bg-white/5 p-4 rounded-lg border border-white/20">
                <h3 className="text-sm text-gray-400 capitalize">{key.replace('_', ' ')}</h3>
                <div className="text-2xl font-bold text-indigo-400">{value}</div>
              </div>
            ))}
          </div>

          <div className="bg-slate-800 rounded-lg p-6 mb-8">
            <h2 className="text-xl mb-4">Create New Shipment</h2>
            <form onSubmit={createShipment} className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <select
                value={newShipment.product_category || ''}
                onChange={(e) => setNewShipment(prev => ({...prev, product_category: e.target.value as ProductCategory}))}
                className="bg-slate-700 text-white p-2 rounded"
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
                className="bg-slate-700 text-white p-2 rounded"
                required
              />
              <input
                type="text"
                placeholder="Destination"
                value={newShipment.destination || ''}
                onChange={(e) => setNewShipment(prev => ({...prev, destination: e.target.value}))}
                className="bg-slate-700 text-white p-2 rounded"
                required
              />
              <input
                type="date"
                value={newShipment.departure_date || ''}
                onChange={(e) => setNewShipment(prev => ({...prev, departure_date: e.target.value}))}
                className="bg-slate-700 text-white p-2 rounded"
                required
              />
              <input
                type="date"
                value={newShipment.eta || ''}
                onChange={(e) => setNewShipment(prev => ({...prev, eta: e.target.value}))}
                className="bg-slate-700 text-white p-2 rounded"
                required
              />
              <input
                type="number"
                placeholder="Cost"
                value={newShipment.cost || ''}
                onChange={(e) => setNewShipment(prev => ({...prev, cost: parseFloat(e.target.value)}))}
                className="bg-slate-700 text-white p-2 rounded"
                required
              />
              <select
                value={newShipment.status || ''}
                onChange={(e) => setNewShipment(prev => ({...prev, status: e.target.value as Shipment['status']}))}
                className="bg-slate-700 text-white p-2 rounded"
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
                  className="bg-slate-700 text-white p-2 rounded"
                  required
                />
              )}
              <button 
                type="submit" 
                disabled={isCreating}
                className="bg-indigo-600 text-white p-2 rounded col-span-1 md:col-span-3 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center space-x-2"
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

          <div className="bg-slate-800 rounded-lg p-6">
            <div className="flex flex-col md:flex-row justify-between items-center mb-4">
              <h2 className="text-xl mb-4 md:mb-0">Shipments</h2>
              <div className="flex flex-col md:flex-row space-y-2 md:space-y-0 md:space-x-2">
                <input
                  type="text"
                  placeholder="Search shipments..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="bg-slate-700 text-white p-2 rounded"
                />
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value as Shipment['status'] | '')}
                  className="bg-slate-700 text-white p-2 rounded"
                >
                  <option value="">All Statuses</option>
                  <option value="Processing">Processing</option>
                  <option value="In Transit">In Transit</option>
                  <option value="Delivered">Delivered</option>
                  <option value="Delayed">Delayed</option>
                </select>
              </div>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-slate-700">
                    <th className="text-left p-2 hidden md:table-cell">Tracking ID</th>
                    <th className="text-left p-2 hidden md:table-cell">Product</th>
                    <th className="text-left p-2 hidden md:table-cell">Origin</th>
                    <th className="text-left p-2 hidden md:table-cell">Destination</th>
                    <th className="text-left p-2 hidden md:table-cell">Status</th>
                    <th className="text-left p-2 hidden md:table-cell">Cost</th>
                    <th className="text-left p-2 hidden md:table-cell">Departure</th>
                    <th className="text-left p-2 hidden md:table-cell">ETA</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredShipments.map(shipment => (
                    <tr key={shipment.tracking_id} className="border-b border-slate-700 hover:bg-slate-700/50 block md:table-row">
                      <td className="p-2 block md:table-cell" data-label="Tracking ID">{shipment.tracking_id}</td>
                      <td className="p-2 block md:table-cell" data-label="Product">{shipment.product_category}</td>
                      <td className="p-2 block md:table-cell" data-label="Origin">{shipment.origin}</td>
                      <td className="p-2 block md:table-cell" data-label="Destination">{shipment.destination}</td>
                      <td className="p-2 block md:table-cell" data-label="Status">
                        <span className={`
                          px-2 py-1 rounded text-xs font-semibold
                          ${shipment.status === 'In Transit' ? 'bg-green-900/50 text-green-400' : ''}
                          ${shipment.status === 'Processing' ? 'bg-yellow-900/50 text-yellow-400' : ''}
                          ${shipment.status === 'Delivered' ? 'bg-blue-900/50 text-blue-400' : ''}
                          ${shipment.status === 'Delayed' ? 'bg-red-900/50 text-red-400' : ''}
                        `}>
                          {shipment.status}
                        </span>
                      </td>
                      <td className="p-2 block md:table-cell" data-label="Departure">{shipment.departure_date}</td>
                      <td className="p-2 block md:table-cell" data-label="ETA">{shipment.eta}</td>
                      <td className="p-2 block md:table-cell" data-label="Cost">${shipment.cost}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>

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
