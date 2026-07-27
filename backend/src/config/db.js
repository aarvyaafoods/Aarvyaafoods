import pg from 'pg'
import { env } from './env.js'

// Validate that DATABASE_URL is set
if (!env.DATABASE_URL) {
  console.error('[CRITICAL] DATABASE_URL environment variable is not set!')
  console.error('Please set DATABASE_URL in your Vercel environment variables.')
  process.exit(1)
}

export const pool = new pg.Pool({
  connectionString: env.DATABASE_URL,
  ssl: env.DATABASE_URL.includes('neon.tech') ? { rejectUnauthorized: false } : undefined
})

// Handle pool errors
pool.on('error', (err) => {
  console.error('[Database Pool Error]', err)
})

export async function query(text, params = []) {
  try {
    const { rows, rowCount } = await pool.query(text, params)
    return { rows, rowCount }
  } catch (error) {
    console.error('[Database Query Error]', {
      message: error.message,
      query: text.substring(0, 100),
      params: params.length
    })
    throw error
  }
}

export async function transaction(work) {
  const client = await pool.connect()
  try {
    await client.query('BEGIN')
    const result = await work(client)
    await client.query('COMMIT')
    return result
  } catch (error) {
    await client.query('ROLLBACK')
    console.error('[Transaction Error]', error.message)
    throw error
  } finally {
    client.release()
  }
}
