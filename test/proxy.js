const dotenv = require('dotenv')
const assert = require('assert')
const { extractCredentials, checkPermission, getTarget, targets } = require('../src/proxy')
const dummyUser = require('./resources/dummyUser')
const Groups = require('../src/models/groups')

dotenv.config()

require('../src/database')

const authorization = "Basic dGVzdGluZ2RldjpwYXNz"

describe('Proxy', () => {

  describe('Extract credentials', () => {

    it ('Should fail withouth variable', async () => {
      try {
        await extractCredentials()
        assert.fail()
      } catch (error) {
        assert.equal(error.message, 'Credentials not provided')
      }
    })

    it ('Should fail return the credentials', async () => {
      try {
        await extractCredentials('testing:pass')
        assert.fail()
      } catch (error) {
        assert.equal(error.message, 'Error paring username/password')
      }
    })

    it ('Should succeed returning the credentials', async () => {
      try {
        const {username, password} = await extractCredentials(authorization)
        assert.equal(username, 'testingdev')
        assert.equal(password, 'pass')
      } catch (error) {
        assert.fail()
      }
    })

  })

  describe('Check Permission', () => {

    it ('Should respond with the correct check', async () => {
      assert.equal(await checkPermission(null, "Require valid-user"), false)
      assert.equal(await checkPermission(dummyUser, "Require valid-user"), true)

      assert.equal(await checkPermission(null, "Require all granted"), true)
      assert.equal(await checkPermission(null, "Require all denied"), false)
      assert.equal(await checkPermission(dummyUser, "Require all granted"), true)
      assert.equal(await checkPermission(dummyUser, "Require all denied"), false)

      assert.equal(await checkPermission(dummyUser, "Require user fakeuser"), false)
      assert.equal(await checkPermission(dummyUser, "Require user testuser"), true)

      await Groups.deleteMany()
      await await Groups.addGroup('dummyGroup', [dummyUser.username])
      assert.equal(await checkPermission(dummyUser, "Require grpup fakegroup"), false)
      assert.equal(await checkPermission(dummyUser, "Require group dummyGroup"), true)
      await Groups.deleteMany()
    })
  })

  describe('Check for get Target', () => {

    it ('Should return a route to /', async () => {
      const route = await getTarget('/', 'GET', {}, targets)
      assert.equal(route.href, 'http://localhost:3000/')
    })

    it ('Should throw error no route', async () => {
      try {
        await getTarget('/wrongroute', 'GET', {}, targets)
        assert.fail()
      } catch (error) {
        assert.equal(error.message, 'No targets to /wrongroute')
      }
    })

    it ('Should retrunr a route to /posts/12345', async () => {
        const route = await getTarget('/page/12345', 'GET', {
          accept: 'application/json'
        }, targets)
        assert.equal(route.href, 'http://localhost:3000/posts/12345')
    })

    it ('Should throw error because the header is not pressent', async () => {
      try {
        await getTarget('/page/12345', 'GET', {}, targets)
        assert.fail()
      } catch (error) {
        assert.equal(error.message, 'No targets to /page/12345')
      }
    })
  })
})