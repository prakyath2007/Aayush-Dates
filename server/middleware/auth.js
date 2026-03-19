import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || 'lovemarket-dev-secret';

/**
 * Authentication middleware (required)
 * Extracts JWT from Authorization header, verifies it, and attaches user to req.user
 * Returns 401 if token is missing or invalid
 */
export function authenticate(req, res, next) {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader) {
      return res.status(401).json({ error: 'No authorization header' });
    }

    // Extract token from "Bearer <token>"
    const parts = authHeader.split(' ');
    if (parts.length !== 2 || parts[0] !== 'Bearer') {
      return res.status(401).json({ error: 'Invalid authorization header format' });
    }

    const token = parts[1];

    // Verify token
    const decoded = jwt.verify(token, JWT_SECRET);

    // Attach user info to request
    req.user = {
      id: decoded.userId,
    };

    next();
  } catch (error) {
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({ error: 'Token expired' });
    }

    if (error.name === 'JsonWebTokenError') {
      return res.status(401).json({ error: 'Invalid token' });
    }

    return res.status(401).json({ error: 'Authentication failed' });
  }
}

/**
 * Optional authentication middleware
 * Same as authenticate but doesn't fail if no token is provided
 * req.user will be null if no valid token is provided
 */
export function optionalAuth(req, res, next) {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader) {
      // No token provided - set req.user to null and continue
      req.user = null;
      return next();
    }

    // Extract token from "Bearer <token>"
    const parts = authHeader.split(' ');
    if (parts.length !== 2 || parts[0] !== 'Bearer') {
      // Invalid format - set req.user to null and continue
      req.user = null;
      return next();
    }

    const token = parts[1];

    // Verify token
    const decoded = jwt.verify(token, JWT_SECRET);

    // Attach user info to request
    req.user = {
      id: decoded.userId,
    };

    next();
  } catch (error) {
    // Token exists but is invalid - set req.user to null and continue
    req.user = null;
    next();
  }
}

export default { authenticate, optionalAuth };
