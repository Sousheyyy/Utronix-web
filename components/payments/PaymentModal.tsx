'use client'

import { useState, useEffect } from 'react'
import { X, Copy, CheckCircle, CreditCard, Building2, Hash } from 'lucide-react'
import { Order } from '@/types'
import { toast } from 'react-hot-toast'

interface PaymentModalProps {
  order: Order
  onClose: () => void
}

export function PaymentModal({ order, onClose }: PaymentModalProps) {
  const [uniqueOrderId, setUniqueOrderId] = useState<string>('')
  const [copiedField, setCopiedField] = useState<string | null>(null)

  // Generate unique 7-digit order ID
  useEffect(() => {
    const generateUniqueId = () => {
      return Math.floor(1000000 + Math.random() * 9000000).toString()
    }
    setUniqueOrderId(generateUniqueId())
  }, [])

  const bankInfo = {
    bankName: 'Türkiye İş Bankası',
    accountName: 'UTRONIX MÜHENDİSLİK',
    accountNumber: '1234-5678-9012-3456',
    iban: 'TR12 0006 4000 0011 2345 6789 01',
    swift: 'ISBKTRIS'
  }

  const copyToClipboard = async (text: string, field: string) => {
    try {
      await navigator.clipboard.writeText(text)
      setCopiedField(field)
      toast.success(`${field} copied to clipboard!`)
      setTimeout(() => setCopiedField(null), 2000)
    } catch (err) {
      toast.error('Failed to copy to clipboard')
    }
  }

  const formatAmount = (amount: number) => {
    return new Intl.NumberFormat('tr-TR', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2
    }).format(amount)
  }

  return (
    <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
      <div className="relative top-2 sm:top-10 mx-auto p-3 sm:p-5 border w-11/12 max-w-2xl shadow-lg rounded-md bg-white">
        <div className="mt-3">
          {/* Modal Header */}
          <div className="flex items-center justify-between mb-6">
            <div>
              <h3 className="text-lg sm:text-xl font-medium text-gray-900">
                Payment Instructions
              </h3>
              <p className="text-sm text-gray-500 mt-1">
                Order #{order.order_number} - {order.title}
              </p>
            </div>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600"
            >
              <X className="h-6 w-6" />
            </button>
          </div>

          {/* Payment Information */}
          <div className="space-y-6">
            {/* Order Amount */}
            <div className="bg-blue-50 p-4 rounded-lg">
              <div className="flex items-center mb-3">
                <CreditCard className="h-5 w-5 text-blue-600 mr-2" />
                <h4 className="text-lg font-medium text-blue-900">Order Amount</h4>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-2xl font-bold text-blue-900">
                  {order.final_price ? formatAmount(order.final_price) : 'Price not set'}
                </span>
                <button
                  onClick={() => order.final_price && copyToClipboard(order.final_price.toString(), 'Amount')}
                  className="flex items-center px-3 py-1 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors text-sm"
                >
                  {copiedField === 'Amount' ? <CheckCircle className="h-4 w-4 mr-1" /> : <Copy className="h-4 w-4 mr-1" />}
                  Copy
                </button>
              </div>
            </div>

            {/* Bank Information */}
            <div className="bg-green-50 p-4 rounded-lg">
              <div className="flex items-center mb-3">
                <Building2 className="h-5 w-5 text-green-600 mr-2" />
                <h4 className="text-lg font-medium text-green-900">Bank Information</h4>
              </div>
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600">Bank Name</p>
                    <p className="font-medium text-green-900">{bankInfo.bankName}</p>
                  </div>
                  <button
                    onClick={() => copyToClipboard(bankInfo.bankName, 'Bank Name')}
                    className="flex items-center px-2 py-1 bg-green-600 text-white rounded hover:bg-green-700 transition-colors text-xs"
                  >
                    {copiedField === 'Bank Name' ? <CheckCircle className="h-3 w-3 mr-1" /> : <Copy className="h-3 w-3 mr-1" />}
                    Copy
                  </button>
                </div>
                
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600">Account Name</p>
                    <p className="font-medium text-green-900">{bankInfo.accountName}</p>
                  </div>
                  <button
                    onClick={() => copyToClipboard(bankInfo.accountName, 'Account Name')}
                    className="flex items-center px-2 py-1 bg-green-600 text-white rounded hover:bg-green-700 transition-colors text-xs"
                  >
                    {copiedField === 'Account Name' ? <CheckCircle className="h-3 w-3 mr-1" /> : <Copy className="h-3 w-3 mr-1" />}
                    Copy
                  </button>
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600">Account Number</p>
                    <p className="font-medium text-green-900 font-mono">{bankInfo.accountNumber}</p>
                  </div>
                  <button
                    onClick={() => copyToClipboard(bankInfo.accountNumber, 'Account Number')}
                    className="flex items-center px-2 py-1 bg-green-600 text-white rounded hover:bg-green-700 transition-colors text-xs"
                  >
                    {copiedField === 'Account Number' ? <CheckCircle className="h-3 w-3 mr-1" /> : <Copy className="h-3 w-3 mr-1" />}
                    Copy
                  </button>
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600">IBAN</p>
                    <p className="font-medium text-green-900 font-mono">{bankInfo.iban}</p>
                  </div>
                  <button
                    onClick={() => copyToClipboard(bankInfo.iban, 'IBAN')}
                    className="flex items-center px-2 py-1 bg-green-600 text-white rounded hover:bg-green-700 transition-colors text-xs"
                  >
                    {copiedField === 'IBAN' ? <CheckCircle className="h-3 w-3 mr-1" /> : <Copy className="h-3 w-3 mr-1" />}
                    Copy
                  </button>
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600">SWIFT Code</p>
                    <p className="font-medium text-green-900 font-mono">{bankInfo.swift}</p>
                  </div>
                  <button
                    onClick={() => copyToClipboard(bankInfo.swift, 'SWIFT')}
                    className="flex items-center px-2 py-1 bg-green-600 text-white rounded hover:bg-green-700 transition-colors text-xs"
                  >
                    {copiedField === 'SWIFT' ? <CheckCircle className="h-3 w-3 mr-1" /> : <Copy className="h-3 w-3 mr-1" />}
                    Copy
                  </button>
                </div>
              </div>
            </div>

            {/* Unique Order ID */}
            <div className="bg-purple-50 p-4 rounded-lg">
              <div className="flex items-center mb-3">
                <Hash className="h-5 w-5 text-purple-600 mr-2" />
                <h4 className="text-lg font-medium text-purple-900">Unique Order ID</h4>
              </div>
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600 mb-1">Use this ID in the payment description</p>
                  <p className="text-2xl font-bold text-purple-900 font-mono">{uniqueOrderId}</p>
                </div>
                <button
                  onClick={() => copyToClipboard(uniqueOrderId, 'Order ID')}
                  className="flex items-center px-3 py-2 bg-purple-600 text-white rounded-md hover:bg-purple-700 transition-colors"
                >
                  {copiedField === 'Order ID' ? <CheckCircle className="h-4 w-4 mr-1" /> : <Copy className="h-4 w-4 mr-1" />}
                  Copy ID
                </button>
              </div>
            </div>

            {/* Payment Instructions */}
            <div className="bg-yellow-50 border border-yellow-200 p-4 rounded-lg">
              <div className="flex items-start">
                <div className="flex-shrink-0">
                  <div className="w-6 h-6 bg-yellow-400 rounded-full flex items-center justify-center">
                    <span className="text-yellow-800 text-sm font-bold">!</span>
                  </div>
                </div>
                <div className="ml-3">
                  <h4 className="text-sm font-medium text-yellow-800 mb-2">Important Payment Instructions</h4>
                  <ul className="text-sm text-yellow-700 space-y-1">
                    <li>• Send the exact order amount to the bank details above</li>
                    <li>• Include the unique order ID <strong>({uniqueOrderId})</strong> in the payment description</li>
                    <li>• Keep the payment receipt for your records</li>
                    <li>• Payment will be verified within 24 hours</li>
                  </ul>
                </div>
              </div>
            </div>
          </div>

          {/* Modal Footer */}
          <div className="flex justify-end mt-6">
            <button
              onClick={onClose}
              className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-md transition-colors"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
