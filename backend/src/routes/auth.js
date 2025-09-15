import { Router } from 'express';
import { User } from '../models/User.js';
import { signJwt } from '../lib/jwt.js';
import { sendMail } from '../lib/mailer.js';

const router = Router();

const deliverTwoFactorCode = (email, code) => {
  // Fire-and-forget to avoid blocking HTTP response
  sendMail({
    to: email,
    subject: 'Your 2FA Code',
    text: `Your verification code is ${code}`,
    html: `<p>Your verification code is <b>${code}</b>. It expires in 5 minutes.</p>`
  }).catch((err) => {
    console.error('[MAIL][2FA] Failed to send code:', err);
  });
};

const deliverResetLink = (email, token) => {
  const link = `http://localhost:3000/reset-password?token=${token}`;
  // Fire-and-forget to avoid blocking HTTP response
  sendMail({
    to: email,
    subject: 'Reset your password',
    text: `Reset your password: ${link}`,
    html: `<p>Click to reset your password: <a href="${link}">${link}</a></p>`
  }).catch((err) => {
    console.error('[MAIL][RESET] Failed to send reset link:', err);
  });
};

router.post('/signup', async (req, res) => {
  try {
    const { firstName, lastName, email, password } = req.body;
    if (!firstName || !lastName || !email || !password) {
      return res.status(400).json({ message: 'Missing required fields' });
    }

    const existing = await User.findOne({ email });
    if (existing) {
      return res.status(409).json({ message: 'Email already in use' });
    }

    const user = new User({ firstName, lastName, email, passwordHash: 'temp' });
    await user.setPassword(password);
    const code = user.setTwoFactorCode();
    await user.save();

    deliverTwoFactorCode(email, code);

    return res.status(201).json({ message: 'Signup successful, 2FA required', twoFARequired: true, email });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: 'Server error' });
  }
});

router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    const ok = await user.comparePassword(password);
    if (!ok) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    const code = user.setTwoFactorCode();
    await user.save();

    deliverTwoFactorCode(email, code);

    return res.json({ message: '2FA required', twoFARequired: true, email });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: 'Server error' });
  }
});

router.post('/2fa/verify', async (req, res) => {
  try {
    const { email, code } = req.body;
    const user = await User.findOne({ email });
    if (!user || !user.twoFactorCode || !user.twoFactorExpiresAt) {
      return res.status(400).json({ message: 'No 2FA in progress' });
    }

    const expired = user.twoFactorExpiresAt.getTime() < Date.now();
    if (expired) {
      user.clearTwoFactor();
      await user.save();
      return res.status(400).json({ message: '2FA code expired' });
    }

    if (user.twoFactorCode !== String(code)) {
      return res.status(400).json({ message: 'Invalid 2FA code' });
    }

    user.clearTwoFactor();
    await user.save();

    const token = signJwt({ sub: user._id.toString(), email: user.email });

    return res.json({ message: '2FA verified', token, user: {
      id: user._id,
      firstName: user.firstName,
      lastName: user.lastName,
      email: user.email
    }});
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: 'Server error' });
  }
});

router.post('/forgot-password', async (req, res) => {
  try {
    const { email } = req.body;
    const user = await User.findOne({ email });
    if (!user) {
      return res.json({ message: 'If the email exists, a reset link will be sent' });
    }

    const token = user.setResetToken();
    await user.save();

    deliverResetLink(email, token);

    return res.json({ message: 'Password reset email sent' });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: 'Server error' });
  }
});

router.post('/reset-password', async (req, res) => {
  try {
    const { token, password } = req.body;
    if (!token || !password) {
      return res.status(400).json({ message: 'Missing token or password' });
    }

    const user = await User.findOne({ resetPasswordToken: token, resetPasswordExpiresAt: { $gt: new Date() } });
    if (!user) {
      return res.status(400).json({ message: 'Invalid or expired token' });
    }

    await user.setPassword(password);
    user.clearResetToken();
    await user.save();

    return res.json({ message: 'Password has been reset' });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: 'Server error' });
  }
});

export default router;
