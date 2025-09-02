'use client'

import { useAuth } from '@/contexts/AuthContext'
import { LoginForm } from '@/components/auth/LoginForm'
import { SignUpForm } from '@/components/auth/SignUpForm'
import { CustomerDashboard } from '@/components/dashboards/CustomerDashboard'
import { SupplierDashboard } from '@/components/dashboards/SupplierDashboard'
import { AdminDashboard } from '@/components/dashboards/AdminDashboard'
import { useState } from 'react'

export default function Home() {
  const { user, profile, loading } = useAuth()
  const [showSignUp, setShowSignUp] = useState(false)

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary-600"></div>
      </div>
    )
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-gray-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
        <div className="sm:mx-auto sm:w-full sm:max-w-md">
          <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
            Utronix Web
          </h2>
          <p className="mt-2 text-center text-sm text-gray-600">
            Order Management System
          </p>
        </div>

        <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
          <div className="bg-white py-8 px-4 shadow sm:rounded-lg sm:px-10">
            {showSignUp ? (
              <SignUpForm onToggle={() => setShowSignUp(false)} />
            ) : (
              <LoginForm onToggle={() => setShowSignUp(true)} />
            )}
          </div>
        </div>
      </div>
    )
  }

  // Render role-based dashboard
  if (profile?.role === 'customer') {
    return <CustomerDashboard />
  } else if (profile?.role === 'supplier') {
    return <SupplierDashboard />
  } else if (profile?.role === 'admin') {
    return <AdminDashboard />
  }

  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="text-center">
        <h2 className="text-2xl font-bold text-gray-900 mb-4">
          Role Not Assigned
        </h2>
        <p className="text-gray-600">
          Please contact an administrator to assign your role.
        </p>
      </div>
    </div>
  )
}
