const router = require('express').Router()
const uuidv4 = require('uuid/v4')

const User = require('../models/user')
const Groups = require('../models/groups')
const Routes = require('../models/routes')

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

router.get('/', (req, res, next) => {

  const json = (req.headers.accept && req.headers.accept.includes('application/json')) || false

  json
    ? res.json({messge: "Loading home"})
    : res.render('home', { title: ' - Home', user: (req.session && req.session.userId) || null })
})

router.get('/registration', (req, res, next) => {
  res.render('registration', { title: ' - Registration', user: (req.session && req.session.userId) || null })
})

router.post('/registration', (req, res, next) => {

  const json = (req.headers.accept && req.headers.accept.includes('application/json')) || false

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

    User.checkUser(req.body.email, req.body.username, async (error, validated, user) => {

        if (error) {
          return next(error)
        } else if (validated) {
          json
            ? res.json({ message: 'This user is already register' })
            : res.render('info', { message: 'This user is already register' })
        } else if (validated === false && user) {
          json
            ? res.json({ message: `This user is not validated got to /resend?username=${user.username}" to Resend email` })
            : res.render('info', { message: `This user is not validated <a href="/resend?username=${user.username}">Resend email</a>` })
        } else if (!user) {

          try {
            const user = await User.register(
              userData.email,
              userData.username,
              userData.password,
              userData.verifyCode
            )

            if (user) {
              Email.send(
                req.body.email,
                `Hello ${userData.username}`,
                `Go to http://localhost:3000/verification?token=${verifyCode} to verify your account`,
                `<b>Follow
                  <a href="http://localhost:3000/verification?token=${verifyCode}">this link</a> to verify your account</b>`,
              ).catch(error =>  console.warn(error))

              json
                ? res.json({ message: `A message was sent to ${req.body.email}. Go to your email to verify your account`})
                : res.render('info', { message: `A message was sent to ${req.body.email}. Go to your email to verify your account` })
            }

          } catch (error) {
            next(error)
          }
        }
    })
  }

  // NOT USING AUTH FROM UI SO IT'S COMMENTED FOR NOW
  // else if (req.body.logUsername && req.body.logPassword) {
  //   User.authenticate(req.body.logUsername, req.body.logPassword, (error, verified, user) => {
  //     if (error || !user) {
  //       const err = new Error(error)
  //       err.status = 401
  //       return next(err)
  //     } else if (verified === false && user) {
  //       res.render('info', { message: `This user is not validated <a href="/resend?username=${user.username}">Resend email</a>` })
  //     } else {
  //       req.session.userId = user._id
  //       return res.redirect('/profile')
  //     }
  //   })
  // }
   else {
    const err = new Error('All fields required.')
    err.status = 400
    return next(err)
  }
})

router.get('/resend', (req, res, next) => {

  const json = (req.headers.accept && req.headers.accept.includes('application/json')) || false

  if (req.query.username) {

    User.checkUser('', req.query.username, (error, validated, user) => {

      if (error) {
        return next(error)
      } else if (validated) {
        json
          ? res.json({ message: `This user is already verified` })
          : res.render('info', { message: `This user is already verified` })
      } else if (validated === false && user) {
        Email.send(
          user.email,
          `Hello ${user.username}`,
          `Go to http://localhost:3000/verify?token=${user.verifyCode} to verify your account`,
          `<b>Follow
            <a href="http://localhost:3000/verify?token=${user.verifyCode}">this link</a> to verify your account</b>`,
          ).catch(error =>  console.warn(error))

          json
            ? res.json({ message: `An email to validated your account was sent to ${user.email}`  })
            : res.render('info', { message: `An email to validated your account was sent to <b>${user.email}</b>` })
      } else if (!user) {
        json
          ? res.json({ message: `There are no user with this username`  })
          : res.render('info', { message: `There are no user with this username` })
      }
    })

  } else {
    const err = new Error('A username is required')
    err.status = 400
    return next(err)
  }

})

router.get('/verification', async (req, res, next) => {

  const token = req.query.token
  const json = (req.headers.accept && req.headers.accept.includes('application/json')) || false

  if (token) {
    try {
      const user = await User.verification(token)
      req.session.userId = user._id
      json
        ? res.json({ message: `Verification Correct, go to your profile`})
        : res.render('info', { message: `Verification Correct, go to your profile <a type="button" href="/profile">Profile</a>` })
    } catch (error) {
      const err = new Error(error)
      err.status = 403
      return next(err)
    }
  } else {
    const err = new Error('Token not present')
    err.status = 499
    return next(err)
  }
})

// GET route after registering
router.get('/profile', requiresLogin, (req, res, next) => {

  const json = (req.headers.accept && req.headers.accept.includes('application/json')) || false

  User.findById(req.session.userId)
    .exec((error, user) => {
      if (error) {
        return next(error)
      } else if (user !== null) {
        if  (json) {
          return res.json({user})
        } else {
          return res.render('profile', {user})
        }
      }
    })
})

router.get('/password/reset', async (req, res, next) => {

  /// if token do different
  const json = (req.headers.accept && req.headers.accept.includes('application/json')) || false
  const token = (req.query && req.query.code) || null

  if (token) {
    try {
      const newPassword = await User.resetPassword(token)
      json
        ? res.json({message: `Your new password is ${newPassword}`})
        : res.render('info', { message: `Your new password is <b>${newPassword}</b>` })

    } catch (error) {
      if (json) {
        res.json({message: `Your new password is ${newPassword}`})
      } else {
        const err = new Error(error)
        return next(err)
      }
    }
  } else {
    json
      ? res.json({message: `You must provide a code`})
      : res.render('reset')
  }
})

router.post('/password/reset', (req, res, next) => {

  const json = (req.headers.accept && req.headers.accept.includes('application/json')) || false

  if (!req.body.email) {
    json
      ? res.json({ message: 'Email is a required field' })
      : res.render('info', { message: 'Email is a required field' })
  } else {
    User.reset(req.body.email, (error, user) => {
      if (error) {
        return next(error)
      } else {
        json
          ? res.json({ message: 'Go to your email to reset your password' })
          :res.render('info', { message: 'Go to your email to reset your password' })
      }
    })
  }
})

router.get('/password/renewal',
// requiresLogin,
(req, res, next) => {
  res.render('changePassword')
})

router.post('/password/renewal',
// requiresLogin,
 (req, res, next) => {

  const json = (req.headers.accept && req.headers.accept.includes('application/json')) || false

  if (req.body.newPassword &&
    req.body.repeatPassword &&
    req.body.oldPassword) {

    if (req.body.newPassword === req.body.oldPassword) {
      const err = new Error(`Your new password can't be the same as your old password`)
      err.status = 400
      return next(err)
    }

    if (req.body.newPassword === req.body.repeatPassword) {
      User.renewal({newPassword: req.body.newPassword, oldPassword: req.body.oldPassword, userId: req.session.userId}, (err, user) => {
        if (err) {
          return next(err)
        } else {
          req.session.destroy(error => {
            if (error) {
              return next(error)
            } else {
              json
                ? res.json({ message: `Password changed correctly go to /login` })
                : res.render('info', { message: `Password changed correctly <a href="/">Go to Login</a>` })
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

router.get('/groups', async (req, res, next) => {
  res.json(await Groups.getGroups())
})

router.post('/groups', async (req, res, next) => {
  if (req.body && req.body.name) {
    const members = req.body.members || []
    await Groups.addGroup(req.body.name, members)
  }
})

router.post('/user/:id/groups', async (req, res, next) => {
  res.json(await Groups.getUserGroups(req.params.id))
})

router.get('/permissions', async (req, res, next) => {
  res.json(await Routes.getRoutes({}))
})

module.exports = router