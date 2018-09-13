const assert = require('assert')
const { extractCredentials, checkPermission } = require('../src/proxy')
const dummyUser = require('./resources/dummyUser')

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

      // Add checks for requires group
    })
  })
})