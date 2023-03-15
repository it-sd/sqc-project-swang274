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

const validatePassword = function (aPassword) {
  const constraints = [
    (w) => w.length >= 6,
    (w) => w.length <= 32,
    (w) => /\p{Uppercase}/u.test(w),
    (w) => /\p{Lowercase}/u.test(w),
    (w) => /\P{Letter}/u.test(w)
  ]

  let isValid = true
  for (const constraint of constraints) {
    isValid = isValid && constraint(aPassword)
  }
  return isValid
}

module.exports = {
  validatePassword
}

const query = async function (sql, params) {
  if (typeof sql !== 'string') {
    throw new TypeError('Expected sql to be a string')
  }
  assert.strictEqual(typeof sql, 'string', 'Expected src to be a string')
  let client
  let results = []
  try {
    client = await pool.connect()
    const response = await client.query(sql, params)
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
  .use(express.static('static')) // set "static" directory as a static directory
  .use(express.static(path.join(__dirname, 'static')))
  .use(express.json())
  .use(express.urlencoded({ extended: true }))
  .set('views', path.join(__dirname, 'views'))
  .set('view engine', 'ejs')
  .get('/health', (req, res) => {
    pool
      .query('SELECT 1')
      .then(() => {
        res.status(200).send('Database connection OK')
      })
      .catch((err) => {
        res.status(500).send(`Database connection error: ${err.message}`)
      })
  })
  .get('/', function (req, res) {
    res.render('pages/login', {})
  })
  .post('/create_user', async function (req, res) {
    const { password, firstName, lastName, email } = req.body
    const isValid = validatePassword(password)
    if (!isValid) {
      res.status(400).send({ status: 'error' })
    } else {
      const insertSql =
        'INSERT INTO customer (firstName, lastName, email, password) VALUES ($1::VARCHAR, $2::VARCHAR, $3::VARCHAR, $4::VARCHAR);'

      const checkEmail = 'SELECT * FROM customer WHERE email=$1::VARCHAR'
      let result = await query(checkEmail, [email])
      if (result.length == 0) {
        await query(insertSql, [firstName, lastName, email, password])
        res.status(200).send({ status: 'success' })
      } else {
        res.status(400).send({ status: 'user exists' })
      }
    }
  })

  .post('/login', async function (req, res) {
    const { email, password } = req.body
    const sql = `SELECT password FROM customer WHERE email = '${email}';`

    const result = await query(sql)
    // Check if username and password are valid
    console.log(result[0]['password'])
    console.log(password)

    if (result.length > 0 && result[0].password === password) {
      // Set a session variable to indicate that the user is logged in
      //   req.session.loggedIn = true
      res.sendStatus(200) // Send a 200 OK response
    } else {
      res.sendStatus(401) // Send a 401 Unauthorized response
    }
  })

  .get('/home', (req, res) => {
    const title = 'Home Page'
    const content = '<h1>Welcome to my website</h1>'
    res.render('pages/index', { title, content })
  })

  .get('/about', (req, res) => {
    const title = 'About Us'
    const content = '<h1>About Us</h1>'
    res.render('pages/about', { title, content })
  })

  .use((req, res) => {
    res.status(404).render('pages/error', {})
  }) // error-handling
  .listen(PORT, () => console.log(`Listening on ${PORT}`))
