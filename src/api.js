const express = require('express')
const app = express()
const bodyParser = require('body-parser')
const session = require('express-session')
const MongoStore = require('connect-mongo')(session)
const routes = require('./routes/router')
const db = require('./database')

app.set('views', __dirname + '/views')
app.set('view engine', 'pug')

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
  const json = (req.headers.accept && req.headers.accept.includes('application/json')) || false
  res.status(err.status || 500)
  json
    ? res.json({ code: err.status, message: err.message })
    :res.render('info', { code: err.status, message: err.message })
})

// listen on port 3000
app.listen(
  process.env.SERVER_PORT,
  process.env.SERVER_HOST,
  () => console.info(`Express app listening on port http://${process.env.SERVER_HOST}:${process.env.SERVER_PORT}`)
)