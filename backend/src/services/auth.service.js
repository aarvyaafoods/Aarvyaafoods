import bcrypt from 'bcryptjs'
import { addDays, addHours } from '../utils/time.js'
import { env } from '../config/env.js'
import { authRepository } from '../repositories/auth.repository.js'
import { hashToken, makeOtpToken, signAccessToken, signRefreshToken } from '../utils/jwt.js'

function publicUser(user) {
  if (!user) return null
  const { password_hash, role_id, ...safe } = user
  return safe
}

export const authService = {
  async register(app, data) {
    const existing = await authRepository.findUserByEmail(data.email)
    if (existing) throw Object.assign(new Error('Email already registered'), { statusCode: 409 })
    const passwordHash = await bcrypt.hash(data.password, env.BCRYPT_ROUNDS)
    const user = await authRepository.createUser({ ...data, passwordHash })
    return this.issueTokens(app, { ...user, role_name: 'customer' })
  },

  async checkEmail(email) {
    const existing = await authRepository.findUserByEmail(email)
    return { available: !existing }
  },

  async login(app, { email, password }, expectedRole = null) {
    const user = await authRepository.findUserByEmail(email)
    if (!user || !(await bcrypt.compare(password, user.password_hash))) {
      throw Object.assign(new Error('Invalid email or password'), { statusCode: 401 })
    }
    if (!user.is_active) throw Object.assign(new Error('Account is disabled'), { statusCode: 403 })
    if (expectedRole && user.role_name !== expectedRole) {
      throw Object.assign(new Error(expectedRole === 'admin' ? 'Admin access only' : 'Customer access only'), { statusCode: 403 })
    }
    return this.issueTokens(app, user)
  },

  async loginWithGoogle(app, idToken) {
    const payload = await this.verifyGoogleToken(idToken)
    const email = payload.email
    const googleId = payload.sub
    if (!email || !googleId) throw Object.assign(new Error('Invalid Google token'), { statusCode: 401 })

    let user = await authRepository.findUserByGoogleId(googleId)
    if (!user) {
      user = await authRepository.findUserByEmail(email)
      if (user) {
        await authRepository.linkUserToGoogle(user.id, googleId)
      } else {
        const passwordHash = await bcrypt.hash(`${googleId}:${Date.now()}`, env.BCRYPT_ROUNDS)
        user = await authRepository.createUserWithGoogle({
          name: payload.name || 'Google User',
          email,
          phone: null,
          googleId,
          passwordHash
        })
      }
    }

    if (!user.is_active) throw Object.assign(new Error('Account is disabled'), { statusCode: 403 })
    return this.issueTokens(app, user)
  },

  async verifyGoogleToken(idToken) {
    if (!env.GOOGLE_CLIENT_ID) throw Object.assign(new Error('Google auth is not configured'), { statusCode: 500 })
    const response = await fetch(`https://oauth2.googleapis.com/tokeninfo?id_token=${encodeURIComponent(idToken)}`)
    if (!response.ok) {
      throw Object.assign(new Error('Google token verification failed'), { statusCode: 401 })
    }
    const payload = await response.json()
    if (payload.aud !== env.GOOGLE_CLIENT_ID) {
      throw Object.assign(new Error('Google token audience mismatch'), { statusCode: 401 })
    }
    if (!['accounts.google.com', 'https://accounts.google.com'].includes(payload.iss)) {
      throw Object.assign(new Error('Invalid Google token issuer'), { statusCode: 401 })
    }
    if (payload.email_verified !== 'true' && payload.email_verified !== true) {
      throw Object.assign(new Error('Google email not verified'), { statusCode: 401 })
    }
    return payload
  },

  async issueTokens(app, user) {
    const accessToken = signAccessToken(app, user)
    const refreshToken = signRefreshToken(app, user)
    await authRepository.saveRefreshToken({
      userId: user.id,
      tokenHash: hashToken(refreshToken),
      expiresAt: addDays(7)
    })
    return { user: publicUser(user), accessToken, refreshToken }
  },

  async refresh(app, refreshToken, expectedRole = null) {
    if (!refreshToken) throw Object.assign(new Error('Invalid refresh token'), { statusCode: 401 })
    const saved = await authRepository.findRefreshToken(hashToken(refreshToken))
    if (!saved) throw Object.assign(new Error('Invalid refresh token'), { statusCode: 401 })
    const user = await authRepository.findUserById(saved.user_id)
    if (!user?.is_active) throw Object.assign(new Error('Account is disabled'), { statusCode: 403 })
    if (expectedRole && user.role_name !== expectedRole) {
      throw Object.assign(new Error(expectedRole === 'admin' ? 'Admin access only' : 'Customer access only'), { statusCode: 403 })
    }
    return this.issueTokens(app, user)
  },

  async logout(refreshToken) {
    if (refreshToken) await authRepository.revokeRefreshToken(hashToken(refreshToken))
  },

  async forgotPassword(email) {
    const user = await authRepository.findUserByEmail(email)
    if (!user) return { resetToken: null }
    const token = makeOtpToken()
    await authRepository.savePasswordReset({ userId: user.id, tokenHash: hashToken(token), expiresAt: addHours(1) })
    return { resetToken: token }
  },

  async resetPassword({ token, password }) {
    const passwordHash = await bcrypt.hash(password, env.BCRYPT_ROUNDS)
    const updated = await authRepository.consumePasswordReset(hashToken(token), passwordHash)
    if (!updated) throw Object.assign(new Error('Invalid or expired reset token'), { statusCode: 400 })
  },

  async changePassword(userId, { currentPassword, newPassword }) {
    const user = await authRepository.findUserById(userId)
    const full = await authRepository.findUserByEmail(user.email)
    if (!(await bcrypt.compare(currentPassword, full.password_hash))) {
      throw Object.assign(new Error('Current password is incorrect'), { statusCode: 400 })
    }
    await authRepository.updatePassword(userId, await bcrypt.hash(newPassword, env.BCRYPT_ROUNDS))
  }
}
