export const requireRole = (...roles) => async (request, reply) => {
  if (!roles.includes(request.user?.role)) {
    return reply.code(403).send({ success: false, message: 'Forbidden' })
  }
}
