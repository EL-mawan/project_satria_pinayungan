/**
 * Database utility helpers for improved reliability and performance
 */

/**
 * Retry a database operation with exponential backoff
 * @param operation - The async operation to retry
 * @param maxRetries - Maximum number of retry attempts (default: 3)
 * @param baseDelay - Base delay in ms for exponential backoff (default: 100)
 */
export async function retryOperation<T>(
  operation: () => Promise<T>,
  maxRetries: number = 3,
  baseDelay: number = 100
): Promise<T> {
  let lastError: any
  
  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      return await operation()
    } catch (error: any) {
      lastError = error
      
      // Don't retry on certain errors
      if (
        error.code === 'P2002' || // Unique constraint violation
        error.code === 'P2025' || // Record not found
        error.code === 'P2003'    // Foreign key constraint violation
      ) {
        throw error
      }
      
      // If this was the last attempt, throw the error
      if (attempt === maxRetries) {
        throw error
      }
      
      // Calculate delay with exponential backoff
      const delay = baseDelay * Math.pow(2, attempt)
      
      // Add some jitter to prevent thundering herd
      const jitter = Math.random() * delay * 0.1
      
      await new Promise(resolve => setTimeout(resolve, delay + jitter))
    }
  }
  
  throw lastError
}

/**
 * Execute a database operation with timeout
 * @param operation - The async operation to execute
 * @param timeoutMs - Timeout in milliseconds (default: 10000)
 */
export async function withTimeout<T>(
  operation: () => Promise<T>,
  timeoutMs: number = 10000
): Promise<T> {
  return Promise.race([
    operation(),
    new Promise<T>((_, reject) =>
      setTimeout(() => reject(new Error('Database operation timeout')), timeoutMs)
    )
  ])
}

/**
 * Combine retry and timeout for robust database operations
 * @param operation - The async operation to execute
 * @param options - Configuration options
 */
export async function robustDbOperation<T>(
  operation: () => Promise<T>,
  options: {
    maxRetries?: number
    baseDelay?: number
    timeoutMs?: number
  } = {}
): Promise<T> {
  const {
    maxRetries = 3,
    baseDelay = 100,
    timeoutMs = 10000
  } = options
  
  return retryOperation(
    () => withTimeout(operation, timeoutMs),
    maxRetries,
    baseDelay
  )
}

/**
 * Check database connection health
 */
export async function checkDatabaseHealth(db: any): Promise<boolean> {
  try {
    await db.$queryRaw`SELECT 1`
    return true
  } catch (error) {
    console.error('Database health check failed:', error)
    return false
  }
}

/**
 * Format database error for user-friendly message
 */
export function formatDatabaseError(error: any): { message: string; code?: string } {
  if (error.code === 'P2002') {
    return {
      message: 'Data dengan nilai tersebut sudah ada',
      code: 'DUPLICATE'
    }
  }
  
  if (error.code === 'P2025') {
    return {
      message: 'Data tidak ditemukan',
      code: 'NOT_FOUND'
    }
  }
  
  if (error.code === 'P2003') {
    return {
      message: 'Operasi gagal karena ada relasi data yang terkait',
      code: 'FOREIGN_KEY'
    }
  }
  
  if (error.message?.includes('timeout')) {
    return {
      message: 'Operasi database timeout. Silakan coba lagi',
      code: 'TIMEOUT'
    }
  }
  
  if (error.message?.includes('connection')) {
    return {
      message: 'Koneksi database terputus. Silakan coba lagi',
      code: 'CONNECTION'
    }
  }
  
  return {
    message: 'Terjadi kesalahan server',
    code: 'UNKNOWN'
  }
}
