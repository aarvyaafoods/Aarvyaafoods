import { userRepository } from '../repositories/user.repository.js'

export const userService = {
  updateProfile: (userId, data) => userRepository.updateProfile(userId, data),
  getAddresses: (userId) => userRepository.getAddresses(userId),
  createAddress: (userId, data) => userRepository.createAddress(userId, data),
  updateAddress: (userId, id, data) => userRepository.updateAddress(userId, id, data),
  deleteAddress: (userId, id) => userRepository.deleteAddress(userId, id),
  setDefaultAddress: (userId, id) => userRepository.setDefaultAddress(userId, id),
  getNotificationPrefs: (userId) => userRepository.getNotificationPrefs(userId),
  updateNotificationPrefs: (userId, data) => userRepository.updateNotificationPrefs(userId, data),
  listUsers: (filters) => userRepository.listUsers(filters)
}
