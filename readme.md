## About

Authentication proxy using mongodb.

It provides with:
+ Login
+ Registration
+ Verification email
+ Resend Link
+ User profile
+ Change Password
+ Reset Password

## Set up

```
git clone https://github.com/dobladov/expressAuth.git
cd expressAuth
npm install
```
Create a .env file with your configuration
```
SERVER_HOST=localhost
SERVER_PORT=3000
PROXY_HOST=localhost
PROXY_PORT=8000
SESSION_SECRET=your secret
DB_STRING=localhost:27017/Auth
EMAIL_IDENTITY=name for email
EMAIL_HOST=mail server
EMAIL_USER=e-mail
EMAIL_PASS=e-mail password
```

## Run

```
mongod
npm start
```

___Optional___

For reloading the server on chages
```
nodemon src/app.js
```

## Permissions

 - Require valid-user
 - Require all `granted|denied`
 - Require user `username`
 - Require group `groupname`

Multiple permissions can be applied to a route. If a user is allowed by any of the permission for the route, the acces is evaluated to true

## Routes format in database

```
{
  "permissions" : [
      "Require all granted"
  ],
  "url" : "/",
  "method" : "GET"
}
```

## Proxy targets format
```
{
  'path': '/page/:id',
  'target': 'http://localhost:3000/posts/:id',
  'conditions': {
    'methods': ['GET', 'POST'],
    'headers': {
      'accept': 'application/json'
    }
  }
}
```

The first target that matches the clientRequest path will be evaluated, required methods and headers are optional

Parameters will be parsed

```
:param: for URL parameters
;param: for matrix parameters
*splat: for parameters spanning over multiple segments. Handle with care
?param1&param2 or ?:param1&:param2: for query parameters. Colons : are optional.
```

## Security

Basic access authentication is checked for the users.
Passwords are stored using bcrypt

## Test

All test will work on a separate database while using `NODE_ENV=test`

```
npm test // Runs all tests
NODE_ENV=test ./node_modules/.bin/mocha test/proxy.js // Runs a single test
```

## Links

Based on [Starting with Authentication](https://medium.com/createdd-notes/starting-with-authentication-a-tutorial-with-node-js-and-mongodb-25d524ca0359) by [Createdd - Daniel Deutsch](https://github.com/Createdd)