'use client'

import React, { useState, useEffect, useCallback } from 'react'
import {
  TruckIcon,
  ChartBarIcon,
  CubeIcon,
  ArrowRightOnRectangleIcon,
  HomeIcon,
  ChartPieIcon,
  Cog6ToothIcon,
  BellIcon,
  MagnifyingGlassIcon
} from '@heroicons/react/24/outline'
import { toast, Toaster } from 'react-hot-toast'
import { Client, Databases, Query } from 'appwrite'
import { ID } from 'appwrite'
import Link from 'next/link'
import UserProfileInfo from '@/components/UserInfo'
import { usePathname } from 'next/navigation'
import { ethers } from 'ethers'
import ShipmentLedgerABI from '@/abis/ShipmentLedger.json' // ensure correct path and valid JSON

const client = new Client()
  .setEndpoint(process.env.NEXT_PUBLIC_APPWRITE_ENDPOINT!)
  .setProject(process.env.NEXT_PUBLIC_APPWRITE_PROJECT_ID!)

const databases = new Databases(client)

// Expanded category list
const PRODUCT_CATEGORIES = [
  'electronics',
  'food',
  'clothing',
  'automotive',
  'furniture',
  'books',
  'beauty',
  'toys',
  'sports',
  'health'
] as const
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
  blockchain_tx_id?: string
}

type ShipmentStats = {
  active_shipments: number
  delivered_today: number
  processing: number
  delayed: number
}

const contractAddress = '0xYourContractAddressHere' // Replace with your deployed contract address

const ShipmentsPage: React.FC = () => {
  const pathname = usePathname()
  const [shipments, setShipments] = useState<Shipment[]>([])
  const [isCreating, setIsCreating] = useState(false)
  const [stats, setStats] = useState<ShipmentStats>({
    active_shipments: 0,
    delivered_today: 0,
    processing: 0,
    delayed: 0,
  })
  const [searchQuery, setSearchQuery] = useState('')
  const [statusFilter, setStatusFilter] = useState<Shipment['status'] | ''>('')
  const [categoryFilter, setCategoryFilter] = useState<ProductCategory | ''>('')

  const [newShipment, setNewShipment] = useState<Partial<Shipment>>({
    product_category: undefined,
    origin: '',
    destination: '',
    status: 'Processing',
    departure_date: '',
    eta: '',
    delivery_date: '',
    cost: 0,
  })

  const connectWallet = async (): Promise<ethers.Signer | null> => {
    if (!(window as any).ethereum) {
      toast.error('MetaMask not installed')
      return null
    }
    const provider = new ethers.providers.Web3Provider((window as any).ethereum)
    await provider.send('eth_requestAccounts', [])
    return provider.getSigner()
  }

  const recordShipmentOnChain = async (signer: ethers.Signer, shipment: Shipment) => {
    const contract = new ethers.Contract(contractAddress, ShipmentLedgerABI, signer)

    const toTimestamp = (dateStr: string) =>
      dateStr ? Math.floor(new Date(dateStr).getTime() / 1000) : 0

    const tx = await contract.recordShipment(
      shipment.tracking_id,
      shipment.product_category,
      shipment.origin,
      shipment.destination,
      shipment.status,
      toTimestamp(shipment.departure_date),
      toTimestamp(shipment.eta),
      toTimestamp(shipment.delivery_date || '')
    )
    toast('Blockchain tx sent, waiting confirmation...')
    await tx.wait()
    toast.success('Shipment recorded on blockchain!')
    return tx.hash
  }

  const fetchShipments = useCallback(async () => {
    try {
      const res = await databases.listDocuments(
        process.env.NEXT_PUBLIC_APPWRITE_DATABASE_ID!,
        process.env.NEXT_PUBLIC_SHIPMENTS_COLLECTION_ID!,
        [Query.orderDesc('$createdAt'), Query.limit(50)]
      )

      const typedShipments: Shipment[] = res.documents.map(doc => ({
        $id: doc.$id,
        tracking_id: doc.tracking_id,
        product_category: PRODUCT_CATEGORIES.includes(doc.product_category) ? doc.product_category : 'electronics',
        origin: doc.origin,
        destination: doc.destination,
        status: doc.status,
        departure_date: doc.departure_date,
        eta: doc.eta,
        delivery_date: doc.delivery_date || '',
        user_id: doc.user_id || '',
        cost: doc.cost,
        blockchain_tx_id: doc.blockchain_tx_id || undefined,
      }))

      setShipments(typedShipments)

      const today = new Date()
      today.setHours(0, 0, 0, 0)
      setStats({
        active_shipments: typedShipments.filter(s => s.status === 'In Transit').length,
        delivered_today: typedShipments.filter(s => {
          if (s.status !== 'Delivered') return false
          const d = new Date(s.delivery_date)
          d.setHours(0, 0, 0, 0)
          return d.getTime() === today.getTime()
        }).length,
        processing: typedShipments.filter(s => s.status === 'Processing').length,
        delayed: typedShipments.filter(s => s.status === 'Delayed').length,
      })
    } catch (error) {
      toast.error('Failed to fetch shipments')
      console.error(error)
    }
  }, [])

  const createShipment = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsCreating(true)
    try {
      const trackingId = `SF-${Math.random().toString(36).substring(2, 10).toUpperCase()}`
      const shipmentData: Shipment = {
        ...newShipment,
        tracking_id: trackingId,
        product_category:
          PRODUCT_CATEGORIES.includes(newShipment.product_category as ProductCategory)
            ? (newShipment.product_category as ProductCategory)
            : 'electronics',
        user_id: '',
        cost: newShipment.cost || 0,
        $id: ID.unique(),
        departure_date: newShipment.departure_date || '',
        eta: newShipment.eta || '',
        delivery_date: newShipment.delivery_date || '',
        status: newShipment.status || 'Processing',
      }

      const signer = await connectWallet()
      if (signer) {
        const txHash = await recordShipmentOnChain(signer, shipmentData)
        shipmentData.blockchain_tx_id = txHash
      }

      await databases.createDocument(
        process.env.NEXT_PUBLIC_APPWRITE_DATABASE_ID!,
        process.env.NEXT_PUBLIC_SHIPMENTS_COLLECTION_ID!,
        shipmentData.$id,
        shipmentData
      )

      toast.success(`Shipment created: ${trackingId}`)
      fetchShipments()
      setNewShipment({
        product_category: undefined,
        origin: '',
        destination: '',
        status: 'Processing',
        departure_date: '',
        eta: '',
        delivery_date: '',
        cost: 0,
      })
    } catch (error) {
      toast.error('Failed to create shipment')
      console.error(error)
    } finally {
      setIsCreating(false)
    }
  }

  const filteredShipments = shipments.filter(s =>
    (!searchQuery || Object.values(s).some(v => v?.toString().toLowerCase().includes(searchQuery.toLowerCase()))) &&
    (!statusFilter || s.status === statusFilter) &&
    (!categoryFilter || s.product_category === categoryFilter)
  )

  useEffect(() => {
    fetchShipments()
  }, [fetchShipments])

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
            <div className="flex items-center gap-2">
              <TruckIcon className="w-8 h-8 text-indigo-500" />
              <span className="text-2xl font-bold">
                Supply<span className="text-green-500">Flow</span>
              </span>
            </div>

            <div className="hidden md:flex flex-1 max-w-md mx-8">
              <div className="relative w-full">
                <input
                  type="text"
                  value={searchQuery}
                  onChange={e => setSearchQuery(e.target.value)}
                  placeholder="Search shipments..."
                  className="w-full bg-white/5 border border-white/10 rounded-lg py-2 pl-10 pr-4 text-sm text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                />
                <MagnifyingGlassIcon className="absolute left-3 top-2.5 h-5 w-5 text-gray-400" />
              </div>
            </div>

            <div className="flex items-center gap-4">
              <button className="relative p-2 text-gray-400 hover:text-white transition-colors rounded-lg hover:bg-white/5">
                <BellIcon className="w-5 h-5" />
                <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full"></span>
              </button>

              <UserProfileInfo />

              <button
                onClick={() => { /* TODO: handle logout */ }}
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
            {navigation.map(item => (
              <Link key={item.name} href={item.href} className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${pathname === item.href ? 'bg-indigo-500/20 text-indigo-400' : 'text-gray-400 hover:text-white hover:bg-white/5'}`}>
                <item.icon className="w-5 h-5" />
                {item.name}
              </Link>
            ))}
          </nav>
        </div>
      </div>

      {/* Main Content */}
      <main className="pt-16 pl-64 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mb-6 flex justify-between items-center">
          <h1 className="text-3xl font-bold">Shipments Dashboard</h1>
          <UserProfileInfo />
        </div>

        <div className="flex flex-wrap gap-4 mb-6">
          <select className="bg-gray-900 text-white px-3 py-2 rounded border border-white/10 focus:outline-none focus:ring-2 focus:ring-indigo-500" value={statusFilter} onChange={e => setStatusFilter(e.target.value as Shipment['status'] | '')}>
            <option value="">All Statuses</option>
            <option>Processing</option>
            <option>In Transit</option>
            <option>Delivered</option>
            <option>Delayed</option>
          </select>

          <select className="bg-gray-900 text-white px-3 py-2 rounded border border-white/10 focus:outline-none focus:ring-2 focus:ring-indigo-500" value={categoryFilter} onChange={e => setCategoryFilter(e.target.value as ProductCategory | '')}>
            <option value="">All Categories</option>
            {PRODUCT_CATEGORIES.map(cat => (
              <option key={cat} value={cat}>{cat.charAt(0).toUpperCase() + cat.slice(1)}</option>
            ))}
          </select>
        </div>

        <form onSubmit={createShipment} className="grid grid-cols-1 md:grid-cols-3 gap-4 bg-gray-900 p-6 rounded mb-8">
          <select required className="bg-gray-800 p-2 rounded border border-white/10 text-white focus:outline-none focus:ring-2 focus:ring-indigo-500" value={newShipment.product_category || ''} onChange={e => setNewShipment(prev => ({ ...prev, product_category: e.target.value as ProductCategory }))}>
            <option value="">Select Product Category</option>
            {PRODUCT_CATEGORIES.map(cat => <option key={cat} value={cat}>{cat.charAt(0).toUpperCase() + cat.slice(1)}</option>)}
          </select>

          <input required type="text" placeholder="Origin" className="bg-gray-800 p-2 rounded border border-white/10 text-white focus:outline-none focus:ring-2 focus:ring-indigo-500" value={newShipment.origin || ''} onChange={e => setNewShipment(prev => ({ ...prev, origin: e.target.value }))} />

          <input required type="text" placeholder="Destination" className="bg-gray-800 p-2 rounded border border-white/10 text-white focus:outline-none focus:ring-2 focus:ring-indigo-500" value={newShipment.destination || ''} onChange={e => setNewShipment(prev => ({ ...prev, destination: e.target.value }))} />

          <label className="text-sm text-gray-400">Departure Date</label>
          <input required type="date" className="bg-gray-800 p-2 rounded border border-white/10 text-white focus:outline-none focus:ring-2 focus:ring-indigo-500" value={newShipment.departure_date || ''} onChange={e => setNewShipment(prev => ({ ...prev, departure_date: e.target.value }))} />

          <label className="text-sm text-gray-400">ETA</label>
          <input required type="date" className="bg-gray-800 p-2 rounded border border-white/10 text-white focus:outline-none focus:ring-2 focus:ring-indigo-500" value={newShipment.eta || ''} onChange={e => setNewShipment(prev => ({ ...prev, eta: e.target.value }))} />

          <input required min={0} type="number" placeholder="Cost" className="bg-gray-800 p-2 rounded border border-white/10 text-white focus:outline-none focus:ring-2 focus:ring-indigo-500" value={newShipment.cost || ''} onChange={e => setNewShipment(prev => ({ ...prev, cost: Number(e.target.value) }))} />

          <select required className="bg-gray-800 p-2 rounded border border-white/10 text-white focus:outline-none focus:ring-2 focus:ring-indigo-500" value={newShipment.status || ''} onChange={e => setNewShipment(prev => ({ ...prev, status: e.target.value as Shipment['status'] }))}>
            <option value="">Select Status</option>
            <option>Processing</option>
            <option>In Transit</option>
            <option>Delivered</option>
            <option>Delayed</option>
          </select>

          {newShipment.status === 'Delivered' && (
            <>
              <label className="text-sm text-gray-400">Delivery Date</label>
              <input required type="date" className="bg-gray-800 p-2 rounded border border-white/10 text-white focus:outline-none focus:ring-2 focus:ring-indigo-500" value={newShipment.delivery_date || ''} onChange={e => setNewShipment(prev => ({ ...prev, delivery_date: e.target.value }))} />
            </>
          )}

          <button type="submit" disabled={isCreating} className="col-span-full bg-indigo-600 py-2 rounded text-white disabled:opacity-50 disabled:cursor-not-allowed hover:bg-indigo-700 transition-colors">
            {isCreating ? 'Creating Shipment...' : 'Create Shipment'}
          </button>
        </form>

        <div className="overflow-x-auto bg-gray-900 rounded-lg p-4 shadow-lg border border-white/10">
          <table className="min-w-full text-white divide-y divide-gray-700">
            <thead>
              <tr>
                <th className="px-4 py-2">Tracking ID</th>
                <th className="px-4 py-2">Category</th>
                <th className="px-4 py-2">Origin</th>
                <th className="px-4 py-2">Destination</th>
                <th className="px-4 py-2">Status</th>
                <th className="px-4 py-2">Cost</th>
                <th className="px-4 py-2">Departure</th>
                <th className="px-4 py-2">ETA</th>
                <th className="px-4 py-2">Blockchain Tx</th>
              </tr>
            </thead>
            <tbody>
              {filteredShipments.map(s => (
                <tr key={s.$id} className="hover:bg-indigo-700">
                  <td className="px-4 py-2">{s.tracking_id}</td>
                  <td className="px-4 py-2 capitalize">{s.product_category}</td>
                  <td className="px-4 py-2">{s.origin}</td>
                  <td className="px-4 py-2">{s.destination}</td>
                  <td className="px-4 py-2">{s.status}</td>
                  <td className="px-4 py-2">${s.cost.toFixed(2)}</td>
                  <td className="px-4 py-2">{new Date(s.departure_date).toLocaleDateString()}</td>
                  <td className="px-4 py-2">{new Date(s.eta).toLocaleDateString()}</td>
                  <td className="px-4 py-2">
                    {s.blockchain_tx_id ? (
                      <a href={`https://etherscan.io/tx/${s.blockchain_tx_id}`} target="_blank" rel="noopener noreferrer" className="underline text-indigo-400 hover:text-indigo-300 break-all" title="View on blockchain explorer">
                        Tx Link
                      </a>
                    ) : (
                      <span className="text-gray-500 italic">N/A</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </main>
      <Toaster position="top-right" />
    </div>
  )
}

export default ShipmentsPage
