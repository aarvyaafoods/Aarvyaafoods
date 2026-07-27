import { ok } from '../utils/response.js'
import { uploadService } from '../services/upload.service.js'

export const uploadController = {
  upload: async (request, reply) => {
    const file = await request.file()
    if (!file || !file.mimetype.startsWith('image/')) {
      throw Object.assign(new Error('Image file is required'), { statusCode: 400 })
    }
    return ok(reply, 'Image uploaded', await uploadService.uploadFile(request.user.sub, file, 'image'), 201)
  },
  uploadVideo: async (request, reply) => {
    const file = await request.file()
    if (!file || !file.mimetype.startsWith('video/')) {
      throw Object.assign(new Error('Video file is required'), { statusCode: 400 })
    }
    return ok(reply, 'Video uploaded', await uploadService.uploadFile(request.user.sub, file, 'video'), 201)
  },
  update: async (request, reply) => ok(reply, 'Upload updated', await uploadService.update(request.params.id, request.body)),
  delete: async (request, reply) => {
    await uploadService.deleteImage(request.params.id)
    return ok(reply, 'Image deleted')
  }
}
