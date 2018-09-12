const mongoose = require('mongoose')

// Connect to MongoDB
mongoose.connect(`mongodb://${process.env.NODE_ENV === 'test'
  ? `${process.env.DB_STRING}Test`
  : process.env.DB_STRING}`, { useNewUrlParser: true })
mongoose.set('useCreateIndex', true)
const db = mongoose.connection

// Handle mongo connection error
db.on('error', (err) => console.error('Connection error:', err.message))
db.once('open', () => console.info('Connected to MongoDB'))

module.exports = database = db