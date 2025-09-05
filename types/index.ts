export type UserRole = 'customer' | 'supplier' | 'admin'

export type OrderStatus = 
  | 'admin_review'
  | 'request_created'
  | 'price_quoted'
  | 'payment_confirmed'
  | 'production_started'
  | 'in_transit'
  | 'delivered'
  | 'canceled'

export interface Profile {
  id: string
  email: string
  full_name: string
  role: UserRole
  company_name?: string
  phone?: string
  address?: string
  created_at: string
  updated_at: string
}

export interface UploadedFile {
  id: string
  name: string
  size: number
  type: string
  url: string
  uploaded_at: string
}

export interface Order {
  id: string
  order_number?: number
  customer_id: string
  title: string
  description: string
  quantity: number
  product_link?: string
  delivery_address?: string
  phone_number?: string
  status: OrderStatus
  supplier_price?: number
  admin_margin?: number
  final_price?: number
  payment_reference?: string
  payment_confirmed_at?: string
  supplier_image_url?: string
  supplier_completed_at?: string
  assigned_supplier_id?: string
  uploaded_files?: UploadedFile[]
  files_uploaded_at?: string
  created_at: string
  updated_at: string
  customer?: Profile
  supplier_quotes?: SupplierQuote[]
  order_status_history?: OrderStatusHistory[]
}

export interface SupplierQuote {
  id: string
  order_id: string
  supplier_id: string
  price: number
  notes?: string
  created_at: string
  supplier?: Profile
  order?: Order
}

export interface OrderStatusHistory {
  id: string
  order_id: string
  status: OrderStatus
  notes?: string
  changed_by: string
  created_at: string
  changed_by_profile?: Profile
}

export interface PaymentTransaction {
  id: string
  order_id: string
  amount: number
  reference_code: string
  transaction_id?: string
  status: string
  confirmed_at?: string
  created_at: string
  order?: Order
}

export interface CreateOrderRequest {
  title: string
  description: string
  quantity: number
  product_link?: string
  delivery_address?: string
  phone_number?: string
  files?: File[]
}

export interface CreateQuoteRequest {
  order_id: string
  price: number
  notes?: string
}

export interface UpdateOrderStatusRequest {
  order_id: string
  status: OrderStatus
  notes?: string
}

export interface SetFinalPriceRequest {
  order_id: string
  admin_margin: number
}

export interface PaymentConfirmationRequest {
  order_id: string
  transaction_id: string
  amount: number
}

export interface SavedAddress {
  id: string
  customer_id: string
  name: string
  address: string
  phone?: string
  created_at: string
  updated_at: string
}
