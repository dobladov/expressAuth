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
          const updatedUser = User.findByIdAndUpdate(user._id, {verified: true}, false)
          return updatedUser
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
        Email.send(
          email,
          "Reset Link ✔",
          `Go to http://localhost:3000/password/reset?code=${resetCode} to reset your account password`,
          `<b>Follow
            <a href="http://localhost:3000/password/reset?code=${resetCode}">this link</a>
            to reset your account password</b>`)
          .then(info =>  console.info(info))
          .catch(error =>  console.warn(error))
          return email
      } catch (error) {
        throw error
      }
    }
  } catch (error) {
    throw error
  }
}


UserSchema.statics.checkUser = (email, username, callback) => {

  User.findOne({$or: [{ email }, { username }]}, (error, user) => {
    if (error) {
      return callback(error)
    } else if (user && user.verified) {
      console.info("User already register")
      return callback(null, true, user)
    } else if (user && !user.verified) {
      console.info("User not verified")
      return callback(null, false, user)
    } else {
      console.info("No user found")
      return callback(null, null, null)
    }
  })
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
    console.log(token);

    const user = await User.findOneAndUpdate({resetCode: token}, {$set: {password: hash, resetCode: null}}, false).exec()

    if (!user) {
      const err = new Error('No user with this code.')
      err.status = 404
      throw err
    } else {
      Email.send(
        user.email,
        "New password ✔",
        `Your new password is ${newPassword}`,
        `Your new password is <b>${newPassword}</b>`)
        .then(info =>  console.info(info))
        .catch(error =>  console.warn(error))
      return newPassword
    }
  } catch (error) {
    throw error
  }

  //   User.findOneAndUpdate({resetCode: token}, {$set: {password: hash, resetCode: null}}, false)
  //   .exec((err, user) => {
  //     if (err) {
  //       console.warn(err)
  //     } else if (!user) {
  //       const err = new Error('No user with this code.')
  //       err.status = 404
  //       return callback(err)
  //     } else if (user) {
  //       Email.send(
  //         user.email,
  //         "New password ✔",
  //         `Your new password is ${newPassword}`,
  //         `Your new password is <b>${newPassword}</b>`)
  //         .then(info =>  console.info(info))
  //         .catch(error =>  console.warn(error))
  //       return callback(null, newPassword)
  //     }
  //   })
}


UserSchema.statics.register = async (email, username, password, verifyCode) => {

  try {
    const user = User.create({email, username, password, verifyCode})
    return user
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

