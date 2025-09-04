'use client'

import React from 'react'
import { OrderStatus } from '@/types'
import { Package, DollarSign, Clock, CheckCircle, Truck, Globe, Home, X } from 'lucide-react'

interface OrderProgressBarProps {
  currentStatus: OrderStatus
}

const orderSteps = [
  { status: 'request_created' as OrderStatus, label: 'Request Created', icon: Package, color: 'bg-blue-500' },
  { status: 'price_quoted' as OrderStatus, label: 'Price Quoted', icon: DollarSign, color: 'bg-yellow-500' },
  { status: 'payment_confirmed' as OrderStatus, label: 'Payment Confirmed', icon: CheckCircle, color: 'bg-green-500' },
  { status: 'production_started' as OrderStatus, label: 'Production Started', icon: Package, color: 'bg-purple-500' },
  { status: 'in_transit' as OrderStatus, label: 'In Transit', icon: Truck, color: 'bg-indigo-500' },
  { status: 'delivered' as OrderStatus, label: 'Delivered', icon: Home, color: 'bg-green-600' },
]

export const OrderProgressBar = React.memo(function OrderProgressBar({ currentStatus }: OrderProgressBarProps) {
  const currentIndex = orderSteps.findIndex(step => step.status === currentStatus)
  
  // Handle canceled status separately
  if (currentStatus === 'canceled') {
    return (
      <div className="flex items-center justify-center w-full" style={{ maxWidth: '45rem' }}>
        <div className="flex items-center space-x-2 px-3 py-2 bg-red-50 border border-red-200 rounded-md">
          <X className="h-4 w-4 text-red-500" />
          <span className="text-sm font-medium text-red-700">Canceled</span>
        </div>
      </div>
    )
  }

  return (
    <div className="flex items-center justify-between w-full" style={{ maxWidth: '45rem' }}>
      {orderSteps.map((step, index) => {
        const Icon = step.icon
        const isCompleted = index < currentIndex
        const isCurrent = index === currentIndex
        const isPending = index > currentIndex
        
        return (
          <div key={step.status} className="flex flex-col items-center">
            {/* Step Icon */}
            <div className={`w-6 h-6 rounded-full flex items-center justify-center ${
              isCompleted 
                ? `${step.color} text-white` 
                : isCurrent 
                  ? `${step.color} text-white ring-2 ring-offset-1 ring-blue-500` 
                  : 'bg-gray-200 text-gray-400'
            }`}>
              <Icon className="h-3.5 w-3.5" />
            </div>
          </div>
        )
      })}
    </div>
  )
})
