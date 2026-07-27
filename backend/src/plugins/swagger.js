import swagger from '@fastify/swagger'
import swaggerUi from '@fastify/swagger-ui'
import fp from 'fastify-plugin'
import { env } from '../config/env.js'

export default fp(async function swaggerPlugin(app) {
  await app.register(swagger, {
    openapi: {
      info: { title: 'Aarvya API', version: '1.0.0' },
      servers: [{ url: env.API_BASE_URL }],
      components: {
        securitySchemes: { bearerAuth: { type: 'http', scheme: 'bearer', bearerFormat: 'JWT' } }
      }
    }
  })
  await app.register(swaggerUi, { routePrefix: '/docs' })
})
