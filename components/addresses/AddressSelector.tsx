'use client'

import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import { SavedAddress } from '@/types'
import { MapPin, Plus, Check, Star } from 'lucide-react'

interface AddressSelectorProps {
  selectedAddress: SavedAddress | null
  onAddressSelect: (address: SavedAddress | null) => void
  onNewAddress: () => void
  onClearAddress?: () => void
}

export function AddressSelector({ selectedAddress, onAddressSelect, onNewAddress, onClearAddress }: AddressSelectorProps) {
  const [addresses, setAddresses] = useState<SavedAddress[]>([])
  const [loading, setLoading] = useState(true)
  const [showDropdown, setShowDropdown] = useState(false)

  useEffect(() => {
    fetchAddresses()
  }, [])

  const fetchAddresses = async () => {
    try {
      const { data, error } = await supabase
        .from('saved_addresses')
        .select('*')
        .order('is_default', { ascending: false })
        .order('created_at', { ascending: false })

      if (error) {
        console.error('Error fetching addresses:', error)
        console.error('Error details:', {
          message: error.message,
          details: error.details,
          hint: error.hint,
          code: error.code
        })
        return
      }

      setAddresses(data || [])
    } catch (error) {
      console.error('Error fetching addresses:', error)
      if (error instanceof Error) {
        console.error('Error message:', error.message)
      }
    } finally {
      setLoading(false)
    }
  }

  const handleAddressSelect = (address: SavedAddress) => {
    onAddressSelect(address)
    setShowDropdown(false)
  }

  const handleNewAddress = () => {
    onNewAddress()
    setShowDropdown(false)
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-4">
        <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary-600"></div>
      </div>
    )
  }

  return (
    <div className="space-y-3">
      {/* Selected Address Display */}
      {selectedAddress ? (
        <div className="border border-primary-500 bg-primary-50 rounded-lg p-4">
          <div className="flex items-start justify-between">
            <div className="flex items-center">
              <MapPin className="h-4 w-4 text-primary-600 mr-2 flex-shrink-0" />
              <div>
                <div className="flex items-center">
                  <span className="font-medium text-gray-900">{selectedAddress.name}</span>
                  {selectedAddress.is_default && (
                    <span className="ml-2 inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-primary-100 text-primary-800">
                      <Star className="h-3 w-3 mr-1" />
                      Default
                    </span>
                  )}
                </div>
                <p className="text-sm text-gray-600 break-words mt-1">{selectedAddress.address}</p>
                {selectedAddress.phone && (
                  <p className="text-sm text-gray-500 mt-1">{selectedAddress.phone}</p>
                )}
              </div>
            </div>
            <div className="flex space-x-2">
              <button
                type="button"
                onClick={() => setShowDropdown(!showDropdown)}
                className="text-primary-600 hover:text-primary-800 text-sm font-medium"
              >
                Change
              </button>
              {onClearAddress && (
                <button
                  type="button"
                  onClick={() => {
                    onClearAddress()
                    setShowDropdown(false)
                  }}
                  className="text-gray-500 hover:text-gray-700 text-sm font-medium"
                >
                  Clear
                </button>
              )}
            </div>
          </div>
        </div>
      ) : (
        <button
          type="button"
          onClick={() => setShowDropdown(!showDropdown)}
          className="w-full border-2 border-dashed border-gray-300 rounded-lg p-4 text-left hover:border-primary-500 hover:bg-primary-50 transition-colors"
        >
          <div className="flex items-center">
            <MapPin className="h-5 w-5 text-gray-400 mr-3" />
            <span className="text-gray-500">Select a saved address or add new</span>
          </div>
        </button>
      )}

      {/* Dropdown */}
      {showDropdown && (
        <div className="border border-gray-200 rounded-lg bg-white shadow-lg max-h-64 overflow-y-auto">
          {addresses.length > 0 ? (
            <div className="divide-y divide-gray-200">
              {addresses.map((address) => (
                <button
                  key={address.id}
                  type="button"
                  onClick={() => handleAddressSelect(address)}
                  className={`w-full p-4 text-left hover:bg-gray-50 transition-colors ${
                    selectedAddress?.id === address.id ? 'bg-primary-50' : ''
                  }`}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex items-center">
                      <MapPin className="h-4 w-4 text-gray-400 mr-3 flex-shrink-0" />
                      <div>
                        <div className="flex items-center">
                          <span className="font-medium text-gray-900">{address.name}</span>
                          {address.is_default && (
                            <span className="ml-2 inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-primary-100 text-primary-800">
                              <Star className="h-3 w-3 mr-1" />
                              Default
                            </span>
                          )}
                        </div>
                        <p className="text-sm text-gray-600 break-words mt-1">{address.address}</p>
                        {address.phone && (
                          <p className="text-sm text-gray-500 mt-1">{address.phone}</p>
                        )}
                      </div>
                    </div>
                    {selectedAddress?.id === address.id && (
                      <Check className="h-5 w-5 text-primary-600" />
                    )}
                  </div>
                </button>
              ))}
            </div>
          ) : (
            <div className="p-4 text-center text-gray-500">
              <MapPin className="h-8 w-8 text-gray-400 mx-auto mb-2" />
              <p className="text-sm">No saved addresses yet</p>
            </div>
          )}
          
          <div className="border-t border-gray-200">
            <button
              type="button"
              onClick={handleNewAddress}
              className="w-full p-4 text-left hover:bg-gray-50 transition-colors flex items-center"
            >
              <Plus className="h-4 w-4 text-primary-600 mr-3" />
              <span className="text-primary-600 font-medium">Add new address</span>
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
