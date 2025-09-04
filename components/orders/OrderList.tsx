'use client'

import React from 'react'
import { Order, UserRole } from '@/types'
import { format } from 'date-fns'
import { Package, DollarSign, Clock, CheckCircle, Truck, Globe, Home, Edit, Trash2, Eye } from 'lucide-react'
import { OrderProgressBar } from './OrderProgressBar'
import { OrderFiles } from './OrderFiles'
import { formatOrderTitle } from '@/lib/orderUtils'

interface OrderListProps {
  orders: Order[]
  userRole: UserRole
  onOrderUpdate?: () => void
  onOrderSelect?: (order: Order) => void
  onEditOrder?: (order: Order) => void
  onCancelOrder?: (order: Order) => void
}

interface OrderCardProps {
  order: Order
  userRole: UserRole
  onOrderSelect?: (order: Order) => void
  onEditOrder?: (order: Order) => void
  onCancelOrder?: (order: Order) => void
}

const statusConfig = {
  admin_review: { label: 'Under Review', icon: Eye, color: 'text-orange-600 bg-orange-100' },
  request_created: { label: 'Request Created', icon: Package, color: 'text-blue-600 bg-blue-100' },
  price_quoted: { label: 'Price Quoted', icon: DollarSign, color: 'text-yellow-600 bg-yellow-100' },
  payment_confirmed: { label: 'Payment Confirmed', icon: CheckCircle, color: 'text-green-600 bg-green-100' },
  production_started: { label: 'Production Started', icon: Package, color: 'text-purple-600 bg-purple-100' },
  in_transit: { label: 'In Transit', icon: Truck, color: 'text-indigo-600 bg-indigo-100' },
  in_customs: { label: 'In Customs', icon: Globe, color: 'text-red-600 bg-red-100' },
  delivered: { label: 'Delivered', icon: Home, color: 'text-green-600 bg-green-100' },
  canceled: { label: 'Canceled', icon: Trash2, color: 'text-red-600 bg-red-100' },
}

export const OrderList = React.memo(function OrderList({ orders, userRole, onOrderUpdate, onOrderSelect, onEditOrder, onCancelOrder }: OrderListProps) {
  if (orders.length === 0) {
    return (
      <div className="text-center py-12">
        <Package className="mx-auto h-12 w-12 text-gray-400" />
        <h3 className="mt-2 text-sm font-medium text-gray-900">No orders</h3>
        <p className="mt-1 text-sm text-gray-500">
          {userRole === 'customer' 
            ? 'Get started by creating your first order.'
            : 'No orders available at the moment.'
          }
        </p>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {orders.map((order) => (
        <OrderCard
          key={order.id}
          order={order}
          userRole={userRole}
          onOrderSelect={onOrderSelect}
          onEditOrder={onEditOrder}
          onCancelOrder={onCancelOrder}
        />
      ))}
    </div>
  )
}

function OrderCard({ order, userRole, onOrderSelect, onEditOrder, onCancelOrder }: OrderCardProps) {
  const status = statusConfig[order.status] || { label: order.status, icon: Package, color: 'text-gray-600 bg-gray-100' }
  const StatusIcon = status.icon

  const canEditOrder = (order: Order) => {
    return order.status === 'request_created' || order.status === 'price_quoted'
  }

  const canCancelOrder = (order: Order) => {
    return order.status === 'request_created' || order.status === 'price_quoted'
  }

  const getPriceDisplay = () => {
    if (userRole === 'customer') {
      if (order.final_price) {
        return `Final Price: $${order.final_price.toFixed(2)}`
      }
      return 'Price pending'
    }
    
    if (userRole === 'supplier') {
      if (order.supplier_quotes && order.supplier_quotes.length > 0) {
        const hasQuoted = order.supplier_quotes.some(q => q.supplier_id === 'current-user-id') // This should be dynamic
        return hasQuoted ? 'Quote submitted' : 'Submit quote'
      }
      return 'Submit quote'
    }
    
    if (userRole === 'admin') {
      if (order.final_price) {
        return `Final: $${order.final_price.toFixed(2)} | Supplier: $${order.supplier_price?.toFixed(2) || 'N/A'}`
      }
      if (order.supplier_quotes && order.supplier_quotes.length > 0) {
        const lowestQuote = order.supplier_quotes.reduce((lowest, quote) => 
          quote.price < lowest.price ? quote : lowest
        )
        return `Lowest quote: $${lowestQuote.price.toFixed(2)}`
      }
      return 'No quotes yet'
    }
    
    return ''
  }

  return (
    <div className="card hover:shadow-lg transition-shadow duration-200 overflow-hidden">
      <div className="flex justify-between items-start gap-4">
        <div className="flex-1 min-w-0">
          <div className="mb-2">
            <h3 className="text-lg font-medium text-gray-900">
              {formatOrderTitle(order.order_number, order.title)}
            </h3>
          </div>
          
          <p className="text-sm text-gray-600 mb-3 break-words whitespace-normal">{order.description}</p>
          
          <div className="grid grid-cols-2 gap-4 text-sm text-gray-500">
            <div>
              <span className="font-medium">Quantity:</span> {order.quantity}
            </div>
            <div>
              <span className="font-medium">Created:</span> {format(new Date(order.created_at), 'MMM dd, yyyy')}
            </div>
            {order.product_link && (
              <div className="col-span-2">
                <span className="font-medium">Product Link:</span>{' '}
                <a 
                  href={order.product_link} 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="text-blue-600 hover:text-blue-800 underline"
                >
                  View Product
                </a>
              </div>
            )}
            {order.delivery_address && (
              <div className="col-span-2">
                <span className="font-medium">Delivery Address:</span>{' '}
                <span className="text-gray-700 break-words whitespace-normal">{order.delivery_address}</span>
              </div>
            )}
            {order.phone_number && (
              <div className="col-span-2">
                <span className="font-medium">Phone:</span>{' '}
                <span className="text-gray-700">{order.phone_number}</span>
              </div>
            )}
            {order.customer && userRole !== 'customer' && (
              <div className="col-span-2">
                <span className="font-medium">Customer:</span> {order.customer.full_name}
                {order.customer.company_name && ` (${order.customer.company_name})`}
              </div>
            )}
          </div>



          {/* Price Display */}
          <div className="mt-4">
            {userRole === 'customer' && order.final_price ? (
              <div className="inline-block bg-green-50 border border-green-200 rounded-lg px-4 py-2">
                <div className="flex items-center">
                  <span className="text-sm font-medium text-green-800 mr-2">Final Price:</span>
                  <span className="text-xl font-bold text-green-900">
                    ${order.final_price.toFixed(2)}
                  </span>
                </div>
              </div>
            ) : userRole === 'customer' ? (
              <div className="inline-block bg-yellow-50 border border-yellow-200 rounded-lg px-4 py-2">
                <div className="flex items-center">
                  <Clock className="h-4 w-4 text-yellow-600 mr-2" />
                  <span className="text-sm font-medium text-yellow-800">Price Pending</span>
                </div>
              </div>
            ) : (
              <div className="mt-3 text-sm">
                <span className="font-medium text-gray-700">{getPriceDisplay()}</span>
              </div>
            )}
          </div>

          {/* Order Files */}
          {order.uploaded_files && order.uploaded_files.length > 0 && (
            <OrderFiles files={order.uploaded_files} />
          )}
        </div>

        <div className="flex flex-col items-end space-y-3 flex-shrink-0">
          {/* Progress Bar */}
          <div className="w-full max-w-xs">
            <OrderProgressBar currentStatus={order.status} />
          </div>
          
          {/* Action Buttons */}
          <div className="flex flex-col space-y-2 w-full">
            {userRole === 'supplier' && onOrderSelect && (
              <button
                onClick={() => onOrderSelect(order)}
                className="btn-primary w-full"
              >
                Submit Quote
              </button>
            )}
            
            {userRole === 'customer' && onEditOrder && canEditOrder(order) && (
              <button
                onClick={() => onEditOrder(order)}
                className="btn-secondary flex items-center justify-center w-full"
              >
                <Edit className="h-4 w-4 mr-2" />
                Edit
              </button>
            )}

            {userRole === 'customer' && onCancelOrder && canCancelOrder(order) && (
              <button
                onClick={() => onCancelOrder(order)}
                className="btn-secondary flex items-center justify-center text-red-600 hover:text-red-700 hover:bg-red-50 w-full"
              >
                <Trash2 className="h-4 w-4 mr-2" />
                Cancel
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  )
})
