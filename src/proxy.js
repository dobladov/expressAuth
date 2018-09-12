const http = require('http')
const URL = require('url')
const User = require('./models/user')
const Routes = require('./models/routes')
const Path = require('path-parser').default

require('./database')

const targets = [
  {
    'path': '/page/:id',
    'target': 'http://localhost:3000/profile/:id',
    'conditions': {
      'methods': ['GET', 'POST'],
      'headers': {
        'accept': 'application/json'
      }
    }
  },
  {
    'path': '/registration',
    'target': 'http://localhost:3000/registration'
  },
  {
    'path': '/',
    'target': 'http://localhost:3000/'
  },
  // {
  //   'path': '/*page',
  //   'target': 'http://localhost:3000/*page'
  // }
]

// Extracts the username and password from the authorization header
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

// Checks if the given permission is satisfied
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
    console.log("For:", route.url, route.method, permission, contents)
  })

  return Promise.all(checksRoute).then((values) => {
    allowed = values.includes(true) ? true : false
    console.log("Checks of route:", values, allowed)
    return allowed
  })
}

// Returns the first matching target
// adding the passed parameters
const getTarget = async (url, method, headers) => {

  for (const target of targets) {
    const path = new Path(target.path)
    const test = path.test(url)

    if (test) {
      const targetURL = URL.parse(target.target)
      const targetPath = new Path(targetURL.path)

      if (target.conditions && target.conditions.methods && !target.conditions.methods.includes(method)) {
        continue
      }

      if (target.conditions && target.conditions.headers) {
        const requiredHeaders = target.conditions.headers
        const matchHeaders = Object.keys(requiredHeaders).filter(header => Object.keys(headers).includes(header))

        if (!matchHeaders || !matchHeaders.every(header => requiredHeaders[header] === headers[header])) {
          continue
        }
      }

      return `${targetURL.protocol}//${targetURL.host}${targetPath.build(test)}`
    }
  }

  throw new Error(`No targets to ${url}`)
}


const proxy = async (clientReq, clientRes) => {

  try {
    const target = await getTarget(clientReq.url, clientReq.method, clientReq.headers)

    console.log({target})

    const {username, password} = await extractCredentials(clientReq.headers && clientReq.headers.authorization)
    const user = await User.authenticate(username, password)
    const { routes } = await Routes.getRoutes()

    // const filteredRoutes = routes
    //   .filter(route => route.method === clientReq.method)
    //   .filter(route => route.url.startsWith(clientReq.url))

    // // CHeck if filtered routes matches any
    // // Error if no route can match it

    // const forwardREQUEST = await evaluate(user, filteredRoutes.slice(-1).pop())

    // if (forwardREQUEST) {
    //   const proxyReq = http.request({
    //     protocol: target.protocol,
    //     host: target.hostname,
    //     port: target.port,
    //     path: target.path,
    //     method: clientReq.method,
    //     headers: clientReq.headers
    //   })

    //   proxyReq.setHeader('X-user', JSON.stringify(user))

    //   proxyReq.on('error', error => {
    //     console.warn("Error requesting target:", error.message)
    //     clientRes.writeHead(400, { 'Content-Type': 'text/plain' })
    //     clientRes.end(`Bad Request: ${error.message}`)
    //   })

    //   proxyReq.on('response', proxyRes => {
    //     proxyRes.pipe(clientRes).on('finish', () => clientRes.end())
    //   })
    //   proxyReq.end()
    // } else {
    //   throw new Error("The user is not allowed to access this route")
    // }

  } catch (error) {
    console.warn(error.message)
    clientRes.writeHead(401, { 'Content-Type': 'text/plain' })
    clientRes.end(`Unauthorized: ${error.message}`)
  }
}

const server = http.createServer(proxy)

server.listen(process.env.PROXY_PORT, err => err
  ? console.error(err)
  : console.info(`Proxy listeing on port ${process.env.PROXY_PORT}`)
)