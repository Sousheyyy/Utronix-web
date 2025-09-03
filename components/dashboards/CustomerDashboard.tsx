'use client'

import { useState, useEffect } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import { supabase } from '@/lib/supabase'
import { Order, CreateOrderRequest, OrderStatus } from '@/types'
import { CreateOrderForm } from '../orders/CreateOrderForm'
import { OrderList } from '../orders/OrderList'
import { OrderStepsInfo } from '../orders/OrderStepsInfo'
import { FileUpload } from '../orders/FileUpload'
import { FileUploadService } from '@/lib/fileUploadService'
import { LogOut, Plus, Package, Settings, ShoppingCart, Clock, Edit, X, Trash2 } from 'lucide-react'
import { toast } from 'react-hot-toast'

export function CustomerDashboard() {
  const { profile, signOut } = useAuth()
  const [orders, setOrders] = useState<Order[]>([])
  const [loading, setLoading] = useState(true)
  const [showCreateForm, setShowCreateForm] = useState(false)
  const [editModalOpen, setEditModalOpen] = useState(false)
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null)
  const [editForm, setEditForm] = useState({
    title: '',
    description: '',
    quantity: 1,
    product_link: '',
    delivery_address: '',
    phone_number: '',
  })
  const [editFiles, setEditFiles] = useState<File[]>([])
  const [cancelModalOpen, setCancelModalOpen] = useState(false)
  const [orderToCancel, setOrderToCancel] = useState<Order | null>(null)
  const [statusFilter, setStatusFilter] = useState<OrderStatus | 'all'>('all')

  // Filter orders based on selected status
  const filteredOrders = statusFilter === 'all' 
    ? orders 
    : orders.filter(order => order.status === statusFilter)

  useEffect(() => {
    fetchOrders()

    // Set up real-time subscription for order updates
    const channel = supabase
      .channel('orders_changes')
      .on('postgres_changes', 
        { 
          event: '*', 
          schema: 'public', 
          table: 'orders',
          filter: `customer_id=eq.${profile?.id}`
        }, 
        (payload) => {
          console.log('Real-time update received:', payload)
          // Refresh orders when any order changes for this customer
          fetchOrders()
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [profile?.id])

  const fetchOrders = async () => {
    try {
      const { data, error } = await supabase
        .from('orders')
        .select(`
          *,
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
          )
        `)
        .eq('customer_id', profile?.id)
        .order('created_at', { ascending: false })

      if (error) {
        console.error('Error fetching orders:', error)
        toast.error('Failed to fetch orders')
        return
      }


      setOrders(data || [])
    } catch (error) {
      console.error('Error fetching orders:', error)
      toast.error('Failed to fetch orders')
    } finally {
      setLoading(false)
    }
  }

  const handleCreateOrder = async (orderData: CreateOrderRequest) => {
    try {
      console.log('Creating order with data:', orderData)
      console.log('Profile ID:', profile?.id)
      
      if (!profile?.id) {
        throw new Error('User profile not found. Please try logging in again.')
      }
      
      const { data, error } = await supabase
        .from('orders')
        .insert([{
          customer_id: profile?.id,
          title: orderData.title,
          description: orderData.description,
          quantity: orderData.quantity,
          product_link: orderData.product_link || null,
          delivery_address: orderData.delivery_address || null,
          phone_number: orderData.phone_number || null,
        }])
        .select()
        .single()

      if (error) {
        console.error('Error creating order:', error)
        toast.error(`Failed to create order: ${error.message}`)
        throw error // This will cause the onSubmit promise to reject
      }

      // Upload files if any
      if (orderData.files && orderData.files.length > 0) {
        try {
          const uploadedFiles = await FileUploadService.uploadFiles(orderData.files, data.id)
          
          // Update order with uploaded files information
          const { error: updateError } = await supabase
            .from('orders')
            .update({
              uploaded_files: uploadedFiles,
              files_uploaded_at: new Date().toISOString()
            })
            .eq('id', data.id)

          if (updateError) {
            console.error('Error updating order with files:', updateError)
            toast.error('Order created but failed to save file information')
          } else {
            toast.success(`Order created successfully with ${uploadedFiles.length} file(s)`)
          }
        } catch (fileError) {
          console.error('Error uploading files:', fileError)
          toast.error('Order created but failed to upload files')
        }
      } else {
        toast.success('Order created successfully')
      }

      setShowCreateForm(false)
      fetchOrders()
    } catch (error) {
      console.error('Error creating order:', error)
      toast.error('Failed to create order')
    }
  }

  const handleSignOut = async () => {
    await signOut()
    toast.success('Signed out successfully')
  }

  const canEditOrder = (order: Order) => {
    return order.status === 'request_created' || order.status === 'price_quoted'
  }

  const canCancelOrder = (order: Order) => {
    return order.status === 'request_created' || order.status === 'price_quoted'
  }

  const handleEditOrder = (order: Order) => {
    if (!canEditOrder(order)) {
      toast.error('This order cannot be edited at this stage')
      return
    }
    
    setSelectedOrder(order)
    setEditForm({
      title: order.title,
      description: order.description,
      quantity: order.quantity,
      product_link: order.product_link || '',
      delivery_address: order.delivery_address || '',
      phone_number: order.phone_number || '',
    })
    setEditFiles([]) // Reset files for new edit session
    setEditModalOpen(true)
  }

  const handleEditFormChange = (field: string, value: string) => {
    setEditForm(prev => ({
      ...prev,
      [field]: field === 'quantity' ? parseInt(value) || 1 : value
    }))
  }

  const handleEditSubmit = async () => {
    if (!selectedOrder) return



    try {
      // Validate form
      if (!editForm.title || !editForm.description || !editForm.delivery_address || !editForm.phone_number) {
        toast.error('Please fill in all required fields')
        return
      }

      const quantity = parseInt(editForm.quantity.toString())
      if (isNaN(quantity) || quantity < 1) {
        toast.error('Quantity must be a valid positive number')
        return
      }

      // Handle file uploads if there are new files
      let uploadedFiles = selectedOrder.uploaded_files || []
      if (editFiles.length > 0) {
        try {
          const newFiles = await FileUploadService.uploadFiles(editFiles, selectedOrder.id)
          uploadedFiles = [...uploadedFiles, ...newFiles]
        } catch (uploadError) {
          console.error('Error uploading files:', uploadError)
          toast.error('Failed to upload files')
          return
        }
      }

      // Update order in database
      const { error } = await supabase
        .from('orders')
        .update({
          title: editForm.title,
          description: editForm.description,
          quantity: quantity,
          product_link: editForm.product_link || null,
          delivery_address: editForm.delivery_address || null,
          phone_number: editForm.phone_number || null,
          uploaded_files: uploadedFiles,
          files_uploaded_at: editFiles.length > 0 ? new Date().toISOString() : selectedOrder.files_uploaded_at,
          supplier_price: null, // Reset supplier price when customer makes changes
          final_price: null, // Reset final price to pending when customer makes changes
          admin_margin: null, // Reset admin margin when customer makes changes
          updated_at: new Date().toISOString()
        })
        .eq('id', selectedOrder.id)

      // If the order was previously quoted, delete the old quotes and reset pricing
      if (selectedOrder.status === 'price_quoted' && selectedOrder.supplier_quotes && selectedOrder.supplier_quotes.length > 0) {
        // Delete all supplier quotes for this order
        const { error: deleteQuotesError } = await supabase
          .from('supplier_quotes')
          .delete()
          .eq('order_id', selectedOrder.id)

        if (deleteQuotesError) {
          console.error('Error deleting old quotes:', deleteQuotesError)
          toast.error('Failed to delete old quotes')
          return
        }
      }

      // Update status using the proper function to record in history
      if (!error) {
        const { error: statusError } = await supabase
          .rpc('update_order_status', {
            p_order_id: selectedOrder.id,
            p_status: 'request_created',
            p_notes: 'Order updated by customer - status reset to request created, old quotes removed',
            p_changed_by: profile?.id
          })

        if (statusError) {
          console.error('Error updating order status:', statusError)
          toast.error('Failed to update order status')
          return
        }
      }

      if (error) {
        console.error('Error updating order:', error)
        toast.error('Failed to update order')
        return
      }

      toast.success('Order updated successfully. Status reset to "Request Created", old quotes removed, and pricing reset for supplier review.')
      setEditModalOpen(false)
      setSelectedOrder(null)
      setEditFiles([])
      fetchOrders()
    } catch (error) {
      console.error('Error updating order:', error)
      toast.error('Failed to update order')
    }
  }

  const handleCloseEditModal = () => {
    setEditModalOpen(false)
    setSelectedOrder(null)
    setEditForm({
      title: '',
      description: '',
      quantity: 1,
      product_link: '',
      delivery_address: '',
      phone_number: '',
    })
    setEditFiles([])
  }

  const handleCancelOrder = (order: Order) => {
    if (!canCancelOrder(order)) {
      toast.error('This order cannot be cancelled at this stage')
      return
    }
    
    setOrderToCancel(order)
    setCancelModalOpen(true)
  }

  const handleConfirmCancel = async () => {
    if (!orderToCancel) return

    try {
      console.log('Cancelling order:', orderToCancel.id, 'Current status:', orderToCancel.status)
      console.log('Order customer_id:', orderToCancel.customer_id)
      console.log('Current user ID:', profile?.id)
      console.log('Customer IDs match:', orderToCancel.customer_id === profile?.id)
      
      // First, let's test if we can find the order by ID
      const { data: testData, error: testError } = await supabase
        .from('orders')
        .select('id, title, status, customer_id')
        .eq('id', orderToCancel.id)
        .single()
      

      
      // Update order status to canceled using the proper function
      const { error } = await supabase
        .rpc('update_order_status', {
          p_order_id: orderToCancel.id,
          p_status: 'canceled',
          p_notes: 'Order cancelled by customer',
          p_changed_by: profile?.id
        })

      if (error) {
        console.error('Error cancelling order:', error)
        console.error('Error details:', error.message, error.code, error.details)
        toast.error(`Failed to cancel order: ${error.message}`)
        return
      }

      console.log('Order canceled successfully')

      toast.success('Order cancelled successfully')
      setCancelModalOpen(false)
      setOrderToCancel(null)
      
      // Force refresh the orders
      console.log('Refreshing orders after cancellation...')
      await fetchOrders()
    } catch (error) {
      console.error('Error cancelling order:', error)
      toast.error('Failed to cancel order')
    }
  }

  const handleCloseCancelModal = () => {
    setCancelModalOpen(false)
    setOrderToCancel(null)
  }

  const getTotalOrders = () => {
    return orders.length
  }

  const getPendingOrders = () => {
    return orders.filter(order => 
      order.status === 'request_created' || 
      order.status === 'price_quoted' || 
      order.status === 'payment_pending'
    ).length
  }

  const getCompletedOrders = () => {
    return orders.filter(order => 
      order.status === 'delivered'
    ).length
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
      <header className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-6">
            <div className="flex items-center">
              <Settings className="h-8 w-8 text-primary-600 mr-3" />
              <h1 className="text-2xl font-bold text-gray-900">
                Customer Portal
              </h1>
            </div>
            <div className="flex items-center space-x-4">
              <span className="text-sm text-gray-600">
                {profile?.full_name}
              </span>
              <span className="inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-green-100 text-green-800">
                Customer
              </span>
              <button
                onClick={handleSignOut}
                className="btn-secondary flex items-center"
              >
                <LogOut className="h-4 w-4 mr-2" />
                Logout
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8">
        {/* Statistics Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
          <div className="bg-white overflow-hidden shadow rounded-lg">
            <div className="p-5">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <ShoppingCart className="h-6 w-6 text-gray-400" />
                </div>
                <div className="ml-5 w-0 flex-1">
                  <dl>
                    <dt className="text-sm font-medium text-gray-500 truncate">
                      Total Orders
                    </dt>
                    <dd className="text-lg font-medium text-gray-900">
                      {getTotalOrders()}
                    </dd>
                  </dl>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-white overflow-hidden shadow rounded-lg">
            <div className="p-5">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <Clock className="h-6 w-6 text-gray-400" />
                </div>
                <div className="ml-5 w-0 flex-1">
                  <dl>
                    <dt className="text-sm font-medium text-gray-500 truncate">
                      Pending Orders
                    </dt>
                    <dd className="text-lg font-medium text-gray-900">
                      {getPendingOrders()}
                    </dd>
                  </dl>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-white overflow-hidden shadow rounded-lg">
            <div className="p-5">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <Package className="h-6 w-6 text-gray-400" />
                </div>
                <div className="ml-5 w-0 flex-1">
                  <dl>
                    <dt className="text-sm font-medium text-gray-500 truncate">
                      Completed Orders
                    </dt>
                    <dd className="text-lg font-medium text-gray-900">
                      {getCompletedOrders()}
                    </dd>
                  </dl>
                </div>
              </div>
            </div>
          </div>


        </div>

        {/* Order Steps Information */}
        <OrderStepsInfo />

        {/* Main Content Area */}
        <div className="bg-white shadow rounded-lg">
          <div className="px-4 py-5 sm:p-6">


                         {/* Orders Section */}
             <div>
               <div className="flex items-center justify-between mb-4">
                 <button
                   onClick={() => setShowCreateForm(true)}
                   className="bg-green-600 hover:bg-green-700 text-white font-medium py-2 px-4 rounded-md transition-colors flex items-center"
                 >
                   <Plus className="h-4 w-4 mr-2" />
                   New Order
                 </button>
                 
                 {/* Status Filter */}
                 <div className="flex items-center space-x-3">
                   <label htmlFor="status-filter" className="text-sm font-medium text-gray-700">
                     Filter by status:
                   </label>
                   <select
                     id="status-filter"
                     value={statusFilter}
                     onChange={(e) => setStatusFilter(e.target.value as OrderStatus | 'all')}
                     className="px-3 py-1 border border-gray-300 rounded-md text-sm focus:ring-primary-500 focus:border-primary-500"
                   >
                     <option value="all">All Orders</option>
                     <option value="request_created">Request Created</option>
                     <option value="price_quoted">Price Quoted</option>
                     <option value="payment_pending">Payment Pending</option>
                     <option value="payment_confirmed">Payment Confirmed</option>
                     <option value="production_started">Production Started</option>
                     <option value="in_transit">In Transit</option>
                     <option value="in_customs">In Customs</option>
                     <option value="delivered">Delivered</option>
                     <option value="canceled">Canceled</option>
                   </select>
                   
                   {statusFilter !== 'all' && (
                     <button
                       onClick={() => setStatusFilter('all')}
                       className="px-2 py-1 text-xs text-gray-600 hover:text-gray-800 underline"
                     >
                       Clear Filter
                     </button>
                   )}
                 </div>
               </div>
               
               {/* Order Count */}
               <div className="mb-4">
                 <p className="text-sm text-gray-600">
                   Showing {filteredOrders.length} of {orders.length} orders
                   {statusFilter !== 'all' && ` (filtered by ${statusFilter.replace('_', ' ')})`}
                 </p>
               </div>
               
               <OrderList 
                 orders={filteredOrders} 
                 userRole="customer"
                 onOrderUpdate={fetchOrders}
                 onEditOrder={handleEditOrder}
                 onCancelOrder={handleCancelOrder}
               />
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
                  <p className="text-sm text-blue-600 font-medium">
                    ✏️ Edit your order details
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
                {/* Product Title */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Product Title *
                  </label>
                  <input
                    type="text"
                    value={editForm.title}
                    onChange={(e) => handleEditFormChange('title', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-primary-500 focus:border-primary-500"
                    placeholder="Enter product title"
                  />
                </div>

                {/* Description */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Description *
                  </label>
                  <textarea
                    rows={4}
                    value={editForm.description}
                    onChange={(e) => handleEditFormChange('description', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-primary-500 focus:border-primary-500"
                    placeholder="Describe your product requirements in detail"
                  />
                </div>

                {/* Product Link */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Product Link (Optional)
                  </label>
                  <input
                    type="url"
                    value={editForm.product_link}
                    onChange={(e) => handleEditFormChange('product_link', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-primary-500 focus:border-primary-500"
                    placeholder="https://example.com/product"
                  />
                </div>

                {/* Quantity */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Quantity *
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

                {/* Delivery Address */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Delivery Address *
                  </label>
                  <textarea
                    rows={3}
                    value={editForm.delivery_address}
                    onChange={(e) => handleEditFormChange('delivery_address', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-primary-500 focus:border-primary-500"
                    placeholder="Enter your complete delivery address"
                  />
                </div>

                {/* Phone Number */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Phone Number *
                  </label>
                  <input
                    type="tel"
                    value={editForm.phone_number}
                    onChange={(e) => handleEditFormChange('phone_number', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-primary-500 focus:border-primary-500"
                    placeholder="Enter your phone number"
                  />
                </div>

                {/* File Upload */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Additional Files (Optional)
                  </label>
                  <FileUpload
                    files={editFiles}
                    onFilesChange={setEditFiles}
                    maxSize={16 * 1024 * 1024} // 16MB
                    acceptedTypes={['image/png', 'image/jpeg', 'image/jpg', 'application/zip', 'application/pdf']}
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    Upload PNG, JPG, ZIP, or PDF files (max 16MB each)
                  </p>
                </div>
              </div>

              {/* Modal Footer */}
              <div className="flex justify-end space-x-3 mt-6">
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
      )}

      {/* Cancel Order Confirmation Modal */}
      {cancelModalOpen && orderToCancel && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white">
            <div className="mt-3">
              {/* Modal Header */}
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h3 className="text-lg font-medium text-gray-900">
                    Cancel Order
                  </h3>
                  <p className="text-sm text-red-600 font-medium">
                    ⚠️ This action cannot be undone
                  </p>
                </div>
                <button
                  onClick={handleCloseCancelModal}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <X className="h-6 w-6" />
                </button>
              </div>

              {/* Modal Body */}
              <div className="mb-6">
                <p className="text-sm text-gray-600 mb-4">
                  Are you sure you want to cancel this order?
                </p>
                
                <div className="bg-gray-50 p-4 rounded-lg">
                  <h4 className="font-medium text-gray-900 mb-2">{orderToCancel.title}</h4>
                  <p className="text-sm text-gray-600 mb-2">{orderToCancel.description}</p>
                  <div className="text-sm text-gray-500">
                    <span className="font-medium">Quantity:</span> {orderToCancel.quantity}
                  </div>
                </div>
                
                <p className="text-sm text-gray-600 mt-4">
                  Once cancelled, this order cannot be restored and you will need to create a new order if you change your mind.
                </p>
              </div>

              {/* Modal Footer */}
              <div className="flex justify-end space-x-3">
                <button
                  onClick={handleCloseCancelModal}
                  className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-md transition-colors"
                >
                  Keep Order
                </button>
                <button
                  onClick={handleConfirmCancel}
                  className="px-4 py-2 text-sm font-medium text-white bg-red-600 hover:bg-red-700 rounded-md transition-colors flex items-center"
                >
                  <Trash2 className="h-4 w-4 mr-2" />
                  Cancel Order
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Create Order Modal */}
      {showCreateForm && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-5 border w-full max-w-2xl shadow-lg rounded-md bg-white">
            <div className="mt-3">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-medium text-gray-900">
                  Create New Order
                </h3>
                <button
                  onClick={() => setShowCreateForm(false)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <X className="h-6 w-6" />
                </button>
              </div>
              
              <CreateOrderForm 
                onSubmit={handleCreateOrder}
                onCancel={() => setShowCreateForm(false)}
              />
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
