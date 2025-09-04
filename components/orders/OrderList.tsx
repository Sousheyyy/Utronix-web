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
  delivered: { label: 'Delivered', icon: Home, color: 'text-gray-600 bg-gray-100' },
  canceled: { label: 'Canceled', icon: Trash2, color: 'text-red-600 bg-red-100' },
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

  const formatPrice = (price?: number) => {
    if (!price) return 'Price Pending'
    return `$${price.toFixed(2)}`
  }

  const getStatusColor = (status: string) => {
    return statusConfig[status as keyof typeof statusConfig]?.color || 'text-gray-600 bg-gray-100'
  }

  return (
    <div className="bg-white border border-gray-200 rounded-lg shadow-sm hover:shadow-md transition-shadow">
      <div className="p-6">
        <div className="flex items-start justify-between">
          <div className="flex-1 min-w-0">
            <div className="flex items-center space-x-3 mb-2">
              <h3 className="text-lg font-medium text-gray-900 truncate">
                {formatOrderTitle(order.order_number, order.title)}
              </h3>
              <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(order.status)}`}>
                <StatusIcon className="h-3 w-3 mr-1" />
                {status.label}
              </span>
            </div>
            
            <p className="text-gray-600 text-sm mb-3 line-clamp-2">
              {order.description}
            </p>
            
            <div className="flex items-center space-x-4 text-sm text-gray-500 mb-3">
              <span>Quantity: {order.quantity}</span>
              <span>•</span>
              <span>Created: {format(new Date(order.created_at), 'MMM d, yyyy')}</span>
              {order.final_price && (
                <>
                  <span>•</span>
                  <span className="font-medium text-green-600">
                    Total: {formatPrice(order.final_price)}
                  </span>
                </>
              )}
            </div>

            {/* Progress Bar for Customer */}
            {userRole === 'customer' && (
              <div className="mb-4">
                <OrderProgressBar currentStatus={order.status} />
              </div>
            )}

            {/* Order Files */}
            {order.uploaded_files && order.uploaded_files.length > 0 && (
              <div className="mb-4">
                <OrderFiles files={order.uploaded_files} />
              </div>
            )}
          </div>
        </div>

        <div className="flex items-center justify-between pt-4 border-t border-gray-200">
          <div className="flex items-center space-x-2">
            {onOrderSelect && (
              <button
                onClick={() => onOrderSelect(order)}
                className="inline-flex items-center px-3 py-1.5 border border-gray-300 shadow-sm text-xs font-medium rounded text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
              >
                <Eye className="h-3 w-3 mr-1" />
                View Details
              </button>
            )}
            
            {onEditOrder && canEditOrder(order) && (
              <button
                onClick={() => onEditOrder(order)}
                className="inline-flex items-center px-3 py-1.5 border border-gray-300 shadow-sm text-xs font-medium rounded text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
              >
                <Edit className="h-3 w-3 mr-1" />
                Edit
              </button>
            )}
          </div>

          <div className="flex items-center space-x-2">
            {onCancelOrder && canCancelOrder(order) && (
              <button
                onClick={() => onCancelOrder(order)}
                className="inline-flex items-center px-3 py-1.5 border border-red-300 shadow-sm text-xs font-medium rounded text-red-700 bg-white hover:bg-red-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
              >
                <Trash2 className="h-3 w-3 mr-1" />
                Cancel
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  )
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
})