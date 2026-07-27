import fs from 'node:fs/promises'
import pg from 'pg'

const file = process.argv[2]
if (!file) throw new Error('Usage: node src/utils/run-sql-file.js <file.sql>')

const sql = await fs.readFile(file, 'utf8')
const pool = new pg.Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false }
})

await pool.query(sql)
const { rows } = await pool.query(
  `select count(*)::int as tables
   from information_schema.tables
   where table_schema = $1 and table_type = $2`,
  ['public', 'BASE TABLE']
)
console.log(JSON.stringify(rows[0]))
await pool.end()
