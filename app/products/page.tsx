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
  BellIcon,
  PlusIcon
} from '@heroicons/react/24/outline'
import { toast } from 'react-hot-toast'
import { Client, Databases, Query } from 'appwrite'
import { ID } from 'appwrite'
import Link from 'next/link'
import UserProfileInfo from '@/components/UserInfo'
import { usePathname } from 'next/navigation'

// Appwrite Configuration
const client = new Client()
  .setEndpoint(process.env.NEXT_PUBLIC_APPWRITE_ENDPOINT!)
  .setProject(process.env.NEXT_PUBLIC_APPWRITE_PROJECT_ID!)

const databases = new Databases(client)

// Types
type Product = {
  $id: string
  name: string
  category: string
  price: number
  stock: number
  description: string
  sku: string
  created_at: string
}

type ProductStats = {
  total_products: number
  low_stock: number
  out_of_stock: number
  total_value: number
}

const ProductsPage: React.FC = () => {
  const pathname = usePathname()
  const [products, setProducts] = useState<Product[]>([])
  const [isCreating, setIsCreating] = useState(false)
  const [stats, setStats] = useState<ProductStats>({
    total_products: 0,
    low_stock: 0,
    out_of_stock: 0,
    total_value: 0
  })

  const [searchQuery, setSearchQuery] = useState('')
  const [categoryFilter, setCategoryFilter] = useState('')

  const [newProduct, setNewProduct] = useState<Partial<Product>>({})

  const navigation = [
    { name: 'Dashboard', href: '/dashboard', icon: HomeIcon },
    { name: 'Shipments', href: '/shipments', icon: TruckIcon },
    { name: 'Products', href: '/products', icon: CubeIcon },
    { name: 'Inventory', href: '/inventory', icon: CubeIcon },
    { name: 'Analytics', href: '/analytics', icon: ChartPieIcon },
    { name: 'Settings', href: '/settings', icon: Cog6ToothIcon },
  ]

  const fetchProducts = async () => {
    try {
      const response = await databases.listDocuments(
        process.env.NEXT_PUBLIC_APPWRITE_DATABASE_ID!,
        process.env.NEXT_PUBLIC_PRODUCTS_COLLECTION_ID!,
        [
          Query.orderDesc('$createdAt'),
          Query.limit(100)
        ]
      )

      const typedProducts = response.documents as unknown as Product[]
      
      // Calculate stats
      const totalProducts = typedProducts.length
      const lowStock = typedProducts.filter(p => p.stock < 10 && p.stock > 0).length
      const outOfStock = typedProducts.filter(p => p.stock === 0).length
      const totalValue = typedProducts.reduce((sum, p) => sum + (p.price * p.stock), 0)

      setProducts(typedProducts)
      setStats({
        total_products: totalProducts,
        low_stock: lowStock,
        out_of_stock: outOfStock,
        total_value: totalValue
      })
    } catch (error) {
      console.error('Failed to fetch products:', error)
      toast.error('Failed to fetch products')
    }
  }

  const createProduct = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsCreating(true)
    try {
      const productData = {
        ...newProduct,
        sku: `PRD-${Math.random().toString(36).substring(2, 10).toUpperCase()}`,
        created_at: new Date().toISOString()
      }

      await databases.createDocument(
        process.env.NEXT_PUBLIC_APPWRITE_DATABASE_ID!,
        process.env.NEXT_PUBLIC_PRODUCTS_COLLECTION_ID!,
        ID.unique(),
        productData
      )

      toast.success('Product created successfully')
      fetchProducts()
      setNewProduct({})
    } catch (error) {
      console.error('Failed to create product:', error)
      toast.error('Failed to create product')
    } finally {
      setIsCreating(false)
    }
  }

  useEffect(() => {
    fetchProducts()
  }, [])

  const filteredProducts = products.filter(product => 
    (!searchQuery || Object.values(product).some(val => 
      val.toString().toLowerCase().includes(searchQuery.toLowerCase())
    )) &&
    (!categoryFilter || product.category === categoryFilter)
  )

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
                <h1 className="text-2xl font-bold text-white">Products Management</h1>
                <p className="text-gray-400 mt-1">Manage your product catalog and inventory</p>
              </div>
              <UserProfileInfo />
            </div>
          </div>

          {/* Stats Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            {/* Total Products Card */}
            <div className="bg-gradient-to-br from-indigo-500/10 to-indigo-600/10 p-6 rounded-xl backdrop-blur-lg border border-indigo-500/20">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-gray-400 text-sm font-medium">Total Products</h3>
                <CubeIcon className="w-5 h-5 text-indigo-500" />
              </div>
              <div className="flex items-baseline justify-between">
                <p className="text-3xl font-bold text-white">{stats.total_products}</p>
                <span className="flex items-center text-green-500 text-sm">
                  <ArrowUpIcon className="w-4 h-4 mr-1" />
                  12%
                </span>
              </div>
            </div>

            {/* Low Stock Card */}
            <div className="bg-gradient-to-br from-amber-500/10 to-amber-600/10 p-6 rounded-xl backdrop-blur-lg border border-amber-500/20">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-gray-400 text-sm font-medium">Low Stock</h3>
                <ArrowDownIcon className="w-5 h-5 text-amber-500" />
              </div>
              <div className="flex items-baseline justify-between">
                <p className="text-3xl font-bold text-white">{stats.low_stock}</p>
                <span className="flex items-center text-amber-500 text-sm">
                  <ArrowDownIcon className="w-4 h-4 mr-1" />
                  3%
                </span>
              </div>
            </div>

            {/* Out of Stock Card */}
            <div className="bg-gradient-to-br from-red-500/10 to-red-600/10 p-6 rounded-xl backdrop-blur-lg border border-red-500/20">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-gray-400 text-sm font-medium">Out of Stock</h3>
                <ClockIcon className="w-5 h-5 text-red-500" />
              </div>
              <div className="flex items-baseline justify-between">
                <p className="text-3xl font-bold text-white">{stats.out_of_stock}</p>
                <span className="flex items-center text-red-500 text-sm">
                  <ArrowDownIcon className="w-4 h-4 mr-1" />
                  5%
                </span>
              </div>
            </div>

            {/* Total Value Card */}
            <div className="bg-gradient-to-br from-green-500/10 to-green-600/10 p-6 rounded-xl backdrop-blur-lg border border-green-500/20">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-gray-400 text-sm font-medium">Total Value</h3>
                <CurrencyDollarIcon className="w-5 h-5 text-green-500" />
              </div>
              <div className="flex items-baseline justify-between">
                <p className="text-3xl font-bold text-white">${stats.total_value.toLocaleString()}</p>
                <span className="flex items-center text-green-500 text-sm">
                  <ArrowUpIcon className="w-4 h-4 mr-1" />
                  8%
                </span>
              </div>
            </div>
          </div>

          {/* Add Product Form */}
          <div className="bg-white/5 rounded-xl backdrop-blur-lg border border-white/10 overflow-hidden mb-8">
            <div className="p-6 border-b border-white/10">
              <h2 className="text-xl font-semibold text-white">Add New Product</h2>
              <p className="text-gray-400 text-sm mt-1">Add a new product to your catalog</p>
            </div>
            <div className="p-6">
              <form onSubmit={createProduct} className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <input
                  type="text"
                  placeholder="Product Name"
                  value={newProduct.name || ''}
                  onChange={(e) => setNewProduct(prev => ({...prev, name: e.target.value}))}
                  className="bg-gray-900/50 text-white p-2 rounded border border-white/10 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  required
                />
                <input
                  type="text"
                  placeholder="Category"
                  value={newProduct.category || ''}
                  onChange={(e) => setNewProduct(prev => ({...prev, category: e.target.value}))}
                  className="bg-gray-900/50 text-white p-2 rounded border border-white/10 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  required
                />
                <input
                  type="number"
                  placeholder="Price"
                  value={newProduct.price || ''}
                  onChange={(e) => setNewProduct(prev => ({...prev, price: parseFloat(e.target.value)}))}
                  className="bg-gray-900/50 text-white p-2 rounded border border-white/10 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  required
                />
                <input
                  type="number"
                  placeholder="Stock"
                  value={newProduct.stock || ''}
                  onChange={(e) => setNewProduct(prev => ({...prev, stock: parseInt(e.target.value)}))}
                  className="bg-gray-900/50 text-white p-2 rounded border border-white/10 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  required
                />
                <input
                  type="text"
                  placeholder="Description"
                  value={newProduct.description || ''}
                  onChange={(e) => setNewProduct(prev => ({...prev, description: e.target.value}))}
                  className="bg-gray-900/50 text-white p-2 rounded border border-white/10 focus:outline-none focus:ring-2 focus:ring-indigo-500 md:col-span-2"
                  required
                />
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
                      <span>Creating Product...</span>
                    </>
                  ) : (
                    <>
                      <PlusIcon className="w-5 h-5" />
                      <span>Add Product</span>
                    </>
                  )}
                </button>
              </form>
            </div>
          </div>

          {/* Products Table */}
          <div className="bg-white/5 rounded-xl backdrop-blur-lg border border-white/10 overflow-hidden">
            <div className="p-6 border-b border-white/10">
              <div className="flex flex-col md:flex-row justify-between items-center gap-4">
                <div>
                  <h2 className="text-xl font-semibold text-white">Product Catalog</h2>
                  <p className="text-gray-400 text-sm mt-1">Manage your product inventory</p>
                </div>
                <div className="flex flex-col md:flex-row gap-2">
                  <div className="relative">
                    <input
                      type="text"
                      placeholder="Search products..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="bg-gray-900/50 text-white pl-10 pr-4 py-2 rounded border border-white/10 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    />
                    <MagnifyingGlassIcon className="absolute left-3 top-2.5 h-5 w-5 text-gray-400" />
                  </div>
                  <select
                    value={categoryFilter}
                    onChange={(e) => setCategoryFilter(e.target.value)}
                    className="bg-gray-900/50 text-white px-4 py-2 rounded border border-white/10 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  >
                    <option value="">All Categories</option>
                    <option value="electronics">Electronics</option>
                    <option value="clothing">Clothing</option>
                    <option value="food">Food</option>
                    <option value="other">Other</option>
                  </select>
                </div>
              </div>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="text-left text-gray-400 border-b border-white/10">
                    <th className="px-6 py-4 font-medium">SKU</th>
                    <th className="px-6 py-4 font-medium">Name</th>
                    <th className="px-6 py-4 font-medium">Category</th>
                    <th className="px-6 py-4 font-medium">Price</th>
                    <th className="px-6 py-4 font-medium">Stock</th>
                    <th className="px-6 py-4 font-medium">Status</th>
                    <th className="px-6 py-4 font-medium">Created</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/10">
                  {filteredProducts.map(product => (
                    <tr key={product.$id} className="hover:bg-white/5 transition-colors">
                      <td className="px-6 py-4 text-sm">{product.sku}</td>
                      <td className="px-6 py-4 text-sm">{product.name}</td>
                      <td className="px-6 py-4 text-sm">{product.category}</td>
                      <td className="px-6 py-4 text-sm">${product.price}</td>
                      <td className="px-6 py-4 text-sm">{product.stock}</td>
                      <td className="px-6 py-4">
                        <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                          product.stock === 0 ? 'bg-red-500/20 text-red-400' :
                          product.stock < 10 ? 'bg-amber-500/20 text-amber-400' :
                          'bg-green-500/20 text-green-400'
                        }`}>
                          {product.stock === 0 ? 'Out of Stock' :
                           product.stock < 10 ? 'Low Stock' :
                           'In Stock'}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-sm">{new Date(product.created_at).toLocaleDateString()}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}

export default ProductsPage
