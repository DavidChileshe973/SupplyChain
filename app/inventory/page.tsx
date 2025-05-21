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
  MagnifyingGlassIcon
} from '@heroicons/react/24/outline'
import { ID } from 'appwrite'
import { databases } from '@/lib/appwrite'

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

  return (
    <div className="min-h-screen bg-slate-900">
      <Toaster position="top-right" />
      {/* Navigation */}
      <nav className="fixed top-0 left-0 right-0 bg-slate-800/80 backdrop-blur-md z-50 border-b border-slate-700">
        <div className="container mx-auto flex justify-between items-center py-4 px-6">
          <Link href="/dashboard" className="flex items-center text-white text-xl font-bold">
            <InboxIcon className="w-8 h-8 mr-2 text-indigo-500" />
            Supply<span className="text-green-500">Flow</span>
          </Link>
          <div className="flex space-x-6">
            {navLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className={`flex items-center space-x-2 
                  ${pathname === link.href ? 'text-indigo-500' : 'text-gray-300 hover:text-white'}
                  transition-colors duration-300
                `}
              >
                <link.icon className="w-5 h-5" />
                <span>{link.label}</span>
              </Link>
            ))}
            <Link
              href="/logout"
              className="text-red-400 hover:text-red-300 transition-colors duration-300"
            >
              Logout
            </Link>
          </div>
        </div>
      </nav>
      {/* Main Content */}
      <div className="pt-20 px-6">
        <div className="max-w-7xl mx-auto">
          {/* Header */}
          <div className="flex justify-between items-center mb-8">
            <div>
              <h1 className="text-3xl font-bold text-white">Inventory Management</h1>
              <p className="text-gray-400">Manage your products and stock levels</p>
            </div>
            <div className="flex space-x-4">
              <button
                onClick={() => setIsAddTransactionModalOpen(true)}
                className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-lg flex items-center"
              >
                <PlusIcon className="w-5 h-5 mr-2" />
                Add Transaction
              </button>
              <button
                onClick={() => setIsAddProductModalOpen(true)}
                className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg flex items-center"
              >
                <PlusIcon className="w-5 h-5 mr-2" />
                Add Product
              </button>
            </div>
          </div>
          {/* Search and Filter */}
          <div className="flex space-x-4 mb-6">
            <div className="relative flex-grow">
              <input
                type="text"
                placeholder="Search products..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-slate-800 border border-slate-700 rounded-lg pl-10 pr-4 py-2 text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
              <MagnifyingGlassIcon className="absolute left-3 top-2.5 w-5 h-5 text-gray-400" />
            </div>
            <select
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
              className="bg-slate-800 border border-slate-700 rounded-lg px-4 py-2 text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
            >
              <option value="">All Categories</option>
              <option value="Electronics">Electronics</option>
              <option value="Furniture">Furniture</option>
              <option value="Apparel">Apparel</option>
            </select>
          </div>
          {/* Products Table */}
          <div className="bg-slate-800 rounded-lg border border-slate-700 overflow-hidden">
            <table className="w-full">
              <thead>
                <tr className="bg-slate-700">
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">Product</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">SKU</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">Category</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">Stock</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">Unit Price</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-700">
                {filteredProducts.map((product) => (
                  <tr key={product.$id} className="hover:bg-slate-700/50">
                    <td className="px-6 py-4 whitespace-nowrap text-white">{product.name}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-gray-300">{product.sku}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-gray-300">{product.category || '-'}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-gray-300">{product.stock}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-gray-300">${product.unitPrice.toFixed(2)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {/* Inventory Log Table */}
          <div className="bg-slate-800 rounded-lg border border-slate-700 overflow-hidden mt-10">
            <h2 className="text-xl font-bold text-white px-6 pt-6">Inventory Log</h2>
            <table className="w-full">
              <thead>
                <tr className="bg-slate-700">
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">Date</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">Product</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">Change Type</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">Quantity</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">Reason</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-700">
                {logs
                  .sort((a, b) => b.created_at.localeCompare(a.created_at))
                  .map((log) => {
                    const product = products.find(p => p.$id === log.product_id)
                    return (
                      <tr key={log.$id}>
                        <td className="px-6 py-4 whitespace-nowrap text-gray-300">{new Date(log.created_at).toLocaleString()}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-gray-300">{product?.name || 'Unknown'}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-gray-300">{log.change_type}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-gray-300">{log.quantity}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-gray-300">{log.reason || '-'}</td>
                      </tr>
                    )
                  })}
              </tbody>
            </table>
          </div>
        </div>
      </div>
      {/* Add Product Modal */}
      <div
        className={`fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 ${isAddProductModalOpen ? 'block' : 'hidden'}`}
        onClick={() => setIsAddProductModalOpen(false)}
      >
        <div
          className="bg-slate-800 rounded-lg p-6 w-full max-w-md"
          onClick={e => e.stopPropagation()}
        >
          <h2 className="text-2xl font-bold mb-4 text-white">Add New Product</h2>
          <form onSubmit={handleAddProduct} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">Product Name</label>
              <input
                type="text"
                value={newProduct.name}
                onChange={(e) => setNewProduct(prev => ({ ...prev, name: e.target.value }))}
                className="w-full bg-slate-700 border border-slate-600 rounded-lg px-3 py-2 text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">SKU</label>
              <input
                type="text"
                value={newProduct.sku}
                onChange={(e) => setNewProduct(prev => ({ ...prev, sku: e.target.value }))}
                className="w-full bg-slate-700 border border-slate-600 rounded-lg px-3 py-2 text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">Category</label>
              <input
                type="text"
                value={newProduct.category}
                onChange={(e) => setNewProduct(prev => ({ ...prev, category: e.target.value }))}
                className="w-full bg-slate-700 border border-slate-600 rounded-lg px-3 py-2 text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">Stock</label>
              <input
                type="number"
                value={newProduct.stock}
                min={0}
                onChange={(e) => setNewProduct(prev => ({ ...prev, stock: Number(e.target.value) }))}
                className="w-full bg-slate-700 border border-slate-600 rounded-lg px-3 py-2 text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">Unit Price</label>
              <input
                type="number"
                value={newProduct.unitPrice}
                min={0}
                step={0.01}
                onChange={(e) => setNewProduct(prev => ({ ...prev, unitPrice: Number(e.target.value) }))}
                className="w-full bg-slate-700 border border-slate-600 rounded-lg px-3 py-2 text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                required
              />
            </div>
            <div className="flex justify-end">
              <button
                type="button"
                className="mr-2 px-4 py-2 rounded-lg bg-gray-600 text-white"
                onClick={() => setIsAddProductModalOpen(false)}
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-4 py-2 rounded-lg bg-green-600 hover:bg-green-700 text-white"
              >
                Add Product
              </button>
            </div>
          </form>
        </div>
      </div>
      {/* Add Transaction Modal */}
      <div
        className={`fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 ${isAddTransactionModalOpen ? 'block' : 'hidden'}`}
        onClick={() => setIsAddTransactionModalOpen(false)}
      >
        <div
          className="bg-slate-800 rounded-lg p-6 w-full max-w-md"
          onClick={e => e.stopPropagation()}
        >
          <h2 className="text-2xl font-bold mb-4 text-white">Add Transaction</h2>
          <form onSubmit={handleAddTransaction} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">Product</label>
              <select
                value={newTransaction.productId}
                onChange={e => setNewTransaction(prev => ({ ...prev, productId: e.target.value }))}
                className="w-full bg-slate-700 border border-slate-600 rounded-lg px-3 py-2 text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                required
              >
                <option value="">Select a product</option>
                {products.map(product => (
                  <option key={product.$id} value={product.$id}>
                    {product.name} ({product.sku})
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">Quantity</label>
              <input
                type="number"
                value={newTransaction.quantity}
                min={1}
                onChange={e => setNewTransaction(prev => ({ ...prev, quantity: Number(e.target.value) }))}
                className="w-full bg-slate-700 border border-slate-600 rounded-lg px-3 py-2 text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">Change Type</label>
              <select
                value={newTransaction.transactionType}
                onChange={e => setNewTransaction(prev => ({ ...prev, transactionType: e.target.value as 'Add' | 'Remove' | 'Adjust' }))}
                className="w-full bg-slate-700 border border-slate-600 rounded-lg px-3 py-2 text-white"
                required
              >
                <option value="Add">Add</option>
                <option value="Remove">Remove</option>
                <option value="Adjust">Adjust</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">Reason (optional)</label>
              <input
                type="text"
                value={newTransaction.reason}
                onChange={e => setNewTransaction(prev => ({ ...prev, reason: e.target.value }))}
                className="w-full bg-slate-700 border border-slate-600 rounded-lg px-3 py-2 text-white"
              />
            </div>
            <div className="flex justify-end">
              <button
                type="button"
                className="mr-2 px-4 py-2 rounded-lg bg-gray-600 text-white"
                onClick={() => setIsAddTransactionModalOpen(false)}
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-4 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white"
              >
                Record Transaction
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  )
}

export default InventoryPage
