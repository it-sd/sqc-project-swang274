// require('dotenv').config() // Read environment variables from .env
const express = require('express')
const path = require('path')
const PORT = process.env.PORT || 5163
const app = express()
app
  .use(express.static('static'))// set "static" directory as a static directory
  .use(express.static(path.join(__dirname, 'static')))
  .use(express.json())
  .use(express.urlencoded({ extended: true }))
  .set('views', path.join(__dirname, 'views'))
  .set('view engine', 'ejs')
  .get('/health', (req, res) => {
    res.status(200).send('healthy')
  })
  .get('/', function (req, res) {
    res.render('pages/index', '')
  })
  .get('/about', function (req, res) {
    res.render('pages/about', '')
  })
  .listen(PORT, () => console.log(`Listening on ${PORT}`))
