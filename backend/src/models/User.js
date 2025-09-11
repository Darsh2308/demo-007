import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import validator from 'validator';

const userSchema = new mongoose.Schema(
  {
    firstName: { type: String, required: true, trim: true },
    lastName: { type: String, required: true, trim: true },
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
      validate: [validator.isEmail, 'Invalid email address']
    },
    passwordHash: { type: String, required: true },

    twoFactorCode: { type: String },
    twoFactorExpiresAt: { type: Date },

    resetPasswordToken: { type: String },
    resetPasswordExpiresAt: { type: Date }
  },
  { timestamps: true }
);

userSchema.methods.comparePassword = async function (candidatePassword) {
  return bcrypt.compare(candidatePassword, this.passwordHash);
};

userSchema.methods.setPassword = async function (plainPassword) {
  const salt = await bcrypt.genSalt(10);
  this.passwordHash = await bcrypt.hash(plainPassword, salt);
};

userSchema.methods.setTwoFactorCode = function () {
  const code = (Math.floor(100000 + Math.random() * 900000)).toString();
  const expiry = new Date(Date.now() + 5 * 60 * 1000);
  this.twoFactorCode = code;
  this.twoFactorExpiresAt = expiry;
  return code;
};

userSchema.methods.clearTwoFactor = function () {
  this.twoFactorCode = undefined;
  this.twoFactorExpiresAt = undefined;
};

userSchema.methods.setResetToken = function () {
  const token = (Math.random().toString(36).slice(2) + Math.random().toString(36).slice(2));
  const expiry = new Date(Date.now() + 60 * 60 * 1000);
  this.resetPasswordToken = token;
  this.resetPasswordExpiresAt = expiry;
  return token;
};

userSchema.methods.clearResetToken = function () {
  this.resetPasswordToken = undefined;
  this.resetPasswordExpiresAt = undefined;
};

export const User = mongoose.model('User', userSchema);
