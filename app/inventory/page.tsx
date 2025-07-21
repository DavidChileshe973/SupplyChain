'use client'

import React, { useState, FormEvent, useEffect, useCallback } from 'react'
import { toast, Toaster } from 'react-hot-toast'
import { ID } from 'appwrite'
import { databases } from '@/lib/appwrite'
import DashboardLayout from '@/components/DashboardLayout' // Assuming this component exists
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
  CameraIcon,
} from '@heroicons/react/24/outline'
import { CheckCircleIcon, ExclamationCircleIcon } from '@heroicons/react/24/solid'
import { usePathname } from 'next/navigation' // For sidebar active link


// --- Interface Definitions ---
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
  hash?: string // Added for blockchain-like integrity check
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

// --- Hashing Utility Types & Function ---
// Defines the subset of Product fields that will be hashed
type ProductHashData = {
  name: string
  sku: string
  stock: number
  unitPrice: number
  category?: string
}

/**
 * Generates a SHA-256 hash of a product's key data.
 * Ensures consistent stringification for deterministic hashing.
 */
async function hashProductData(product: ProductHashData): Promise<string> {
  const productString = JSON.stringify({
    name: product.name,
    sku: product.sku,
    stock: product.stock,
    unitPrice: product.unitPrice,
    category: product.category || '', // Ensure category is always a string for consistent hash
  })
  const encoder = new TextEncoder()
  const data = encoder.encode(productString)
  const hashBuffer = await crypto.subtle.digest('SHA-256', data)
  const hashArray = Array.from(new Uint8Array(hashBuffer))
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('')
}


// --- Main InventoryPage Component ---
function InventoryPage() {
  const pathname = usePathname()

  // Define sidebar navigation links
  const navLinks = [
    { href: '/dashboard', label: 'Dashboard', icon: HomeIcon },
    { href: '/shipments', label: 'Shipments', icon: TruckIcon },
    { href: '/inventory', label: 'Inventory', icon: InboxIcon },
    { href: '/analytics', label: 'Analytics', icon: ChartBarIcon },
    { href: '/products', label: 'Products', icon: InboxIcon },
    { href: '/settings', label: 'Settings', icon: CogIcon },
  ]

  // State variables
  const [products, setProducts] = useState<Product[]>([])
  const [logs, setLogs] = useState<InventoryLog[]>([]) // For inventory transaction logs
  const [currentUserId, setCurrentUserId] = useState<string>('') // User ID for product ownership/logging
  const [searchQuery, setSearchQuery] = useState('')
  const [categoryFilter, setCategoryFilter] = useState('')

  // Modals visibility states
  const [isAddProductModalOpen, setIsAddProductModalOpen] = useState(false)
  const [isAddTransactionModalOpen, setIsAddTransactionModalOpen] = useState(false)
  const [isScanningModalOpen, setIsScanningModalOpen] = useState(false)

  // Scanning related states
  const [scanningStatus, setScanningStatus] = useState<'idle' | 'scanning' | 'success' | 'error'>('idle')
  const [scannedProduct, setScannedProduct] = useState<Product | null>(null) // Placeholder for scanned product details

  // Form data for adding new products
  const [newProduct, setNewProduct] = useState<Omit<Product, '$id' | 'created_at' | 'updated_at' | 'hash'>>({
    user_id: '',
    name: '',
    sku: '',
    stock: 0,
    unitPrice: 0,
    category: ''
  })

  // Form data for new inventory transactions
  const [newTransaction, setNewTransaction] = useState<Transaction>({
    productId: '',
    quantity: 0,
    transactionType: 'Add',
    reason: ''
  })

  // State to store IDs of products whose hash has been successfully verified
  const [verifiedIds, setVerifiedIds] = useState<Set<string>>(new Set())


  // --- Data Fetching Functions ---

  /**
   * Fetches product data from Appwrite.
   * Uses useCallback for memoization to prevent unnecessary re-renders.
   */
  const fetchProducts = useCallback(async () => {
    try {
      const response = await databases.listDocuments(
        process.env.NEXT_PUBLIC_APPWRITE_DATABASE_ID!,
        process.env.NEXT_PUBLIC_PRODUCTS_COLLECTION_ID!
      )
      setProducts(response.documents as unknown as Product[])
    } catch (error) {
      toast.error('Failed to load products')
      console.error('Appwrite fetch products error:', error)
    }
  }, [])

  /**
   * Fetches inventory log data from Appwrite.
   */
  const fetchLogs = async () => {
    try {
      const response = await databases.listDocuments(
        process.env.NEXT_PUBLIC_APPWRITE_DATABASE_ID!,
        process.env.NEXT_PUBLIC_INVENTORY_LOG_COLLECTION_ID!
      )
      setLogs(response.documents as unknown as InventoryLog[])
    } catch (error) {
      toast.error('Failed to fetch inventory logs')
      console.error('Appwrite fetch logs error:', error)
    }
  }


  // --- Product Integrity Verification ---

  /**
   * Verifies the integrity of a product's data by comparing its computed hash
   * with the hash stored in the database.
   */
  async function verifyProductHash(product: Product): Promise<boolean> {
    if (!product.hash) {
      // If no hash is stored, it cannot be verified, but log as an issue.
      console.warn(`Product ${product.$id} (${product.name}) has no hash stored for verification.`)
      return false
    }
    // Prepare data for hashing (excluding Appwrite internal fields and the hash itself)
    const productDataToHash: ProductHashData = {
      name: product.name,
      sku: product.sku,
      stock: product.stock,
      unitPrice: product.unitPrice,
      category: product.category || '',
    }
    const computedHash = await hashProductData(productDataToHash)
    return computedHash === product.hash
  }

  /**
   * Effect hook to run verification on all products whenever `products` state changes.
   * Updates `verifiedIds` set for UI display.
   */
  useEffect(() => {
    async function verifyAllProducts() {
      const newVerifiedSet = new Set<string>()
      for (const product of products) {
        if (await verifyProductHash(product)) {
          newVerifiedSet.add(product.$id)
        }
      }
      setVerifiedIds(newVerifiedSet)
    }
    verifyAllProducts()
  }, [products]) // Rerun whenever products list changes


  // --- Initial Data Load & User Info ---

  /**
   * Effect hook to load initial data (user ID, products, logs) on component mount.
   */
  useEffect(() => {
    const userStr = localStorage.getItem('user')
    if (userStr) {
      const user = JSON.parse(userStr)
      setCurrentUserId(user.$id || user.id) // Ensure currentUserId is set
      setNewProduct(prev => ({ ...prev, user_id: user.$id || user.id })) // Set user_id for new product form
    }
    fetchProducts()
    fetchLogs()
  }, [fetchProducts]) // Dependency on fetchProducts to ensure it's up-to-date


  // --- Product Filtering Logic ---

  const filteredProducts = products.filter(product => {
    const matchesSearch =
      (product.name?.toLowerCase().includes(searchQuery.toLowerCase()) || false) ||
      (product.sku?.toLowerCase().includes(searchQuery.toLowerCase()) || false)
    const matchesCategory = !categoryFilter || product.category === categoryFilter
    return matchesSearch && matchesCategory
  })


  // --- Form Validation & Handlers ---

  /**
   * Validates the new product form fields.
   */
  const validateProductForm = () => {
    const errors: string[] = []
    if (!newProduct.name.trim()) errors.push('Product name is required.')
    if (!newProduct.sku.trim()) errors.push('SKU is required.')
    if (newProduct.stock < 0) errors.push('Stock cannot be negative.')
    if (newProduct.unitPrice < 0) errors.push('Unit price cannot be negative.')
    if (!newProduct.user_id) errors.push('User ID is required. Please ensure you are logged in.')
    return errors
  }

  /**
   * Handles the submission for adding a new product.
   * Computes and stores hash along with product data.
   */
  const handleAddProduct = async (e: FormEvent) => {
    e.preventDefault()
    const validationErrors = validateProductForm()
    if (validationErrors.length > 0) {
      validationErrors.forEach(error => toast.error(error))
      return
    }

    try {
      // Data to be hashed
      const dataToHash: ProductHashData = {
        name: newProduct.name,
        sku: newProduct.sku,
        stock: newProduct.stock,
        unitPrice: newProduct.unitPrice,
        category: newProduct.category || ''
      }
      const productHash = await hashProductData(dataToHash) // Compute hash

      const now = new Date().toISOString()
      const createdProduct = {
        ...newProduct,
        hash: productHash, // Store the computed hash
        created_at: now,
        updated_at: now,
      }

      await databases.createDocument(
        process.env.NEXT_PUBLIC_APPWRITE_DATABASE_ID!,
        process.env.NEXT_PUBLIC_PRODUCTS_COLLECTION_ID!,
        ID.unique(),
        createdProduct
      )
      await fetchProducts() // Refresh products list including new one
      toast.success('Product added successfully!', { icon: '🎉' })
      setIsAddProductModalOpen(false) // Close modal
      setNewProduct({ // Reset form
        user_id: currentUserId,
        name: '',
        sku: '',
        stock: 0,
        unitPrice: 0,
        category: ''
      })
    } catch (error) {
      toast.error('Failed to add product')
      console.error('Error adding product:', error)
    }
  }

  /**
   * Handles the submission for adding an inventory transaction (updating stock).
   * Recomputes and updates hash along with stock.
   */
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

      // Prepare updated data for re-hashing
      const updatedProductDataForHash: ProductHashData = {
        name: productToUpdate.name,
        sku: productToUpdate.sku,
        stock: updatedStock, // Use the new stock value for hashing
        unitPrice: productToUpdate.unitPrice,
        category: productToUpdate.category || ''
      }
      const updatedHash = await hashProductData(updatedProductDataForHash) // Recompute hash

      // Update product document in Appwrite (including new stock and hash)
      await databases.updateDocument(
        process.env.NEXT_PUBLIC_APPWRITE_DATABASE_ID!,
        process.env.NEXT_PUBLIC_PRODUCTS_COLLECTION_ID!,
        productToUpdate.$id,
        {
          stock: updatedStock,
          updated_at: new Date().toISOString(),
          hash: updatedHash, // Update the hash
        }
      )

      // Create a log entry for the inventory transaction
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

      await fetchProducts() // Refresh products list
      await fetchLogs() // Refresh logs
      toast.success('Transaction recorded successfully!', { icon: '📦' })
      setIsAddTransactionModalOpen(false) // Close modal
      setNewTransaction({ // Reset form
        productId: '',
        quantity: 0,
        transactionType: 'Add',
        reason: ''
      })
    } catch (error) {
      toast.error('Failed to record transaction')
      console.error('Error handling transaction:', error)
    }
  }

  /**
   * Placeholder for starting the camera scanning process.
   * You'd integrate a library like QuaggaJS or similar here.
   */
  const startScanning = async () => {
    setScanningStatus('scanning')
    try {
      // This is a placeholder. Real implementation would use a scanning library.
      const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'environment' } })
      // You'd attach this stream to a video element and process frames for codes.
      // Example: Quagga.init({ inputStream: { name: "Live", type: "LiveStream", target: videoElement } }, ...)

      // Simulate a successful scan after a delay
      setTimeout(() => {
        const dummyScannedProduct = products.length > 0 ? products[0] : null // Pick first product for demo
        if (dummyScannedProduct) {
          setScannedProduct(dummyScannedProduct)
          setScanningStatus('success')
          toast.success(`Scanned: ${dummyScannedProduct.name}`)
        } else {
          setScanningStatus('error')
          toast.error('No products available to simulate scan.')
        }
      }, 2000)

      // Cleanup function for camera stream (important for real implementation)
      // stream.getTracks().forEach(track => track.stop());

    } catch (error) {
      console.error('Error accessing camera:', error)
      setScanningStatus('error')
      toast.error('Failed to access camera. Please check permissions.')
    }
  }


  // --- Render JSX ---
  return (
    <DashboardLayout>
      <div className="space-y-6">
        <Toaster position="top-right" />

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 xl:grid-cols-5 gap-4">
          {/* Total Products Card */}
          <div className="bg-gray-800/50 p-4 rounded-lg shadow-lg backdrop-blur-sm border border-white/10">
            <div className="flex justify-between items-center mb-3">
              <CubeIcon className="h-6 w-6 text-indigo-500" />
              <span className="text-xs text-gray-400">Total Products</span>
            </div>
            <div className="text-2xl font-bold text-white">{products.length}</div>
            <div className="text-xs text-green-500 mt-1">Active inventory items</div>
          </div>
          {/* Total Stock Card */}
          <div className="bg-gray-800/50 p-4 rounded-lg shadow-lg backdrop-blur-sm border border-white/10">
            <div className="flex justify-between items-center mb-3">
              <ArrowUpIcon className="h-6 w-6 text-green-500" />
              <span className="text-xs text-gray-400">Total Stock</span>
            </div>
            <div className="text-2xl font-bold text-white">
              {products.reduce((total, product) => total + (product.stock ?? 0), 0).toLocaleString()}
            </div>
            <div className="text-xs text-green-500 mt-1">Units in inventory</div>
          </div>
          {/* Total Value Card */}
          <div className="bg-gray-800/50 p-4 rounded-lg shadow-lg backdrop-blur-sm border border-white/10">
            <div className="flex justify-between items-center mb-3">
              <CurrencyDollarIcon className="h-6 w-6 text-yellow-500" />
              <span className="text-xs text-gray-400">Total Value</span>
            </div>
            <div className="text-2xl font-bold text-white">
              ${products.reduce((total, product) => total + ((product.stock ?? 0) * (product.unitPrice ?? 0)), 0).toLocaleString()}
            </div>
            <div className="text-xs text-yellow-500 mt-1">Current inventory value</div>
          </div>
          {/* Low Stock Items Card */}
          <div className="bg-gray-800/50 p-4 rounded-lg shadow-lg backdrop-blur-sm border border-white/10">
            <div className="flex justify-between items-center mb-3">
              <ArrowDownIcon className="h-6 w-6 text-red-500" />
              <span className="text-xs text-gray-400">Low Stock Items</span>
            </div>
            <div className="text-2xl font-bold text-white">{products.filter(p => (p.stock ?? 0) < 10 && (p.stock ?? 0) > 0).length}</div>
            <div className="text-xs text-red-500 mt-1">Items below threshold</div>
          </div>
          {/* Out of Stock Items Card */}
          <div className="bg-gray-800/50 p-4 rounded-lg shadow-lg backdrop-blur-sm border border-white/10">
            <div className="flex justify-between items-center mb-3">
              <ArrowDownIcon className="h-6 w-6 text-red-500" />
              <span className="text-xs text-gray-400">Out of Stock</span>
            </div>
            <div className="text-2xl font-bold text-white">{products.filter(p => (p.stock ?? 0) === 0).length}</div>
            <div className="text-xs text-red-500 mt-1">Items out of stock</div>
          </div>
        </div>

        {/* Search, Filter and Action Buttons */}
        <div className="bg-gray-800/50 rounded-lg p-4 sm:p-6 shadow-lg backdrop-blur-sm border border-white/10">
          <div className="flex flex-col md:flex-row justify-between items-center gap-4">
            {/* Search Input */}
            <div className="relative w-full md:w-96">
              <input
                type="text"
                placeholder="Search products by name or SKU..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full px-4 py-2 pl-10 rounded bg-gray-900/50 border border-white/10 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
              <MagnifyingGlassIcon className="absolute left-3 top-2.5 h-5 w-5 text-gray-400" />
            </div>
            {/* Action Buttons */}
            <div className="flex gap-2 flex-wrap">
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
                  <th className="px-4 py-2 text-gray-400 font-medium">Integrity</th>
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
                      <span
                        className={`px-2 py-1 rounded-full text-xs ${
                          (product.stock ?? 0) === 0
                            ? 'bg-red-500/20 text-red-400'
                            : (product.stock ?? 0) < 10
                            ? 'bg-orange-500/20 text-orange-400'
                            : 'bg-green-500/20 text-green-400'
                        }`}
                      >
                        {typeof product.stock === 'number' ? product.stock : 'N/A'}
                      </span>
                    </td>
                    <td className="px-4 py-2">
                      ${typeof product.unitPrice === 'number' ? product.unitPrice.toLocaleString() : 'N/A'}
                    </td>
                    <td className="px-4 py-2">
                      ${typeof product.unitPrice === 'number' && typeof product.stock === 'number'
                        ? (product.unitPrice * product.stock).toLocaleString()
                        : 'N/A'}
                    </td>
                    <td className="px-4 py-2">
                      {verifiedIds.has(product.$id) ? (
                        <CheckCircleIcon className="inline h-5 w-5 text-green-500" title="Verified" />
                      ) : (
                        <ExclamationCircleIcon className="inline h-5 w-5 text-red-500" title="Integrity check failed" />
                      )}
                    </td>
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
                  <label htmlFor="productName" className="block text-sm font-medium text-gray-400 mb-1">Name</label>
                  <input
                    id="productName"
                    type="text"
                    value={newProduct.name}
                    onChange={(e) => setNewProduct(prev => ({ ...prev, name: e.target.value }))}
                    className="w-full px-3 py-2 rounded bg-gray-800 border border-white/10 text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    required
                  />
                </div>
                <div>
                  <label htmlFor="productSKU" className="block text-sm font-medium text-gray-400 mb-1">SKU</label>
                  <input
                    id="productSKU"
                    type="text"
                    value={newProduct.sku}
                    onChange={(e) => setNewProduct(prev => ({ ...prev, sku: e.target.value }))}
                    className="w-full px-3 py-2 rounded bg-gray-800 border border-white/10 text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    required
                  />
                </div>
                <div>
                  <label htmlFor="productCategory" className="block text-sm font-medium text-gray-400 mb-1">Category</label>
                  <input
                    id="productCategory"
                    type="text"
                    value={newProduct.category}
                    onChange={(e) => setNewProduct(prev => ({ ...prev, category: e.target.value }))}
                    className="w-full px-3 py-2 rounded bg-gray-800 border border-white/10 text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
                <div>
                  <label htmlFor="initialStock" className="block text-sm font-medium text-gray-400 mb-1">Initial Stock</label>
                  <input
                    id="initialStock"
                    type="number"
                    value={newProduct.stock}
                    onChange={(e) => setNewProduct(prev => ({ ...prev, stock: parseInt(e.target.value) }))}
                    className="w-full px-3 py-2 rounded bg-gray-800 border border-white/10 text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    min="0"
                    required
                  />
                </div>
                <div>
                  <label htmlFor="unitPrice" className="block text-sm font-medium text-gray-400 mb-1">Unit Price</label>
                  <input
                    id="unitPrice"
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
                  <label htmlFor="transactionProduct" className="block text-sm font-medium text-gray-400 mb-1">Product</label>
                  <select
                    id="transactionProduct"
                    value={newTransaction.productId}
                    onChange={(e) => setNewTransaction(prev => ({ ...prev, productId: e.target.value }))}
                    className="w-full px-3 py-2 rounded bg-gray-800 border border-white/10 text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    required
                  >
                    <option value="">Select a product</option>
                    {products.map(product => (
                      <option key={product.$id} value={product.$id}>
                        {product.name} (Current Stock: {typeof product.stock === 'number' ? product.stock : 'N/A'})
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label htmlFor="transactionType" className="block text-sm font-medium text-gray-400 mb-1">Transaction Type</label>
                  <select
                    id="transactionType"
                    value={newTransaction.transactionType}
                    onChange={(e) => setNewTransaction(prev => ({ ...prev, transactionType: e.target.value as 'Add' | 'Remove' | 'Adjust' }))}
                    className="w-full px-3 py-2 rounded bg-gray-800 border border-white/10 text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    required
                  >
                    <option value="Add">Add Stock</option>
                    <option value="Remove">Remove Stock</option>
                    <option value="Adjust">Adjust Stock (set to exact quantity)</option>
                  </select>
                </div>
                <div>
                  <label htmlFor="transactionQuantity" className="block text-sm font-medium text-gray-400 mb-1">Quantity</label>
                  <input
                    id="transactionQuantity"
                    type="number"
                    value={newTransaction.quantity}
                    onChange={(e) => setNewTransaction(prev => ({ ...prev, quantity: parseInt(e.target.value) }))}
                    className="w-full px-3 py-2 rounded bg-gray-800 border border-white/10 text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    min="1"
                    required
                  />
                </div>
                <div>
                  <label htmlFor="transactionReason" className="block text-sm font-medium text-gray-400 mb-1">Reason (Optional)</label>
                  <input
                    id="transactionReason"
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
                  setScanningStatus('idle') // Reset status on close
                  setScannedProduct(null) // Clear scanned product on close
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
                      {/* Placeholder for video stream - in a real app, this would be a <video> element */}
                      <div className="absolute inset-0 flex items-center justify-center text-gray-500">
                         {/* This div would be replaced by your video stream for scanning */}
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
                      <p><span className="text-gray-400">Stock:</span> {typeof scannedProduct.stock === 'number' ? scannedProduct.stock : 'N/A'}</p>
                      <button
                        onClick={() => {
                          setNewTransaction(prev => ({ ...prev, productId: scannedProduct.$id }))
                          setIsAddTransactionModalOpen(true)
                          setIsScanningModalOpen(false) // Close scanning modal
                          setScanningStatus('idle') // Reset status
                          setScannedProduct(null) // Clear scanned product
                        }}
                        className="w-full mt-4 px-4 py-2 bg-indigo-600 text-white rounded hover:bg-indigo-700 transition-colors"
                      >
                        Update Stock for this Product
                      </button>
                    </div>
                  </div>
                )}
                {scanningStatus === 'error' && (
                  <div className="text-center text-red-500">
                    <p>Failed to access camera or product not found. Please try again.</p>
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
