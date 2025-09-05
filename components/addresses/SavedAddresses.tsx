'use client'

import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import { SavedAddress } from '@/types'
import { Plus, Edit, Trash2, MapPin, Phone, Check } from 'lucide-react'
import { toast } from 'react-hot-toast'

interface SavedAddressesProps {
  onAddressSelect?: (address: SavedAddress) => void
  showSelectButton?: boolean
}

export function SavedAddresses({ onAddressSelect, showSelectButton = false }: SavedAddressesProps) {
  const [addresses, setAddresses] = useState<SavedAddress[]>([])
  const [loading, setLoading] = useState(true)
  const [showAddForm, setShowAddForm] = useState(false)
  const [editingAddress, setEditingAddress] = useState<SavedAddress | null>(null)
  const [formData, setFormData] = useState({
    name: '',
    address: '',
    phone: ''
  })

  useEffect(() => {
    fetchAddresses()
  }, [])

  const fetchAddresses = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        toast.error('You must be logged in to view addresses')
        setLoading(false)
        return
      }

      const { data, error } = await supabase
        .from('saved_addresses')
        .select('*')
        .eq('customer_id', user.id)
        .order('created_at', { ascending: false })

      if (error) {
        console.error('Error fetching addresses:', error)
        toast.error('Failed to fetch saved addresses')
        return
      }

      setAddresses(data || [])
    } catch (error) {
      console.error('Error fetching addresses:', error)
      toast.error('Failed to fetch saved addresses')
    } finally {
      setLoading(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!formData.name.trim() || !formData.address.trim()) {
      toast.error('Please fill in name and address')
      return
    }

    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        toast.error('You must be logged in to save addresses')
        return
      }

      if (editingAddress) {
        // Update existing address
        const { error } = await supabase
          .from('saved_addresses')
          .update({
            name: formData.name,
            address: formData.address,
            phone: formData.phone || null,
            updated_at: new Date().toISOString()
          })
          .eq('id', editingAddress.id)

        if (error) {
          console.error('Error updating address:', error)
          toast.error('Failed to update address')
          return
        }

        toast.success('Address updated successfully')
      } else {
        // Create new address
        const { error } = await supabase
          .from('saved_addresses')
          .insert([{
            customer_id: user.id,
            name: formData.name,
            address: formData.address,
            phone: formData.phone || null
          }])

        if (error) {
          console.error('Error creating address:', error)
          toast.error('Failed to save address')
          return
        }

        toast.success('Address saved successfully')
      }

      setFormData({ name: '', address: '', phone: '' })
      setShowAddForm(false)
      setEditingAddress(null)
      fetchAddresses()
    } catch (error) {
      console.error('Error saving address:', error)
      toast.error('Failed to save address')
    }
  }

  const handleEdit = (address: SavedAddress) => {
    setEditingAddress(address)
    setFormData({
      name: address.name,
      address: address.address,
      phone: address.phone || ''
    })
    setShowAddForm(true)
  }

  const handleDelete = async (addressId: string) => {
    if (!confirm('Are you sure you want to delete this address?')) {
      return
    }

    try {
      const { error } = await supabase
        .from('saved_addresses')
        .delete()
        .eq('id', addressId)

      if (error) {
        console.error('Error deleting address:', error)
        toast.error('Failed to delete address')
        return
      }

      toast.success('Address deleted successfully')
      fetchAddresses()
    } catch (error) {
      console.error('Error deleting address:', error)
      toast.error('Failed to delete address')
    }
  }


  const handleSelect = (address: SavedAddress) => {
    if (onAddressSelect) {
      onAddressSelect(address)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-medium text-gray-900">My Addresses</h3>
        <button
          onClick={() => {
            setEditingAddress(null)
            setFormData({ name: '', address: '', phone: '' })
            setShowAddForm(true)
          }}
          className="btn-primary flex items-center"
        >
          <Plus className="h-4 w-4 mr-2" />
          Add Address
        </button>
      </div>

      {/* Address List */}
      {addresses.length === 0 ? (
        <div className="text-center py-8">
          <MapPin className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <p className="text-gray-500">No saved addresses yet</p>
          <p className="text-sm text-gray-400">Add your first address to get started</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {addresses.map((address) => (
            <div
              key={address.id}
              className="border border-gray-200 rounded-lg p-4"
            >
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-center">
                  <h4 className="font-medium text-gray-900">{address.name}</h4>
                </div>
                <div className="flex space-x-2">
                  {showSelectButton && (
                    <button
                      onClick={() => handleSelect(address)}
                      className="text-primary-600 hover:text-primary-800 text-sm font-medium"
                    >
                      <Check className="h-4 w-4" />
                    </button>
                  )}
                  <button
                    onClick={() => handleEdit(address)}
                    className="text-gray-400 hover:text-gray-600"
                  >
                    <Edit className="h-4 w-4" />
                  </button>
                  <button
                    onClick={() => handleDelete(address.id)}
                    className="text-gray-400 hover:text-red-600"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </div>
              
              <div className="space-y-2">
                <div className="flex items-start">
                  <MapPin className="h-4 w-4 text-gray-400 mt-0.5 mr-2 flex-shrink-0" />
                  <p className="text-sm text-gray-600 break-words">{address.address}</p>
                </div>
                {address.phone && (
                  <div className="flex items-center">
                    <Phone className="h-4 w-4 text-gray-400 mr-2 flex-shrink-0" />
                    <p className="text-sm text-gray-600">{address.phone}</p>
                  </div>
                )}
              </div>

            </div>
          ))}
        </div>
      )}

      {/* Add/Edit Form Modal */}
      {showAddForm && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white">
            <div className="mt-3">
              <h3 className="text-lg font-medium text-gray-900 mb-4">
                {editingAddress ? 'Edit Address' : 'Add New Address'}
              </h3>
              
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Address Name *
                  </label>
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
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
                    value={formData.address}
                    onChange={(e) => setFormData(prev => ({ ...prev, address: e.target.value }))}
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
                    value={formData.phone}
                    onChange={(e) => setFormData(prev => ({ ...prev, phone: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-primary-500 focus:border-primary-500"
                    placeholder="Enter phone number"
                  />
                </div>


                <div className="flex space-x-3">
                  <button
                    type="submit"
                    className="flex-1 bg-primary-600 hover:bg-primary-700 text-white font-medium py-2 px-4 rounded-md transition-colors"
                  >
                    {editingAddress ? 'Update Address' : 'Save Address'}
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setShowAddForm(false)
                      setEditingAddress(null)
                      setFormData({ name: '', address: '', phone: '' })
                    }}
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
    </div>
  )
}
