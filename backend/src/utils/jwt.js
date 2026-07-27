import crypto from 'node:crypto'
import { env } from '../config/env.js'

export function signAccessToken(app, user) {
  return app.jwt.sign(
    { sub: user.id, role: user.role_name || user.role || 'customer' },
    { secret: env.JWT_ACCESS_SECRET, expiresIn: env.ACCESS_TOKEN_TTL }
  )
}

export function signRefreshToken(app, user) {
  return app.jwt.sign(
    { sub: user.id, tokenType: 'refresh' },
    { secret: env.JWT_REFRESH_SECRET, expiresIn: env.REFRESH_TOKEN_TTL }
  )
}

export function hashToken(token) {
  return crypto.createHash('sha256').update(token).digest('hex')
}

export function makeOtpToken() {
  return crypto.randomBytes(32).toString('hex')
}
