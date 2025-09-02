'use client'

import { useState } from 'react'
import { CreateOrderRequest } from '@/types'
import { FileUpload } from './FileUpload'

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

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target
    setFormData(prev => ({
      ...prev,
      [name]: name === 'quantity' ? parseInt(value) || 1 : value
    }))
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

      <div>
        <label htmlFor="delivery_address" className="block text-sm font-medium text-gray-700">
          Delivery Address *
        </label>
        <div className="mt-1">
          <textarea
            id="delivery_address"
            name="delivery_address"
            rows={3}
            required
            value={formData.delivery_address}
            onChange={handleChange}
            className="input-field"
            placeholder="Enter your complete delivery address"
          />
        </div>
        <p className="mt-1 text-sm text-gray-500">
          Include street address, city, postal code, and country
        </p>
      </div>

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
  )
}
