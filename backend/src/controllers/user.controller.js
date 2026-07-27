import { ok } from '../utils/response.js'
import { userService } from '../services/user.service.js'
import { authRepository } from '../repositories/auth.repository.js'

export const userController = {
  me: async (request, reply) => ok(reply, 'Success', await authRepository.findUserById(request.user.sub)),
  updateMe: async (request, reply) => ok(reply, 'Profile updated', await userService.updateProfile(request.user.sub, request.validated.body)),
  addresses: async (request, reply) => ok(reply, 'Success', await userService.getAddresses(request.user.sub)),
  createAddress: async (request, reply) => ok(reply, 'Address created', await userService.createAddress(request.user.sub, request.validated.body), 201),
  updateAddress: async (request, reply) => ok(reply, 'Address updated', await userService.updateAddress(request.user.sub, request.validated.params.id, request.validated.body)),
  deleteAddress: async (request, reply) => {
    await userService.deleteAddress(request.user.sub, request.validated.params.id)
    return ok(reply, 'Address deleted')
  },
  defaultAddress: async (request, reply) => ok(reply, 'Default address updated', await userService.setDefaultAddress(request.user.sub, request.validated.params.id)),
  prefs: async (request, reply) => ok(reply, 'Success', await userService.getNotificationPrefs(request.user.sub)),
  updatePrefs: async (request, reply) => ok(reply, 'Notification preferences updated', await userService.updateNotificationPrefs(request.user.sub, request.validated.body)),
  adminList: async (request, reply) => ok(reply, 'Success', await userService.listUsers(request.validated.query))
}
