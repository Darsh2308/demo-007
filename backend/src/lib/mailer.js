import nodemailer from 'nodemailer';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

// Ensure environment variables are loaded even when this module is imported early
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.join(__dirname, '../../.env') });

let cachedTransporter = null;

export const getTransporter = async () => {
  if (cachedTransporter) return cachedTransporter;

  const { SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASS, SMTP_SECURE, GMAIL_USER, GMAIL_PASS } = process.env;

  // Prefer explicit Gmail configuration if provided
  if (GMAIL_USER && GMAIL_PASS) {
    cachedTransporter = nodemailer.createTransport({
      host: 'smtp.gmail.com',
      port: 465,
      secure: true,
      auth: { user: GMAIL_USER, pass: GMAIL_PASS },
      pool: true,
      maxConnections: 3,
      maxMessages: 50
    });
    return cachedTransporter;
  }

  // Fallback to generic SMTP if configured
  if (SMTP_HOST && SMTP_PORT && SMTP_USER && SMTP_PASS) {
    cachedTransporter = nodemailer.createTransport({
      host: SMTP_HOST,
      port: Number(SMTP_PORT),
      secure: String(SMTP_SECURE || '').toLowerCase() === 'true',
      auth: { user: SMTP_USER, pass: SMTP_PASS },
      pool: true,
      maxConnections: 3,
      maxMessages: 50
    });
    return cachedTransporter;
  }

  throw new Error('SMTP is not configured. Set GMAIL_USER/GMAIL_PASS or SMTP_* environment variables.');
};

export const sendMail = async ({ to, subject, html, text }) => {
  const transporter = await getTransporter();
  const info = await transporter.sendMail({
    from: process.env.MAIL_FROM || process.env.GMAIL_USER || 'no-reply@cms.local',
    to,
    subject,
    text,
    html
  });
  return info;
};
