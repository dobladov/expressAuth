const dotenv = require('dotenv')
const assert = require('assert')

dotenv.config()

const User = require('../src/models/user')
const dummyUser = require('./resources/dummyUser')

require('../src/database')

describe('User Model', () => {

  describe('User Cycle', () => {

    it ('Should fail with an inexistan user', async () => {
      try {
        await User.deleteOne({ username: dummyUser.username })
        await User.authenticate(dummyUser.username, dummyUser.password)
        assert.fail()
      } catch (error) {
        assert.equal(error.message, 'User not found')
      }
    })

    it ("Should create a new user", async () => {
      try {
        const user = await User.register(
          dummyUser.email,
          dummyUser.username,
          dummyUser.password,
          dummyUser.verifyCode
        )
        assert.ok(user._id)
      } catch (error) {
        assert.fail(error)
      }
    })

    it ("Should fail creating the same user", async () => {
      try {
        await User.register(
          dummyUser.email,
          dummyUser.username,
          dummyUser.password,
          dummyUser.verifyCode
        )
        assert.fail()
      } catch (error) {
        assert.equal(error.code, 11000) // Mongo code for duplicate
      }
    })

    it ('Should return error with a user not verified', async () => {
      try {
        const a = await User.authenticate(dummyUser.username, dummyUser.password)
        assert.fail()
      } catch (error) {
        assert.equal(error.message, 'User not verified')
      }
    })

    it ('Should return error with a wrong token', async () => {
      try {
        const user = await User.verification('wrongtoken')
        assert.fail()
      } catch (error) {
        await User.verification(dummyUser.verifyCode) // Verify user here
        assert.equal(error.message, 'Token not found')
      }
    })

    it ('Should return error with a user not enabled', async () => {
      try {
        await User.findOneAndUpdate({username: dummyUser.username}, {enabled: false}, false) // Disable user
        await User.authenticate(dummyUser.username, dummyUser.password)
        assert.fail()
      } catch (error) {
        await User.findOneAndUpdate({username: dummyUser.username}, {enabled: true}, false) // Enable user
        assert.equal(error.message, 'User not enabled')
      }
    })

    it ('Should return error with a user with a wrong password', async () => {
      try {
        await User.authenticate(dummyUser.username, 'wrongpassword')
        assert.fail()
      } catch (error) {
        assert.equal(error.message, 'Wrong username or password')
      }
    })

    it('Should return a valid user', async () => {
      try {
        const user = await User.authenticate(dummyUser.username, dummyUser.password)
        assert.ok(user._id)
      } catch (error) {
        assert.fail(error)
      }
    })

  })
})
