import { env } from '../config/env.js'
import { authCookieNames, readCookie } from '../utils/cookies.js'

export function requireAuthScope(scope = 'customer') {
  return async function requireScopedAuth(request, reply) {
    try {
      const token = readCookie(request, authCookieNames(scope).access)
      if (!token) {
        request.log.warn({
          scope,
          origin: request.headers.origin,
          cookieHeader: Boolean(request.headers.cookie),
          cookies: request.headers.cookie ? request.headers.cookie.substring(0, 100) : 'none'
        }, `Missing ${scope} auth token in cookies`)
        throw new Error(`Missing ${scope} authentication token`)
      }
      request.user = await request.server.jwt.verify(token, { secret: env.JWT_ACCESS_SECRET })
    } catch (error) {
      request.log.warn({
        scope,
        error: error.message,
        origin: request.headers.origin
      }, `${scope} token verification failed`)
      return reply.code(401).send({
        success: false,
        message: error.message || 'Unauthorized'
      })
    }
  }
}

export async function requireAuth(request, reply) {
  try {
    const token = readCookie(request, authCookieNames('customer').access)
    if (!token) {
      request.log.warn({
        origin: request.headers.origin,
        cookieHeader: Boolean(request.headers.cookie)
      }, 'Missing customer auth token in cookies')
      throw new Error('Missing authentication token')
    }
    request.user = await request.server.jwt.verify(token, { secret: env.JWT_ACCESS_SECRET })
  } catch (error) {
    request.log.warn({
      error: error.message,
      origin: request.headers.origin
    }, 'Customer token verification failed')
    return reply.code(401).send({
      success: false,
      message: error.message || 'Unauthorized'
    })
  }
}

export const requireAdminAuth = requireAuthScope('admin')
