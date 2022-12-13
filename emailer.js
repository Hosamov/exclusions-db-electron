const nodemailer = require('nodemailer');

//* EMAILER
async function email(subject, emailBody, toEmail) {
  let transporter = nodemailer.createTransport({
    host: 'pcluster08.stablehost.com', // backyarddev.io email
    port: 465,
    secure: true, // use TLS
    auth: {
      user: process.env.EMAILUSER,
      pass: process.env.EMAILPASS,
    },
    tls: {
      // do not fail on invalid certs
      rejectUnauthorized: false,
    },
  });

  message = {
    from: process.env.EMAILUSER,
    to: toEmail,
    subject: subject,
    text: emailBody,
    html: emailBody,
  };

  await transporter.sendMail(message, function (err, info) {
    if (err) {
      console.log(err);
    } else {
      console.log(info);
    }
  });
}

module.exports = email;
