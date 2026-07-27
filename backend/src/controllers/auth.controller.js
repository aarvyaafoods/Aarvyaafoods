import { ok } from '../utils/response.js'
import { authService } from '../services/auth.service.js'
import { authRepository } from '../repositories/auth.repository.js'
import { authCookieNames, clearAuthCookies, readCookie, setAuthCookies } from '../utils/cookies.js'

function issueCookieResponse(reply, message, authResult, code = 200, scope = 'customer') {
  setAuthCookies(reply, authResult, scope)
  const { accessToken, refreshToken, ...safe } = authResult
  return ok(reply, message, safe, code)
}

export const authController = {
  register: async (request, reply) => issueCookieResponse(reply, 'Registered successfully', await authService.register(request.server, request.validated.body), 201),
  checkEmail: async (request, reply) => ok(reply, 'Success', await authService.checkEmail(request.validated.query.email)),
  login: async (request, reply) => issueCookieResponse(reply, 'Logged in successfully', await authService.login(request.server, request.validated.body, 'customer')),
  google: async (request, reply) => issueCookieResponse(reply, 'Signed in with Google', await authService.loginWithGoogle(request.server, request.validated.body.token)),
  adminLogin: async (request, reply) => issueCookieResponse(reply, 'Admin logged in successfully', await authService.login(request.server, request.validated.body, 'admin'), undefined, 'admin'),
  refresh: async (request, reply) => {
    const token = request.validated?.body?.refreshToken || readCookie(request, authCookieNames('customer').refresh)
    return issueCookieResponse(reply, 'Token refreshed', await authService.refresh(request.server, token, 'customer'))
  },
  adminRefresh: async (request, reply) => {
    const token = request.validated?.body?.refreshToken || readCookie(request, authCookieNames('admin').refresh)
    return issueCookieResponse(reply, 'Admin token refreshed', await authService.refresh(request.server, token, 'admin'), undefined, 'admin')
  },
  logout: async (request, reply) => {
    await authService.logout(request.body?.refreshToken || readCookie(request, authCookieNames('customer').refresh))
    clearAuthCookies(reply)
    return ok(reply, 'Logged out')
  },
  adminLogout: async (request, reply) => {
    await authService.logout(request.body?.refreshToken || readCookie(request, authCookieNames('admin').refresh))
    clearAuthCookies(reply, 'admin')
    return ok(reply, 'Admin logged out')
  },
  forgotPassword: async (request, reply) => ok(reply, 'Password reset instructions generated', await authService.forgotPassword(request.validated.body.email)),
  resetPassword: async (request, reply) => {
    await authService.resetPassword(request.validated.body)
    return ok(reply, 'Password reset successful')
  },
  changePassword: async (request, reply) => {
    await authService.changePassword(request.user.sub, request.validated.body)
    return ok(reply, 'Password changed')
  },
  me: async (request, reply) => ok(reply, 'Success', await authRepository.findUserById(request.user.sub)),
  adminMe: async (request, reply) => {
    const user = await authRepository.findUserById(request.user.sub)
    if (user?.role_name !== 'admin') throw Object.assign(new Error('Admin access only'), { statusCode: 403 })
    return ok(reply, 'Success', user)
  }
}
