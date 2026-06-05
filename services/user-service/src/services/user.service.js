const AppError = require('../errors/appError');
const { hashPassword, comparePassword } = require('../lib/auth/password');
const { signAccessToken, verifyAccessToken } = require('../lib/auth/jwt');
const userRepository = require('../repositories/user.repository');
const { validateCreateUser, validateLogin } = require('../utils/validation');

function isDuplicateKeyError(err) {
  return err?.code === 11000;
}

async function createUser({ email, username, password }) {
  const validationError = validateCreateUser({ email, username, password });
  if (validationError) {
    throw AppError.invalidArgument(validationError);
  }

  try {
    const passwordHash = await hashPassword(password);
    const doc = await userRepository.create({ email, username, passwordHash });
    return userRepository.toProto(doc);
  } catch (err) {
    if (isDuplicateKeyError(err)) {
      throw AppError.alreadyExists('Email is already registered');
    }
    throw err;
  }
}

async function loginUser({ email, password }) {
  const validationError = validateLogin({ email, password });
  if (validationError) {
    throw AppError.invalidArgument(validationError);
  }

  const doc = await userRepository.findByEmail(email);
  if (!doc) {
    throw AppError.unauthenticated('Invalid email or password');
  }

  const passwordMatch = await comparePassword(password, doc.password);
  if (!passwordMatch) {
    throw AppError.unauthenticated('Invalid email or password');
  }

  const accessToken = signAccessToken(doc);
  return {
    access_token: accessToken,
    user: userRepository.toProto(doc),
  };
}

async function getProfile({ access_token }) {
  if (!access_token?.trim()) {
    throw AppError.unauthenticated('Access token is required');
  }

  let payload;
  try {
    payload = verifyAccessToken(access_token.trim());
  } catch {
    throw AppError.unauthenticated('Invalid or expired access token');
  }

  const doc = await userRepository.findById(payload.sub);
  if (!doc) {
    throw AppError.notFound('User not found');
  }

  return userRepository.toProto(doc);
}

module.exports = { createUser, loginUser, getProfile };
