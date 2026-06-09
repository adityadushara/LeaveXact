import { format, isValid, parseISO } from 'date-fns'

/**
 * Safely format a date string or Date object
 * Returns a fallback string if the date is invalid
 */
export function safeFormatDate(
  dateValue: string | Date | null | undefined,
  formatString: string,
  fallback: string = 'Invalid Date'
): string {
  if (!dateValue) return fallback

  try {
    let date: Date
    
    if (typeof dateValue === 'string') {
      // Try parsing as ISO string first, then as regular Date
      date = dateValue.includes('T') ? parseISO(dateValue) : new Date(dateValue)
    } else {
      date = dateValue
    }
    
    if (!isValid(date)) {
      return fallback
    }
    
    return format(date, formatString)
  } catch (error) {
    console.error('Date formatting error:', error, 'for value:', dateValue)
    return fallback
  }
}

/**
 * Check if a date string or Date object is valid
 */
export function isValidDate(dateValue: string | Date | null | undefined): boolean {
  if (!dateValue) return false
  
  try {
    let date: Date
    
    if (typeof dateValue === 'string') {
      date = dateValue.includes('T') ? parseISO(dateValue) : new Date(dateValue)
    } else {
      date = dateValue
    }
    
    return isValid(date)
  } catch {
    return false
  }
}
