import { env } from '../config/env.js'

const sevenDays = 7 * 24 * 60 * 60
const cookieNames = {
  customer: {
    access: 'staffarc_access_token',
    refresh: 'staffarc_refresh_token'
  },
  admin: {
    access: 'staffarc_admin_access_token',
    refresh: 'staffarc_admin_refresh_token'
  }
}

function defaultCookieOptions(expired = false) {
  const maxAge = expired ? 0 : sevenDays
  // Development: Use SameSite=None for localhost (works with cross-port requests like 3000->4000)
  // Production: Use SameSite=None for cross-origin support
  // Note: SameSite=None requires Secure flag which we'll conditionally add
  const sameSite = env.NODE_ENV === 'production' ? 'None' : 'None'
  return `HttpOnly; Path=/; SameSite=${sameSite}; Max-Age=${maxAge}`
}

function serializeCookie(name, value, options = '') {
  // Development localhost: Skip Secure flag to allow cookies on HTTP
  // Production: Always require Secure flag with SameSite=None
  const isLocalhost = env.API_BASE_URL?.includes('localhost') || env.API_BASE_URL?.includes('127.0.0.1')
  const secure = (env.NODE_ENV === 'production' || !isLocalhost) ? '; Secure' : ''
  return `${name}=${encodeURIComponent(value)}; ${options || defaultCookieOptions(value === '' ? true : false)}${secure}`
}

export function readCookie(request, name) {
  const header = request.headers.cookie
  if (!header) return null
  const found = header.split(';').map(part => part.trim()).find(part => part.startsWith(`${name}=`))
  return found ? decodeURIComponent(found.slice(name.length + 1)) : null
}

export function authCookieNames(scope = 'customer') {
  return cookieNames[scope] || cookieNames.customer
}

function setCookieHeader(reply, cookies) {
  if (reply.raw?.setHeader) {
    reply.raw.setHeader('Set-Cookie', cookies)
  } else {
    reply.header('Set-Cookie', cookies)
  }
}

export function setAuthCookies(reply, { accessToken, refreshToken }, scope = 'customer') {
  const names = authCookieNames(scope)
  setCookieHeader(reply, [
    serializeCookie(names.access, accessToken),
    serializeCookie(names.refresh, refreshToken)
  ])
}

export function clearAuthCookies(reply, scope = 'customer') {
  const names = authCookieNames(scope)
  const expired = defaultCookieOptions(true)
  setCookieHeader(reply, [
    serializeCookie(names.access, '', expired),
    serializeCookie(names.refresh, '', expired)
  ])
}
