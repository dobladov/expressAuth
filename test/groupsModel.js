const dotenv = require('dotenv')
dotenv.config()

// const User = require('../src/models/user')
const Groups = require('../src/models/groups')

const dummyUser = require('./resources/dummyUser')
const dummyGroup = 'dummyGroup'

const assert = require('assert')

require('../src/database')

describe('Groups Model', () => {

  it ('Should get all groups', async () => {
    try {
      await Groups.deleteMany()
      const groups = await Groups.getGroups()
      assert.ok(groups)
    } catch (error) {
      assert.fail(error)
    }
  })

  // add test for group with multiple users
  it ('Should add a group', async () => {
    try {
      await Groups.deleteOne({ name: dummyGroup })
      const group = await Groups.addGroup(dummyGroup)
      assert.ok(group)
    } catch (error) {
      assert.fail(error)
    }
  })

  it ('Should add a user to a group', async () => {
    try {
      const group = await Groups.addMember(dummyGroup, dummyUser.username)
      assert.ok(group)
    } catch (error) {
      assert.fail(error)
    }
  })

  it ('Should fail user already in group', async () => {
    try {
      await Groups.addMember(dummyGroup, dummyUser.username)
    } catch (error) {
      assert.ok(error === 'User already in group')
    }
  })

  it ('Should fail adding member, group does not exists', async () => {
    try {
      await Groups.addMember("wrongGroup", dummyUser.username)
    } catch (error) {
      assert.ok(error === 'Group does not exists')
    }
  })

  it ('Should remove a member from the group', async () => {
    try {
      await Groups.removeMember(dummyGroup, dummyUser.username)
      const group = await Groups.findOne({name: dummyGroup}).exec()
      assert.ok(!group.members.includes(dummyUser.username))
    } catch (error) {
      assert.fail(error)
    }
  })

  it ('Should fail removing member, group does not exists ', async () => {
    try {
      await Groups.removeMember("wrongGroup", dummyUser.username)
      assert.fail()
    } catch (error) {
      assert.ok(error === 'No groups found with this member')
    }
  })

  it ('Should fail removing member, group does not contain this member ', async () => {
    try {
      await Groups.removeMember(dummyGroup, 'wrongusername')
      assert.fail()
    } catch (error) {
      assert.ok(error === 'No groups found with this member')
    }
  })


  it ('Should get all groups with the user and be empty', async () => {
    try {
      const groups = await Groups.getUserGroups(dummyUser.username)
      assert.ok(groups.length === 0)
    } catch (error) {
      assert.fail(error)
    }
  })

  it ('Should get one group with the user', async () => {
    try {
      await Groups.addMember(dummyGroup, dummyUser.username)
      const groups = await Groups.getUserGroups(dummyUser.username)
      assert.ok(groups)
    } catch (error) {
      assert.fail(error)
    }
  })

  it ('Should get all users in a group', async () => {
    try {
      const users = await Groups.getUsersInGroup(dummyGroup)
      assert.ok(users.includes(dummyUser.username))
    } catch (error) {
      assert.fail(error)
    }
  })

  it ('Should fail, group not found', async () => {
    try {
      await Groups.getUsersInGroup('wrongGroup')
      assert.fail()
    } catch (error) {
      assert.ok(error === 'Group not found')
    }
  })

})
