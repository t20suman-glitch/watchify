const AppError = require('../../errors/appError');
const { verifyAccessToken } = require('../../lib/auth/jwt');

function getBearerToken(req) {
  const header = req.headers.authorization;
  if (!header) return null;

  const match = header.match(/^Bearer\s+(.+)$/i);
  if (!match) return null;

  return match[1].trim().replace(/^["']|["']$/g, '');
}

function requireAuth(req, _res, next) {
  const token = getBearerToken(req);
  if (!token) {
    next(AppError.unauthenticated('Authorization: Bearer <token> is required'));
    return;
  }

  try {
    const payload = verifyAccessToken(token);
    req.user = { id: payload.sub, email: payload.email };
    next();
  } catch {
    next(AppError.unauthenticated('Invalid or expired access token'));
  }
}

module.exports = { requireAuth };
