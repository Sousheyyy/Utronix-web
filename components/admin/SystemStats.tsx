'use client'

import { Order, Profile } from '@/types'
import { Users, Package, DollarSign, TrendingUp, Clock, CheckCircle } from 'lucide-react'

interface SystemStatsProps {
  orders: Order[]
  users: Profile[]
}

export function SystemStats({ orders, users }: SystemStatsProps) {
  const totalOrders = orders.length
  const totalUsers = users.length
  
  const ordersByStatus = orders.reduce((acc, order) => {
    acc[order.status] = (acc[order.status] || 0) + 1
    return acc
  }, {} as Record<string, number>)

  const totalRevenue = orders
    .filter(order => order.final_price)
    .reduce((sum, order) => sum + (order.final_price || 0), 0)

  const waitingPayment = orders.filter(order => order.status === 'price_quoted').length
  const completedOrders = orders.filter(order => order.status === 'delivered').length
  const inProgressOrders = orders.filter(order => 
    ['payment_confirmed', 'production_started', 'in_transit'].includes(order.status)
  ).length

  const userRoleDistribution = users.reduce((acc, user) => {
    acc[user.role] = (acc[user.role] || 0) + 1
    return acc
  }, {} as Record<string, number>)

  const recentOrders = orders
    .sort((a, b) => new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime())
    .slice(0, 5)

  // Calculate profit analytics
  const totalProfit = orders
    .filter(order => order.final_price && order.supplier_price)
    .reduce((sum, order) => sum + ((order.final_price || 0) - (order.supplier_price || 0)), 0)

  const averageOrderValue = totalOrders > 0 ? totalRevenue / totalOrders : 0
  const averageProfitPerOrder = totalOrders > 0 ? totalProfit / totalOrders : 0

  // Calculate monthly trends (last 6 months)
  const monthlyData = orders.reduce((acc, order) => {
    const month = new Date(order.created_at).toLocaleDateString('en-US', { month: 'short', year: '2-digit' })
    if (!acc[month]) {
      acc[month] = { orders: 0, revenue: 0 }
    }
    acc[month].orders += 1
    acc[month].revenue += order.final_price || 0
    return acc
  }, {} as Record<string, { orders: number, revenue: number }>)

  const stats = [
    {
      name: 'Total Orders',
      value: totalOrders,
      icon: Package,
      color: 'text-blue-600 bg-blue-100',
    },
    {
      name: 'Total Users',
      value: totalUsers,
      icon: Users,
      color: 'text-green-600 bg-green-100',
    },
    {
      name: 'Total Revenue',
      value: `$${totalRevenue.toFixed(2)}`,
      icon: DollarSign,
      color: 'text-yellow-600 bg-yellow-100',
    },
    {
      name: 'Total Profit',
      value: `$${totalProfit.toFixed(2)}`,
      icon: TrendingUp,
      color: 'text-green-600 bg-green-100',
    },
    {
      name: 'Waiting Payment',
      value: waitingPayment,
      icon: Clock,
      color: 'text-orange-600 bg-orange-100',
    },
    {
      name: 'In Progress',
      value: inProgressOrders,
      icon: TrendingUp,
      color: 'text-purple-600 bg-purple-100',
    },
    {
      name: 'Completed Orders',
      value: completedOrders,
      icon: CheckCircle,
      color: 'text-green-600 bg-green-100',
    },
  ]

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-lg font-medium text-gray-900 mb-4">System Statistics</h2>
        <p className="text-sm text-gray-600">
          Overview of system performance and key metrics.
        </p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {stats.map((stat) => {
          const Icon = stat.icon
          return (
            <div key={stat.name} className="card">
              <div className="flex items-center">
                <div className={`p-3 rounded-full ${stat.color}`}>
                  <Icon className="h-6 w-6" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">{stat.name}</p>
                  <p className="text-2xl font-semibold text-gray-900">{stat.value}</p>
                </div>
              </div>
            </div>
          )
        })}
      </div>

      {/* Order Status Distribution */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="card">
          <h3 className="text-lg font-medium text-gray-900 mb-4">Order Status Distribution</h3>
          <div className="space-y-3">
            {Object.entries(ordersByStatus).map(([status, count]) => {
              const getStatusLabel = (status: string) => {
                switch (status) {
                  case 'request_created': return 'Order Received'
                  case 'price_quoted': return 'Price Quoted'
                  case 'payment_confirmed': return 'Payment Received'
                  case 'production_started': return 'In Production'
                  case 'in_transit': return 'In Shipping'
                  case 'delivered': return 'Delivered'
                  case 'canceled': return 'Canceled'
                  default: return status.replace('_', ' ')
                }
              }
              
              const getStatusColor = (status: string) => {
                switch (status) {
                  case 'request_created': return 'text-blue-600 bg-blue-100'
                  case 'price_quoted': return 'text-yellow-600 bg-yellow-100'
                  case 'payment_confirmed': return 'text-green-600 bg-green-100'
                  case 'production_started': return 'text-purple-600 bg-purple-100'
                  case 'in_transit': return 'text-indigo-600 bg-indigo-100'
                  case 'delivered': return 'text-green-600 bg-green-100'
                  case 'canceled': return 'text-red-600 bg-red-100'
                  default: return 'text-gray-600 bg-gray-100'
                }
              }
              
              return (
                <div key={status} className="flex justify-between items-center">
                  <div className="flex items-center space-x-2">
                    <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(status)}`}>
                      {getStatusLabel(status)}
                    </span>
                  </div>
                  <span className="text-sm font-medium text-gray-900">{count}</span>
                </div>
              )
            })}
          </div>
        </div>

        <div className="card">
          <h3 className="text-lg font-medium text-gray-900 mb-4">User Role Distribution</h3>
          <div className="space-y-3">
            {Object.entries(userRoleDistribution).map(([role, count]) => (
              <div key={role} className="flex justify-between items-center">
                <span className="text-sm text-gray-600 capitalize">{role}</span>
                <span className="text-sm font-medium text-gray-900">{count}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Profit Analytics */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="card">
          <h3 className="text-lg font-medium text-gray-900 mb-4">Profit Analytics</h3>
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-600">Average Order Value</span>
              <span className="text-sm font-medium text-gray-900">${averageOrderValue.toFixed(2)}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-600">Average Profit per Order</span>
              <span className="text-sm font-medium text-gray-900">${averageProfitPerOrder.toFixed(2)}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-600">Profit Margin</span>
              <span className="text-sm font-medium text-gray-900">
                {totalRevenue > 0 ? ((totalProfit / totalRevenue) * 100).toFixed(1) : 0}%
              </span>
            </div>
          </div>
        </div>

        <div className="card">
          <h3 className="text-lg font-medium text-gray-900 mb-4">Monthly Trends</h3>
          <div className="space-y-3">
            {Object.entries(monthlyData)
              .sort(([a], [b]) => new Date(a).getTime() - new Date(b).getTime())
              .slice(-6)
              .map(([month, data]) => (
                <div key={month} className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">{month}</span>
                  <div className="text-right">
                    <div className="text-sm font-medium text-gray-900">{data.orders} orders</div>
                    <div className="text-xs text-gray-500">${data.revenue.toFixed(2)}</div>
                  </div>
                </div>
              ))}
          </div>
        </div>
      </div>

      {/* Recent Orders */}
      <div className="card">
        <h3 className="text-lg font-medium text-gray-900 mb-4">Recent Orders</h3>
        {recentOrders.length === 0 ? (
          <p className="text-sm text-gray-500">No orders yet.</p>
        ) : (
          <div className="space-y-3">
            {recentOrders.map((order) => {
              const getStatusLabel = (status: string) => {
                switch (status) {
                  case 'request_created': return 'Order Received'
                  case 'price_quoted': return 'Price Quoted'
                  case 'payment_confirmed': return 'Payment Received'
                  case 'production_started': return 'In Production'
                  case 'in_transit': return 'In Shipping'
                  case 'delivered': return 'Delivered'
                  case 'canceled': return 'Canceled'
                  default: return status.replace('_', ' ')
                }
              }
              
              const getStatusColor = (status: string) => {
                switch (status) {
                  case 'request_created': return 'text-blue-600 bg-blue-100'
                  case 'price_quoted': return 'text-yellow-600 bg-yellow-100'
                  case 'payment_confirmed': return 'text-green-600 bg-green-100'
                  case 'production_started': return 'text-purple-600 bg-purple-100'
                  case 'in_transit': return 'text-indigo-600 bg-indigo-100'
                  case 'delivered': return 'text-green-600 bg-green-100'
                  case 'canceled': return 'text-red-600 bg-red-100'
                  default: return 'text-gray-600 bg-gray-100'
                }
              }
              
              return (
                <div key={order.id} className="flex justify-between items-center py-2 border-b border-gray-200 last:border-b-0">
                  <div>
                    <p className="text-sm font-medium text-gray-900">
                      #{order.order_number} - {order.title}
                    </p>
                    <p className="text-xs text-gray-500">
                      {order.customer?.full_name} • {new Date(order.updated_at).toLocaleDateString()}
                    </p>
                  </div>
                  <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(order.status)}`}>
                    {getStatusLabel(order.status)}
                  </span>
                </div>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}
