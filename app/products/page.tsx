'use client'

import React, { useState, useEffect, useCallback } from 'react'
import { Client, Databases, Query } from 'appwrite'
import { PlusIcon, MagnifyingGlassIcon, HomeIcon, InboxIcon, TruckIcon, ChartBarIcon, CogIcon } from '@heroicons/react/24/solid'
import toast, { Toaster } from 'react-hot-toast'
import Link from 'next/link'
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
  sku: string
  category: 'Electronics' | 'Furniture' | 'Apparel'
  stock: number
  unitPrice: number
}

const ProductsPage: React.FC = () => {
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
  const [searchQuery, setSearchQuery] = useState('')
  const [categoryFilter, setCategoryFilter] = useState<string>('')
  const [isAddModalOpen, setIsAddModalOpen] = useState(false)
  const [isEditModalOpen, setIsEditModalOpen] = useState(false)
  const [currentProduct, setCurrentProduct] = useState<Product | null>(null)

  // Fetch Products
  const fetchProducts = useCallback(async () => {
    try {
      const response = await databases.listDocuments(
        process.env.NEXT_PUBLIC_APPWRITE_DATABASE_ID!,
        process.env.NEXT_PUBLIC_PRODUCTS_COLLECTION_ID!,
        [
          ...(searchQuery ? [Query.search('name', searchQuery)] : []),
          ...(categoryFilter ? [Query.equal('category', categoryFilter)] : [])
        ]
      )
      setProducts(response.documents as unknown as Product[])
    } catch (error) {
      toast.error('Failed to fetch products')
      console.error(error)
    }
  }, [searchQuery, categoryFilter])

  // Add Product
  const handleAddProduct = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    const formData = new FormData(e.currentTarget)
    const newProduct: Omit<Product, '$id'> = {
      name: formData.get('name') as string,
      sku: formData.get('sku') as string,
      category: formData.get('category') as Product['category'],
      stock: Number(formData.get('stock')),
      unitPrice: Number(formData.get('unitPrice'))
    }

    try {
      await databases.createDocument(
        process.env.NEXT_PUBLIC_APPWRITE_DATABASE_ID!,
        process.env.NEXT_PUBLIC_PRODUCTS_COLLECTION_ID!,
        'unique()',
        newProduct
      )
      toast.success('Product added successfully')
      fetchProducts()
      setIsAddModalOpen(false)
    } catch (error) {
      toast.error('Failed to add product')
      console.error(error)
    }
  }

  // Edit Product
  const handleEditProduct = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    if (!currentProduct) return

    const formData = new FormData(e.currentTarget)
    const updatedProduct: Omit<Product, '$id'> = {
      name: formData.get('name') as string,
      sku: formData.get('sku') as string,
      category: formData.get('category') as Product['category'],
      stock: Number(formData.get('stock')),
      unitPrice: Number(formData.get('unitPrice'))
    }

    try {
      await databases.updateDocument(
        process.env.NEXT_PUBLIC_APPWRITE_DATABASE_ID!,
        process.env.NEXT_PUBLIC_PRODUCTS_COLLECTION_ID!,
        currentProduct.$id,
        updatedProduct
      )
      toast.success('Product updated successfully')
      fetchProducts()
      setIsEditModalOpen(false)
    } catch (error) {
      toast.error('Failed to update product')
      console.error(error)
    }
  }

  useEffect(() => {
    fetchProducts()
  }, [fetchProducts])

  return (
    <div className="min-h-screen bg-slate-900 text-white">
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
              className={`
                flex items-center space-x-2 
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
  
    <div className="flex min-h-screen pt-20">
      {/* Sidebar */}
      <div className="w-64 bg-slate-800 border-r border-slate-700 p-6 fixed left-0 top-16 bottom-0">
        <ul className="space-y-2">
          {navLinks.map((link) => (
            <li key={link.href}>
              <Link
                href={link.href}
                className={`
                  flex items-center space-x-3 py-2 px-4 rounded-lg transition-all duration-300
                  ${pathname === link.href 
                    ? 'bg-gradient-to-r from-indigo-500 to-green-500 text-white'
                    : 'text-gray-300 hover:bg-slate-700 hover:text-white'}
                `}
              >
                <link.icon className="w-5 h-5" />
                <span>{link.label}</span>
              </Link>
            </li>
          ))}
        </ul>
      </div>
  
      {/* Main Content */}
      <div className="flex-grow bg-slate-900 p-6 ml-64">
        <Toaster position="top-right" />
  
        {/* Page Header */}
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold text-white">Products</h1>
            <p className="text-gray-400">Manage your product inventory</p>
          </div>
          <button
            onClick={() => setIsAddModalOpen(true)}
            className="bg-gradient-to-r from-indigo-500 to-green-500 hover:from-indigo-600 hover:to-green-600 text-white px-4 py-2 rounded-lg flex items-center"
          >
            <PlusIcon className="w-5 h-5 mr-2" /> Add Product
          </button>
        </div>
  
        {/* Search and Filter */}
        <div className="flex space-x-4 mb-8">
          <div className="relative flex-grow">
            <input
              type="text"
              placeholder="Search products..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-slate-800 border border-slate-700 rounded-lg pl-10 pr-4 py-2 text-white"
            />
            <MagnifyingGlassIcon className="absolute left-3 top-3 w-5 h-5 text-gray-400" />
          </div>
          <select
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
            className="bg-slate-800 border border-slate-700 rounded-lg px-4 py-2 text-white"
          >
            <option value="">All Categories</option>
            <option value="Electronics">Electronics</option>
            <option value="Furniture">Furniture</option>
            <option value="Apparel">Apparel</option>
          </select>
        </div>
  
        {/* Product Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {products.map((product) => (
            <div
              key={product.$id}
              className="bg-slate-800 rounded-lg p-6 border border-slate-700 hover:border-indigo-500 transition-all"
            >
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-xl font-semibold">{product.name}</h3>
                <span className="text-sm text-gray-400">SKU: {product.sku}</span>
              </div>
              <div className="space-y-2 mb-4">
                <p className="text-gray-400">Category: {product.category}</p>
                <p className="text-gray-400">Stock: {product.stock}</p>
                <p className="text-green-400">Price: ${product.unitPrice.toFixed(2)}</p>
              </div>
              <div className="flex space-x-4">
                <button
                  onClick={() => {
                    setCurrentProduct(product);
                    setIsEditModalOpen(true);
                  }}
                  className="flex-grow bg-slate-700 hover:bg-slate-600 text-white px-4 py-2 rounded-lg"
                >
                  Edit
                </button>
                <button className="flex-grow bg-gradient-to-r from-indigo-500 to-green-500 hover:from-indigo-600 hover:to-green-600 text-white px-4 py-2 rounded-lg">
                  Track
                </button>
              </div>
            </div>
          ))}
        </div>
  
        {/* Add Product Modal */}
        {isAddModalOpen && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-slate-800 rounded-lg p-8 w-full max-w-md">
              <h2 className="text-2xl font-bold mb-6">Add New Product</h2>
              <form onSubmit={handleAddProduct} className="space-y-4">
                <input
                  type="text"
                  name="name"
                  placeholder="Product Name"
                  required
                  className="w-full bg-slate-700 rounded-lg px-4 py-2 text-white"
                />
                <input
                  type="text"
                  name="sku"
                  placeholder="SKU"
                  required
                  className="w-full bg-slate-700 rounded-lg px-4 py-2 text-white"
                />
                <select
                  name="category"
                  required
                  className="w-full bg-slate-700 rounded-lg px-4 py-2 text-white"
                >
                  <option value="Electronics">Electronics</option>
                  <option value="Furniture">Furniture</option>
                  <option value="Apparel">Apparel</option>
                </select>
                <input
                  type="number"
                  name="stock"
                  placeholder="Stock"
                  required
                  min="0"
                  className="w-full bg-slate-700 rounded-lg px-4 py-2 text-white"
                />
                <input
                  type="number"
                  name="unitPrice"
                  placeholder="Unit Price"
                  required
                  min="0.01"
                  step="0.01"
                  className="w-full bg-slate-700 rounded-lg px-4 py-2 text-white"
                />
                <div className="flex space-x-4">
                  <button
                    type="submit"
                    className="flex-grow bg-gradient-to-r from-indigo-500 to-green-500 hover:from-indigo-600 hover:to-green-600 text-white px-4 py-2 rounded-lg"
                  >
                    Add Product
                  </button>
                  <button
                    type="button"
                    onClick={() => setIsAddModalOpen(false)}
                    className="flex-grow bg-slate-700 hover:bg-slate-600 text-white px-4 py-2 rounded-lg"
                  >
                    Cancel
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
  
        {/* Edit Product Modal */}
        {isEditModalOpen && currentProduct && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-slate-800 rounded-lg p-8 w-full max-w-md">
              <h2 className="text-2xl font-bold mb-6">Edit Product</h2>
              <form onSubmit={handleEditProduct} className="space-y-4">
                <input
                  type="text"
                  name="name"
                  placeholder="Product Name"
                  defaultValue={currentProduct.name}
                  required
                  className="w-full bg-slate-700 rounded-lg px-4 py-2 text-white"
                />
                <input
                  type="text"
                  name="sku"
                  placeholder="SKU"
                  defaultValue={currentProduct.sku}
                  required
                  className="w-full bg-slate-700 rounded-lg px-4 py-2 text-white"
                />
                <select
                  name="category"
                  defaultValue={currentProduct.category}
                  required
                  className="w-full bg-slate-700 rounded-lg px-4 py-2 text-white"
                >
                  <option value="Electronics">Electronics</option>
                  <option value="Furniture">Furniture</option>
                  <option value="Apparel">Apparel</option>
                </select>
                <input
                  type="number"
                  name="stock"
                  placeholder="Stock"
                  defaultValue={currentProduct.stock}
                  required
                  min="0"
                  className="w-full bg-slate-700 rounded-lg px-4 py-2 text-white"
                />
                <input
                  type="number"
                  name="unitPrice"
                  placeholder="Unit Price"
                  defaultValue={currentProduct.unitPrice}
                  required
                  min="0.01"
                  step="0.01"
                  className="w-full bg-slate-700 rounded-lg px-4 py-2 text-white"
                />
                <div className="flex space-x-4">
                  <button
                    type="submit"
                    className="flex-grow bg-gradient-to-r from-indigo-500 to-green-500 hover:from-indigo-600 hover:to-green-600 text-white px-4 py-2 rounded-lg"
                  >
                    Update Product
                  </button>
                  <button
                    type="button"
                    onClick={() => setIsEditModalOpen(false)}
                    className="flex-grow bg-slate-700 hover:bg-slate-600 text-white px-4 py-2 rounded-lg"
                  >
                    Cancel
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </div>
  </div>
  
  )
}

export default ProductsPage
