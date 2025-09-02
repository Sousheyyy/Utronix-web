import { supabase } from './supabase'
import { createAdminClient } from './supabase'

interface PaymentTransaction {
  order_id: string
  amount: number
  reference_code: string
  transaction_id: string
}

export class PaymentService {
  private static instance: PaymentService
  private isMonitoring: boolean = false
  private monitoringInterval: NodeJS.Timeout | null = null

  private constructor() {}

  static getInstance(): PaymentService {
    if (!PaymentService.instance) {
      PaymentService.instance = new PaymentService()
    }
    return PaymentService.instance
  }

  /**
   * Start monitoring for incoming payments
   */
  async startMonitoring(): Promise<void> {
    if (this.isMonitoring) {
      console.log('Payment monitoring is already active')
      return
    }

    this.isMonitoring = true
    console.log('Starting payment monitoring...')

    // Check for payments every 5 minutes
    this.monitoringInterval = setInterval(async () => {
      await this.checkForNewPayments()
    }, 5 * 60 * 1000)

    // Initial check
    await this.checkForNewPayments()
  }

  /**
   * Stop monitoring for payments
   */
  stopMonitoring(): void {
    if (this.monitoringInterval) {
      clearInterval(this.monitoringInterval)
      this.monitoringInterval = null
    }
    this.isMonitoring = false
    console.log('Payment monitoring stopped')
  }

  /**
   * Check for new payments from the financial API
   */
  private async checkForNewPayments(): Promise<void> {
    try {
      // This would integrate with your financial API
      // For now, we'll simulate checking for payments
      const newPayments = await this.fetchNewPaymentsFromAPI()
      
      for (const payment of newPayments) {
        await this.processPayment(payment)
      }
    } catch (error) {
      console.error('Error checking for new payments:', error)
    }
  }

  /**
   * Fetch new payments from the financial API
   * This is a placeholder - implement with your actual financial API
   */
  private async fetchNewPaymentsFromAPI(): Promise<PaymentTransaction[]> {
    // TODO: Implement actual financial API integration
    // Example implementation:
    /*
    const response = await fetch(process.env.FINANCIAL_API_URL + '/transactions', {
      headers: {
        'Authorization': `Bearer ${process.env.FINANCIAL_API_KEY}`,
        'Content-Type': 'application/json'
      }
    })
    
    if (!response.ok) {
      throw new Error('Failed to fetch transactions from financial API')
    }
    
    const transactions = await response.json()
    return transactions.filter(t => t.status === 'completed' && !t.processed)
    */
    
    // For now, return empty array
    return []
  }

  /**
   * Process a received payment
   */
  private async processPayment(payment: PaymentTransaction): Promise<void> {
    try {
      // Find the order by reference code
      const { data: order, error: orderError } = await supabase
        .from('orders')
        .select('*')
        .eq('payment_reference', payment.reference_code)
        .single()

      if (orderError || !order) {
        console.error('Order not found for payment reference:', payment.reference_code)
        return
      }

      // Verify payment amount matches order final price
      if (Math.abs(payment.amount - (order.final_price || 0)) > 0.01) {
        console.error('Payment amount mismatch for order:', order.id)
        return
      }

      // Record the payment transaction
      const { error: transactionError } = await supabase
        .from('payment_transactions')
        .insert([{
          order_id: order.id,
          amount: payment.amount,
          reference_code: payment.reference_code,
          transaction_id: payment.transaction_id,
          status: 'confirmed',
          confirmed_at: new Date().toISOString()
        }])

      if (transactionError) {
        console.error('Error recording payment transaction:', transactionError)
        return
      }

      // Update order status to payment confirmed
      const { error: updateError } = await supabase
        .from('orders')
        .update({
          status: 'payment_confirmed',
          payment_confirmed_at: new Date().toISOString()
        })
        .eq('id', order.id)

      if (updateError) {
        console.error('Error updating order status:', updateError)
        return
      }

      // Add to status history
      const adminClient = createAdminClient()
      await adminClient.rpc('update_order_status', {
        p_order_id: order.id,
        p_status: 'payment_confirmed',
        p_notes: `Payment confirmed via ${payment.transaction_id}`,
        p_changed_by: null // System update
      })

      console.log(`Payment confirmed for order ${order.id}: $${payment.amount}`)
    } catch (error) {
      console.error('Error processing payment:', error)
    }
  }

  /**
   * Generate a unique payment reference for an order
   */
  async generatePaymentReference(orderId: string): Promise<string> {
    const reference = `UTX-${Date.now()}-${Math.random().toString(36).substr(2, 9).toUpperCase()}`
    
    // Update the order with the payment reference
    const { error } = await supabase
      .from('orders')
      .update({ payment_reference: reference })
      .eq('id', orderId)

    if (error) {
      throw new Error('Failed to generate payment reference')
    }

    return reference
  }

  /**
   * Get payment instructions for a customer
   */
  getPaymentInstructions(paymentReference: string, amount: number): string {
    return `
Payment Instructions:
Amount: $${amount.toFixed(2)}
Reference: ${paymentReference}

Please transfer the amount to our bank account:
Bank: [Your Bank Name]
IBAN: [Your IBAN]
Account Holder: [Your Company Name]

IMPORTANT: Include the reference code "${paymentReference}" in the transfer description to ensure proper processing.

Your order will be processed automatically once payment is confirmed.
    `.trim()
  }

  /**
   * Check payment status for an order
   */
  async getPaymentStatus(orderId: string): Promise<{
    status: 'pending' | 'confirmed' | 'failed'
    amount?: number
    confirmed_at?: string
    transaction_id?: string
  }> {
    const { data, error } = await supabase
      .from('payment_transactions')
      .select('*')
      .eq('order_id', orderId)
      .order('created_at', { ascending: false })
      .limit(1)

    if (error || !data || data.length === 0) {
      return { status: 'pending' }
    }

    const transaction = data[0]
    return {
      status: transaction.status as 'pending' | 'confirmed' | 'failed',
      amount: transaction.amount,
      confirmed_at: transaction.confirmed_at,
      transaction_id: transaction.transaction_id
    }
  }
}

export const paymentService = PaymentService.getInstance()
