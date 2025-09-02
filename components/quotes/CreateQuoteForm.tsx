'use client'

import { useState } from 'react'
import { CreateQuoteRequest } from '@/types'

interface CreateQuoteFormProps {
  onSubmit: (quoteData: CreateQuoteRequest) => Promise<void>
  onCancel: () => void
  initialPrice?: number
  initialNotes?: string
}

export function CreateQuoteForm({ onSubmit, onCancel, initialPrice, initialNotes }: CreateQuoteFormProps) {
  const [formData, setFormData] = useState({
    price: initialPrice?.toString() || '',
    notes: initialNotes || '',
  })
  const [loading, setLoading] = useState(false)

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target
    setFormData(prev => ({
      ...prev,
      [name]: value
    }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!formData.price || parseFloat(formData.price) <= 0) {
      return
    }

    setLoading(true)

    try {
      await onSubmit({
        order_id: '', // This will be set by the parent component
        price: parseFloat(formData.price),
        notes: formData.notes,
      })
    } finally {
      setLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label htmlFor="price" className="block text-sm font-medium text-gray-700">
          Price (USD) *
        </label>
        <div className="mt-1 relative">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <span className="text-gray-500 sm:text-sm">$</span>
          </div>
          <input
            id="price"
            name="price"
            type="number"
            step="0.01"
            min="0.01"
            required
            value={formData.price}
            onChange={handleChange}
            className="input-field pl-7"
            placeholder="0.00"
          />
        </div>
      </div>

      <div>
        <label htmlFor="notes" className="block text-sm font-medium text-gray-700">
          Notes (Optional)
        </label>
        <div className="mt-1">
          <textarea
            id="notes"
            name="notes"
            rows={3}
            value={formData.notes}
            onChange={handleChange}
            className="input-field"
            placeholder="Add any additional notes or conditions for your quote"
          />
        </div>
      </div>

      <div className="flex justify-end space-x-3 pt-4">
        <button
          type="button"
          onClick={onCancel}
          className="btn-secondary"
        >
          Cancel
        </button>
        <button
          type="submit"
          disabled={loading || !formData.price || parseFloat(formData.price) <= 0}
          className="btn-primary disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {loading ? (initialPrice ? 'Updating...' : 'Submitting...') : (initialPrice ? 'Update Quote' : 'Submit Quote')}
        </button>
      </div>
    </form>
  )
}
