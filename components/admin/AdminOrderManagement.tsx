'use client'

import { useState } from 'react'
import { Order, Profile, UpdateOrderStatusRequest, SetFinalPriceRequest, OrderStatus } from '@/types'
import { format } from 'date-fns'
import { Package, DollarSign, Settings, CheckCircle } from 'lucide-react'

interface AdminOrderManagementProps {
  orders: Order[]
  users: Profile[]
  onOrderUpdate: (request: UpdateOrderStatusRequest) => Promise<void>
  onSetFinalPrice: (request: SetFinalPriceRequest) => Promise<void>
}

export function AdminOrderManagement({ 
  orders, 
  users, 
  onOrderUpdate, 
  onSetFinalPrice 
}: AdminOrderManagementProps) {
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null)
  const [showStatusModal, setShowStatusModal] = useState(false)
  const [showPricingModal, setShowPricingModal] = useState(false)
  const [statusForm, setStatusForm] = useState({
    status: 'request_created' as OrderStatus,
    notes: '',
  })
  const [pricingForm, setPricingForm] = useState({
    admin_margin: '',
  })

  const handleStatusUpdate = async () => {
    if (!selectedOrder) return

    await onOrderUpdate({
      order_id: selectedOrder.id,
      status: statusForm.status,
      notes: statusForm.notes,
    })

    setShowStatusModal(false)
    setSelectedOrder(null)
    setStatusForm({ status: 'request_created', notes: '' })
  }

  const handleSetFinalPrice = async () => {
    if (!selectedOrder) return

    await onSetFinalPrice({
      order_id: selectedOrder.id,
      admin_margin: parseFloat(pricingForm.admin_margin),
    })

    setShowPricingModal(false)
    setSelectedOrder(null)
    setPricingForm({ admin_margin: '' })
  }

  const openStatusModal = (order: Order) => {
    setSelectedOrder(order)
    setStatusForm({ status: order.status, notes: '' })
    setShowStatusModal(true)
  }

  const openPricingModal = (order: Order) => {
    setSelectedOrder(order)
    setPricingForm({ admin_margin: '' })
    setShowPricingModal(true)
  }

  const canSetFinalPrice = (order: Order) => {
    return order.status === 'price_quoted' && 
           order.supplier_quotes && 
           order.supplier_quotes.length > 0 &&
           !order.final_price
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-lg font-medium text-gray-900 mb-4">Order Management</h2>
        <p className="text-sm text-gray-600 mb-6">
          Manage order statuses, set final prices, and monitor the order workflow.
        </p>
      </div>

      {/* Orders requiring attention */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {orders.map((order) => (
          <div key={order.id} className="card">
            <div className="flex justify-between items-start mb-3">
              <h3 className="text-lg font-medium text-gray-900">{order.title}</h3>
              <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                order.status === 'request_created' ? 'text-blue-600 bg-blue-100' :
                order.status === 'price_quoted' ? 'text-yellow-600 bg-yellow-100' :
                'text-gray-600 bg-gray-100'
              }`}>
                {order.status.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase())}
              </span>
            </div>
            
            <p className="text-sm text-gray-600 mb-3 line-clamp-2">{order.description}</p>
            
            <div className="space-y-2 text-sm text-gray-500 mb-4">
              <div><span className="font-medium">Customer:</span> {order.customer?.full_name}</div>
              <div><span className="font-medium">Quantity:</span> {order.quantity}</div>
              <div><span className="font-medium">Created:</span> {format(new Date(order.created_at), 'MMM dd, yyyy')}</div>
            </div>

            {order.supplier_quotes && order.supplier_quotes.length > 0 && (
              <div className="mb-4 p-3 bg-gray-50 rounded">
                <h4 className="text-sm font-medium text-gray-700 mb-2">Quotes Received:</h4>
                <div className="space-y-1">
                  {order.supplier_quotes.map((quote) => (
                    <div key={quote.id} className="flex justify-between text-sm">
                      <span>{quote.supplier?.full_name || 'Unknown'}</span>
                      <span className="font-medium">${quote.price.toFixed(2)}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div className="flex space-x-2">
              <button
                onClick={() => openStatusModal(order)}
                className="btn-secondary flex-1 text-sm"
              >
                <Settings className="h-4 w-4 mr-1" />
                Update Status
              </button>
              
              {canSetFinalPrice(order) && (
                <button
                  onClick={() => openPricingModal(order)}
                  className="btn-primary flex-1 text-sm"
                >
                  <DollarSign className="h-4 w-4 mr-1" />
                  Set Price
                </button>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* Status Update Modal */}
      {showStatusModal && selectedOrder && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white">
            <h3 className="text-lg font-medium text-gray-900 mb-4">Update Order Status</h3>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700">Status</label>
                <select
                  value={statusForm.status}
                  onChange={(e) => setStatusForm(prev => ({ ...prev, status: e.target.value as OrderStatus }))}
                  className="input-field"
                >
                  <option value="request_created">Request Created</option>
                  <option value="price_quoted">Price Quoted</option>
                  <option value="payment_confirmed">Payment Confirmed</option>
                  <option value="production_started">Production Started</option>
                  <option value="in_transit">In Transit</option>
                  <option value="in_customs">In Customs</option>
                  <option value="delivered">Delivered</option>
                </select>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700">Notes</label>
                <textarea
                  value={statusForm.notes}
                  onChange={(e) => setStatusForm(prev => ({ ...prev, notes: e.target.value }))}
                  rows={3}
                  className="input-field"
                  placeholder="Add notes about this status change"
                />
              </div>
            </div>
            
            <div className="flex justify-end space-x-3 mt-6">
              <button
                onClick={() => setShowStatusModal(false)}
                className="btn-secondary"
              >
                Cancel
              </button>
              <button
                onClick={handleStatusUpdate}
                className="btn-primary"
              >
                Update Status
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Pricing Modal */}
      {showPricingModal && selectedOrder && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white">
            <h3 className="text-lg font-medium text-gray-900 mb-4">Set Final Price</h3>
            
            <div className="space-y-4">
              <div className="p-3 bg-gray-50 rounded">
                <p className="text-sm text-gray-600">
                  <strong>Order:</strong> {selectedOrder.title}
                </p>
                <p className="text-sm text-gray-600">
                  <strong>Lowest Quote:</strong> ${Math.min(...(selectedOrder.supplier_quotes?.map(q => q.price) || [0])).toFixed(2)}
                </p>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700">Admin Margin (%)</label>
                <input
                  type="number"
                  step="0.1"
                  min="0"
                  value={pricingForm.admin_margin}
                  onChange={(e) => setPricingForm(prev => ({ ...prev, admin_margin: e.target.value }))}
                  className="input-field"
                  placeholder="Enter margin percentage"
                />
              </div>
            </div>
            
            <div className="flex justify-end space-x-3 mt-6">
              <button
                onClick={() => setShowPricingModal(false)}
                className="btn-secondary"
              >
                Cancel
              </button>
              <button
                onClick={handleSetFinalPrice}
                disabled={!pricingForm.admin_margin || parseFloat(pricingForm.admin_margin) < 0}
                className="btn-primary disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Set Final Price
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
