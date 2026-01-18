// Timezone utilities for Pakistan Standard Time (PKT = UTC+5)

const PKT_TIMEZONE = 'Asia/Karachi'

/**
 * Format a date/time for display in PKT timezone
 * Use this in all components that display times
 */
export function formatTimePKT(dateString: string): string {
    const date = new Date(dateString)
    return date.toLocaleTimeString('en-PK', {
        timeZone: PKT_TIMEZONE,
        hour: '2-digit',
        minute: '2-digit',
        hour12: true,
    })
}

/**
 * Format a date for display in PKT timezone
 */
export function formatDatePKT(dateString: string): string {
    const date = new Date(dateString)
    return date.toLocaleDateString('en-PK', {
        timeZone: PKT_TIMEZONE,
        weekday: 'short',
        month: 'short',
        day: 'numeric',
    })
}

/**
 * Format date and time together in PKT timezone
 */
export function formatDateTimePKT(dateString: string): string {
    const date = new Date(dateString)
    return date.toLocaleString('en-PK', {
        timeZone: PKT_TIMEZONE,
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
        hour12: true,
    })
}

/**
 * Create a timestamp from a time string (HH:MM) for today
 * This properly preserves the intended local time
 */
export function createTimestampFromTimeInput(timeString: string): string {
    const [hours, minutes] = timeString.split(':').map(Number)

    // Create a date object for today
    const now = new Date()

    // Build a date string with explicit timezone offset for PKT (UTC+5)
    const year = now.getFullYear()
    const month = String(now.getMonth() + 1).padStart(2, '0')
    const day = String(now.getDate()).padStart(2, '0')
    const hour = String(hours).padStart(2, '0')
    const minute = String(minutes).padStart(2, '0')

    // Create ISO string with PKT offset (+05:00)
    // This ensures the time is interpreted correctly regardless of server timezone
    const isoString = `${year}-${month}-${day}T${hour}:${minute}:00+05:00`

    return isoString
}

/**
 * Get today's date in YYYY-MM-DD format for PKT timezone
 */
export function getTodayPKT(): string {
    const now = new Date()
    return now.toLocaleDateString('en-CA', { // en-CA gives YYYY-MM-DD format
        timeZone: PKT_TIMEZONE,
    })
}
