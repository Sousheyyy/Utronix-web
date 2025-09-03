'use client'

import { CustomerDashboard } from '@/components/dashboards/CustomerDashboard'
import { SupplierDashboard } from '@/components/dashboards/SupplierDashboard'
import { AdminDashboard } from '@/components/dashboards/AdminDashboard'
import { useState } from 'react'
import { UserRole } from '@/types'

export default function Home() {
  const [selectedRole, setSelectedRole] = useState<UserRole | null>(null)

  if (!selectedRole) {
    return (
      <div className="min-h-screen bg-gray-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
        <div className="sm:mx-auto sm:w-full sm:max-w-md">
          <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
            Utronix Web
          </h2>
          <p className="mt-2 text-center text-sm text-gray-600">
            Order Management System - Demo Mode
          </p>
        </div>

        <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
          <div className="bg-white py-8 px-4 shadow sm:rounded-lg sm:px-10">
            <div className="space-y-4">
              <h3 className="text-lg font-medium text-gray-900 text-center mb-6">
                Select Dashboard to View
              </h3>
              
              <button
                onClick={() => setSelectedRole('customer')}
                className="w-full flex justify-center py-3 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors"
              >
                Customer Dashboard
              </button>
              
              <button
                onClick={() => setSelectedRole('supplier')}
                className="w-full flex justify-center py-3 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 transition-colors"
              >
                Supplier Dashboard
              </button>
              
              <button
                onClick={() => setSelectedRole('admin')}
                className="w-full flex justify-center py-3 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-purple-600 hover:bg-purple-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-purple-500 transition-colors"
              >
                Admin Dashboard
              </button>
            </div>
          </div>
        </div>
      </div>
    )
  }

  // Render role-based dashboard
  if (selectedRole === 'customer') {
    return <CustomerDashboard onBack={() => setSelectedRole(null)} />
  } else if (selectedRole === 'supplier') {
    return <SupplierDashboard onBack={() => setSelectedRole(null)} />
  } else if (selectedRole === 'admin') {
    return <AdminDashboard onBack={() => setSelectedRole(null)} />
  }

  return null
}
