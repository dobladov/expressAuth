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
    try {
      await transporter.sendMail({
        from: `${process.env.EMAIL_IDENTITY} <${process.env.EMAIL_USER}>`,
        to, subject, text, html
      })
    } catch (error) {
      console.warn(error)
    }
  }
}

module.exports = email