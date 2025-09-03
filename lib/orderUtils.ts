// Utility functions for order numbering and formatting

/**
 * Formats an order number for display
 * @param orderNumber - The order number to format
 * @returns Formatted order number string
 */
export function formatOrderNumber(orderNumber?: number): string {
  if (!orderNumber) return 'N/A'
  return `#${orderNumber}`
}

/**
 * Formats an order title with order number
 * @param orderNumber - The order number
 * @param title - The order title
 * @returns Formatted title with order number
 */
export function formatOrderTitle(orderNumber?: number, title?: string): string {
  if (!orderNumber) return title || 'Untitled Order'
  return `#${orderNumber} - ${title || 'Untitled Order'}`
}

/**
 * Extracts order number from search term
 * @param searchTerm - The search term
 * @returns The order number if found, null otherwise
 */
export function extractOrderNumberFromSearch(searchTerm: string): number | null {
  // Remove # symbol and try to parse as number
  const cleaned = searchTerm.replace('#', '').trim()
  const number = parseInt(cleaned, 10)
  return isNaN(number) ? null : number
}

/**
 * Checks if a search term matches an order number
 * @param searchTerm - The search term
 * @param orderNumber - The order number to check against
 * @returns True if the search term matches the order number
 */
export function matchesOrderNumber(searchTerm: string, orderNumber?: number): boolean {
  if (!orderNumber) return false
  
  const searchNumber = extractOrderNumberFromSearch(searchTerm)
  if (searchNumber !== null) {
    return orderNumber === searchNumber
  }
  
  // Also check if the order number contains the search term as a string
  return orderNumber.toString().includes(searchTerm)
}
