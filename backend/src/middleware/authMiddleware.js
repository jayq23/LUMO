import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET;

const assertJwtSecret = () => {
  if (!JWT_SECRET) {
    throw new Error('JWT_SECRET is not configured');
  }
};

export const generateToken = (userId) => {
  assertJwtSecret();
  return jwt.sign({ userId }, JWT_SECRET, { expiresIn: '24h' });
};

export const authMiddleware = (req, res, next) => {
  try {
    if (!JWT_SECRET) {
      return res.status(500).json({ error: 'JWT_SECRET is not configured on the server' });
    }

    const token = req.headers.authorization?.split(' ')[1];

    if (!token) {
      return res.status(401).json({ error: 'Missing authorization token' });
    }

    const decoded = jwt.verify(token, JWT_SECRET);

    // NOTE: Must set req.user.id (not req.userId) so all routes
    // that read req.user.id (like ai.js) work correctly
    req.user = { id: decoded.userId };

    next();
  } catch (err) {
    // eslint-disable-next-line no-unused-vars
    return res.status(401).json({ error: 'Invalid or expired token' });
  }
};

// Verify user can only access their own data
// Checks both :id and :userId URL params, and userId in request body
export const verifyOwnership = (req, res, next) => {
  const userIdFromParams = req.params.id
    ? parseInt(req.params.id)
    : req.params.userId
    ? parseInt(req.params.userId)
    : null;
  const userIdFromBody = req.body?.userId ? parseInt(req.body.userId) : null;
  const requestedUserId = userIdFromParams || userIdFromBody;

  if (requestedUserId && requestedUserId !== req.user.id) {
    return res.status(403).json({ error: 'Unauthorized access to this resource' });
  }

  next();
};