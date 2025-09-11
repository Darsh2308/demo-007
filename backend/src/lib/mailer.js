import nodemailer from 'nodemailer';

let cachedTransporter = null;

export const getTransporter = async () => {
  if (cachedTransporter) return cachedTransporter;

  const { SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASS, SMTP_SECURE } = process.env;

  if (SMTP_HOST && SMTP_PORT && SMTP_USER && SMTP_PASS) {
    cachedTransporter = nodemailer.createTransport({
      host: SMTP_HOST,
      port: Number(SMTP_PORT),
      secure: String(SMTP_SECURE || '').toLowerCase() === 'true',
      auth: { user: SMTP_USER, pass: SMTP_PASS }
    });
    return cachedTransporter;
  }

  const testAccount = await nodemailer.createTestAccount();
  cachedTransporter = nodemailer.createTransport({
    host: 'smtp.ethereal.email',
    port: 587,
    secure: false,
    auth: { user: testAccount.user, pass: testAccount.pass }
  });
  console.log(`[MAIL] Using Ethereal test account: ${testAccount.user}`);
  return cachedTransporter;
};

export const sendMail = async ({ to, subject, html, text }) => {
  const transporter = await getTransporter();
  const info = await transporter.sendMail({
    from: process.env.MAIL_FROM || 'no-reply@cms.local',
    to,
    subject,
    text,
    html
  });
  const previewUrl = nodemailer.getTestMessageUrl(info);
  if (previewUrl) {
    console.log(`[MAIL] Preview: ${previewUrl}`);
  }
  return info;
};
