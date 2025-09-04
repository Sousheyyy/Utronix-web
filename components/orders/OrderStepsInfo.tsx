'use client'

import { Package, DollarSign, Clock, CheckCircle, Truck, Globe, Home, Eye } from 'lucide-react'

const orderSteps = [
  { status: 'admin_review', label: 'Under Review', icon: Eye, color: 'bg-orange-500' },
  { status: 'request_created', label: 'Request Created', icon: Package, color: 'bg-blue-500' },
  { status: 'price_quoted', label: 'Price Quoted', icon: DollarSign, color: 'bg-yellow-500' },
  { status: 'payment_confirmed', label: 'Payment Confirmed', icon: CheckCircle, color: 'bg-green-500' },
  { status: 'production_started', label: 'Production Started', icon: Package, color: 'bg-purple-500' },
  { status: 'in_transit', label: 'In Transit', icon: Truck, color: 'bg-indigo-500' },
  { status: 'delivered', label: 'Delivered', icon: Home, color: 'bg-green-600' },
]

export function OrderStepsInfo() {
  return (
    <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 mb-4">
      <h3 className="text-sm font-semibold text-blue-900 mb-2 flex items-center">
        <Package className="h-4 w-4 mr-2" />
        Order Process Steps
      </h3>
      <div className="grid grid-cols-7 gap-1">
        {orderSteps.map((step, index) => {
          const Icon = step.icon || Package // Fallback to Package icon
          return (
            <div key={step.status} className="flex flex-col items-center text-center">
              <div className={`w-7 h-7 rounded-full flex items-center justify-center ${step.color} text-white mb-1`}>
                <Icon className="h-3.5 w-3.5" />
              </div>
              <span className="text-xs font-medium text-gray-700 leading-tight">{step.label}</span>
            </div>
          )
        })}
      </div>
      <p className="text-xs text-blue-700 mt-2">
        📦 Estimated delivery time: 10-12 days after order is placed
      </p>
    </div>
  )
}
