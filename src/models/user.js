const mongoose = require('mongoose')
const bcrypt = require('bcrypt')
const uuidv4 = require('uuid/v4')
const generatePassword = require('password-generator')
const Email = require('../email')

const UserSchema = new mongoose.Schema({
  email: {
    type: String,
    unique: true,
    required: true,
    trim: true
  },
  username: {
    type: String,
    unique: true,
    required: true,
    trim: true
  },
  password: {
    type: String,
    required: true,
  },
  verifyCode: {
    type: String,
    required: true
  },
  verified: {
    type: Boolean,
    default: false
  },
  resetCode: {
    type: String,
    default: null
  },
  enabled: {
    type: Boolean,
    default: true
  }
})

UserSchema.statics.authenticate = async (username, password) => {

  const user = await User.findOne({ username }).exec()

  if (!user) {
    throw new Error('User not found')
  }

  if (user && user.verified === false) {
    throw new Error('User not verified')
  }

  if (user && user.enabled === false) {
    throw new Error('User not enabled')
  }

  const match = await bcrypt.compare(password, user.password)

  if (match === true) {
    return user
  } else {
    throw new Error('Wrong username or password')
  }

}

UserSchema.statics.verification = async (token) => {

  try {
    const user = await User.findOne({ verifyCode: token }).exec()

    if (!user) {
      const err = new Error('Token not found')
      err.status = 400
      throw err
    } else {

      if (user.verified === true) {
        const err = new Error('This profile was already verified')
        err.status = 401
        throw err
      } else {
        try {
          return User.findByIdAndUpdate(user._id, {verified: true}, false)
        } catch (error) {
          throw error
        }
      }
    }
  } catch (error) {
    throw error
  }

}


UserSchema.statics.reset = async (email) => {

  try {
    const user = await User.findOne({ email }).exec()

    if (!user) {
      const err = new Error('User not register')
      err.status = 401
      throw err
    } else {
      const resetCode = uuidv4()

      try {
        await User.findOneAndUpdate({email}, {$set: {resetCode:resetCode}}, false).exec()
        try {
          await Email.send(
            email,
            "Reset Link ✔",
            `Go to http://localhost:3000/password/reset?code=${resetCode} to reset your account password`,
            `<b>Follow
              <a href="http://localhost:3000/password/reset?code=${resetCode}">this link</a>
              to reset your account password</b>`)
        } catch (error) {
          console.warn(error)
        }
        return email
      } catch (error) {
        throw error
      }
    }
  } catch (error) {
    throw error
  }
}


UserSchema.statics.checkUser = async (email, username) => {

  try {
    return await User.findOne({$or: [{ email }, { username }]})
  } catch (error) {
    throw error
  }
}

UserSchema.statics.renewal = async (credentials) => {

  try {
    const newPassword = await bcrypt.hash(credentials.newPassword, 10)
    const user = await User.findByIdAndUpdate(credentials.userId, {}, false).exec()

    if (!user) {
      const err = new Error('No user with this id.')
      err.status = 404
      throw err
    } else {
      const result = await bcrypt.compare(credentials.oldPassword, user.password)

      if (result === true) {
        await User.findByIdAndUpdate(credentials.userId, {$set: {password: newPassword}}, false)
      } else {
        const err = new Error('Wrong old password')
        err.status = 401
        throw err
      }
    }

  } catch (error) {
    throw error
  }
}

UserSchema.statics.resetPassword = async (token) => {

  const newPassword = generatePassword()
  const hash = await bcrypt.hash(newPassword, 10)

  try {
    const user = await User.findOneAndUpdate({resetCode: token}, {$set: {password: hash, resetCode: null}}, false).exec()

    if (!user) {
      const err = new Error('No user with this code.')
      err.status = 404
      throw err
    } else {
      try {
        await Email.send(
          user.email,
          "New password ✔",
          `Your new password is ${newPassword}`,
          `Your new password is <b>${newPassword}</b>`)
      } catch (error) {
        console.warn(error)
      }
      return newPassword
    }
  } catch (error) {
    throw error
  }
}


UserSchema.statics.register = async (email, username, password, verifyCode) => {

  try {
    return User.create({email, username, password, verifyCode})
  } catch (error) {
    const err = new Error('Error creating the user.')
    err.status = 400
    throw err
  }
}


// Hashing the password before saving it to the database
UserSchema.pre('save', function (next) {
  const user = this

  bcrypt.hash(user.password, 10, (err, hash) => {
    if (err) {
      return next(err)
    }
    user.password = hash
    next()
  })
})

const User = mongoose.model('User', UserSchema)
module.exports = User

