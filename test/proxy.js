const { extractCredentials } = require('../src/proxy')
const assert = require('assert')

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
})