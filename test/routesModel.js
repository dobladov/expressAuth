const dotenv = require('dotenv')
dotenv.config()

const Routes = require('../src/models/routes')

const dummyRoutes = [
  {
      "permissions" : [
          "Require user testingdev"
      ],
      "url" : "/",
      "method" : "GET"
  },
  {
      "permissions" : [
          "Require valid-user"
      ],
      "url" : "/log/",
      "method" : "GET"
  },
  {
      "permissions" : [
          "Require all denied"
      ],
      "url" : "/",
      "method" : "POST"
  },
  {
      "permissions" : [
          "Require user literaymachine"
      ],
      "url" : "/literaymachine/",
      "method" : "POST"
  }
]

const assert = require('assert')

require('../src/database')

describe('Routes Model', async () => {

  it ('Should delete all routes and create and empty array', async () => {
    try {
      await Routes.remove()
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
