import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import dotenv from 'dotenv'
import { z } from 'zod'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const envCandidates = [
  path.resolve(__dirname, '../../.env'),
  path.resolve(__dirname, '../../.env.local'),
  path.resolve(__dirname, '../../../.env'),
  path.resolve(__dirname, '../../../.env.local')
]
for (const envPath of envCandidates) {
  if (fs.existsSync(envPath)) {
    dotenv.config({ path: envPath })
  }
}

const schema = z.object({
  NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
  PORT: z.coerce.number().default(4000),
  API_BASE_URL: z.string().url().default('http://localhost:4000'),
  FRONTEND_URL: z.string().url().default('https://getyourstore.in'),
  DATABASE_URL: z.string().min(1),
  JWT_ACCESS_SECRET: z.string().min(24),
  JWT_REFRESH_SECRET: z.string().min(24),
  ACCESS_TOKEN_TTL: z.string().default('7d'),
  REFRESH_TOKEN_TTL: z.string().default('7d'),
  BCRYPT_ROUNDS: z.coerce.number().default(12),
  RAZORPAY_KEY_ID: z.string().optional(),
  RAZORPAY_KEY_SECRET: z.string().optional(),
  RAZORPAY_WEBHOOK_SECRET: z.string().optional(),
  CLOUDINARY_URL: z.string().optional(),
  CLOUDINARY_CLOUD_NAME: z.string().optional(),
  CLOUDINARY_API_KEY: z.string().optional(),
  CLOUDINARY_API_SECRET: z.string().optional(),
  CLOUDINARY_FOLDER: z.string().default('staffarc/uploads'),
  GOOGLE_CLIENT_ID: z.string().optional()
})

export const env = schema.parse(process.env)
