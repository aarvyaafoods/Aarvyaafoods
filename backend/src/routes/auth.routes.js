import { authController } from '../controllers/auth.controller.js'
import { requireAdminAuth, requireAuth } from '../middlewares/auth.middleware.js'
import { validate } from '../middlewares/validation.middleware.js'
import { changePasswordSchema, emailAvailabilitySchema, forgotPasswordSchema, googleSchema, loginSchema, refreshSchema, registerSchema, resetPasswordSchema } from '../validators/auth.validator.js'

export async function authRoutes(app) {
  app.post('/register', { preHandler: validate(registerSchema) }, authController.register)
  app.get('/check-email', { preHandler: validate(emailAvailabilitySchema) }, authController.checkEmail)
  app.post('/login', { preHandler: validate(loginSchema) }, authController.login)
  app.post('/google', { preHandler: validate(googleSchema) }, authController.google)
  app.post('/admin/login', { preHandler: validate(loginSchema) }, authController.adminLogin)
  app.post('/logout', authController.logout)
  app.post('/admin/logout', authController.adminLogout)
  app.post('/refresh-token', { preHandler: validate(refreshSchema) }, authController.refresh)
  app.post('/admin/refresh-token', { preHandler: validate(refreshSchema) }, authController.adminRefresh)
  app.post('/forgot-password', { preHandler: validate(forgotPasswordSchema) }, authController.forgotPassword)
  app.post('/reset-password', { preHandler: validate(resetPasswordSchema) }, authController.resetPassword)
  app.post('/change-password', { preHandler: [requireAuth, validate(changePasswordSchema)] }, authController.changePassword)
  app.get('/me', { preHandler: requireAuth }, authController.me)
  app.get('/admin/me', { preHandler: requireAdminAuth }, authController.adminMe)
}
