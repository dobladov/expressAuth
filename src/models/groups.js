const mongoose = require('mongoose')

const GroupsSchema = new mongoose.Schema({
  name: {
    type: String,
    unique: true,
    required: true,
    trim: true
  },
  members: {
    type: Array,
    default: []
  }
})

GroupsSchema.statics.getGroups = async () => {
  try {
    return await Groups.find({}).exec()
  } catch (error) {
    throw error
  }
}

GroupsSchema.statics.addGroup = async (group, members) => {

  // CHECK IF EVERY MEMBER EXIST?

  try {
    return await Groups.create({name: group, members: members || []}) // fail if already exists
  } catch(error) {
    throw error
  }
}

GroupsSchema.statics.addMember = async (group, username) => {

  // CHECK IF THE USER EXISTS?

  const foundGroup = await Groups.findOne({name:group}).exec()

  if (!foundGroup) {
    throw "Group does not exists"
  } else if (foundGroup.members.includes(username)) {
    throw 'User already in group'
  } else if (!foundGroup.members.includes(username)) {
    try {
      return await Groups.findByIdAndUpdate(foundGroup._id, { members: foundGroup.members.concat(username) }).exec()
    } catch (error) {
      throw error
    }
  }
}

GroupsSchema.statics.removeMember = async (group, member) => {
  // Get group with the member
  const foundGroup = await Groups.findOne({name: group, members: { $in: [member] }}).exec()

  if (!foundGroup) {
    throw 'No groups found with this member'
  } else {
    await Groups.findByIdAndUpdate(foundGroup._id, { members: foundGroup.members.remove(member)}).exec()
  }
}

GroupsSchema.statics.getUserGroups = async (username) => {
  try {
    return await Groups.find({ members: { $in: [username] } }).exec()
  } catch (error) {
    throw error
  }
}

// Refacto to only return boolean if the user is in the group
GroupsSchema.statics.getUserInGroup = async (username, group) => {
  try {
    return await Groups.find({name : group, members: { $in: [username] } }).exec()
  } catch (error) {
    throw error
  }
}

GroupsSchema.statics.getUsersInGroup = async (group) => {
  try {
    const foundGroup = await Groups.findOne({name : group}).exec()

    if (foundGroup) {
      return foundGroup.members
    } else {
      throw "Group not found"
    }
  } catch (error) {
    throw error
  }
}

const Groups = mongoose.model('Groups', GroupsSchema)
module.exports = Groups