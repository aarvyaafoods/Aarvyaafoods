import { env } from './env.js'

function parseCloudinaryUrl(value) {
  if (!value) return {}

  try {
    const url = new URL(value)
    if (url.protocol !== 'cloudinary:') return {}

    return {
      cloudName: url.hostname,
      apiKey: decodeURIComponent(url.username),
      apiSecret: decodeURIComponent(url.password)
    }
  } catch {
    return {}
  }
}

const fromUrl = parseCloudinaryUrl(env.CLOUDINARY_URL)

export const cloudinaryConfig = {
  cloudName: env.CLOUDINARY_CLOUD_NAME || fromUrl.cloudName,
  apiKey: env.CLOUDINARY_API_KEY || fromUrl.apiKey,
  apiSecret: env.CLOUDINARY_API_SECRET || fromUrl.apiSecret,
  folder: env.CLOUDINARY_FOLDER || 'staffarc/uploads'
}

export const isCloudinaryConfigured = Boolean(
  cloudinaryConfig.cloudName &&
  cloudinaryConfig.apiKey &&
  cloudinaryConfig.apiSecret
)
