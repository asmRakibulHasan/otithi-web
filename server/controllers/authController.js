import fs from 'fs';
import jwt from 'jsonwebtoken';
import User from '../models/User.js';

const signToken = (user) =>
  jwt.sign({ id: user._id }, process.env.JWT_SECRET, { expiresIn: '7d' });

const removeFile = (file) => file && fs.unlink(file.path, () => {});

// POST /api/auth/register  (multipart: name, email, phone, password, role, idDocument)
export async function register(req, res) {
  const { name, email, phone, password, role } = req.body;

  const fail = (status, message) => {
    removeFile(req.file);
    return res.status(status).json({ message });
  };

  if (!name || !email || !phone || !password) return fail(400, 'Please fill in all fields');
  if (!['traveller', 'host'].includes(role)) return fail(400, 'Choose traveller or host');
  if (!/^\S+@\S+\.\S+$/.test(email)) return fail(400, 'Enter a valid email');
  if (password.length < 6) return fail(400, 'Password must be at least 6 characters');
  if (!req.file) return fail(400, 'Please upload a photo of your ID');

  if (await User.exists({ email: email.toLowerCase() })) {
    return fail(409, 'An account with this email already exists');
  }

  const user = await User.create({
    name,
    email,
    phone,
    password,
    role,
    idDocument: req.file.filename,
    status: 'pending',
  });

  res.status(201).json({ token: signToken(user), user });
}

// POST /api/auth/login  { email, password }
export async function login(req, res) {
  const { email, password } = req.body;
  if (!email || !password) return res.status(400).json({ message: 'Enter email and password' });

  const user = await User.findOne({ email: email.toLowerCase() }).select('+password');
  if (!user || !(await user.matchPassword(password))) {
    return res.status(401).json({ message: 'Wrong email or password' });
  }

  res.json({ token: signToken(user), user });
}

// GET /api/auth/me
export function me(req, res) {
  res.json({ user: req.user });
}
