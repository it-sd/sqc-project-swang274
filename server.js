require('dotenv').config() // Read environment variables from .env
const assert = require('node:assert/strict')
const process = require('node:process')
const express = require('express')
const path = require('path')
const PORT = process.env.PORT || 5163
const app = express()
const { Pool } = require('pg')

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: {
    rejectUnauthorized: false
  }
})

const query = async function (sql) {
  if (typeof sql !== 'string') {
    throw new TypeError('Expected sql to be a string')
  }
  assert.strictEqual(typeof sql, 'string',
    'Expected src to be a string')
  let client
  let results = []
  try {
    client = await pool.connect()
    const response = await client.query(sql)
    if (response && response.rows) {
    results = response.rows
    }
  } catch (err) {
    console.error(err)
  }
  if (client) client.release()
  return results
}

app
  .use(express.static('static'))// set "static" directory as a static directory
  .use(express.static(path.join(__dirname, 'static')))
  .use(express.json())
  .use(express.urlencoded({ extended: true }))
  .set('views', path.join(__dirname, 'views'))
  .set('view engine', 'ejs')
  .get('/health', (req, res) => {
    pool.query('SELECT 1')
      .then(() => {
        res.status(200).send('Database connection OK')
      })
      .catch((err) => {
        res.status(500).send(`Database connection error: ${err.message}`)
      })
  })
  .get('/', function (req, res) {
    res.render('pages/index', {})
  })
  .get('/about', function (req, res) {
    res.render('pages/about', {})
  })
  .use((req, res) => {
    res.status(404).render('pages/error', {})
  })// error-handling
  .listen(PORT, () => console.log(`Listening on ${PORT}`))
