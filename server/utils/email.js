const nodemailer = require("nodemailer");

const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST,
  port: Number(process.env.SMTP_PORT) || 587,
  secure: false,
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
});

async function sendPasswordResetEmail(email, resetUrl) {
  return transporter.sendMail({
    from: `"GoodPay Security" <${process.env.SMTP_FROM}>`,
    to: email,
    subject: "Reset your GoodPay password",
    text: `We received a request to reset your GoodPay password.

Use this link to reset your password:
${resetUrl}

This link expires in 15 minutes. If you did not request this, you can ignore this email.`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 560px; margin: auto; padding: 30px; color: #333;">
        <h2 style="color: #492AC3;">GoodPay</h2>
        <h3>Password reset request</h3>
        <p>We received a request to reset your GoodPay password.</p>
        <p>Click the button below to choose a new password:</p>
        <a href="${resetUrl}" style="display:inline-block; padding:14px 24px; background:#492AC3; color:#fff; text-decoration:none; border-radius:8px;">
          Reset Password
        </a>
        <p>This link expires in 15 minutes.</p>
        <p>If you did not request this, you can safely ignore this email.</p>
        <p style="color:#777; font-size:12px;">GoodPay Security Team</p>
      </div>
    `,
  });
}

async function sendVerificationEmail(email, code) {
  return transporter.sendMail({
    from: `"GoodPay Security" <${process.env.SMTP_FROM}>`,
    to: email,
    subject: "Your GoodPay verification code",
    text: `Your GoodPay verification code is ${code}.

This code expires in 10 minutes. Do not share it with anyone.`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 560px; margin: auto; padding: 30px; color: #333;">
        <h2 style="color: #492AC3;">GoodPay</h2>
        <h3>Verify your email address</h3>
        <p>Use the verification code below to complete your GoodPay registration:</p>
        <div style="padding: 18px; background: #f4f1ff; border-radius: 10px; text-align: center; font-size: 32px; font-weight: bold; letter-spacing: 8px; color: #492AC3;">
          ${code}
        </div>
        <p>This code expires in 10 minutes.</p>
        <p>For your security, do not share this code with anyone.</p>
        <p style="color: #777; font-size: 12px;">GoodPay Security Team</p>
      </div>
    `,
  });
}

async function sendVerificationEmail(email, code) {
  return transporter.sendMail({
    from: `"GoodPay Security" <${process.env.SMTP_FROM}>`,
    to: email,
    subject: "Your GoodPay verification code",
    text: `Your GoodPay verification code is ${code}.

This code expires in 10 minutes. Do not share it with anyone.`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 560px; margin: auto; padding: 30px; color: #333;">
        <h2 style="color: #492AC3;">GoodPay</h2>
        <h3>Verify your email address</h3>
        <p>Use the verification code below to complete your GoodPay registration:</p>
        <div style="padding: 18px; background: #f4f1ff; border-radius: 10px; text-align: center; font-size: 32px; font-weight: bold; letter-spacing: 8px; color: #492AC3;">
          ${code}
        </div>
        <p>This code expires in 10 minutes.</p>
        <p>For your security, do not share this code with anyone.</p>
        <p style="color: #777; font-size: 12px;">GoodPay Security Team</p>
      </div>
    `,
  });
}

module.exports = {
  transporter,
  sendPasswordResetEmail,
  sendVerificationEmail,
};
