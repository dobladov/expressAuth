const assert = require('assert')
const dotenv = require('dotenv')
dotenv.config()

const Routes = require('../src/models/routes')
const dummyRoutes = require('./resources/dummyRoutes')

require('../src/database')

describe('Routes Model', async () => {

  it ('Should delete all routes and create and empty array', async () => {
    try {
      await Routes.deleteMany()
      const allRoutes = await Routes.create({routes: []})
      assert(allRoutes.routes)
    } catch (error) {
      assert.fail(error)
    }
  })

  it ('Should set new routes', async () => {
    try {
      const allRoutes = await Routes.setRoutes(dummyRoutes)
      assert(allRoutes._id)
    } catch (error) {
      assert.fail(error)
    }
  })

  it ('Should get all routes', async () => {
    try {
      const allRoutes = await Routes.getRoutes()
      assert.ok(allRoutes.routes)
    } catch (error) {
      assert.fail(error)
    }
  })

})
