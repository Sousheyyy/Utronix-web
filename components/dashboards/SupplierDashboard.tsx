'use client'

import { useState, useEffect } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import { supabase } from '@/lib/supabase'
import { Order, CreateQuoteRequest, OrderStatus } from '@/types'
import { CreateQuoteForm } from '../quotes/CreateQuoteForm'
import { OrderFiles } from '../orders/OrderFiles'
import { LogOut, Package, DollarSign, Upload, CheckCircle, Image as ImageIcon, X } from 'lucide-react'
import { toast } from 'react-hot-toast'
import { formatOrderTitle, formatOrderNumber } from '@/lib/orderUtils'

export function SupplierDashboard() {
  const { profile, signOut } = useAuth()
  const [orders, setOrders] = useState<Order[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null)
  const [showQuoteForm, setShowQuoteForm] = useState(false)
  const [showImageUpload, setShowImageUpload] = useState(false)
  const [showEditQuoteForm, setShowEditQuoteForm] = useState(false)
  const [showOrderDetails, setShowOrderDetails] = useState(false)
  const [imageFile, setImageFile] = useState<File | null>(null)
  const [uploading, setUploading] = useState(false)
  const [statusFilter, setStatusFilter] = useState<OrderStatus | 'all'>('all')

  // Filter orders based on selected status (excluding request_created from main table)
  const filteredOrders = statusFilter === 'all' 
    ? orders.filter(order => order.status !== 'request_created')
    : orders.filter(order => order.status === statusFilter && order.status !== 'request_created')

  // Separate request orders (request_created status)
  const requestOrders = orders.filter(order => order.status === 'request_created')

  useEffect(() => {
    fetchOrders()

    // Set up real-time subscription for order updates
    const channel = supabase
      .channel('orders_changes')
      .on('postgres_changes', 
        { 
          event: '*', 
          schema: 'public', 
          table: 'orders' 
        }, 
        () => {
          // Refresh orders when any order changes
          fetchOrders()
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [])

  const fetchOrders = async () => {
    try {
      console.log('Fetching orders for supplier:', profile?.id, 'Role:', profile?.role)

      const { data, error } = await supabase
        .from('orders')
        .select(`
          *,
          customer:profiles!orders_customer_id_fkey (
            id,
            full_name,
            company_name
          ),
          supplier_quotes (
            id,
            price,
            notes,
            created_at,
            supplier_id
          )
        `)
        .order('created_at', { ascending: false })

      if (error) {
        console.error('Error fetching orders:', error)
        console.error('Error details:', {
          message: error.message,
          details: error.details,
          hint: error.hint,
          code: error.code
        })
        toast.error(`Failed to fetch orders: ${error.message}`)
        return
      }

      console.log('Successfully fetched orders:', data?.length || 0, 'orders')
      setOrders(data || [])
    } catch (error) {
      console.error('Error fetching orders:', error)
      toast.error('Failed to fetch orders')
    } finally {
      setLoading(false)
    }
  }

  const handleCreateQuote = async (quoteData: CreateQuoteRequest) => {
    if (!selectedOrder) return

    console.log('Creating quote with data:', {
      quoteData,
      selectedOrder: selectedOrder.id,
      profile: profile?.id,
      profileRole: profile?.role
    })

    try {
      // First, try to update existing quote or create new one
      const { error: quoteError } = await supabase
        .from('supplier_quotes')
        .upsert([{
          order_id: selectedOrder.id,
          supplier_id: profile?.id,
          price: quoteData.price,
          notes: quoteData.notes,
        }], {
          onConflict: 'order_id,supplier_id'
        })

      if (quoteError) {
        console.error('Error creating/updating quote:', quoteError)
        console.error('Quote data:', {
          order_id: selectedOrder.id,
          supplier_id: profile?.id,
          price: quoteData.price,
          notes: quoteData.notes,
        })
        toast.error(`Failed to create quote: ${quoteError.message}`)
        return
      }

      // Calculate customer price with 20% profit margin
      const customerPrice = Math.round(quoteData.price * 1.20 * 100) / 100 // Round to 2 decimal places
      const profit = Math.round((customerPrice - quoteData.price) * 100) / 100 // Round to 2 decimal places
      
      // Convert to strings and parse back to ensure proper decimal formatting
      const supplierPrice = parseFloat(quoteData.price.toFixed(2))
      const finalPrice = parseFloat(customerPrice.toFixed(2))
      const adminMargin = parseFloat(profit.toFixed(2))
      
      // Validate that values are within reasonable limits
      if (finalPrice > 99999999.99) {
        toast.error('Customer price too high. Please contact administrator.')
        return
      }
      
      if (adminMargin > 99999999.99) {
        toast.error('Profit margin too high. Please contact administrator.')
        return
      }

      // First, update the order with pricing information
      const updateData = { 
        supplier_price: supplierPrice,
        final_price: finalPrice,
        admin_margin: adminMargin
      }
      

      
      const { error: updateError } = await supabase
        .from('orders')
        .update(updateData)
        .eq('id', selectedOrder.id)

      if (updateError) {
        console.error('Error updating order pricing:', updateError)
        toast.error(`Quote submitted but failed to update pricing: ${updateError.message}`)
        return
      }

      // Manually assign the supplier to the order (backup to trigger)
      console.log('Assigning supplier to order:', {
        orderId: selectedOrder.id,
        supplierId: profile?.id,
        supplierRole: profile?.role
      })
      
      const { error: assignError } = await supabase
        .from('orders')
        .update({ assigned_supplier_id: profile?.id })
        .eq('id', selectedOrder.id)

      if (assignError) {
        console.error('Error assigning supplier to order:', assignError)
        console.error('Assignment error details:', {
          message: assignError.message,
          details: assignError.details,
          hint: assignError.hint,
          code: assignError.code
        })
        // Don't fail the quote creation for this, just log it
      } else {
        console.log('Successfully assigned supplier to order')
      }

      // Then, update the order status using the proper function to record in history
      const { error: statusError } = await supabase
        .rpc('update_order_status', {
          p_order_id: selectedOrder.id,
          p_status: 'price_quoted',
          p_notes: `Quote submitted: $${quoteData.price.toFixed(2)}`,
          p_changed_by: profile?.id
        })

      if (statusError) {
        console.error('Error updating order status:', statusError)
        toast.error(`Quote submitted but failed to update status: ${statusError.message}`)
        return
      }

      toast.success(`Quote ${selectedOrder.supplier_quotes && selectedOrder.supplier_quotes.length > 0 ? 'updated' : 'submitted'} successfully!`)
      setShowQuoteForm(false)
      setSelectedOrder(null)
      fetchOrders()
    } catch (error) {
      console.error('Error creating quote:', error)
      toast.error('Failed to create quote')
    }
  }

  const handleUpdateQuote = async (quoteData: CreateQuoteRequest) => {
    if (!selectedOrder) return

    console.log('Updating quote with data:', {
      quoteData,
      selectedOrder: selectedOrder.id,
      profile: profile?.id,
      profileRole: profile?.role
    })

    try {
      // Update the existing quote
      const { error: quoteError } = await supabase
        .from('supplier_quotes')
        .update({
          price: quoteData.price,
          notes: quoteData.notes,
        })
        .eq('order_id', selectedOrder.id)
        .eq('supplier_id', profile?.id)

      if (quoteError) {
        console.error('Error updating quote:', quoteError)
        console.error('Quote data:', {
          order_id: selectedOrder.id,
          supplier_id: profile?.id,
          price: quoteData.price,
          notes: quoteData.notes,
        })
        toast.error(`Failed to update quote: ${quoteError.message}`)
        return
      }

      // Calculate customer price with 20% profit margin
      const customerPrice = Math.round(quoteData.price * 1.20 * 100) / 100 // Round to 2 decimal places
      const profit = Math.round((customerPrice - quoteData.price) * 100) / 100 // Round to 2 decimal places
      
      // Convert to strings and parse back to ensure proper decimal formatting
      const supplierPrice = parseFloat(quoteData.price.toFixed(2))
      const finalPrice = parseFloat(customerPrice.toFixed(2))
      const adminMargin = parseFloat(profit.toFixed(2))
      
      // Validate that values are within reasonable limits
      if (finalPrice > 99999999.99) {
        toast.error('Customer price too high. Please contact administrator.')
        return
      }
      
      if (adminMargin > 99999999.99) {
        toast.error('Profit margin too high. Please contact administrator.')
        return
      }
      
      console.log('Calculated values:', {
        supplierPrice: quoteData.price,
        customerPrice,
        profit,
        profitPercentage: ((profit / quoteData.price) * 100).toFixed(2) + '%'
      })

      // Update the order with new pricing
      const updateData = { 
        supplier_price: supplierPrice,
        final_price: finalPrice,
        admin_margin: adminMargin
      }
      

      
      const { data, error: statusError } = await supabase
        .from('orders')
        .update(updateData)
        .eq('id', selectedOrder.id)
        .select()

      if (statusError) {
        console.error('Error updating order pricing:', statusError)
        console.error('Update data:', updateData)
        toast.error(`Quote updated but failed to update pricing: ${statusError.message}`)
        return
      }

      console.log('Successfully updated order pricing:', data)
      setShowEditQuoteForm(false)
      setSelectedOrder(null)
      fetchOrders()
    } catch (error) {
      console.error('Error updating quote:', error)
      toast.error('Failed to update quote')
    }
  }

  const handleOrderSelect = (order: Order) => {
    // Check if supplier already quoted on this order
    const hasQuoted = order.supplier_quotes?.some(
      quote => quote.supplier_id === profile?.id
    )

    if (hasQuoted) {
      toast.error('You have already submitted a quote for this order')
      return
    }

    // Check if order is already assigned to another supplier
    if (order.assigned_supplier_id && order.assigned_supplier_id !== profile?.id) {
      toast.error('This order has already been assigned to another supplier')
      return
    }

    setSelectedOrder(order)
    setShowQuoteForm(true)
  }

  const handleViewOrderDetails = (order: Order) => {
    setSelectedOrder(order)
    setShowOrderDetails(true)
  }

  const handleCloseOrderDetails = () => {
    setShowOrderDetails(false)
    setSelectedOrder(null)
  }

  const handleImageUpload = (order: Order) => {
    setSelectedOrder(order)
    setShowImageUpload(true)
  }

  const handleEditQuote = (order: Order) => {
    setSelectedOrder(order)
    setShowEditQuoteForm(true)
  }

  const handleImageSubmit = async () => {
    if (!selectedOrder || !imageFile) return

    setUploading(true)
    try {
      // Validate file type
      const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp']
      if (!allowedTypes.includes(imageFile.type)) {
        toast.error('Please select a valid image file (JPEG, PNG, GIF, or WebP)')
        return
      }

      // Validate file size (max 5MB)
      const maxSize = 5 * 1024 * 1024 // 5MB
      if (imageFile.size > maxSize) {
        toast.error('Image file size must be less than 5MB')
        return
      }

      // Generate unique filename with folder structure
      const fileExtension = imageFile.name.split('.').pop()?.toLowerCase()
      const fileName = `${selectedOrder.id}/${Date.now()}-${Math.random().toString(36).substring(2)}.${fileExtension}`

      // Try to upload to Supabase Storage
      console.log('Uploading image with filename:', fileName)
      console.log('User profile:', profile)
      
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('order-images')
        .upload(fileName, imageFile, {
          cacheControl: '3600',
          upsert: false
        })

      if (uploadError) {
        console.error('Error uploading image:', uploadError)
        console.error('Upload error details:', {
          message: uploadError.message,
          name: uploadError.name
        })
        
        // Check if it's a bucket not found error
        if (uploadError.message.includes('bucket') || uploadError.message.includes('not found')) {
          toast.error('Storage bucket not configured. Please contact administrator.')
        } else if (uploadError.message.includes('permission') || uploadError.message.includes('unauthorized')) {
          toast.error('Permission denied. Please check your account permissions.')
        } else {
          toast.error(`Upload failed: ${uploadError.message}`)
        }
        return
      }

      // Get the public URL
      const { data: urlData } = supabase.storage
        .from('order-images')
        .getPublicUrl(fileName)

      if (!urlData?.publicUrl) {
        toast.error('Failed to get image URL after upload')
        return
      }

      // Update the order with image URL and move to 'production_started' status
      const { error: updateError } = await supabase
        .from('orders')
        .update({ 
          status: 'production_started',
          supplier_image_url: urlData.publicUrl,
          supplier_completed_at: new Date().toISOString()
        })
        .eq('id', selectedOrder.id)

      if (updateError) {
        console.error('Error updating order:', updateError)
        toast.error('Image uploaded but failed to update order status')
        return
      }

      toast.success('Order completed and moved to In Depo!')
      setShowImageUpload(false)
      setSelectedOrder(null)
      setImageFile(null)
      fetchOrders()
    } catch (error) {
      console.error('Error processing image:', error)
      toast.error('Failed to process image')
    } finally {
      setUploading(false)
    }
  }

  const handleMoveToTransit = async (orderId: string) => {
    setLoading(true)
    try {

      
      const { error } = await supabase
        .rpc('update_order_status', {
          p_order_id: orderId,
          p_status: 'in_transit',
          p_notes: 'Order moved to transit by supplier',
          p_changed_by: profile?.id
        })

      if (error) {
        console.error('Error moving to transit:', error)
        toast.error(`Failed to move order to transit: ${error.message}`)
        return
      }


      toast.success('Order moved to In Transit!')
      fetchOrders()
    } catch (error) {
      console.error('Unexpected error moving to transit:', error)
      toast.error('Failed to move order to transit')
    } finally {
      setLoading(false)
    }
  }

  const handleRevertToDepo = async (orderId: string) => {
    setLoading(true)
    try {

      
      const { error } = await supabase
        .rpc('update_order_status', {
          p_order_id: orderId,
          p_status: 'production_started',
          p_notes: 'Order reverted to depo by supplier',
          p_changed_by: profile?.id
        })

      if (error) {
        console.error('Error reverting to depo:', error)
        toast.error(`Failed to revert order to depo: ${error.message}`)
        return
      }


      toast.success('Order reverted to In Depo!')
      fetchOrders()
    } catch (error) {
      console.error('Unexpected error reverting to depo:', error)
      toast.error('Failed to revert order to depo')
    } finally {
      setLoading(false)
    }
  }

  const handleSignOut = async () => {
    await signOut()
    toast.success('Signed out successfully')
  }

  const getOrdersByStatus = (status: string) => {
    if (status === 'request_created') {
      // For requests, show only unassigned orders (available to all suppliers)
      return orders.filter(order => 
        order.status === status && 
        !order.assigned_supplier_id
      )
    } else {
      // For all other statuses, show only orders assigned to this supplier
      return orders.filter(order => 
        order.status === status && 
        order.assigned_supplier_id === profile?.id
      )
    }
  }

  const getContainerColor = (status: string) => {
    const colors = {
      'request_created': 'bg-blue-50 border-blue-200',
      'price_quoted': 'bg-yellow-50 border-yellow-200',
      'payment_confirmed': 'bg-green-50 border-green-200',
      'production_started': 'bg-purple-50 border-purple-200',
      'in_transit': 'bg-indigo-50 border-indigo-200',
      'delivered': 'bg-gray-50 border-gray-200',
      'canceled': 'bg-red-50 border-red-200'
    }
    return colors[status as keyof typeof colors] || 'bg-gray-50 border-gray-200'
  }

  const getStatusLabel = (status: string) => {
    const labels = {
      'request_created': 'Requests',
      'price_quoted': 'Price Quoted',
      'payment_confirmed': 'Payment Confirmed',
      'production_started': 'In Depo',
      'in_transit': 'In Transit',
      'delivered': 'Delivered',
      'canceled': 'Canceled'
    }
    return labels[status as keyof typeof labels] || status
  }

  const getStatusColor = (status: string) => {
    const colors = {
      'request_created': 'text-blue-600 bg-blue-100',
      'price_quoted': 'text-yellow-600 bg-yellow-100',
      'payment_confirmed': 'text-green-600 bg-green-100',
      'production_started': 'text-purple-600 bg-purple-100',
      'in_transit': 'text-indigo-600 bg-indigo-100',
      'delivered': 'text-green-600 bg-green-100',
      'canceled': 'text-red-600 bg-red-100'
    }
    return colors[status as keyof typeof colors] || 'text-gray-600 bg-gray-100'
  }

  const getStatusCount = (status: string) => {
    return getOrdersByStatus(status).length
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary-600"></div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50">
      {/* Header */}
      <header className="bg-white/80 backdrop-blur-sm shadow-sm border-b border-gray-200">
        <div className="w-full mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-6">
            <div className="flex items-center">
              <Package className="h-8 w-8 text-primary-600 mr-3" />
              <h1 className="text-2xl font-bold text-gray-900">
                Supplier Dashboard
              </h1>
            </div>
            <div className="flex items-center space-x-4">
              <span className="text-sm text-gray-600">
                Welcome, {profile?.full_name}
                {profile?.company_name && ` (${profile.company_name})`}
              </span>
              <button
                onClick={handleSignOut}
                className="btn-secondary flex items-center"
              >
                <LogOut className="h-4 w-4 mr-2" />
                Sign Out
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content - Table Layout */}
      <main className="w-full mx-auto py-6 px-4">
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="mb-6">
            <h2 className="text-lg font-medium text-gray-900 mb-4">Order Management</h2>
            
            {/* Status Filter */}
            <div className="flex items-center space-x-4 mb-6">
              <label htmlFor="status-filter" className="text-sm font-medium text-gray-700">
                Filter by status:
              </label>
              <select
                id="status-filter"
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value as OrderStatus | 'all')}
                className="px-3 py-2 border border-gray-300 rounded-md focus:ring-primary-500 focus:border-primary-500 text-sm"
              >
                <option value="all">All Orders</option>
                <option value="price_quoted">Price Quoted</option>
                <option value="payment_confirmed">Payment Confirmed</option>
                <option value="production_started">In Depo</option>
                <option value="in_transit">In Transit</option>
                <option value="delivered">Delivered</option>
                <option value="canceled">Canceled</option>
              </select>
              <span className="text-sm text-gray-500">
                Showing {filteredOrders.length} of {orders.length - requestOrders.length} orders
              </span>
            </div>
          </div>

          {/* Request Orders Table */}
          {requestOrders.length > 0 && (
            <div className="mb-8">
              <h3 className="text-md font-medium text-gray-900 mb-4">New Requests ({requestOrders.length})</h3>
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-blue-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        #Order
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Product Name
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Description
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Quantity
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Status
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Updated
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {requestOrders.map((order) => (
                      <tr 
                        key={order.id}
                        onClick={() => {
                          setSelectedOrder(order)
                          setShowOrderDetails(true)
                        }}
                        className="hover:bg-gray-50 cursor-pointer"
                      >
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                          {formatOrderNumber(order.order_number)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {formatOrderTitle(order.title)}
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-500 max-w-xs truncate">
                          {order.description}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {order.quantity}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                            Request Created
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {order.updated_at ? new Date(order.updated_at).toLocaleDateString('en-US', {
                            month: 'numeric',
                            day: 'numeric',
                            year: '2-digit',
                            hour: 'numeric',
                            minute: '2-digit'
                          }) : '-'}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Orders Table */}
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    #Order
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Product Name
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Description
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Quantity
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Given Price
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Updated
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredOrders.map((order) => {
                  const currentSupplierQuote = order.supplier_quotes?.find(quote => quote.supplier_id === profile?.id)
                  
                  return (
                    <tr 
                      key={order.id}
                      onClick={() => handleViewOrderDetails(order)}
                      className="hover:bg-gray-50 cursor-pointer transition-colors"
                    >
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                        {formatOrderNumber(order.order_number)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {order.title}
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-500 max-w-xs truncate">
                        {order.description}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {order.quantity}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {currentSupplierQuote ? `$${currentSupplierQuote.price.toFixed(2)}` : '-'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(order.status)}`}>
                          {getStatusLabel(order.status)}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {new Date(order.updated_at).toLocaleString('en-US', {
                          month: 'numeric',
                          day: 'numeric',
                          year: '2-digit',
                          hour: 'numeric',
                          minute: '2-digit',
                          hour12: true
                        })}
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
            
            {filteredOrders.length === 0 && (
              <div className="text-center py-12">
                <Package className="mx-auto h-12 w-12 text-gray-400" />
                <h3 className="mt-2 text-sm font-medium text-gray-900">
                  {statusFilter === 'all' ? 'No orders' : `No ${statusFilter.replace('_', ' ')} orders`}
                </h3>
                <p className="mt-1 text-sm text-gray-500">
                  {statusFilter === 'all' 
                    ? 'You don\'t have any orders assigned to you yet.' 
                    : `No orders with status "${statusFilter.replace('_', ' ')}" found.`
                  }
                </p>
              </div>
            )}
          </div>
        </div>
      </main>

      {/* Quote Form Modal */}
      {showQuoteForm && selectedOrder && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white">
            <div className="mt-3">
              <h3 className="text-lg font-medium text-gray-900 mb-4">
                Submit Quote for Order
              </h3>
              <div className="mb-4 p-3 bg-gray-50 rounded">
                <p className="text-sm text-gray-600">
                  <strong>Order #:</strong> {formatOrderNumber(selectedOrder.order_number)}
                </p>
                <p className="text-sm text-gray-600">
                  <strong>Title:</strong> {selectedOrder.title}
                </p>
                <p className="text-sm text-gray-600">
                  <strong>Description:</strong> {selectedOrder.description}
                </p>
                <p className="text-sm text-gray-600">
                  <strong>Quantity:</strong> {selectedOrder.quantity}
                </p>
              </div>
              <CreateQuoteForm 
                onSubmit={handleCreateQuote}
                onCancel={() => {
                  setShowQuoteForm(false)
                  setSelectedOrder(null)
                }}
              />
            </div>
          </div>
        </div>
      )}

      {/* Edit Quote Form Modal */}
      {showEditQuoteForm && selectedOrder && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white">
            <div className="mt-3">
              <h3 className="text-lg font-medium text-gray-900 mb-4">
                Edit Quote for Order
              </h3>
              <div className="mb-4 p-3 bg-gray-50 rounded">
                <p className="text-sm text-gray-600">
                  <strong>Order #:</strong> {formatOrderNumber(selectedOrder.order_number)}
                </p>
                <p className="text-sm text-gray-600">
                  <strong>Title:</strong> {selectedOrder.title}
                </p>
                <p className="text-sm text-gray-600">
                  <strong>Description:</strong> {selectedOrder.description}
                </p>
                <p className="text-sm text-gray-600">
                  <strong>Quantity:</strong> {selectedOrder.quantity}
                </p>
                {selectedOrder.supplier_quotes?.find(quote => quote.supplier_id === profile?.id) && (
                  <p className="text-sm text-gray-600">
                    <strong>Current Quote:</strong> ${selectedOrder.supplier_quotes.find(quote => quote.supplier_id === profile?.id)?.price.toFixed(2)}
                  </p>
                )}
              </div>
              <CreateQuoteForm 
                onSubmit={handleUpdateQuote}
                onCancel={() => {
                  setShowEditQuoteForm(false)
                  setSelectedOrder(null)
                }}
                initialPrice={selectedOrder.supplier_quotes?.find(quote => quote.supplier_id === profile?.id)?.price}
                initialNotes={selectedOrder.supplier_quotes?.find(quote => quote.supplier_id === profile?.id)?.notes}
              />
            </div>
          </div>
        </div>
      )}

      {/* Image Upload Modal */}
      {showImageUpload && selectedOrder && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white">
            <div className="mt-3">
              <h3 className="text-lg font-medium text-gray-900 mb-4">
                Complete Order & Move to In Depo
              </h3>
              <div className="mb-4 p-3 bg-gray-50 rounded">
                <p className="text-sm text-gray-600">
                  <strong>Order #:</strong> {formatOrderNumber(selectedOrder.order_number)}
                </p>
                <p className="text-sm text-gray-600">
                  <strong>Title:</strong> {selectedOrder.title}
                </p>
                <p className="text-sm text-gray-600">
                  <strong>Description:</strong> {selectedOrder.description}
                </p>
                <p className="text-sm text-gray-600">
                  <strong>Quantity:</strong> {selectedOrder.quantity}
                </p>

              </div>
              
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Upload Order Image
                </label>
                <input
                  type="file"
                  accept="image/jpeg,image/jpg,image/png,image/gif,image/webp"
                  onChange={(e) => setImageFile(e.target.files?.[0] || null)}
                  className="w-full p-2 border border-gray-300 rounded-md"
                />
                <p className="text-xs text-gray-500 mt-1">
                  Supported formats: JPEG, PNG, GIF, WebP (Max size: 5MB)
                </p>
              </div>

              <div className="flex space-x-3">
                <button
                  onClick={handleImageSubmit}
                  disabled={!imageFile || uploading}
                  className="flex-1 bg-green-600 hover:bg-green-700 disabled:bg-gray-400 text-white font-medium py-2 px-4 rounded-md transition-colors"
                >
                  {uploading ? (
                    <span className="flex items-center justify-center">
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                      Processing...
                    </span>
                  ) : (
                    <span className="flex items-center justify-center">
                      <CheckCircle className="h-4 w-4 mr-2" />
                      Complete Order
                    </span>
                  )}
                </button>
                <button
                  onClick={() => {
                    setShowImageUpload(false)
                    setSelectedOrder(null)
                    setImageFile(null)
                  }}
                  className="flex-1 bg-gray-500 hover:bg-gray-600 text-white font-medium py-2 px-4 rounded-md transition-colors"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Order Details Modal */}
      {showOrderDetails && selectedOrder && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-10 mx-auto p-5 border w-11/12 max-w-4xl shadow-lg rounded-md bg-white">
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
                <button
                  onClick={handleCloseOrderDetails}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <X className="h-6 w-6" />
                </button>
              </div>

              {/* Modal Body */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Left Column - Order Information */}
                <div className="space-y-6">
                  {/* Basic Information */}
                  <div className="bg-gray-50 p-4 rounded-lg">
                    <h4 className="text-lg font-medium text-gray-900 mb-4">Order Information</h4>
                    <div className="space-y-3">
                      <div className="flex justify-between">
                        <span className="text-sm text-gray-600">Order Number:</span>
                        <span className="text-sm font-medium text-gray-900">{formatOrderNumber(selectedOrder.order_number)}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-sm text-gray-600">Product Name:</span>
                        <span className="text-sm font-medium text-gray-900">{selectedOrder.title}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-sm text-gray-600">Description:</span>
                        <span className="text-sm font-medium text-gray-900 max-w-xs text-right break-words">{selectedOrder.description}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-sm text-gray-600">Quantity:</span>
                        <span className="text-sm font-medium text-gray-900">{selectedOrder.quantity}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-sm text-gray-600">Status:</span>
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(selectedOrder.status)}`}>
                          {getStatusLabel(selectedOrder.status)}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Pricing Information */}
                  <div className="bg-gray-50 p-4 rounded-lg">
                    <h4 className="text-lg font-medium text-gray-900 mb-4">Pricing</h4>
                    <div className="space-y-3">
                      <div className="flex justify-between">
                        <span className="text-sm text-gray-600">Your Quote:</span>
                        <span className="text-sm font-medium text-gray-900">
                          {selectedOrder.supplier_quotes?.find(q => q.supplier_id === profile?.id)?.price ? 
                            `$${selectedOrder.supplier_quotes.find(q => q.supplier_id === profile?.id)?.price.toFixed(2)}` : 
                            'Not quoted yet'
                          }
                        </span>
                      </div>
                      {selectedOrder.supplier_quotes?.find(q => q.supplier_id === profile?.id)?.notes && (
                        <div className="flex justify-between">
                          <span className="text-sm text-gray-600">Your Notes:</span>
                          <span className="text-sm font-medium text-gray-900 max-w-xs text-right break-words">
                            {selectedOrder.supplier_quotes.find(q => q.supplier_id === profile?.id)?.notes}
                          </span>
                        </div>
                      )}
                    </div>
                  </div>


                </div>

                {/* Right Column - Files and Timeline */}
                <div className="space-y-6">
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

                  {/* Your Uploaded Image */}
                  {selectedOrder.supplier_image_url && (
                    <div className="bg-gray-50 p-4 rounded-lg">
                      <h4 className="text-lg font-medium text-gray-900 mb-4">Your Uploaded Image</h4>
                      <div className="space-y-3">
                        <div className="flex items-center justify-between p-3 bg-white rounded-lg border">
                          <div className="flex items-center space-x-3">
                            <div className="w-8 h-8 bg-purple-100 rounded-lg flex items-center justify-center">
                              <span className="text-purple-600 text-xs font-medium">IMG</span>
                            </div>
                            <div>
                              <p className="text-sm font-medium text-gray-900">Your Image</p>
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
                    </div>
                  )}

                  {/* Timestamps */}
                  <div className="bg-gray-50 p-4 rounded-lg">
                    <h4 className="text-lg font-medium text-gray-900 mb-4">Timeline</h4>
                    <div className="space-y-3">
                      <div className="flex justify-between">
                        <span className="text-sm text-gray-600">Created:</span>
                        <span className="text-sm font-medium text-gray-900">
                          {new Date(selectedOrder.created_at).toLocaleString('en-US', {
                            month: 'numeric',
                            day: 'numeric',
                            year: '2-digit',
                            hour: 'numeric',
                            minute: '2-digit',
                            hour12: true
                          })}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-sm text-gray-600">Last Updated:</span>
                        <span className="text-sm font-medium text-gray-900">
                          {new Date(selectedOrder.updated_at).toLocaleString('en-US', {
                            month: 'numeric',
                            day: 'numeric',
                            year: '2-digit',
                            hour: 'numeric',
                            minute: '2-digit',
                            hour12: true
                          })}
                        </span>
                      </div>
                      {selectedOrder.supplier_completed_at && (
                        <div className="flex justify-between">
                          <span className="text-sm text-gray-600">You Completed:</span>
                          <span className="text-sm font-medium text-gray-900">
                            {new Date(selectedOrder.supplier_completed_at).toLocaleString('en-US', {
                              month: 'numeric',
                              day: 'numeric',
                              year: '2-digit',
                              hour: 'numeric',
                              minute: '2-digit',
                              hour12: true
                            })}
                          </span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>

              {/* Modal Footer */}
              <div className="flex justify-between items-center mt-8">
                <div className="flex space-x-3">
                  {/* Action buttons based on order status */}
                  {selectedOrder.status === 'request_created' && !selectedOrder.supplier_quotes?.find(q => q.supplier_id === profile?.id) && (
                    <button
                      onClick={() => {
                        handleCloseOrderDetails()
                        handleOrderSelect(selectedOrder)
                      }}
                      className="px-4 py-2 text-sm font-medium text-white bg-primary-600 hover:bg-primary-700 rounded-md transition-colors"
                    >
                      Submit Quote
                    </button>
                  )}

                  {selectedOrder.status === 'price_quoted' && selectedOrder.supplier_quotes?.find(q => q.supplier_id === profile?.id) && (
                    <button
                      onClick={() => {
                        handleCloseOrderDetails()
                        handleEditQuote(selectedOrder)
                      }}
                      className="px-4 py-2 text-sm font-medium text-white bg-yellow-600 hover:bg-yellow-700 rounded-md transition-colors"
                    >
                      Edit Quote
                    </button>
                  )}

                  {selectedOrder.status === 'payment_confirmed' && (
                    <button
                      onClick={() => {
                        handleCloseOrderDetails()
                        handleImageUpload(selectedOrder)
                      }}
                      className="px-4 py-2 text-sm font-medium text-white bg-green-600 hover:bg-green-700 rounded-md transition-colors flex items-center"
                    >
                      <Upload className="h-4 w-4 mr-2" />
                      Add Image & Complete
                    </button>
                  )}

                  {selectedOrder.status === 'production_started' && (
                    <button
                      onClick={() => {
                        handleCloseOrderDetails()
                        handleMoveToTransit(selectedOrder.id)
                      }}
                      className="px-4 py-2 text-sm font-medium text-white bg-purple-600 hover:bg-purple-700 rounded-md transition-colors"
                    >
                      Move to Transit
                    </button>
                  )}

                  {selectedOrder.status === 'in_transit' && (
                    <button
                      onClick={() => {
                        handleCloseOrderDetails()
                        handleRevertToDepo(selectedOrder.id)
                      }}
                      className="px-4 py-2 text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 rounded-md transition-colors"
                    >
                      Revert to Depo
                    </button>
                  )}
                </div>

                <button
                  onClick={handleCloseOrderDetails}
                  className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-md transition-colors"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

// Order Card Component for the Trello-style layout
interface OrderCardProps {
  order: Order
  onViewDetails?: (order: Order) => void
  currentSupplierId?: string
}

function OrderCard({ order, onViewDetails, currentSupplierId }: OrderCardProps) {
  const currentSupplierQuote = order.supplier_quotes?.find(quote => quote.supplier_id === currentSupplierId)
  const hasQuoted = currentSupplierQuote !== undefined
  const isAssignedToOther = order.assigned_supplier_id && order.assigned_supplier_id !== currentSupplierId

  return (
    <div 
      className={`bg-white rounded-lg shadow-sm border p-4 transition-shadow cursor-pointer ${
        isAssignedToOther 
          ? 'border-gray-300 bg-gray-50 opacity-75' 
          : 'border-gray-200 hover:shadow-md'
      }`}
      onClick={() => onViewDetails && onViewDetails(order)}
    >
      <div className="mb-3">
        <h4 className="font-medium text-gray-900 text-sm mb-2 line-clamp-2">
          {formatOrderTitle(order.order_number, order.title)}
        </h4>
        <p className="text-gray-600 text-xs line-clamp-2">
          {order.description}
        </p>
      </div>
      
      <div className="space-y-2 mb-3">
        <div className="flex justify-between text-xs">
          <span className="text-gray-500">Qty:</span>
          <span className="font-medium">{order.quantity}</span>
        </div>
        {currentSupplierQuote && (
          <div className="flex justify-between text-xs">
            <span className="text-gray-500">Your Quote:</span>
            <span className="font-medium text-blue-600">${currentSupplierQuote.price.toFixed(2)}</span>
          </div>
        )}

        {order.supplier_image_url && (
          <div className="flex justify-between text-xs">
            <span className="text-gray-500">Image:</span>
            <span className="font-medium text-blue-600 flex items-center">
              <ImageIcon className="h-3 w-3 mr-1" />
              Added
            </span>
          </div>
        )}
      </div>

      {/* Order Files */}
      {order.uploaded_files && order.uploaded_files.length > 0 && (
        <div className="mb-3">
          <OrderFiles files={order.uploaded_files} />
        </div>
      )}

      {hasQuoted && (
        <div className="text-xs text-green-600 font-medium text-center py-2">
          Quote Submitted
        </div>
      )}

      {isAssignedToOther && (
        <div className="text-xs text-orange-600 font-medium text-center py-2 bg-orange-50 rounded">
          Assigned to Another Supplier
        </div>
      )}
    </div>
  )
}
