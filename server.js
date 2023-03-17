require('dotenv').config() // Read environment variables from .env
const express = require('express')
const path = require('path')
const PORT = process.env.PORT || 5163
const app = express()
const { Pool } = require('pg')
const cookieParser = require('cookie-parser')
const sessions = require('express-session')

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: {
    rejectUnauthorized: false
  }
})

const validatePassword = function (aPassword) {
  const constraints = [(w) => w.length >= 6, (w) => w.length <= 32, (w) => /\p{Uppercase}/u.test(w), (w) => /\p{Lowercase}/u.test(w), (w) => /\P{Letter}/u.test(w)]

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
  //   assert.strictEqual(typeof sql, 'string', 'Expected src to be a string')
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
  .use(
    sessions({
      secret: 'my-secret-key',
      resave: false,
      saveUninitialized: false
    })
  )
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
      const insertSql = 'INSERT INTO customer (firstName, lastName, email, password) VALUES ($1::VARCHAR, $2::VARCHAR, $3::VARCHAR, $4::VARCHAR);'

      const checkEmail = 'SELECT * FROM customer WHERE email=$1::VARCHAR'
      let result = await query(checkEmail, [email])
      if (result.length == 0) {
        await query(insertSql, [firstName, lastName, email, password])
        res.status(200).send({ status: 'success', url: '/home' })
      } else {
        res.status(400).send({ status: 'user exists' })
      }
    }
  })

  .post('/login', async function (req, res) {
    const { email, password } = req.body
    const sql = `SELECT customerID, password FROM customer WHERE email = '${email}';`

    const result = await query(sql)
    // Check if username and password are valid
    console.log(result)

    if (result.length > 0 && result[0].password === password) {
      // Set a session variable to indicate that the user is logged in
      req.session.userId = result[0].customerid
      res.sendStatus(200) // Send a 200 OK response
      console.log(req.session.userId)
    } else {
      res.render('pages/login', { message: 'Invalid email or password.' })
      res.sendStatus(401) // Send a 401 Unauthorized response
    }
  })

  .get('/home', async (req, res) => {
    const userId = req.session.userId // get userId from session
    const title = 'Home Page'
    const content = '<h1>Welcome to my website</h1>'
    const sql = 'SELECT * FROM trip WHERE customerid = $1;'
    const trips = await query(sql, [userId])
    console.log(trips)
    res.render('pages/index', { title, content, userId, trips })
  })

  .get('/about', (req, res) => {
    const userId = req.session.userId // get userId from session
    const title = 'About Us'
    const content = '<h1>About Us</h1>'
    res.render('pages/about', { title, content, userId })
  })

  // Handle the POST request to save a new trip
  .post('/api/trips', async (req, res) => {
    // Extract the trip name and note from the request body
    const tripName = req.body.name
    const tripNote = req.body.note
    const userId = req.body.customerId

    // Insert the new trip into the database
    const sql = 'INSERT INTO trip (trip_name, note, customerid) VALUES ($1, $2, $3)'
    const params = [tripName, tripNote, userId]
    try {
      console.log(sql)
      await query(sql, params)
      res.status(200).send('New trip inserted successfully')
    } catch (err) {
      console.error(err)
      res.status(500).send('Error inserting new trip into database')
    }
  })

  .post('/api/addStop', async (req, res) => {
    // Extract the trip name and note from the request body
    const tripId = req.body.tripId
    const stopName = req.body.stopName
    const note = req.body.note
    const longitude = req.body.longitude
    const latitude = req.body.latitude
    const location = req.body.location

    // Insert the new trip into the database
    const sql = 'INSERT INTO tripstop (tripid, stop_name, note, longitude, latitude, location) VALUES ($1, $2, $3, $4, $5, $6);'
    const params = [tripId, stopName, note, longitude, latitude, location]
    try {
      console.log(sql)
      await query(sql, params)
      res.status(200).send('New trip stop inserted successfully')
    } catch (err) {
      console.error(err)
      res.status(500).send('Error inserting new trip stop into database')
    }
  })

  .post('/api/deleteTrip', async (req, res) => {
    const tripId = req.body.tripId

    const sql1 = 'DELETE FROM tripstop WHERE tripid = $1;'
    const sql2 = 'DELETE FROM trip WHERE tripid = $1;'
    const params = [tripId]
    try {
      await query(sql1, params)
      await query(sql2, params)
      res.status(200).send('Trip deleted!')
    } catch (err) {
      console.error(err)
      res.status(500).send('Error deleting trip')
    }
  })

  .get('/api/get_trip_stops', async (req, res) => {
    const tripId = req.query.tripId

    const sql = 'SELECT * FROM tripstop WHERE tripid = $1;'
    const params = [tripId]

    try {
      const tripStops = await query(sql, params)
      res.json({ tripStops: tripStops })
    } catch (err) {
      console.error(err)
      res.status(500).send('Error getting trip stops')
    }
  })

  .use((req, res) => {
    res.status(404).render('pages/error', {})
  }) // error-handling
  .listen(PORT, () => console.log(`Listening on ${PORT}`))
