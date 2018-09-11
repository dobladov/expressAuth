const http = require('http')
const User = require('./models/user')
const Routes = require('./models/routes')

require('./database')

// const targets = {
//   '/foo': 'http://example.org:8080/foo/bar'
// }

const extractCredentials = async (authorization) => {

  const credentials = (authorization
  && Buffer.from(authorization.replace('Basic ', ''), 'base64').toString('ascii'))
  || null

  if (credentials) {
    const [username, password] = credentials.split(':')

    if (username && password) {
      return {username, password}
    } else {
      throw new Error("Error paring username/password")
    }
  } else {
    throw new Error("Credentials not provided")
  }

}

const checkPermission = async (user, permission) => {

  // 'Require valid-user'
  // Chcek if a valid user was provided
  // AUTHENTICATE? AGAIN OR THE USER IS ALREADY PROVIDED?
  if (permission === "Require valid-user") {
    return user ? true : false
  }

  // // 'Require all granted'
  // // 'Require all denied'
  if (/Require all (.*)/g.test(permission)) {
    return /Require all (.*)/g.exec(permission)[1] === "granted" ? true : false
  }

  // // 'Require group admin
  // // Check if the user is member of the group
  if (/Require group (.*)/g.test(permission)) {
    const group = /Require group (.*)/g.exec(permission)[1]
    const response = await Groups.getUserInGroup(user.username, group)
    if (response && response.length) {
      return true
    }
    return false
  }

  // // 'Require user testingdev'
  // Check if the user is the one required
  if (/Require user (.*)/g.test(permission)) {
    const userRequired = /Require user (.*)/g.exec(permission)[1]
    return user.username === userRequired ? true : false
  }

  return false
}

// After checking all permissions to the given route
// returns true or false if the user can access   it
const evaluate = async (user, route) => {

  let allowed = false

  const checksRoute = []

  route.permissions.forEach(permission => {
    const contents = checkPermission(user, permission)
    checksRoute.push(contents)
    console.log("For:", permission, contents)
  })

  return Promise.all(checksRoute).then((values) => {
    allowed = values.includes(true) ? true : false
    console.log("Checks of route:", values, allowed)
    return allowed
  })
}

const proxy = async (clientReq, clientRes) => {

  try {
    const {username, password} = await extractCredentials(clientReq.headers && clientReq.headers.authorization)
    const user = await User.authenticate(username, password)
    const { routes } = await Routes.getRoutes()

    const filteredRoutes = routes
      .filter(route => route.method === clientReq.method)
      .filter(route => route.url.startsWith(clientReq.url))

    // CHeck if filtered routes matches any
    // Error if no route can match it

    const forwardREQUEST = await evaluate(user, filteredRoutes.slice(-1).pop())

    console.log(clientReq.headers);


    if (forwardREQUEST) {
      const proxyReq = http.request({
        host: '192.168.2.46', // We need some logic for this to get from targets
        port: 8080,
        path: clientReq.url,
        method: clientReq.method,
        headers: clientReq.headers // add custom header stuff here
      })

      proxyReq.setHeader('X-user', JSON.stringify(user))

      proxyReq.on('response', proxyRes => {
        proxyRes.pipe(clientRes).on('finish', () => clientRes.end())
      })
      proxyReq.end()
    } else {
      throw new Error("The user is not allowed to access this route")
    }

  } catch (error) {
    console.warn(error.message)
    clientRes.writeHead(401, { 'Content-Type': 'text/plain' })
    clientRes.end(`Unauthorized: ${error.message}`)
  }
}

const server = http.createServer(proxy)

server.listen(process.env.PROXY_PORT, err => err
  ? console.error(err)
  : console.log(`Proxy listeing on port ${process.env.PROXY_PORT}`)
)