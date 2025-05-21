'use client'

import React, { useState, FormEvent, useEffect, useCallback } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { toast, Toaster } from 'react-hot-toast'
import {
  HomeIcon,
  TruckIcon,
  InboxIcon,
  ChartBarIcon,
  CogIcon,
  PlusIcon,
  MagnifyingGlassIcon,
  ArrowUpIcon,
  ArrowDownIcon,
  CurrencyDollarIcon,
  CubeIcon,
  TagIcon,
  CameraIcon
} from '@heroicons/react/24/outline'
import { ID } from 'appwrite'
import { databases } from '@/lib/appwrite'
import DashboardLayout from '@/components/DashboardLayout'

interface Product {
  $id: string
  user_id: string
  name: string
  sku: string
  stock: number
  unitPrice: number
  category?: string
  created_at: string
  updated_at: string
}

interface InventoryLog {
  $id: string
  product_id: string
  user_id: string
  change_type: 'Add' | 'Remove' | 'Adjust'
  quantity: number
  reason?: string
  created_at: string
}


interface Transaction {
  productId: string
  quantity: number
  transactionType: 'Add' | 'Remove' | 'Adjust'
  reason?: string
}


function InventoryPage() {
  const pathname = usePathname()
  const navLinks = [
    { href: '/dashboard', label: 'Dashboard', icon: HomeIcon },
    { href: '/shipments', label: 'Shipments', icon: TruckIcon },
    { href: '/inventory', label: 'Inventory', icon: InboxIcon },
    { href: '/analytics', label: 'Analytics', icon: ChartBarIcon },
    { href: '/products', label: 'Products', icon: InboxIcon },
    { href: '/settings', label: 'Settings', icon: CogIcon },
  ]
  const [products, setProducts] = useState<Product[]>([])
  const [logs, setLogs] = useState<InventoryLog[]>([])
  const [currentUserId, setCurrentUserId] = useState<string>('')
  const [searchQuery, setSearchQuery] = useState('')
  const [categoryFilter, setCategoryFilter] = useState('')
  const [isAddProductModalOpen, setIsAddProductModalOpen] = useState(false)
  const [isAddTransactionModalOpen, setIsAddTransactionModalOpen] = useState(false)
  const [isScanningModalOpen, setIsScanningModalOpen] = useState(false)
  const [scanningStatus, setScanningStatus] = useState<'idle' | 'scanning' | 'success' | 'error'>('idle')
  const [scannedProduct, setScannedProduct] = useState<Product | null>(null)
  const [newProduct, setNewProduct] = useState<Omit<Product, '$id' | 'created_at' | 'updated_at'>>({
    user_id: '',
    name: '',
    sku: '',
    stock: 0,
    unitPrice: 0,
    category: ''
  })
  const [newTransaction, setNewTransaction] = useState<Transaction>({
    productId: '',
    quantity: 0,
    transactionType: 'Add',
    reason: ''
  })

  // Fetch products from Appwrite
  const fetchProducts = useCallback(async () => {
    try {
      const response = await databases.listDocuments(
        process.env.NEXT_PUBLIC_APPWRITE_DATABASE_ID!,
        process.env.NEXT_PUBLIC_PRODUCTS_COLLECTION_ID!
      )
      setProducts(response.documents as unknown as Product[])
    } catch (error) {
      toast.error('Failed to add product')
      console.error(error)
    }
  }, [])

  // Fetch inventory logs from Appwrite
  const fetchLogs = async () => {
    try {
      const response = await databases.listDocuments(
        process.env.NEXT_PUBLIC_APPWRITE_DATABASE_ID!,
        process.env.NEXT_PUBLIC_INVENTORY_LOG_COLLECTION_ID!
      )
      setLogs(response.documents as unknown as InventoryLog[])
    } catch (error) {
      console.error("Error fetching inventory logs:", error)
      toast.error('Failed to fetch inventory logs')
    }
  }

  useEffect(() => {
    // Get user from localStorage
    const userStr = localStorage.getItem('user')
    if (userStr) {
      const user = JSON.parse(userStr)
      setCurrentUserId(user.$id || user.id)
      setNewProduct(prev => ({ ...prev, user_id: user.$id || user.id }))
    }
    fetchProducts()
    fetchLogs()
  }, [fetchProducts])

  // Filtering products
  const filteredProducts = products.filter(product => {
    const matchesSearch =
      (product.name?.toLowerCase().includes(searchQuery.toLowerCase()) || false) ||
      (product.sku?.toLowerCase().includes(searchQuery.toLowerCase()) || false)
    const matchesCategory = !categoryFilter || product.category === categoryFilter
    return matchesSearch && matchesCategory
  })

  const validateProductForm = () => {
    const errors: string[] = []
    if (!newProduct.name.trim()) errors.push('Product name is required.')
    if (!newProduct.sku.trim()) errors.push('SKU is required.')
    if (newProduct.stock < 0) errors.push('Stock cannot be negative.')
    if (newProduct.unitPrice < 0) errors.push('Unit price cannot be negative.')
    if (!newProduct.user_id) errors.push('User ID is required.')
    return errors
  }

  const handleAddProduct = async (e: FormEvent) => {
    e.preventDefault()
    const validationErrors = validateProductForm()
    if (validationErrors.length > 0) {
      validationErrors.forEach(error => toast.error(error))
      return
    }
    try {
      const now = new Date().toISOString()
      const createdProduct = {
        ...newProduct,
        created_at: now,
        updated_at: now,
      }
      await databases.createDocument(
        process.env.NEXT_PUBLIC_APPWRITE_DATABASE_ID!,
        process.env.NEXT_PUBLIC_PRODUCTS_COLLECTION_ID!,
        ID.unique(),
        createdProduct
      )
      await fetchProducts()
      toast.success('Product added successfully!', { icon: '🎉' })
      setIsAddProductModalOpen(false)
      setNewProduct({
        user_id: currentUserId,
        name: '',
        sku: '',
        stock: 0,
        unitPrice: 0,
        category: ''
      })
    } catch (error) {
          toast.error('Failed to add product')
          console.error(error)
        }
  }

  const handleAddTransaction = async (e: FormEvent) => {
    e.preventDefault()
    if (!newTransaction.productId || newTransaction.quantity <= 0) {
      toast.error('Please select a product and enter a valid quantity.')
      return
    }
    try {
      const productToUpdate = products.find(p => p.$id === newTransaction.productId)
      if (!productToUpdate) {
        toast.error('Product not found')
        return
      }
      let updatedStock = productToUpdate.stock
      if (newTransaction.transactionType === 'Add') {
        updatedStock += newTransaction.quantity
      } else if (newTransaction.transactionType === 'Remove') {
        updatedStock -= newTransaction.quantity
        if (updatedStock < 0) {
          toast.error('Insufficient stock for this transaction')
          return
        }
      } else if (newTransaction.transactionType === 'Adjust') {
        updatedStock = newTransaction.quantity
      }
      // Update product stock
      await databases.updateDocument(
        process.env.NEXT_PUBLIC_APPWRITE_DATABASE_ID!,
        process.env.NEXT_PUBLIC_PRODUCTS_COLLECTION_ID!,
        productToUpdate.$id,
        {
          stock: updatedStock,
          updated_at: new Date().toISOString()
        }
      )
      // Log to inventory_log
      await databases.createDocument(
        process.env.NEXT_PUBLIC_APPWRITE_DATABASE_ID!,
        process.env.NEXT_PUBLIC_INVENTORY_LOG_COLLECTION_ID!,
        ID.unique(),
        {
          product_id: productToUpdate.$id,
          user_id: currentUserId,
          change_type: newTransaction.transactionType,
          quantity: newTransaction.quantity,
          reason: newTransaction.reason,
          created_at: new Date().toISOString()
        }
      )
      await fetchProducts()
      await fetchLogs()
      toast.success('Transaction recorded successfully!', { icon: '📦' })
      setIsAddTransactionModalOpen(false)
      setNewTransaction({
        productId: '',
        quantity: 0,
        transactionType: 'Add',
        reason: ''
      })
    } catch (error) {
          toast.error('Failed to add product')
          console.error(error)
        }
  }

  // Add camera scanning functionality
  const startScanning = async () => {
    try {
      setScanningStatus('scanning')
      // Here you would integrate with a barcode/QR code scanning library
      // For example, using QuaggaJS or similar
      const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'environment' } })
      // Process the video stream for product identification
      // This is a placeholder for the actual scanning logic
      setScanningStatus('success')
    } catch (error) {
      console.error('Error accessing camera:', error)
      setScanningStatus('error')
      toast.error('Failed to access camera')
    }
  }

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <Toaster position="top-right" />
        
        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="bg-gray-800/50 p-4 rounded-lg shadow-lg backdrop-blur-sm border border-white/10">
            <div className="flex justify-between items-center mb-3">
              <CubeIcon className="h-6 w-6 text-indigo-500" />
              <span className="text-xs text-gray-400">Total Products</span>
            </div>
            <div className="text-2xl font-bold text-white">{products.length}</div>
            <div className="text-xs text-green-500 mt-1">Active inventory items</div>
          </div>
          <div className="bg-gray-800/50 p-4 rounded-lg shadow-lg backdrop-blur-sm border border-white/10">
            <div className="flex justify-between items-center mb-3">
              <ArrowUpIcon className="h-6 w-6 text-green-500" />
              <span className="text-xs text-gray-400">Total Stock</span>
            </div>
            <div className="text-2xl font-bold text-white">{products.reduce((total, product) => total + product.stock, 0)}</div>
            <div className="text-xs text-green-500 mt-1">Units in inventory</div>
          </div>
          <div className="bg-gray-800/50 p-4 rounded-lg shadow-lg backdrop-blur-sm border border-white/10">
            <div className="flex justify-between items-center mb-3">
              <CurrencyDollarIcon className="h-6 w-6 text-yellow-500" />
              <span className="text-xs text-gray-400">Total Value</span>
            </div>
            <div className="text-2xl font-bold text-white">${products.reduce((total, product) => total + (product.stock * product.unitPrice), 0).toLocaleString()}</div>
            <div className="text-xs text-yellow-500 mt-1">Current inventory value</div>
          </div>
          <div className="bg-gray-800/50 p-4 rounded-lg shadow-lg backdrop-blur-sm border border-white/10">
            <div className="flex justify-between items-center mb-3">
              <ArrowDownIcon className="h-6 w-6 text-red-500" />
              <span className="text-xs text-gray-400">Low Stock Items</span>
            </div>
            <div className="text-2xl font-bold text-white">{products.filter(p => p.stock < 10).length}</div>
            <div className="text-xs text-red-500 mt-1">Items below threshold</div>
          </div>
          <div className="bg-gray-800/50 p-4 rounded-lg shadow-lg backdrop-blur-sm border border-white/10">
            <div className="flex justify-between items-center mb-3">
              <TagIcon className="h-6 w-6 text-purple-500" />
              <span className="text-xs text-gray-400">Unique SKUs</span>
            </div>
            <div className="text-2xl font-bold text-white">{new Set(products.map(p => p.sku)).size}</div>
            <div className="text-xs text-purple-500 mt-1">Active product variants</div>
          </div>
        </div>

        {/* Search and Add Product */}
        <div className="bg-gray-800/50 rounded-lg p-4 sm:p-6 shadow-lg backdrop-blur-sm border border-white/10">
          <div className="flex flex-col md:flex-row justify-between items-center gap-4">
            <div className="relative w-full md:w-96">
              <input
                type="text"
                placeholder="Search products..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full px-4 py-2 pl-10 rounded bg-gray-900/50 border border-white/10 text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
              <MagnifyingGlassIcon className="absolute left-3 top-2.5 h-5 w-5 text-gray-400" />
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => setIsScanningModalOpen(true)}
                className="flex items-center gap-2 px-4 py-2 bg-purple-600 text-white rounded hover:bg-purple-700 transition-colors"
              >
                <CameraIcon className="h-5 w-5" />
                Scan Product
              </button>
              <button
                onClick={() => setIsAddProductModalOpen(true)}
                className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded hover:bg-indigo-700 transition-colors"
              >
                <PlusIcon className="h-5 w-5" />
                Add Product
              </button>
            </div>
          </div>
        </div>

        {/* Products Table */}
        <div className="bg-gray-800/50 rounded-lg p-4 sm:p-6 shadow-lg backdrop-blur-sm border border-white/10">
          <h2 className="text-lg font-semibold mb-4">Inventory Items</h2>
          <div className="overflow-x-auto">
            <table className="min-w-full text-left text-sm">
              <thead>
                <tr className="border-b border-white/10">
                  <th className="px-4 py-2 text-gray-400 font-medium">SKU</th>
                  <th className="px-4 py-2 text-gray-400 font-medium">Name</th>
                  <th className="px-4 py-2 text-gray-400 font-medium">Category</th>
                  <th className="px-4 py-2 text-gray-400 font-medium">Stock</th>
                  <th className="px-4 py-2 text-gray-400 font-medium">Unit Price</th>
                  <th className="px-4 py-2 text-gray-400 font-medium">Total Value</th>
                  <th className="px-4 py-2 text-gray-400 font-medium">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/10">
                {filteredProducts.map((product) => (
                  <tr key={product.$id} className="hover:bg-gray-800/30 transition-colors">
                    <td className="px-4 py-2">{product.sku}</td>
                    <td className="px-4 py-2">{product.name}</td>
                    <td className="px-4 py-2">{product.category || 'N/A'}</td>
                    <td className="px-4 py-2">
                      <span className={`px-2 py-1 rounded-full text-xs ${
                        product.stock < 10 ? 'bg-red-500/20 text-red-400' :
                        product.stock < 50 ? 'bg-yellow-500/20 text-yellow-400' :
                        'bg-green-500/20 text-green-400'
                      }`}>
                        {product.stock}
                      </span>
                    </td>
                    <td className="px-4 py-2">${product.unitPrice.toLocaleString()}</td>
                    <td className="px-4 py-2">${(product.stock * product.unitPrice).toLocaleString()}</td>
                    <td className="px-4 py-2">
                      <button
                        onClick={() => {
                          setNewTransaction(prev => ({ ...prev, productId: product.$id }))
                          setIsAddTransactionModalOpen(true)
                        }}
                        className="px-3 py-1 bg-indigo-600 text-white rounded text-xs hover:bg-indigo-700 transition-colors"
                      >
                        Update Stock
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Add Product Modal */}
        {isAddProductModalOpen && (
          <div className="fixed inset-0 bg-black bg-opacity-70 flex items-center justify-center z-50">
            <div className="bg-gray-900 rounded-lg p-8 shadow-lg w-full max-w-lg relative">
              <button
                className="absolute top-2 right-2 text-gray-400 hover:text-white"
                onClick={() => setIsAddProductModalOpen(false)}
              >
                &times;
              </button>
              <h2 className="text-xl font-bold mb-4">Add New Product</h2>
              <form onSubmit={handleAddProduct} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-400 mb-1">Name</label>
                  <input
                    type="text"
                    value={newProduct.name}
                    onChange={(e) => setNewProduct(prev => ({ ...prev, name: e.target.value }))}
                    className="w-full px-3 py-2 rounded bg-gray-800 border border-white/10 text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-400 mb-1">SKU</label>
                  <input
                    type="text"
                    value={newProduct.sku}
                    onChange={(e) => setNewProduct(prev => ({ ...prev, sku: e.target.value }))}
                    className="w-full px-3 py-2 rounded bg-gray-800 border border-white/10 text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-400 mb-1">Category</label>
                  <input
                    type="text"
                    value={newProduct.category}
                    onChange={(e) => setNewProduct(prev => ({ ...prev, category: e.target.value }))}
                    className="w-full px-3 py-2 rounded bg-gray-800 border border-white/10 text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-400 mb-1">Initial Stock</label>
                  <input
                    type="number"
                    value={newProduct.stock}
                    onChange={(e) => setNewProduct(prev => ({ ...prev, stock: parseInt(e.target.value) }))}
                    className="w-full px-3 py-2 rounded bg-gray-800 border border-white/10 text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    min="0"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-400 mb-1">Unit Price</label>
                  <input
                    type="number"
                    value={newProduct.unitPrice}
                    onChange={(e) => setNewProduct(prev => ({ ...prev, unitPrice: parseFloat(e.target.value) }))}
                    className="w-full px-3 py-2 rounded bg-gray-800 border border-white/10 text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    min="0"
                    step="0.01"
                    required
                  />
                </div>
                <button
                  type="submit"
                  className="w-full px-4 py-2 bg-indigo-600 text-white rounded hover:bg-indigo-700 transition-colors"
                >
                  Add Product
                </button>
              </form>
            </div>
          </div>
        )}

        {/* Add Transaction Modal */}
        {isAddTransactionModalOpen && (
          <div className="fixed inset-0 bg-black bg-opacity-70 flex items-center justify-center z-50">
            <div className="bg-gray-900 rounded-lg p-8 shadow-lg w-full max-w-lg relative">
              <button
                className="absolute top-2 right-2 text-gray-400 hover:text-white"
                onClick={() => setIsAddTransactionModalOpen(false)}
              >
                &times;
              </button>
              <h2 className="text-xl font-bold mb-4">Update Stock</h2>
              <form onSubmit={handleAddTransaction} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-400 mb-1">Product</label>
                  <select
                    value={newTransaction.productId}
                    onChange={(e) => setNewTransaction(prev => ({ ...prev, productId: e.target.value }))}
                    className="w-full px-3 py-2 rounded bg-gray-800 border border-white/10 text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    required
                  >
                    <option value="">Select a product</option>
                    {products.map(product => (
                      <option key={product.$id} value={product.$id}>
                        {product.name} (Current Stock: {product.stock})
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-400 mb-1">Transaction Type</label>
                  <select
                    value={newTransaction.transactionType}
                    onChange={(e) => setNewTransaction(prev => ({ ...prev, transactionType: e.target.value as 'Add' | 'Remove' | 'Adjust' }))}
                    className="w-full px-3 py-2 rounded bg-gray-800 border border-white/10 text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    required
                  >
                    <option value="Add">Add Stock</option>
                    <option value="Remove">Remove Stock</option>
                    <option value="Adjust">Adjust Stock</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-400 mb-1">Quantity</label>
                  <input
                    type="number"
                    value={newTransaction.quantity}
                    onChange={(e) => setNewTransaction(prev => ({ ...prev, quantity: parseInt(e.target.value) }))}
                    className="w-full px-3 py-2 rounded bg-gray-800 border border-white/10 text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    min="1"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-400 mb-1">Reason (Optional)</label>
                  <input
                    type="text"
                    value={newTransaction.reason}
                    onChange={(e) => setNewTransaction(prev => ({ ...prev, reason: e.target.value }))}
                    className="w-full px-3 py-2 rounded bg-gray-800 border border-white/10 text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
                <button
                  type="submit"
                  className="w-full px-4 py-2 bg-indigo-600 text-white rounded hover:bg-indigo-700 transition-colors"
                >
                  Update Stock
                </button>
              </form>
            </div>
          </div>
        )}

        {/* Product Scanner Modal */}
        {isScanningModalOpen && (
          <div className="fixed inset-0 bg-black bg-opacity-70 flex items-center justify-center z-50">
            <div className="bg-gray-900 rounded-lg p-8 shadow-lg w-full max-w-lg relative">
              <button
                className="absolute top-2 right-2 text-gray-400 hover:text-white"
                onClick={() => {
                  setIsScanningModalOpen(false)
                  setScanningStatus('idle')
                }}
              >
                &times;
              </button>
              <h2 className="text-xl font-bold mb-4">Scan Product</h2>
              <div className="space-y-4">
                {scanningStatus === 'idle' && (
                  <div className="text-center">
                    <p className="text-gray-400 mb-4">Use your camera to scan product barcodes or QR codes</p>
                    <button
                      onClick={startScanning}
                      className="px-4 py-2 bg-purple-600 text-white rounded hover:bg-purple-700 transition-colors"
                    >
                      Start Scanning
                    </button>
                  </div>
                )}
                {scanningStatus === 'scanning' && (
                  <div className="text-center">
                    <div className="aspect-video bg-gray-800 rounded-lg mb-4 relative">
                      <div className="absolute inset-0 flex items-center justify-center">
                        <div className="animate-pulse text-purple-500">
                          <CameraIcon className="h-12 w-12" />
                        </div>
                      </div>
                    </div>
                    <p className="text-gray-400">Scanning for product code...</p>
                  </div>
                )}
                {scanningStatus === 'success' && scannedProduct && (
                  <div className="bg-gray-800 rounded-lg p-4">
                    <h3 className="font-semibold text-lg mb-2">Product Found</h3>
                    <div className="space-y-2">
                      <p><span className="text-gray-400">SKU:</span> {scannedProduct.sku}</p>
                      <p><span className="text-gray-400">Name:</span> {scannedProduct.name}</p>
                      <p><span className="text-gray-400">Stock:</span> {scannedProduct.stock}</p>
                      <button
                        onClick={() => {
                          setNewTransaction(prev => ({ ...prev, productId: scannedProduct.$id }))
                          setIsAddTransactionModalOpen(true)
                          setIsScanningModalOpen(false)
                        }}
                        className="w-full mt-4 px-4 py-2 bg-indigo-600 text-white rounded hover:bg-indigo-700 transition-colors"
                      >
                        Update Stock
                      </button>
                    </div>
                  </div>
                )}
                {scanningStatus === 'error' && (
                  <div className="text-center text-red-500">
                    <p>Failed to access camera. Please check your permissions.</p>
                    <button
                      onClick={() => setScanningStatus('idle')}
                      className="mt-4 px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700 transition-colors"
                    >
                      Try Again
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </DashboardLayout>
  )
}

export default InventoryPage
