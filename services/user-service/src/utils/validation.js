const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const MIN_PASSWORD_LENGTH = 6;

function validateCreateUser({ email, username, password }) {
  if (!email?.trim()) return 'Email is required';
  if (!EMAIL_REGEX.test(email.trim())) return 'Invalid email format';
  if (!username?.trim()) return 'Username is required';
  if (username.trim().length < 2) return 'Username must be at least 2 characters';
  if (!password) return 'Password is required';
  if (password.length < MIN_PASSWORD_LENGTH) {
    return `Password must be at least ${MIN_PASSWORD_LENGTH} characters`;
  }
  return null;
}

function validateLogin({ email, password }) {
  if (!email?.trim()) return 'Email is required';
  if (!password) return 'Password is required';
  return null;
}

module.exports = { validateCreateUser, validateLogin };
