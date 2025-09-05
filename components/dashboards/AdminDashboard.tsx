'use client'

import { useState, useEffect } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import { supabase } from '@/lib/supabase'
import { Order, Profile, UpdateOrderStatusRequest, SetFinalPriceRequest } from '@/types'
import { AdminOrderManagement } from '@/components/admin/AdminOrderManagement'
import { SystemStats } from '@/components/admin/SystemStats'
import { formatOrderNumber, matchesOrderNumber } from '@/lib/orderUtils'
import { LogOut, Settings, Users, Package, BarChart3, ShoppingCart, DollarSign, PieChart, Percent, X, ArrowUpDown, ArrowUp, ArrowDown, Clock, User, Edit, Upload, CheckCircle, MessageSquare, CreditCard, Truck, Factory, XCircle } from 'lucide-react'
import { AppHeader } from '../layout/AppHeader'
import { toast } from 'react-hot-toast'

export function AdminDashboard() {
  const { profile, signOut } = useAuth()
  const [orders, setOrders] = useState<Order[]>([])
  const [users, setUsers] = useState<Profile[]>([])
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState<'orders' | 'customers' | 'analyze'>('orders')
  const [searchTerm, setSearchTerm] = useState('')
  const [editModalOpen, setEditModalOpen] = useState(false)
  const [detailsModalOpen, setDetailsModalOpen] = useState(false)
  const [detailsEditMode, setDetailsEditMode] = useState(false)
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null)
  const [editForm, setEditForm] = useState({
    supplier_price: '',
    quantity: '',
    status: '',
    final_price: ''
  })
  const [detailsEditForm, setDetailsEditForm] = useState({
    title: '',
    description: '',
    quantity: '',
    supplier_price: '',
    final_price: '',
    status: '',
    delivery_address: '',
    phone_number: '',
    product_link: ''
  })
  const [lastRefreshTime, setLastRefreshTime] = useState<Date>(new Date())
  const [isRefreshing, setIsRefreshing] = useState(false)
  const [newOrderCount, setNewOrderCount] = useState(0)
  const [collapsedTables, setCollapsedTables] = useState<Record<string, boolean>>({
    admin_review: false,
    request_created: false,
    price_quoted: false,
    payment_confirmed: false,
    production_started: false,
    in_transit: false,
    delivered: false,
    canceled: false
  })

  useEffect(() => {
    fetchData()
    clearNewOrderCount() // Clear any existing new order count

    // Set up real-time subscription for order updates
    const channel = supabase
      .channel('admin_orders_changes')
      .on('postgres_changes', 
        { 
          event: '*', 
          schema: 'public', 
          table: 'orders' 
        }, 
        (payload) => {
          handleOrderUpdate(payload)
        }
      )
      .on('postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'orders'
        },
        (payload) => {
          handleNewOrder(payload)
        }
      )
      .subscribe((status) => {
        if (status === 'SUBSCRIBED') {
          // Successfully subscribed to admin order updates
        } else if (status === 'CHANNEL_ERROR') {
          startPeriodicRefresh()
        }
      })

    // Periodic refresh fallback (every 30 seconds)
    const refreshInterval = setInterval(() => {
      if (document.visibilityState === 'visible') {
        refreshData()
      }
    }, 30000)

    return () => {
      supabase.removeChannel(channel)
      clearInterval(refreshInterval)
    }
  }, [])

  // Clear new order count when orders are viewed
  useEffect(() => {
    if (orders.length > 0) {
      clearNewOrderCount()
    }
  }, [orders.length])

  // Handle real-time order updates
  const handleOrderUpdate = async (payload: any) => {
    await refreshData()
  }

  // Handle new order creation
  const handleNewOrder = async (payload: any) => {
    setNewOrderCount(prev => prev + 1)
    await refreshData()
    
    // Show notification for new orders
    if (payload.new) {
      toast.success(`New order created! Order #${payload.new.order_number}`, {
        duration: 5000,
        position: 'top-right'
      })
    }
  }

  // Optimized refresh function
  const refreshData = async () => {
    if (isRefreshing) return
    
    setIsRefreshing(true)
    try {
      await fetchData()
      setLastRefreshTime(new Date())
    } catch (error) {
      console.error('Error refreshing data:', error)
    } finally {
      setIsRefreshing(false)
    }
  }

  // Start periodic refresh as fallback
  const startPeriodicRefresh = () => {
    const interval = setInterval(() => {
      if (document.visibilityState === 'visible') {
        refreshData()
      }
    }, 10000) // More frequent fallback (10 seconds)
    
    return () => clearInterval(interval)
  }

  // Clear new order count when user views orders
  const clearNewOrderCount = () => {
    setNewOrderCount(0)
  }

  const fetchData = async () => {
    try {
      // Fetch orders with all related data including status history
      const { data: ordersData, error: ordersError } = await supabase
        .from('orders')
        .select(`
          *,
          customer:profiles!orders_customer_id_fkey (
            id,
            full_name,
            company_name,
            email
          ),
          supplier_quotes (
            id,
            price,
            notes,
            created_at,
            supplier:profiles!supplier_quotes_supplier_id_fkey (
              id,
              full_name,
              company_name
            )
          ),
          order_status_history (
            id,
            status,
            notes,
            created_at,
            changed_by
          )
        `)
        .order('updated_at', { ascending: false })

      if (ordersError) {
        console.error('Error fetching orders:', ordersError)
        toast.error('Failed to fetch orders')
        return
      }

      // Fetch all users
      const { data: usersData, error: usersError } = await supabase
        .from('profiles')
        .select('*')
        .order('created_at', { ascending: false })

      if (usersError) {
        console.error('Error fetching users:', usersError)
        toast.error('Failed to fetch users')
        return
      }


      setOrders(ordersData || [])
      setUsers(usersData || [])
    } catch (error) {
      console.error('Error fetching data:', error)
      toast.error('Failed to fetch data')
    } finally {
      setLoading(false)
    }
  }

  const handleUpdateOrderStatus = async (request: UpdateOrderStatusRequest) => {
    try {
      const { error } = await supabase
        .rpc('update_order_status', {
          p_order_id: request.order_id,
          p_status: request.status,
          p_notes: request.notes,
          p_changed_by: profile?.id
        })

      if (error) {
        console.error('Error updating order status:', error)
        toast.error('Failed to update order status')
        return
      }

      toast.success('Order status updated successfully')
      fetchData()
    } catch (error) {
      console.error('Error updating order status:', error)
      toast.error('Failed to update order status')
    }
  }

  const handleSetFinalPrice = async (request: SetFinalPriceRequest) => {
    try {
      // Get the lowest supplier quote
      const order = orders.find(o => o.id === request.order_id)
      if (!order || !order.supplier_quotes || order.supplier_quotes.length === 0) {
        toast.error('No supplier quotes found for this order')
        return
      }

      const lowestQuote = order.supplier_quotes.reduce((lowest, quote) => 
        quote.price < lowest.price ? quote : lowest
      )

      const finalPrice = lowestQuote.price * (1 + request.admin_margin / 100)

      const { error } = await supabase
        .from('orders')
        .update({
          supplier_price: lowestQuote.price,
          admin_margin: request.admin_margin,
          final_price: finalPrice,
          status: 'payment_confirmed'
        })
        .eq('id', request.order_id)

      if (error) {
        console.error('Error setting final price:', error)
        toast.error('Failed to set final price')
        return
      }

      // Update order status to payment pending
      await handleUpdateOrderStatus({
        order_id: request.order_id,
        status: 'payment_confirmed',
        notes: `Final price set: $${finalPrice.toFixed(2)} (Supplier: $${lowestQuote.price}, Margin: ${request.admin_margin}%)`
      })

      toast.success('Final price set successfully')
      fetchData()
    } catch (error) {
      console.error('Error setting final price:', error)
      toast.error('Failed to set final price')
    }
  }

  const handleSignOut = async () => {
    await signOut()
    toast.success('Signed out successfully')
  }

  const handleEditOrder = (order: Order) => {
    setSelectedOrder(order)
    setEditForm({
      supplier_price: order.supplier_price?.toString() || '',
      quantity: order.quantity.toString(),
      status: order.status,
      final_price: order.final_price?.toString() || ''
    })
    setEditModalOpen(true)
  }

  const handleViewOrderDetails = (order: Order) => {
    setSelectedOrder(order)
    setDetailsEditForm({
      title: order.title || '',
      description: order.description || '',
      quantity: order.quantity.toString(),
      supplier_price: order.supplier_price?.toString() || '',
      final_price: order.final_price?.toString() || '',
      status: order.status,
      delivery_address: order.delivery_address || '',
      phone_number: order.phone_number || '',
      product_link: order.product_link || ''
    })
    setDetailsEditMode(false)
    setDetailsModalOpen(true)
  }

  const handleCloseDetailsModal = () => {
    setDetailsModalOpen(false)
    setDetailsEditMode(false)
    setSelectedOrder(null)
  }

  const handleDetailsEditFormChange = (field: string, value: string) => {
    setDetailsEditForm(prev => {
      const newForm = {
        ...prev,
        [field]: value
      }
      
      // Auto-calculate final price with 20% profit margin when supplier price changes
      if (field === 'supplier_price' && value) {
        const supplierPrice = parseFloat(value)
        if (!isNaN(supplierPrice)) {
          newForm.final_price = (supplierPrice * 1.2).toFixed(2)
        }
      }
      
      return newForm
    })
  }

  const handleDetailsEditSubmit = async () => {
    if (!selectedOrder) return

    try {
      const updateData: any = {
        title: detailsEditForm.title,
        description: detailsEditForm.description,
        quantity: parseInt(detailsEditForm.quantity),
        supplier_price: detailsEditForm.supplier_price ? parseFloat(detailsEditForm.supplier_price) : null,
        final_price: detailsEditForm.final_price ? parseFloat(detailsEditForm.final_price) : null,
        status: detailsEditForm.status,
        delivery_address: detailsEditForm.delivery_address,
        phone_number: detailsEditForm.phone_number,
        product_link: detailsEditForm.product_link,
        updated_at: new Date().toISOString()
      }

      const { error } = await supabase
        .from('orders')
        .update(updateData)
        .eq('id', selectedOrder.id)

      if (error) throw error

      toast.success('Order updated successfully!')
      setDetailsEditMode(false)
      fetchData()
    } catch (error) {
      console.error('Error updating order:', error)
      toast.error('Failed to update order')
    }
  }

  const handleEditFormChange = (field: string, value: string) => {
    setEditForm(prev => {
      const newForm = {
        ...prev,
        [field]: value
      }
      
      // Auto-calculate customer price with 20% profit margin when supplier price changes
      if (field === 'supplier_price' && value) {
        const supplierPrice = parseFloat(value)
        if (!isNaN(supplierPrice) && supplierPrice > 0) {
          const customerPrice = supplierPrice * 1.20 // 20% profit margin
          newForm.final_price = customerPrice.toFixed(2)
        }
      }
      
      return newForm
    })
  }

  const handleEditSubmit = async () => {
    if (!selectedOrder) return

    try {
      // Validate form
      if (!editForm.supplier_price || !editForm.quantity || !editForm.status) {
        toast.error('Please fill in all required fields')
        return
      }

      const supplierPrice = parseFloat(editForm.supplier_price)
      const quantity = parseInt(editForm.quantity)
      const finalPrice = editForm.final_price ? parseFloat(editForm.final_price) : null

      if (isNaN(supplierPrice) || supplierPrice < 0) {
        toast.error('Supplier price must be a valid positive number')
        return
      }

      if (isNaN(quantity) || quantity < 1) {
        toast.error('Quantity must be a valid positive number')
        return
      }

      if (finalPrice && (isNaN(finalPrice) || finalPrice < 0)) {
        toast.error('Final price must be a valid positive number')
        return
      }

      // Update order in database
      const { error } = await supabase
        .from('orders')
        .update({
          supplier_price: supplierPrice,
          quantity: quantity,
          status: editForm.status,
          final_price: finalPrice,
          updated_at: new Date().toISOString()
        })
        .eq('id', selectedOrder.id)

      if (error) {
        console.error('Error updating order:', error)
        toast.error('Failed to update order')
        return
      }

      // Add status history entry
      await supabase
        .from('order_status_history')
        .insert({
          order_id: selectedOrder.id,
          status: editForm.status,
          changed_by: profile?.id,
          notes: `Order updated by admin: Supplier price: $${supplierPrice}, Quantity: ${quantity}, Final price: ${finalPrice ? '$' + finalPrice : 'Not set'}`
        })

      toast.success('Order updated successfully')
      setEditModalOpen(false)
      setSelectedOrder(null)
      fetchData()
    } catch (error) {
      console.error('Error updating order:', error)
      toast.error('Failed to update order')
    }
  }

  const handleCloseEditModal = () => {
    setEditModalOpen(false)
    setSelectedOrder(null)
    setEditForm({
      supplier_price: '',
      quantity: '',
      status: '',
      final_price: ''
    })
  }

  const handleDeleteOrder = async (order: Order) => {
    if (!confirm(`Are you sure you want to delete order "${order.title}"?`)) {
      return
    }

    try {
      const { error } = await supabase
        .from('orders')
        .delete()
        .eq('id', order.id)

      if (error) {
        console.error('Error deleting order:', error)
        toast.error('Failed to delete order')
        return
      }

      toast.success('Order deleted successfully')
      fetchData()
    } catch (error) {
      console.error('Error deleting order:', error)
      toast.error('Failed to delete order')
    }
  }

  const handleApproveOrder = async (order: Order) => {
    try {
      await handleUpdateOrderStatus({
        order_id: order.id,
        status: 'request_created',
        notes: 'Order approved by admin and sent to suppliers'
      })
      toast.success('Order approved and sent to suppliers')
    } catch (error) {
      console.error('Error approving order:', error)
      toast.error('Failed to approve order')
    }
  }

  const handleRejectOrder = async (order: Order) => {
    try {
      await handleUpdateOrderStatus({
        order_id: order.id,
        status: 'canceled',
        notes: 'Order rejected by admin'
      })
      toast.success('Order rejected')
    } catch (error) {
      console.error('Error rejecting order:', error)
      toast.error('Failed to reject order')
    }
  }

  const getOrdersCreated = () => {
    return orders.filter(order => order.status === 'request_created').length
  }

  const getPaymentReceived = () => {
    return orders.filter(order => order.status === 'payment_confirmed').length
  }

  const getWaitingPayment = () => {
    return orders.filter(order => order.status === 'price_quoted').length
  }


  const generateTimelineEvents = (order: Order) => {
    const events = []
    

    // 1. Order Created - Always the first event
    events.push({
      id: `created_${order.created_at}`,
      action: 'Order Created',
      description: 'Customer created the order',
      timestamp: order.created_at,
      icon: Package,
      color: 'text-blue-600',
      bgColor: 'bg-blue-100'
    })

    // 2. All Quote Submissions - Multiple quotes can be submitted
    if (order.supplier_quotes && order.supplier_quotes.length > 0) {
      order.supplier_quotes.forEach((quote, index) => {
        events.push({
          id: `quote_${quote.id}`,
          action: 'Quote Submitted',
          description: `Supplier quoted $${quote.price.toFixed(2)}${quote.notes ? ` - ${quote.notes}` : ''}`,
          timestamp: quote.created_at,
          icon: DollarSign,
          color: 'text-yellow-600',
          bgColor: 'bg-yellow-100'
        })
      })
    }

    // 3. Customer Updates - Track when customer makes changes
    // We'll use updated_at vs created_at to detect customer updates
    // This is a simplified approach - in a real system, you'd have a separate customer_actions table
    if (order.updated_at !== order.created_at) {
      const updateTime = new Date(order.updated_at).getTime()
      const createdTime = new Date(order.created_at).getTime()
      
      // Check if this update happened after the last quote (indicating customer update)
      const lastQuoteTime = order.supplier_quotes && order.supplier_quotes.length > 0 
        ? Math.max(...order.supplier_quotes.map(q => new Date(q.created_at).getTime()))
        : createdTime
      
      if (updateTime > lastQuoteTime && updateTime > createdTime) {
        events.push({
          id: `customer_update_${order.updated_at}`,
          action: 'Customer Updated Order',
          description: 'Customer made changes to order details',
          timestamp: order.updated_at,
          icon: Edit,
          color: 'text-orange-600',
          bgColor: 'bg-orange-100'
        })
      }
    }

    // 4. Supplier Updates - When supplier uploads image and marks complete
    if (order.supplier_completed_at) {
      events.push({
        id: `supplier_update_${order.supplier_completed_at}`,
        action: 'Supplier Updated Order',
        description: 'Supplier uploaded image and marked as complete',
        timestamp: order.supplier_completed_at,
        icon: Upload,
        color: 'text-purple-600',
        bgColor: 'bg-purple-100'
      })
    }

    // 5. Payment Events - Track payment confirmation
    if (order.payment_confirmed_at) {
      events.push({
        id: `payment_${order.payment_confirmed_at}`,
        action: 'Payment Received',
        description: 'Customer payment confirmed',
        timestamp: order.payment_confirmed_at,
        icon: CreditCard,
        color: 'text-green-600',
        bgColor: 'bg-green-100'
      })
    }

    // 6. Status Changes from History - Track all status transitions from order_status_history
    if (order.order_status_history && order.order_status_history.length > 0) {
      order.order_status_history.forEach((statusChange, index) => {
        let action = ''
        let description = ''
        let icon = Package
        let color = 'text-gray-600'
        let bgColor = 'bg-gray-100'

        switch (statusChange.status) {
          case 'request_created':
            action = 'Status: Request Created'
            description = 'Order status set to request created'
            icon = Package
            color = 'text-blue-600'
            bgColor = 'bg-blue-100'
            break
          case 'price_quoted':
            action = 'Status: Price Quoted'
            description = 'Order status set to price quoted'
            icon = DollarSign
            color = 'text-yellow-600'
            bgColor = 'bg-yellow-100'
            break
          case 'payment_confirmed':
            action = 'Status: Payment Confirmed'
            description = 'Order status set to payment confirmed'
            icon = CreditCard
            color = 'text-green-600'
            bgColor = 'bg-green-100'
            break
          case 'production_started':
            action = 'Status: In Production'
            description = 'Order status set to in production'
            icon = Factory
            color = 'text-purple-600'
            bgColor = 'bg-purple-100'
            break
          case 'in_transit':
            action = 'Status: In Transit'
            description = 'Order status set to in transit'
            icon = Truck
            color = 'text-indigo-600'
            bgColor = 'bg-indigo-100'
            break
          case 'delivered':
            action = 'Status: Delivered'
            description = 'Order status set to delivered'
            icon = CheckCircle
            color = 'text-green-600'
            bgColor = 'bg-green-100'
            break
          case 'canceled':
            action = 'Status: Canceled'
            description = 'Order status set to canceled'
            icon = XCircle
            color = 'text-red-600'
            bgColor = 'bg-red-100'
            break
          default:
            action = `Status: ${statusChange.status}`
            description = `Order status set to ${statusChange.status}`
        }

        if (statusChange.notes) {
          description += ` - ${statusChange.notes}`
        }

        events.push({
          id: `status_${statusChange.id}`,
          action,
          description,
          timestamp: statusChange.created_at,
          icon,
          color,
          bgColor
        })
      })
    }

    // Sort events by timestamp, then by action for events with same timestamp
    return events.sort((a, b) => {
      const timeA = new Date(a.timestamp).getTime()
      const timeB = new Date(b.timestamp).getTime()
      
      if (timeA !== timeB) {
        return timeA - timeB
      }
      
      // If timestamps are the same, sort by action name for consistency
      return a.action.localeCompare(b.action)
    })
  }

  // Group orders by status for separate tables
  const ordersByStatus = {
    admin_review: orders.filter(order => order.status === 'admin_review'),
    request_created: orders.filter(order => order.status === 'request_created'),
    price_quoted: orders.filter(order => order.status === 'price_quoted'),
    payment_confirmed: orders.filter(order => order.status === 'payment_confirmed'),
    production_started: orders.filter(order => order.status === 'production_started'),
    in_transit: orders.filter(order => order.status === 'in_transit'),
    delivered: orders.filter(order => order.status === 'delivered'),
    canceled: orders.filter(order => order.status === 'canceled')
  }

  // Toggle table collapse state
  const toggleTableCollapse = (status: string) => {
    setCollapsedTables(prev => ({
      ...prev,
      [status]: !prev[status]
    }))
  }

  // Filter orders by search term (including order number)
  const getFilteredOrdersByStatus = (statusOrders: Order[]) => {
    return statusOrders.filter(order => {
      const matchesSearch = order.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           order.customer?.full_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           order.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           matchesOrderNumber(searchTerm, order.order_number)
      return matchesSearch
    })
  }

  const getStatusColor = (status: string) => {
    const colors = {
      'admin_review': 'bg-orange-100 text-orange-800',
      'request_created': 'bg-blue-100 text-blue-800',
      'price_quoted': 'bg-yellow-100 text-yellow-800',
      'payment_confirmed': 'bg-green-100 text-green-800',
      'production_started': 'bg-purple-100 text-purple-800',
      'in_transit': 'bg-indigo-100 text-indigo-800',
      'delivered': 'bg-gray-100 text-gray-800',
      'canceled': 'bg-red-100 text-red-800'
    }
    return colors[status as keyof typeof colors] || 'bg-gray-100 text-gray-800'
  }

  const getTableHeaderColor = (status: string) => {
    const colors = {
      'admin_review': 'bg-orange-50',
      'request_created': 'bg-blue-50',
      'price_quoted': 'bg-yellow-50',
      'payment_confirmed': 'bg-green-50',
      'production_started': 'bg-purple-50',
      'in_transit': 'bg-indigo-50',
      'delivered': 'bg-gray-50',
      'canceled': 'bg-red-50'
    }
    return colors[status as keyof typeof colors] || 'bg-gray-50'
  }

  const getStatusLabel = (status: string) => {
    const labels = {
      'admin_review': 'UNDER REVIEW',
      'request_created': 'ORDER RECEIVED',
      'price_quoted': 'PRICE QUOTED',
      'payment_confirmed': 'PAYMENT RECEIVED',
      'production_started': 'IN PRODUCTION',
      'in_transit': 'IN SHIPPING',
      'delivered': 'DELIVERED',
      'canceled': 'CANCELED'
    }
    return labels[status as keyof typeof labels] || status.toUpperCase()
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary-600"></div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 to-blue-50">
      {/* Header */}
      <AppHeader onSignOut={handleSignOut} />
      
      {/* New Order Notification Bar */}
      {(newOrderCount > 0 || isRefreshing) && (
        <div className="bg-white border-b border-gray-200">
          <div className="w-full px-4 sm:px-6 lg:px-8 py-2">
            <div className="flex items-center justify-center space-x-4">
              {newOrderCount > 0 && (
                <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-red-100 text-red-800 animate-pulse">
                  {newOrderCount} new order{newOrderCount > 1 ? 's' : ''} available
                </span>
              )}
              {isRefreshing && (
                <div className="flex items-center text-sm text-gray-500">
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-primary-500 mr-2"></div>
                  Refreshing orders...
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Main Content */}
      <main className="w-full py-4 sm:py-6 px-4 sm:px-6 lg:px-8">
        {/* Statistics Cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-6 mb-6 sm:mb-8">
          <div className="bg-white overflow-hidden shadow rounded-lg">
            <div className="p-3 sm:p-5">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <ShoppingCart className="h-5 w-5 sm:h-6 sm:w-6 text-gray-400" />
                </div>
                <div className="ml-3 sm:ml-5 w-0 flex-1">
                  <dl>
                    <dt className="text-xs sm:text-sm font-medium text-gray-500 truncate">
                      Total Orders
                    </dt>
                    <dd className="text-base sm:text-lg font-medium text-gray-900">
                      {orders.length}
                    </dd>
                  </dl>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-white overflow-hidden shadow rounded-lg">
            <div className="p-3 sm:p-5">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <Package className="h-5 w-5 sm:h-6 sm:w-6 text-gray-400" />
                </div>
                <div className="ml-3 sm:ml-5 w-0 flex-1">
                  <dl>
                    <dt className="text-xs sm:text-sm font-medium text-gray-500 truncate">
                      Order Created
                    </dt>
                    <dd className="text-base sm:text-lg font-medium text-gray-900">
                      {getOrdersCreated()}
                    </dd>
                  </dl>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-white overflow-hidden shadow rounded-lg">
            <div className="p-3 sm:p-5">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <DollarSign className="h-5 w-5 sm:h-6 sm:w-6 text-gray-400" />
                </div>
                <div className="ml-3 sm:ml-5 w-0 flex-1">
                  <dl>
                    <dt className="text-xs sm:text-sm font-medium text-gray-500 truncate">
                      Payment Received
                    </dt>
                    <dd className="text-base sm:text-lg font-medium text-gray-900">
                      {getPaymentReceived()}
                    </dd>
                  </dl>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-white overflow-hidden shadow rounded-lg">
            <div className="p-3 sm:p-5">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <BarChart3 className="h-5 w-5 sm:h-6 sm:w-6 text-gray-400" />
                </div>
                <div className="ml-3 sm:ml-5 w-0 flex-1">
                  <dl>
                    <dt className="text-xs sm:text-sm font-medium text-gray-500 truncate">
                      Waiting Payment
                    </dt>
                    <dd className="text-base sm:text-lg font-medium text-gray-900">
                      {getWaitingPayment()}
                    </dd>
                  </dl>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Main Content Area */}
        <div className="bg-white shadow rounded-lg">
          <div className="px-4 py-5 sm:p-6">
            {/* Tabs */}
            <div className="border-b border-gray-200">
              <nav className="-mb-px flex space-x-8">
                <button
                  onClick={() => setActiveTab('orders')}
                  className={`py-2 px-1 border-b-2 font-medium text-sm ${
                    activeTab === 'orders'
                      ? 'border-primary-500 text-primary-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}
                >
                  Orders
                </button>
                <button
                  onClick={() => setActiveTab('customers')}
                  className={`py-2 px-1 border-b-2 font-medium text-sm ${
                    activeTab === 'customers'
                      ? 'border-primary-500 text-primary-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}
                >
                  Customers
                </button>
                <button
                  onClick={() => setActiveTab('analyze')}
                  className={`py-2 px-1 border-b-2 font-medium text-sm ${
                    activeTab === 'analyze'
                      ? 'border-primary-500 text-primary-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}
                >
                  Analyze
                </button>
              </nav>
            </div>

            {/* Tab Content */}
            <div className="mt-6">
              {activeTab === 'orders' && (
                <div>
                  {/* Search and Filter */}
                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-6">
                    <div className="flex flex-col sm:flex-row sm:items-center space-y-2 sm:space-y-0 sm:space-x-4">
                      <div className="relative">
                        <input
                          type="text"
                          placeholder="Search product, customer, order number"
                          value={searchTerm}
                          onChange={(e) => setSearchTerm(e.target.value)}
                          className="pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:ring-primary-500 focus:border-primary-500"
                        />
                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                          <svg className="h-5 w-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                          </svg>
                        </div>
                      </div>
                    </div>

                  </div>

                  {/* Orders Table */}
                  {/* Separate Tables for Each Status */}
                  {Object.entries(ordersByStatus).map(([status, statusOrders]) => {
                    const isCollapsed = collapsedTables[status]
                    const headerColor = getTableHeaderColor(status)
                    const statusLabel = getStatusLabel(status)
                    const filteredStatusOrders = getFilteredOrdersByStatus(statusOrders)

                    return (
                      <div key={status} className="mb-6">
                        {/* Table Header with Collapse Toggle */}
                        <div 
                          className={`${headerColor} rounded-t-lg border border-gray-200 cursor-pointer hover:opacity-90 transition-opacity`}
                          onClick={() => toggleTableCollapse(status)}
                        >
                          <div className="px-6 py-4 flex items-center justify-between">
                            <div className="flex items-center space-x-3">
                              <h3 className="text-lg font-medium text-gray-900">
                                {statusLabel} ({filteredStatusOrders.length})
                              </h3>
                            </div>
                            <div className="flex items-center space-x-2">
                              <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(status)}`}>
                                {statusLabel}
                              </span>
                              <svg
                                className={`w-5 h-5 text-gray-500 transform transition-transform ${isCollapsed ? 'rotate-180' : ''}`}
                                fill="none"
                                stroke="currentColor"
                                viewBox="0 0 24 24"
                              >
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                              </svg>
                            </div>
                          </div>
                        </div>

                        {/* Collapsible Table Content */}
                        {!isCollapsed && (
                          <div className="overflow-x-auto border-l border-r border-b border-gray-200 rounded-b-lg">
                            <table className="min-w-full divide-y divide-gray-200" style={{ minWidth: '800px' }}>
                              <thead className={headerColor}>
                                <tr>
                                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider whitespace-nowrap">
                                    #Order
                                  </th>
                                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    Product Name
                                  </th>
                                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    Description
                                  </th>
                                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    Supplier Price
                                  </th>
                                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    Quantity
                                  </th>
                                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    Customer Price
                                  </th>
                                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    Profit
                                  </th>
                                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    Customer
                                  </th>
                                </tr>
                              </thead>
                              <tbody className="bg-white divide-y divide-gray-200">
                                {filteredStatusOrders.length > 0 ? (
                                  filteredStatusOrders.map((order) => (
                                    <tr 
                                      key={order.id}
                                      onClick={() => handleViewOrderDetails(order)}
                                      className="cursor-pointer hover:bg-gray-50 transition-colors"
                                    >
                                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                                        {formatOrderNumber(order.order_number)}
                                      </td>
                                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                        {order.title}
                                      </td>
                                      <td className="px-6 py-4 text-sm text-gray-500 max-w-lg">
                                        <div className="whitespace-normal break-words">
                                          {order.description}
                                        </div>
                                      </td>
                                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                        ${order.supplier_price?.toFixed(2) || '-'}
                                      </td>
                                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                        {order.quantity}
                                      </td>
                                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                        ${order.final_price?.toFixed(2) || '-'}
                                      </td>
                                      <td className="px-6 py-4 whitespace-nowrap text-sm text-green-600 font-medium">
                                        {order.final_price && order.supplier_price ? 
                                          `+$${(order.final_price - order.supplier_price).toFixed(2)}` : 
                                          '-'
                                        }
                                      </td>
                                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                        {order.customer?.full_name}
                                      </td>
                                    </tr>
                                  ))
                                ) : (
                                  <tr>
                                    <td 
                                      colSpan={8} 
                                      className="px-6 py-12 text-center text-sm text-gray-500"
                                    >
                                      <Package className="mx-auto h-8 w-8 text-gray-400 mb-2" />
                                      <div>No {statusLabel.toLowerCase()} orders</div>
                                    </td>
                                  </tr>
                                )}
                              </tbody>
                            </table>
                          </div>
                        )}
                      </div>
                    )
                  })}
                </div>
              )}
              {activeTab === 'customers' && (
                <div>
                  <h3 className="text-lg font-medium text-gray-900 mb-4">
                    Customer Management
                  </h3>
                  <div className="overflow-hidden shadow ring-1 ring-black ring-opacity-5 md:rounded-lg">
                    <table className="min-w-full divide-y divide-gray-300">
                      <thead className="bg-gray-50">
                        <tr>
                          <th className="px-6 py-3 text-left text-sm font-medium text-gray-500 uppercase tracking-wider">
                            Name
                          </th>
                          <th className="px-6 py-3 text-left text-sm font-medium text-gray-500 uppercase tracking-wider">
                            Email
                          </th>
                          <th className="px-6 py-3 text-left text-sm font-medium text-gray-500 uppercase tracking-wider">
                            Role
                          </th>
                          <th className="px-6 py-3 text-left text-sm font-medium text-gray-500 uppercase tracking-wider">
                            Company
                          </th>
                          <th className="px-6 py-3 text-left text-sm font-medium text-gray-500 uppercase tracking-wider">
                            Joined
                          </th>
                        </tr>
                      </thead>
                      <tbody className="bg-white divide-y divide-gray-200">
                        {users.map((user) => (
                          <tr key={user.id}>
                            <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                              {user.full_name}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                              {user.email}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                                user.role === 'admin' 
                                  ? 'bg-red-100 text-red-800'
                                  : user.role === 'supplier'
                                  ? 'bg-blue-100 text-blue-800'
                                  : 'bg-green-100 text-green-800'
                              }`}>
                                {user.role}
                              </span>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                              {user.company_name || '-'}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                              {new Date(user.created_at).toLocaleDateString()}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
              {activeTab === 'analyze' && (
                <SystemStats 
                  orders={orders} 
                  users={users}
                />
              )}
            </div>
          </div>
                 </div>
       </main>

       {/* Edit Order Modal */}
       {editModalOpen && selectedOrder && (
         <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
           <div className="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white">
             <div className="mt-3">
               {/* Modal Header */}
               <div className="flex items-center justify-between mb-4">
                 <div>
                   <h3 className="text-lg font-medium text-gray-900">
                     Edit Order: {selectedOrder.title}
                   </h3>
                   <p className="text-sm text-green-600 font-medium">
                     💰 Fixed 20% Profit Margin Applied
                   </p>
                 </div>
                 <button
                   onClick={handleCloseEditModal}
                   className="text-gray-400 hover:text-gray-600"
                 >
                   <X className="h-6 w-6" />
                 </button>
               </div>

               {/* Modal Body */}
               <div className="space-y-4">
                 {/* Supplier Price */}
                 <div>
                   <label className="block text-sm font-medium text-gray-700 mb-1">
                     Supplier Price ($)
                   </label>
                   <input
                     type="number"
                     step="0.01"
                     min="0"
                     value={editForm.supplier_price}
                     onChange={(e) => handleEditFormChange('supplier_price', e.target.value)}
                     className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-primary-500 focus:border-primary-500"
                     placeholder="0.00"
                   />
                 </div>

                 {/* Quantity */}
                 <div>
                   <label className="block text-sm font-medium text-gray-700 mb-1">
                     Quantity
                   </label>
                   <input
                     type="number"
                     min="1"
                     value={editForm.quantity}
                     onChange={(e) => handleEditFormChange('quantity', e.target.value)}
                     className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-primary-500 focus:border-primary-500"
                     placeholder="1"
                   />
                 </div>

                 {/* Final Price - Auto-calculated with 20% profit */}
                 <div>
                   <label className="block text-sm font-medium text-gray-700 mb-1">
                     Customer Price ($) - Auto-calculated with 20% profit
                   </label>
                   <div className="relative">
                     <input
                       type="number"
                       step="0.01"
                       min="0"
                       value={editForm.final_price}
                       onChange={(e) => handleEditFormChange('final_price', e.target.value)}
                       className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-primary-500 focus:border-primary-500 bg-gray-50"
                       placeholder="0.00"
                       readOnly={editForm.supplier_price ? true : false}
                     />
                     {editForm.supplier_price && (
                       <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
                         <span className="text-green-600 text-sm font-medium">+20%</span>
                       </div>
                     )}
                   </div>
                   {editForm.supplier_price && editForm.final_price && (
                     <p className="text-xs text-gray-500 mt-1">
                       Profit: ${(parseFloat(editForm.final_price) - parseFloat(editForm.supplier_price)).toFixed(2)} 
                       (${((parseFloat(editForm.final_price) - parseFloat(editForm.supplier_price)) / parseFloat(editForm.supplier_price) * 100).toFixed(1)}%)
                     </p>
                   )}
                 </div>

                 {/* Status */}
                 <div>
                   <label className="block text-sm font-medium text-gray-700 mb-1">
                     Status
                   </label>
                   <select
                     value={editForm.status}
                     onChange={(e) => handleEditFormChange('status', e.target.value)}
                     className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-primary-500 focus:border-primary-500"
                   >
                     <option value="request_created">Order Received</option>
                     <option value="price_quoted">Price Quoted</option>

                     <option value="payment_confirmed">Payment Received</option>
                     <option value="production_started">In Production</option>
                     <option value="in_transit">In Shipping</option>
                     <option value="delivered">Delivered</option>
                     <option value="canceled">Canceled</option>
                   </select>
                 </div>
               </div>

               {/* Modal Footer */}
               <div className="flex justify-between mt-6">
                 <button
                   onClick={() => handleDeleteOrder(selectedOrder)}
                   className="px-4 py-2 text-sm font-medium text-white bg-red-600 hover:bg-red-700 rounded-md transition-colors"
                 >
                   Delete Order
                 </button>
                 <div className="flex space-x-3">
                   <button
                     onClick={handleCloseEditModal}
                     className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-md transition-colors"
                   >
                     Cancel
                   </button>
                   <button
                     onClick={handleEditSubmit}
                     className="px-4 py-2 text-sm font-medium text-white bg-primary-600 hover:bg-primary-700 rounded-md transition-colors"
                   >
                     Update Order
                   </button>
                 </div>
               </div>
             </div>
           </div>
         </div>
       )}

       {/* Order Details Modal */}
       {detailsModalOpen && selectedOrder && (
         <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
           <div className="relative top-2 sm:top-5 mx-auto p-3 sm:p-5 border w-11/12 max-w-6xl shadow-lg rounded-md bg-white mb-2 sm:mb-10">
             <div className="mt-3">
               {/* Modal Header */}
               <div className="flex items-center justify-between mb-6">
                 <div>
                   <h3 className="text-xl font-medium text-gray-900">
                     Order Details: {formatOrderNumber(selectedOrder.order_number)}
                   </h3>
                   <p className="text-sm text-gray-500 mt-1">
                     Created: {new Date(selectedOrder.created_at).toLocaleString('en-US', {
                       month: 'numeric',
                       day: 'numeric',
                       year: '2-digit',
                       hour: 'numeric',
                       minute: '2-digit',
                       hour12: true
                     })}
                   </p>
                 </div>
                 <div className="flex items-center space-x-3">
                   {!detailsEditMode && (
                     <button
                       onClick={() => setDetailsEditMode(true)}
                       className="px-3 py-1 text-sm font-medium text-primary-600 bg-primary-50 hover:bg-primary-100 rounded-md transition-colors"
                     >
                       Edit
                     </button>
                   )}
                   <button
                     onClick={handleCloseDetailsModal}
                     className="text-gray-400 hover:text-gray-600"
                   >
                     <X className="h-6 w-6" />
                   </button>
                 </div>
               </div>

               {/* Modal Body */}
               <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
                 {/* Left Column - Order Information */}
                 <div className="space-y-6">
                   {/* Basic Information */}
                   <div className="bg-gray-50 p-4 rounded-lg">
                     <h4 className="text-lg font-medium text-gray-900 mb-4">Order Information</h4>
                     <div className="space-y-4">
                       <div>
                         <label className="block text-sm font-medium text-gray-700 mb-1">Order Number</label>
                         <div className="text-sm font-medium text-gray-900 bg-gray-100 px-3 py-2 rounded-md">
                           {formatOrderNumber(selectedOrder.order_number)}
                         </div>
                       </div>
                       
                       <div>
                         <label className="block text-sm font-medium text-gray-700 mb-1">Product Name</label>
                         {detailsEditMode ? (
                           <input
                             type="text"
                             value={detailsEditForm.title}
                             onChange={(e) => handleDetailsEditFormChange('title', e.target.value)}
                             className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-primary-500 focus:border-primary-500"
                           />
                         ) : (
                           <div className="text-sm text-gray-900 bg-gray-100 px-3 py-2 rounded-md min-h-[40px]">
                             {selectedOrder.title || <span className="text-gray-400 italic">No product name</span>}
                           </div>
                         )}
                       </div>

                       <div>
                         <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                         {detailsEditMode ? (
                           <textarea
                             value={detailsEditForm.description}
                             onChange={(e) => handleDetailsEditFormChange('description', e.target.value)}
                             rows={3}
                             className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-primary-500 focus:border-primary-500"
                           />
                         ) : (
                           <div className="text-sm text-gray-900 bg-gray-100 px-3 py-2 rounded-md min-h-[80px] break-words whitespace-pre-wrap">
                             {selectedOrder.description || <span className="text-gray-400 italic">No description</span>}
                           </div>
                         )}
                       </div>

                       <div>
                         <label className="block text-sm font-medium text-gray-700 mb-1">Product Link</label>
                         {detailsEditMode ? (
                           <input
                             type="url"
                             value={detailsEditForm.product_link}
                             onChange={(e) => handleDetailsEditFormChange('product_link', e.target.value)}
                             className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-primary-500 focus:border-primary-500"
                             placeholder="https://example.com/product"
                           />
                         ) : (
                           <div className="text-sm text-gray-900 bg-gray-100 px-3 py-2 rounded-md min-h-[40px]">
                             {selectedOrder.product_link ? (
                               <a href={selectedOrder.product_link} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:text-blue-800">
                                 {selectedOrder.product_link}
                               </a>
                             ) : (
                               <span className="text-gray-400 italic">No product link</span>
                             )}
                           </div>
                         )}
                       </div>

                       <div>
                         <label className="block text-sm font-medium text-gray-700 mb-1">Quantity</label>
                         {detailsEditMode ? (
                           <input
                             type="number"
                             min="1"
                             value={detailsEditForm.quantity}
                             onChange={(e) => handleDetailsEditFormChange('quantity', e.target.value)}
                             className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-primary-500 focus:border-primary-500"
                           />
                         ) : (
                           <div className="text-sm text-gray-900 bg-gray-100 px-3 py-2 rounded-md min-h-[40px]">
                             {selectedOrder.quantity}
                           </div>
                         )}
                       </div>

                       <div>
                         <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
                         {detailsEditMode ? (
                           <select
                             value={detailsEditForm.status}
                             onChange={(e) => handleDetailsEditFormChange('status', e.target.value)}
                             className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-primary-500 focus:border-primary-500"
                           >
                             <option value="request_created">Order Received</option>
                             <option value="price_quoted">Price Quoted</option>
                             <option value="payment_confirmed">Payment Received</option>
                             <option value="production_started">In Production</option>
                             <option value="in_transit">In Shipping</option>
                             <option value="delivered">Delivered</option>
                             <option value="canceled">Canceled</option>
                           </select>
                         ) : (
                           <div className="text-sm text-gray-900 bg-gray-100 px-3 py-2 rounded-md min-h-[40px] flex items-center">
                             <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(selectedOrder.status)}`}>
                               {getStatusLabel(selectedOrder.status)}
                             </span>
                           </div>
                         )}
                       </div>
                     </div>
                   </div>

                   {/* Pricing Information */}
                   <div className="bg-gray-50 p-4 rounded-lg">
                     <h4 className="text-lg font-medium text-gray-900 mb-4">Pricing</h4>
                     <div className="space-y-4">
                       <div>
                         <label className="block text-sm font-medium text-gray-700 mb-1">Supplier Price ($)</label>
                         {detailsEditMode ? (
                           <input
                             type="number"
                             step="0.01"
                             min="0"
                             value={detailsEditForm.supplier_price}
                             onChange={(e) => handleDetailsEditFormChange('supplier_price', e.target.value)}
                             className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-primary-500 focus:border-primary-500"
                             placeholder="0.00"
                           />
                         ) : (
                           <div className="text-sm text-gray-900 bg-gray-100 px-3 py-2 rounded-md min-h-[40px]">
                             {selectedOrder.supplier_price ? `$${selectedOrder.supplier_price.toFixed(2)}` : <span className="text-gray-400 italic">No supplier price</span>}
                           </div>
                         )}
                       </div>

                       {/* Supplier Notes */}
                       {selectedOrder.supplier_quotes && selectedOrder.supplier_quotes.length > 0 && (
                         <div>
                           <label className="block text-sm font-medium text-gray-700 mb-1">Supplier Notes</label>
                           <div className="text-sm text-gray-900 bg-gray-100 px-3 py-2 rounded-md min-h-[40px]">
                             {selectedOrder.supplier_quotes[0]?.notes ? (
                               <span className="break-words">{selectedOrder.supplier_quotes[0].notes}</span>
                             ) : (
                               <span className="text-gray-400 italic">No supplier notes</span>
                             )}
                           </div>
                         </div>
                       )}

                       <div>
                         <label className="block text-sm font-medium text-gray-700 mb-1">Customer Price</label>
                         {detailsEditMode ? (
                           <div className="space-y-3">
                             {/* Direct Price Input */}
                             <div>
                               <label className="block text-xs font-medium text-gray-600 mb-1">Direct Price ($)</label>
                               <input
                                 type="number"
                                 step="0.01"
                                 min="0"
                                 value={detailsEditForm.final_price}
                                 onChange={(e) => handleDetailsEditFormChange('final_price', e.target.value)}
                                 className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-primary-500 focus:border-primary-500"
                                 placeholder="0.00"
                               />
                             </div>
                             
                             {/* Percentage Input */}
                             {detailsEditForm.supplier_price && (
                               <div>
                                 <label className="block text-xs font-medium text-gray-600 mb-1">Profit Margin (%)</label>
                                 <div className="flex space-x-2">
                                   <input
                                     type="number"
                                     step="0.1"
                                     min="0"
                                     max="1000"
                                     value={detailsEditForm.final_price && detailsEditForm.supplier_price ? 
                                       (((parseFloat(detailsEditForm.final_price) - parseFloat(detailsEditForm.supplier_price)) / parseFloat(detailsEditForm.supplier_price)) * 100).toFixed(1) : 
                                       '20'
                                     }
                                     onChange={(e) => {
                                       const percentage = parseFloat(e.target.value)
                                       if (!isNaN(percentage) && detailsEditForm.supplier_price) {
                                         const supplierPrice = parseFloat(detailsEditForm.supplier_price)
                                         const customerPrice = supplierPrice * (1 + percentage / 100)
                                         handleDetailsEditFormChange('final_price', customerPrice.toFixed(2))
                                       }
                                     }}
                                     className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:ring-primary-500 focus:border-primary-500"
                                     placeholder="20.0"
                                   />
                                   <span className="px-3 py-2 text-sm text-gray-500 bg-gray-100 rounded-md">%</span>
                                 </div>
                                 <p className="text-xs text-gray-500 mt-1">
                                   Supplier: ${detailsEditForm.supplier_price} | 
                                   Customer: ${detailsEditForm.final_price || '0.00'} | 
                                   Profit: ${detailsEditForm.final_price && detailsEditForm.supplier_price ? 
                                     (parseFloat(detailsEditForm.final_price) - parseFloat(detailsEditForm.supplier_price)).toFixed(2) : 
                                     '0.00'
                                   }
                                 </p>
                               </div>
                             )}
                           </div>
                         ) : (
                           <div className="text-sm text-gray-900 bg-gray-100 px-3 py-2 rounded-md min-h-[40px]">
                             {selectedOrder.final_price ? `$${selectedOrder.final_price.toFixed(2)}` : <span className="text-gray-400 italic">No customer price</span>}
                           </div>
                         )}
                       </div>

                       <div>
                         <label className="block text-sm font-medium text-gray-700 mb-1">Total Revenue</label>
                         <div className="text-sm text-gray-900 bg-gray-100 px-3 py-2 rounded-md min-h-[40px]">
                           ${((selectedOrder.final_price || 0) * selectedOrder.quantity).toFixed(2)}
                         </div>
                       </div>

                       <div>
                         <label className="block text-sm font-medium text-gray-700 mb-1">Profit</label>
                         <div className="text-sm font-medium text-green-600 bg-gray-100 px-3 py-2 rounded-md min-h-[40px]">
                           ${((selectedOrder.final_price || 0) - (selectedOrder.supplier_price || 0)).toFixed(2)}
                         </div>
                       </div>
                     </div>
                   </div>

                   {/* Customer Information */}
                   <div className="bg-gray-50 p-4 rounded-lg">
                     <h4 className="text-lg font-medium text-gray-900 mb-4">Customer Information</h4>
                     <div className="space-y-4">
                       <div>
                         <label className="block text-sm font-medium text-gray-700 mb-1">Customer Name</label>
                         <div className="text-sm text-gray-900 bg-gray-100 px-3 py-2 rounded-md min-h-[40px]">
                           {selectedOrder.customer?.full_name || <span className="text-gray-400 italic">No customer name</span>}
                         </div>
                       </div>

                       <div>
                         <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                         <div className="text-sm text-gray-900 bg-gray-100 px-3 py-2 rounded-md min-h-[40px]">
                           {selectedOrder.customer?.email || <span className="text-gray-400 italic">No email</span>}
                         </div>
                       </div>

                       <div>
                         <label className="block text-sm font-medium text-gray-700 mb-1">Phone Number</label>
                         {detailsEditMode ? (
                           <input
                             type="tel"
                             value={detailsEditForm.phone_number}
                             onChange={(e) => handleDetailsEditFormChange('phone_number', e.target.value)}
                             className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-primary-500 focus:border-primary-500"
                             placeholder="+1 (555) 123-4567"
                           />
                         ) : (
                           <div className="text-sm text-gray-900 bg-gray-100 px-3 py-2 rounded-md min-h-[40px]">
                             {selectedOrder.phone_number || <span className="text-gray-400 italic">No phone number</span>}
                           </div>
                         )}
                       </div>

                       <div>
                         <label className="block text-sm font-medium text-gray-700 mb-1">Delivery Address</label>
                         {detailsEditMode ? (
                           <textarea
                             value={detailsEditForm.delivery_address}
                             onChange={(e) => handleDetailsEditFormChange('delivery_address', e.target.value)}
                             rows={3}
                             className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-primary-500 focus:border-primary-500"
                             placeholder="Enter delivery address"
                           />
                         ) : (
                           <div className="text-sm text-gray-900 bg-gray-100 px-3 py-2 rounded-md min-h-[80px] break-words whitespace-pre-wrap">
                             {selectedOrder.delivery_address || <span className="text-gray-400 italic">No delivery address</span>}
                           </div>
                         )}
                       </div>
                     </div>
                   </div>
                 </div>

                 {/* Right Column - Images, Files, and Timeline */}
                 <div className="space-y-6">
                   {/* Supplier Images */}
                   <div className="bg-gray-50 p-4 rounded-lg">
                     <h4 className="text-lg font-medium text-gray-900 mb-4">Supplier Images</h4>
                     {selectedOrder.supplier_image_url ? (
                       <div className="space-y-3">
                         <div className="flex items-center justify-between p-3 bg-white rounded-lg border">
                           <div className="flex items-center space-x-3">
                             <div className="w-8 h-8 bg-purple-100 rounded-lg flex items-center justify-center">
                               <span className="text-purple-600 text-xs font-medium">IMG</span>
                             </div>
                             <div>
                               <p className="text-sm font-medium text-gray-900">Supplier Image</p>
                               <p className="text-xs text-gray-500">Image file</p>
                             </div>
                           </div>
                           <div className="flex space-x-2">
                             <a
                               href={selectedOrder.supplier_image_url}
                               target="_blank"
                               rel="noopener noreferrer"
                               className="text-blue-600 hover:text-blue-800 text-sm font-medium"
                             >
                               View
                             </a>
                             <a
                               href={selectedOrder.supplier_image_url}
                               download="supplier-image"
                               className="text-green-600 hover:text-green-800 text-sm font-medium"
                             >
                               Download
                             </a>
                           </div>
                         </div>
                       </div>
                     ) : (
                       <div className="text-sm text-gray-400 italic bg-gray-100 px-3 py-8 rounded-md text-center">
                         No supplier images uploaded
                       </div>
                     )}
                   </div>

                   {/* Customer Files */}
                   <div className="bg-gray-50 p-4 rounded-lg">
                     <h4 className="text-lg font-medium text-gray-900 mb-4">Customer Files</h4>
                     {selectedOrder.uploaded_files && selectedOrder.uploaded_files.length > 0 ? (
                       <div className="space-y-3">
                         {selectedOrder.uploaded_files.map((file, index) => (
                           <div key={index} className="flex items-center justify-between p-3 bg-white rounded-lg border">
                             <div className="flex items-center space-x-3">
                               <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center">
                                 <span className="text-blue-600 text-xs font-medium">
                                   {file.name.split('.').pop()?.toUpperCase()}
                                 </span>
                               </div>
                               <div>
                                 <p className="text-sm font-medium text-gray-900">{file.name}</p>
                                 <p className="text-xs text-gray-500">{(file.size / 1024 / 1024).toFixed(2)} MB</p>
                               </div>
                             </div>
                             <div className="flex space-x-2">
                               <a
                                 href={file.url}
                                 target="_blank"
                                 rel="noopener noreferrer"
                                 className="text-blue-600 hover:text-blue-800 text-sm font-medium"
                               >
                                 View
                               </a>
                               <a
                                 href={file.url}
                                 download={file.name}
                                 className="text-green-600 hover:text-green-800 text-sm font-medium"
                               >
                                 Download
                               </a>
                             </div>
                           </div>
                         ))}
                       </div>
                     ) : (
                       <div className="text-sm text-gray-400 italic bg-gray-100 px-3 py-8 rounded-md text-center">
                         No customer files uploaded
                       </div>
                     )}
                   </div>

                   {/* Detailed Timeline */}
                   <div className="bg-gray-50 p-4 rounded-lg min-h-[200px]">
                     <h4 className="text-lg font-medium text-gray-900 mb-4">
                       Order Timeline ({generateTimelineEvents(selectedOrder).length} events)
                     </h4>
                     <div className="relative">
                       {generateTimelineEvents(selectedOrder).map((event, index) => {
                         const Icon = event.icon
                         const isLast = index === generateTimelineEvents(selectedOrder).length - 1
                         return (
                           <div key={event.id} className="relative flex items-start space-x-3 pb-4">
                             <div className="relative">
                               <div className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center ${event.bgColor}`}>
                                 <Icon className={`h-4 w-4 ${event.color}`} />
                               </div>
                               {!isLast && (
                                 <div className="absolute left-4 top-8 w-0.5 h-8 bg-gray-300"></div>
                               )}
                             </div>
                             <div className="flex-1 min-w-0">
                               <div className="flex items-center justify-between">
                                 <p className="text-sm font-medium text-gray-900">{event.action}</p>
                                 <p className="text-xs text-gray-500">
                                   {new Date(event.timestamp).toLocaleString('en-US', {
                                     month: 'numeric',
                                     day: 'numeric',
                                     year: '2-digit',
                                     hour: 'numeric',
                                     minute: '2-digit',
                                     hour12: true
                                   })}
                                 </p>
                               </div>
                               <p className="text-xs text-gray-600 mt-1">{event.description}</p>
                             </div>
                           </div>
                         )
                       })}
                     </div>
                   </div>
                 </div>
               </div>

               {/* Modal Footer */}
               <div className="flex justify-between mt-8">
                 <div className="flex space-x-3">
                   <button
                     onClick={() => handleDeleteOrder(selectedOrder)}
                     className="px-4 py-2 text-sm font-medium text-white bg-red-600 hover:bg-red-700 rounded-md transition-colors"
                   >
                     Delete Order
                   </button>
                   
                   {/* Approve/Reject buttons for admin_review orders */}
                   {selectedOrder.status === 'admin_review' && !detailsEditMode && (
                     <>
                       <button
                         onClick={() => handleApproveOrder(selectedOrder)}
                         className="px-4 py-2 text-sm font-medium text-white bg-green-600 hover:bg-green-700 rounded-md transition-colors flex items-center"
                       >
                         <CheckCircle className="h-4 w-4 mr-2" />
                         Approve Order
                       </button>
                       <button
                         onClick={() => handleRejectOrder(selectedOrder)}
                         className="px-4 py-2 text-sm font-medium text-white bg-orange-600 hover:bg-orange-700 rounded-md transition-colors flex items-center"
                       >
                         <X className="h-4 w-4 mr-2" />
                         Reject Order
                       </button>
                     </>
                   )}
                 </div>
                 
                 <div className="flex space-x-3">
                   {detailsEditMode ? (
                     <>
                       <button
                         onClick={() => setDetailsEditMode(false)}
                         className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-md transition-colors"
                       >
                         Cancel
                       </button>
                       <button
                         onClick={handleDetailsEditSubmit}
                         className="px-4 py-2 text-sm font-medium text-white bg-primary-600 hover:bg-primary-700 rounded-md transition-colors"
                       >
                         Save Changes
                       </button>
                     </>
                   ) : (
                     <button
                       onClick={handleCloseDetailsModal}
                       className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-md transition-colors"
                     >
                       Close
                     </button>
                   )}
                 </div>
               </div>
             </div>
           </div>
         </div>
       )}
     </div>
   )
 }