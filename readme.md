## About

Authentication in express using mongodb.

It provides with:
+ Login
+ Registration
+ Verification email
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

Open [localhost:3000](http://localhost:3000)


## Links

Based on [Starting with Authentication](https://medium.com/createdd-notes/starting-with-authentication-a-tutorial-with-node-js-and-mongodb-25d524ca0359) by [Createdd - Daniel Deutsch](https://github.com/Createdd)