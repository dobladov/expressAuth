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

// UserSchema.statics.authenticate = async (username, password) => {

//   try {
//     const user = await User.findOne({}).exec()

//     if (user) {


//     }


//   } catch (error) {
//     const err = error
//     err.status = 401
//     throw err
//   }


//   await User.findOne({ username })
//     .exec((error, user) => {

//       if (error) {
//         return callback(error)
//       } else if (!user) {
//         const err = new Error('User not found.')
//         err.status = 401
//         return callback(err)
//       }

//       if (user.verified === false) {
//         return callback(null, false, user)
//       }

//       if (user.enabled === false) {
//         const err = new Error('User not active.')
//         err.status = 401
//         return callback(err)
//       }

//       bcrypt.compare(password, user.password, (error, result) => {
//         if (result === true) {
//           return callback(null, null, user)
//         } else {
//           const err = new Error('Wrong email or password.')
//           err.status = 401
//           return callback(err)
//         }
//       })
//     })
// }

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

// UserSchema.statics.authenticate = (username, password, callback) => {
//   User.findOne({ username })
//     .exec((error, user) => {

//       if (error) {
//         return callback(error)
//       } else if (!user) {
//         const err = new Error('User not found.')
//         err.status = 401
//         return callback(err)
//       }

//       if (user.verified === false) {
//         return callback(null, false, user)
//       }

//       if (user.enabled === false) {
//         const err = new Error('User not active.')
//         err.status = 401
//         return callback(err)
//       }

//       bcrypt.compare(password, user.password, (error, result) => {
//         if (result === true) {
//           return callback(null, null, user)
//         } else {
//           const err = new Error('Wrong email or password.')
//           err.status = 401
//           return callback(err)
//         }
//       })
//     })
// }

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


UserSchema.statics.reset = (email, callback) => {
  User.findOne({ email })
    .exec((error, user) => {
      if (error) {
        return callback(error)
      } else if (!user) {
        const err = new Error('User not register')
        err.status = 401
        return callback(err)
      } else {

        const resetCode = uuidv4()

        User.findOneAndUpdate({email}, {$set: {resetCode:resetCode}}, false)
          .exec((error, user) => {
            if (error) {
              console.warn(error)
            } else if (user) {
              Email.send(
                email,
                "Reset Link ✔",
                `Go to http://localhost:3000/reset?code=${resetCode} to reset your account password`,
                `<b>Follow
                  <a href="http://localhost:3000/reset?code=${resetCode}">this link</a>
                  to reset your account password</b>`)
                .then(info =>  console.info(info))
                .catch(error =>  console.warn(error))
              return callback(null, user)
          }
        })
      }
    })
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

UserSchema.statics.renewal = (credentials, callback) => {

  bcrypt.hash(credentials.newPassword, 10, (error, newPassword) => {

    User.findByIdAndUpdate(credentials.userId, {}, false)
      .exec((error, user) => {
        if (error) {
          return callback(error)
        } else if (!user) {
          const err = new Error('No user with this id.')
          err.status = 404
          return callback(err)
        } else if (user) {

          bcrypt.compare(credentials.oldPassword, user.password, (error, result) => {
            if (result === true) {

              User.findByIdAndUpdate(credentials.userId, {$set: {password: newPassword}}, false)
                .exec((error, user) => {
                  if (error) {
                    return callback(error)
                  }
                  return callback(null, user)
              })

            } else {
              const err = new Error('Wrong old password')
              err.status = 401
              return callback(err)
            }
          })
        }
      })
    })
}

UserSchema.statics.resetPassword = (code, callback) => {

  const newPassword = generatePassword()
  const hash = bcrypt.hash(newPassword, 10, (err, hash) => {

    User.findOneAndUpdate({resetCode: code}, {$set: {password: hash, resetCode: null}}, false)
    .exec((err, user) => {
      if (err) {
        console.warn(err)
      } else if (!user) {
        const err = new Error('No user with this code.')
        err.status = 404
        return callback(err)
      } else if (user) {
        Email.send(
          user.email,
          "New password ✔",
          `Your new password is ${newPassword}`,
          `Your new password is <b>${newPassword}</b>`)
          .then(info =>  console.info(info))
          .catch(error =>  console.warn(error))
        return callback(null, newPassword)
      }
    })
  })
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

