import { ZodError } from 'zod'

export function errorHandler(error, request, reply) {
  const errorInfo = {
    message: error.message,
    statusCode: error.statusCode || 500,
    url: request.url,
    method: request.method,
    timestamp: new Date().toISOString()
  }
  
  // Log full error details for debugging
  request.log.error(errorInfo)
  
  if (error instanceof ZodError) {
    return reply.code(422).send({ 
      success: false, 
      message: error.errors[0]?.message || 'Validation failed' 
    })
  }
  
  if (error.statusCode) {
    return reply.code(error.statusCode).send({ 
      success: false, 
      message: error.message 
    })
  }
  
  // Log database/connection errors more clearly
  if (error.message?.includes('connect') || error.message?.includes('database') || error.message?.includes('ENOTFOUND')) {
    request.log.error({
      error: 'Database Connection Failed',
      message: error.message,
      hint: 'Check if DATABASE_URL environment variable is set and valid'
    })
  }
  
  return reply.code(500).send({ 
    success: false, 
    message: 'Internal server error',
    // Only show detailed errors in development
    ...(process.env.NODE_ENV === 'development' && { error: error.message })
  })
}
