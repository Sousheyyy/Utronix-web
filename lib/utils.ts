import { type ClassValue, clsx } from 'clsx'
import { twMerge } from 'tailwind-merge'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
  }).format(amount)
}

export function formatDate(date: string | Date): string {
  return new Intl.DateTimeFormat('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  }).format(new Date(date))
}

export function formatDateTime(date: string | Date): string {
  return new Intl.DateTimeFormat('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(new Date(date))
}

export function generateOrderNumber(): string {
  const timestamp = Date.now().toString(36)
  const random = Math.random().toString(36).substr(2, 5)
  return `ORD-${timestamp}-${random}`.toUpperCase()
}

export function getStatusColor(status: string): string {
  const statusColors: Record<string, string> = {
    request_created: 'text-blue-600 bg-blue-100',
    price_quoted: 'text-yellow-600 bg-yellow-100',
    payment_pending: 'text-orange-600 bg-orange-100',
    payment_confirmed: 'text-green-600 bg-green-100',
    production_started: 'text-purple-600 bg-purple-100',
    in_transit: 'text-indigo-600 bg-indigo-100',
    in_customs: 'text-red-600 bg-red-100',
    delivered: 'text-green-600 bg-green-100',
  }
  return statusColors[status] || 'text-gray-600 bg-gray-100'
}

export function getStatusLabel(status: string): string {
  return status.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase())
}

export function calculateProfitMargin(supplierPrice: number, finalPrice: number): number {
  if (supplierPrice <= 0) return 0
  return ((finalPrice - supplierPrice) / supplierPrice) * 100
}

export function validateEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  return emailRegex.test(email)
}

export function validatePassword(password: string): boolean {
  return password.length >= 6
}

export function debounce<T extends (...args: any[]) => any>(
  func: T,
  wait: number
): (...args: Parameters<T>) => void {
  let timeout: NodeJS.Timeout
  return (...args: Parameters<T>) => {
    clearTimeout(timeout)
    timeout = setTimeout(() => func(...args), wait)
  }
}
