import { uploadController } from '../controllers/upload.controller.js'
import { requireAdminAuth } from '../middlewares/auth.middleware.js'

export async function uploadRoutes(app) {
  app.addHook('preHandler', requireAdminAuth)
  app.post('/images', uploadController.upload)
  app.post('/videos', uploadController.uploadVideo)
  app.patch('/:id', uploadController.update)
  app.delete('/:id', uploadController.delete)
}
