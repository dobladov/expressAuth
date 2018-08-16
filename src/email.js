const nodemailer = require('nodemailer')

const transporter = nodemailer.createTransport({
  host: process.env.EMAIL_HOST,
  secure: true,
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS
  }
})

const email =  {

  send: async (to, subject, text, html) => {
    transporter.sendMail({
      from: `${process.env.EMAIL_IDENTITY} <${process.env.EMAIL_USER}>`,
      to, subject, text, html
    }).then(info => info)
    .catch(error => {
      const err = new Error(error)
      err.status = 400
      throw new Error(err)
    })
  }
}

module.exports = email