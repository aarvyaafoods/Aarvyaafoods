export const validate = (schema) => async (request) => {
  const parsed = await schema.parseAsync({
    body: request.body,
    query: request.query,
    params: request.params
  })
  request.validated = parsed
}
