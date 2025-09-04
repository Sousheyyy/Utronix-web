'use client'

import { useState } from 'react'
import { CreateOrderRequest, SavedAddress } from '@/types'
import { FileUpload } from './FileUpload'
import { AddressSelector } from '../addresses/AddressSelector'

interface CreateOrderFormProps {
  onSubmit: (orderData: CreateOrderRequest) => Promise<void>
  onCancel?: () => void
}

export function CreateOrderForm({ onSubmit, onCancel }: CreateOrderFormProps) {
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    quantity: 1,
    product_link: '',
    delivery_address: '',
    phone_number: '',
  })
  const [files, setFiles] = useState<File[]>([])
  const [loading, setLoading] = useState(false)
  const [selectedAddress, setSelectedAddress] = useState<SavedAddress | null>(null)
  const [showAddressForm, setShowAddressForm] = useState(false)

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target
    setFormData(prev => ({
      ...prev,
      [name]: name === 'quantity' ? parseInt(value) || 1 : value
    }))
  }

  const handleAddressSelect = (address: SavedAddress | null) => {
    setSelectedAddress(address)
    if (address) {
      setFormData(prev => ({
        ...prev,
        delivery_address: address.address,
        phone_number: address.phone || ''
      }))
    }
  }

  const handleNewAddress = () => {
    setShowAddressForm(true)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    try {
      await onSubmit({ ...formData, files })
      // Reset form
      setFormData({
        title: '',
        description: '',
        quantity: 1,
        product_link: '',
        delivery_address: '',
        phone_number: '',
      })
      setFiles([])
      setSelectedAddress(null)
    } catch (error) {
      console.error('Error in form submission:', error)
      // Error handling is done in the parent component
    } finally {
      setLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div>
        <label htmlFor="title" className="block text-sm font-medium text-gray-700">
          Product Title *
        </label>
        <div className="mt-1">
          <input
            id="title"
            name="title"
            type="text"
            required
            value={formData.title}
            onChange={handleChange}
            className="input-field"
            placeholder="Enter product title"
          />
        </div>
      </div>

      <div>
        <label htmlFor="description" className="block text-sm font-medium text-gray-700">
          Description *
        </label>
        <div className="mt-1">
          <textarea
            id="description"
            name="description"
            rows={4}
            required
            value={formData.description}
            onChange={handleChange}
            className="input-field"
            placeholder="Describe your product requirements in detail"
          />
        </div>
      </div>

      <div>
        <label htmlFor="product_link" className="block text-sm font-medium text-gray-700">
          Product Link (Optional)
        </label>
        <div className="mt-1">
          <input
            id="product_link"
            name="product_link"
            type="url"
            value={formData.product_link}
            onChange={handleChange}
            className="input-field"
            placeholder="https://example.com/product"
          />
        </div>
        <p className="mt-1 text-sm text-gray-500">
          Add a link to the product you want to order (e.g., Amazon, AliExpress, etc.)
        </p>
      </div>

      <div>
        <label htmlFor="quantity" className="block text-sm font-medium text-gray-700">
          Quantity *
        </label>
        <div className="mt-1">
          <input
            id="quantity"
            name="quantity"
            type="number"
            min="1"
            required
            value={formData.quantity}
            onChange={handleChange}
            className="input-field"
            placeholder="Enter quantity"
          />
        </div>
      </div>

      <AddressSelector
        selectedAddress={selectedAddress}
        onAddressSelect={handleAddressSelect}
        onNewAddress={handleNewAddress}
      />

      <div>
        <label htmlFor="phone_number" className="block text-sm font-medium text-gray-700">
          Phone Number *
        </label>
        <div className="mt-1">
          <input
            id="phone_number"
            name="phone_number"
            type="tel"
            required
            value={formData.phone_number}
            onChange={handleChange}
            className="input-field"
            placeholder="Enter your phone number"
          />
        </div>
        <p className="mt-1 text-sm text-gray-500">
          Include country code (e.g., +1 555 123 4567)
        </p>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Attach Files (Optional)
        </label>
        <FileUpload 
          files={files}
          onFilesChange={setFiles}
        />
        <p className="mt-1 text-sm text-gray-500">
          Upload reference images, documents, or specifications (PNG, JPG, ZIP, PDF - Max 16MB each)
        </p>
      </div>

      <div className="flex justify-end space-x-3">
        {onCancel && (
          <button
            type="button"
            onClick={onCancel}
            className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-md transition-colors"
          >
            Cancel
          </button>
        )}
        <button
          type="submit"
          disabled={loading || !formData.title || !formData.description || !formData.delivery_address || !formData.phone_number}
          className="btn-primary disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {loading ? 'Creating...' : 'Create Order'}
        </button>
      </div>
    </form>

    {/* Address Form Modal */}
    {showAddressForm && (
      <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
        <div className="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white">
          <div className="mt-3">
            <h3 className="text-lg font-medium text-gray-900 mb-4">Add New Address</h3>
            <p className="text-sm text-gray-500 mb-4">
              This address will be saved to your account for future orders.
            </p>
            
            <form onSubmit={(e) => {
              e.preventDefault()
              // For now, just close the modal - the address will be saved when the order is created
              setShowAddressForm(false)
            }} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Address Name *
                </label>
                <input
                  type="text"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-primary-500 focus:border-primary-500"
                  placeholder="e.g., Home, Office, Warehouse"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Address *
                </label>
                <textarea
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-primary-500 focus:border-primary-500"
                  placeholder="Enter full delivery address"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Phone Number
                </label>
                <input
                  type="tel"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-primary-500 focus:border-primary-500"
                  placeholder="Enter phone number"
                />
              </div>

              <div className="flex space-x-3">
                <button
                  type="submit"
                  className="flex-1 bg-primary-600 hover:bg-primary-700 text-white font-medium py-2 px-4 rounded-md transition-colors"
                >
                  Save & Use Address
                </button>
                <button
                  type="button"
                  onClick={() => setShowAddressForm(false)}
                  className="flex-1 bg-gray-500 hover:bg-gray-600 text-white font-medium py-2 px-4 rounded-md transition-colors"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    )}
  )
}
