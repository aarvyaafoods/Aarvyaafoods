import crypto from 'node:crypto'
import { cloudinaryConfig, isCloudinaryConfigured } from '../config/cloudinary.js'
import { uploadRepository } from '../repositories/upload.repository.js'

function signCloudinaryParams(params) {
  const payload = Object.keys(params)
    .sort()
    .map((key) => `${key}=${params[key]}`)
    .join('&')

  return crypto
    .createHash('sha1')
    .update(`${payload}${cloudinaryConfig.apiSecret}`)
    .digest('hex')
}

function getResourceType(type) {
  return type === 'video' ? 'video' : 'image'
}

async function sendCloudinaryRequest(path, params, file) {
  const body = new FormData()

  for (const [key, value] of Object.entries(params)) {
    body.append(key, String(value))
  }

  if (file) {
    body.append('file', new Blob([file.buffer], { type: file.mimeType }), file.fileName)
  }

  body.append('api_key', cloudinaryConfig.apiKey)
  body.append('signature', signCloudinaryParams(params))

  const response = await fetch(`https://api.cloudinary.com/v1_1/${cloudinaryConfig.cloudName}/${path}`, {
    method: 'POST',
    body
  })
  const payload = await response.json().catch(() => ({}))

  if (!response.ok) {
    throw Object.assign(new Error(payload.error?.message || 'Cloudinary request failed'), {
      statusCode: response.status >= 500 ? 502 : response.status
    })
  }

  return payload
}

export const uploadService = {
  async uploadImage(userId, file) {
    return this.uploadFile(userId, file, 'image')
  },

  async uploadFile(userId, file, type = 'file') {
    if (!isCloudinaryConfigured) throw Object.assign(new Error('Cloudinary is not configured'), { statusCode: 503 })
    const buffer = await file.toBuffer()
    const resourceType = getResourceType(type)
    const publicId = `${cloudinaryConfig.folder}/${resourceType}s/${userId}/${crypto.randomUUID()}`
    const timestamp = Math.floor(Date.now() / 1000)
    const result = await sendCloudinaryRequest(
      `${resourceType}/upload`,
      { public_id: publicId, timestamp },
      { buffer, fileName: file.filename || `${publicId}.${resourceType === 'video' ? 'mp4' : 'jpg'}`, mimeType: file.mimetype }
    )

    return uploadRepository.create({
      uploadedBy: userId,
      url: result.secure_url,
      key: result.public_id,
      fileName: file.filename,
      mimeType: file.mimetype,
      sizeBytes: buffer.length
    })
  },

  async deleteImage(id) {
    const upload = await uploadRepository.find(id)
    if (!upload) throw Object.assign(new Error('Upload not found'), { statusCode: 404 })
    if (isCloudinaryConfigured) {
      const resourceType = upload.mime_type?.startsWith('video/') ? 'video' : 'image'
      await sendCloudinaryRequest(`${resourceType}/destroy`, { public_id: upload.object_key, timestamp: Math.floor(Date.now() / 1000) })
    }
    await uploadRepository.softDelete(id)
  },

  update: (id, patch) => uploadRepository.update(id, patch)
}
