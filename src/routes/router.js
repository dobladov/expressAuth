const router = require('express').Router()
const uuidv4 = require('uuid/v4')

const User = require('../models/user')
const Email = require('../email')

function requiresLogin(req, res, next) {
  if (req.session && req.session.userId) {
    return next()
  } else {
    const err = new Error('You must be logged in to view this page.')
    err.status = 401
    return next(err)
  }
}

router.get('/test', (req, res, next) => {
  res.render('info', { code: 404, message: 'Hello there!'})
})

router.get('/', (req, res, next) => {
  res.render('user', { title: ' - Login - Register', user: (req.session && req.session.userId) || null })
})

router.post('/', (req, res, next) => {

  if (req.body.password !== req.body.passwordConf) {
    const err = new Error('Passwords do not match')
    err.status = 400
    return next(err)
  }

  if (req.body.email &&
    req.body.username &&
    req.body.password &&
    req.body.passwordConf) {

    const verifyCode = uuidv4()

    const userData = {
      email: req.body.email,
      username: req.body.username,
      password: req.body.password,
      verifyCode
    }

    User.checkUser(req.body.email, req.body.username, (error, validated, user) => {

        if (error) {
          return next(error)
        } else if (validated) {
          res.render('info', { message: 'This user is already register' })
        } else if (validated === false && user) {
          res.render('info', { message: `This user is not validated <a href="/resend?username=${user.username}">Resend email</a>` })
        } else if (!user) {

          User.create(userData, (error, user) => {
            if (error) {
              return next(error)
            } else {
              Email.send(
                req.body.email,
                `Hello ${userData.username}`,
                `Go to http://localhost:3000/verify?token=${verifyCode} to verify your account`,
                `<b>Follow
                  <a href="http://localhost:3000/verify?token=${verifyCode}">this link</a> to verify your account</b>`,
                ).catch(error =>  console.warn(error))
              res.render('info', { message: `A message was sent to ${req.body.email}. Go to your email to verify your account` })
            }
          })
        }
    })
  } else if (req.body.logUsername && req.body.logPassword) {
    User.authenticate(req.body.logUsername, req.body.logPassword, (error, verified, user) => {
      if (error || !user) {
        const err = new Error(error)
        err.status = 401
        return next(err)
      } else if (verified === false && user) {
        res.render('info', { message: `This user is not validated <a href="/resend?username=${user.username}">Resend email</a>` })
      } else {
        req.session.userId = user._id
        return res.redirect('/profile')
      }
    })
  } else {
    const err = new Error('All fields required.')
    err.status = 400
    return next(err)
  }
})

router.get('/resend', (req, res, next) => {

  if (req.query.username) {

    User.checkUser('', req.query.username, (error, validated, user) => {

      if (error) {
        return next(error)
      } else if (validated) {
        res.render('info', { message: `This user is already verified` })
      } else if (validated === false && user) {
        Email.send(
          user.email,
          `Hello ${user.username}`,
          `Go to http://localhost:3000/verify?token=${user.verifyCode} to verify your account`,
          `<b>Follow
            <a href="http://localhost:3000/verify?token=${user.verifyCode}">this link</a> to verify your account</b>`,
          ).catch(error =>  console.warn(error))

        res.render('info', { message: `An email to validated your account was sent to <b>${user.email}</b>` })
      } else if (!user) {
        res.render('info', { message: `There are no user with this username` })
      }
    })

  } else {
    const err = new Error('A username is required')
    err.status = 400
    return next(err)
  }

})

router.get('/verify', (req, res, next) => {

  const token = req.query.token

  if (token) {
    User.verify(token, (error, user) => {
      if (error || !user) {
        const err = new Error(error)
        err.status = 403
        return next(err)
      } else {
        req.session.userId = user._id
        res.render('info', { message: `Verification Correct, go to your profile <a type="button" href="/profile">Profile</a>` })
        // return res.redirect('/profile')
      }
    })
  } else {
    const err = new Error('Token not present')
    err.status = 499
    return next(err)
  }
})

// GET route after registering
router.get('/profile', requiresLogin, (req, res, next) => {

  User.findById(req.session.userId)
    .exec((error, user) => {
      if (error) {
        return next(error)
      } else if (user !== null) {
        return res.render('profile', {user})
      }
    })
})

router.get('/reset', (req, res, next) => {

  if (req.query.code) {
    User.resetPassword(req.query.code, (error, newPassword) => {
      if (error) {
        return next(error)
      } else {
        res.render('info', { message: `Your new password is <b>${newPassword}</b>` })
      }
    })
  } else {
    res.render('reset')
  }
})

router.post('/reset', (req, res, next) => {

  if (!req.body.email) {
    res.render('info', { message: 'Email is a required field' })
  } else {
    User.reset(req.body.email, (error, user) => {
      if (error) {
        return next(error)
      } else {
        res.render('info', { message: 'Go to your email to reset your password' })
      }
    })
  }
})

router.get('/changePassword', requiresLogin, (req, res, next) => {
  res.render('changePassword')
})

router.post('/changePassword', requiresLogin, (req, res, next) => {

  if (req.body.newPassword &&
    req.body.repeatPassword &&
    req.body.oldPassword) {

    if (req.body.newPassword === req.body.oldPassword) {
      const err = new Error(`Your new password can't be the same as your old password`)
      err.status = 400
      return next(err)
    }

    if (req.body.newPassword === req.body.repeatPassword) {
      User.changePassword({newPassword: req.body.newPassword, oldPassword: req.body.oldPassword, userId: req.session.userId}, (err, user) => {
        if (err) {
          return next(err)
        } else {
          req.session.destroy(error => {
            if (error) {
              return next(error)
            } else {
              res.render('info', { message: `Password changed correctly <a href="/">Go to Login</a>` })
            }
          })
        }
      })
    } else {
      const err = new Error(`Passwords don't match`)
      err.status = 400
      return next(err)
    }
  } else {
    const err = new Error(`All fields are required`)
    err.status = 400
    return next(err)
  }
})

router.get('/logout', (req, res, next) => {

  if (req.session) {
    req.session.destroy(err => {
      if (err) {
        return next(err)
      } else {
        return res.redirect('/')
      }
    })
  }
})

module.exports = router