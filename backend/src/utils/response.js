export const ok = (reply, message = 'Success', data = {}, status = 200) =>
  reply.code(status).send({ success: true, message, data })

export const fail = (reply, message = 'Error Message', status = 400) =>
  reply.code(status).send({ success: false, message })
