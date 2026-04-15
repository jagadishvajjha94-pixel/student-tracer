const { validationResult } = require('express-validator');
const User = require('../models/User');
const { signToken } = require('../utils/jwt');

function buildAuthResponse(user) {
  const token = signToken({
    sub: user._id.toString(),
    role: user.role,
    rollNumber: user.rollNumber || undefined,
  });
  return {
    token,
    user: {
      id: user._id,
      name: user.name,
      email: user.email,
      role: user.role,
      rollNumber: user.rollNumber,
      expertise: user.expertise,
      batch: user.batch,
      group: user.group,
      skills: user.skills,
      contactNumber: user.contactNumber,
      placementStatus: user.placementStatus,
    },
  };
}

async function register(req, res) {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  const { name, password, role, rollNumber, expertise } = req.body;
  const email = req.body.email != null ? String(req.body.email).trim() : '';

  try {
    if (role === 'interviewer') {
      const em = email.toLowerCase();
      const existing = await User.findOne({ email: em });
      if (existing) {
        return res.status(409).json({ message: 'Email already registered' });
      }
      const user = await User.create({
        name: String(name).trim(),
        email: em,
        password,
        role: 'interviewer',
        expertise: expertise != null ? String(expertise).trim() : '',
      });
      return res.status(201).json(buildAuthResponse(user));
    }

    if (role === 'student') {
      if (!rollNumber) {
        return res.status(400).json({ message: 'Roll number is required for students' });
      }
      const r = String(rollNumber).trim().toUpperCase();
      const dupRoll = await User.findOne({ rollNumber: r });
      if (dupRoll) {
        return res.status(409).json({ message: 'Roll number already registered' });
      }
      const dupEmail = email
        ? await User.findOne({ email: email.toLowerCase() })
        : null;
      if (dupEmail) {
        return res.status(409).json({ message: 'Email already registered' });
      }
      const user = await User.create({
        name: String(name).trim(),
        ...(email ? { email: email.toLowerCase() } : {}),
        password,
        role: 'student',
        rollNumber: r,
      });
      return res.status(201).json(buildAuthResponse(user));
    }

    return res.status(400).json({ message: 'Invalid role for registration' });
  } catch (err) {
    console.error('[register]', err);
    if (err.code === 11000 || err.code === '11000') {
      const field = Object.keys(err.keyPattern || {})[0];
      const msg =
        field === 'email'
          ? 'Email already registered'
          : field === 'rollNumber'
            ? 'Roll number already registered'
            : 'Duplicate value';
      return res.status(409).json({ message: msg });
    }
    const status = err.statusCode && Number.isInteger(err.statusCode) ? err.statusCode : 500;
    const message =
      process.env.NODE_ENV === 'development'
        ? err.message || 'Registration failed'
        : 'Registration failed';
    return res.status(status).json({ message });
  }
}

async function login(req, res) {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  const { email, password, rollNumber } = req.body;

  try {
    if (rollNumber) {
      const r = rollNumber.trim().toUpperCase();
      const user = await User.findOne({ rollNumber: r, role: 'student' });
      if (!user) {
        return res.status(401).json({ message: 'Invalid roll number or password' });
      }
      const ok = await user.comparePassword(password);
      if (!ok) {
        return res.status(401).json({ message: 'Invalid roll number or password' });
      }
      return res.json(buildAuthResponse(user));
    }

    if (!email) {
      return res.status(400).json({ message: 'Email or roll number required' });
    }

    const user = await User.findOne({ email: email.toLowerCase().trim() });
    if (!user) {
      return res.status(401).json({ message: 'Invalid email or password' });
    }
    if (user.role === 'student') {
      return res.status(400).json({
        message: 'Students must log in with roll number and password',
      });
    }
    const ok = await user.comparePassword(password);
    if (!ok) {
      return res.status(401).json({ message: 'Invalid email or password' });
    }
    return res.json(buildAuthResponse(user));
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: 'Login failed' });
  }
}

async function me(req, res) {
  return res.json({
    user: {
      id: req.user._id,
      name: req.user.name,
      email: req.user.email,
      role: req.user.role,
      rollNumber: req.user.rollNumber,
      expertise: req.user.expertise,
      batch: req.user.batch,
      group: req.user.group,
      skills: req.user.skills,
      contactNumber: req.user.contactNumber,
      placementStatus: req.user.placementStatus,
    },
  });
}

module.exports = { register, login, me };
