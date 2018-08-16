const express = require('express')
const app = express()
const bodyParser = require('body-parser')
const mongoose = require('mongoose')
const session = require('express-session')
const MongoStore = require('connect-mongo')(session)
const dotenv = require('dotenv')
const routes = require('./routes/router')

dotenv.config()
app.set('views', __dirname + '/views')
app.set('view engine', 'pug')


// Connect to MongoDB
mongoose.connect(`mongodb://${process.env.DB_STRING}`, { useNewUrlParser: true })
const db = mongoose.connection

// Handle mongo connection error
db.on('error', (err) => console.error('Connection error:', err.message))
db.once('open', () => console.info('Connected to MongoDB'))

// Use sessions for tracking logins
app.use(session({
  secret: process.env.SESSION_SECRET,
  resave: true,
  saveUninitialized: false,
  store: new MongoStore({
    mongooseConnection: db
  })
}))

// Parse incoming requests
app.use(bodyParser.json())
app.use(bodyParser.urlencoded({ extended: false }))

// Serve static files from template
app.use(express.static(__dirname + '/public'))

// Include routes
app.use('/', routes)

// Catch 404 and forward to error handler
app.use((req, res, next) => {
  const err = new Error('404: File Not Found')
  err.status = 404
  next(err)
})

// Error handler
app.use((err, req, res, next) => {
  res.status(err.status || 500)
  res.render('info', { code: err.status, message: err.message })

})

// listen on port 3000
app.listen(
  process.env.SERVER_PORT,
  process.env.SERVER_HOST,
  () => console.info(`Express app listening on port http://${process.env.SERVER_HOST}:${process.env.SERVER_PORT}`)
)