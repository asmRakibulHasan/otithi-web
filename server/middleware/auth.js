import jwt from 'jsonwebtoken';
import User from '../models/User.js';

// Requires a valid "Authorization: Bearer <token>" header; sets req.user.
export async function protect(req, res, next) {
  const header = req.headers.authorization || '';
  const token = header.startsWith('Bearer ') ? header.slice(7) : null;
  if (!token) return res.status(401).json({ message: 'Please log in' });

  try {
    const { id } = jwt.verify(token, process.env.JWT_SECRET);
    const user = await User.findById(id);
    if (!user) return res.status(401).json({ message: 'Account not found' });
    req.user = user;
    next();
  } catch {
    res.status(401).json({ message: 'Session expired, please log in again' });
  }
}

// Like protect, but lets guests through (req.user stays undefined).
export async function optionalAuth(req, res, next) {
  const header = req.headers.authorization || '';
  if (!header.startsWith('Bearer ')) return next();
  try {
    const { id } = jwt.verify(header.slice(7), process.env.JWT_SECRET);
    req.user = (await User.findById(id)) || undefined;
  } catch {
    // invalid token: treat as guest
  }
  next();
}

// Use after protect: requireRole('host'), requireRole('admin'), ...
export function requireRole(...roles) {
  return (req, res, next) => {
    if (!roles.includes(req.user.role)) {
      return res.status(403).json({ message: 'You do not have access to this' });
    }
    next();
  };
}

// Use after protect: blocks users whose ID is not yet approved by the admin.
export function requireApproved(req, res, next) {
  if (req.user.status !== 'approved') {
    return res.status(403).json({ message: 'Your account is waiting for admin verification' });
  }
  next();
}
