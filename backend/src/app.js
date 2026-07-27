import Fastify from 'fastify'
import cors from '@fastify/cors'
import helmet from '@fastify/helmet'
import jwt from '@fastify/jwt'
import multipart from '@fastify/multipart'
import rateLimit from '@fastify/rate-limit'
import { env } from './config/env.js'
import { errorHandler } from './middlewares/error.middleware.js'
import swaggerPlugin from './plugins/swagger.js'
import { authRoutes } from './routes/auth.routes.js'
import { userRoutes } from './routes/user.routes.js'
import { catalogRoutes } from './routes/catalog.routes.js'
import { orderRoutes } from './routes/order.routes.js'
import { paymentRoutes } from './routes/payment.routes.js'
import { uploadRoutes } from './routes/upload.routes.js'
import { adminRoutes } from './routes/admin.routes.js'

export async function buildApp() {
  const app = Fastify({ logger: true })
  app.addContentTypeParser('application/json', { parseAs: 'buffer' }, (request, body, done) => {
    request.rawBody = body.toString('utf8')
    done(null, JSON.parse(request.rawBody || '{}'))
  })
  await app.register(helmet)
  // Build allowed origins with www variants for both domains
  const baseOrigins = [
    env.FRONTEND_URL,
    'https://getyourstore.in',
    'https://www.getyourstore.in',
    'https://aarvyafoods.com',
    'https://www.aarvyafoods.com',
    'http://localhost:3000',
    'http://127.0.0.1:3000',
    'https://aarvyaafoods.vercel.app'
  ]
  const allowedOrigins = new Set(baseOrigins.filter(Boolean))
  
  await app.register(cors, {
    origin: (origin, callback) => {
      if (!origin || allowedOrigins.has(origin)) return callback(null, true)
      app.log.warn({ origin, allowedOrigins: Array.from(allowedOrigins) }, 'CORS request rejected')
      return callback(new Error('Not allowed by CORS'), false)
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
    exposedHeaders: ['Set-Cookie']
  })
  await app.register(rateLimit, { max: 120, timeWindow: '1 minute' })
  await app.register(jwt, { secret: env.JWT_ACCESS_SECRET })
  await app.register(multipart, { limits: { fileSize: 50 * 1024 * 1024 } })
  await app.register(swaggerPlugin)
  app.setErrorHandler(errorHandler)

  app.get('/health', async () => ({ success: true, message: 'Success', data: { status: 'ok' } }))
  await app.register(authRoutes, { prefix: '/api/auth' })
  await app.register(userRoutes, { prefix: '/api/users' })
  await app.register(catalogRoutes, { prefix: '/api/catalog' })
  await app.register(orderRoutes, { prefix: '/api' })
  await app.register(paymentRoutes, { prefix: '/api/payments' })
  await app.register(uploadRoutes, { prefix: '/api/uploads' })
  await app.register(adminRoutes, { prefix: '/api/admin' })
  return app
}
