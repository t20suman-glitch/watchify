module.exports = {
  port: process.env.PORT || '50053',
  httpPort: process.env.HTTP_PORT || '3003',
  mongoUri: process.env.MONGO_URI,
  jwtSecret: process.env.JWT_SECRET || 'dev-only-change-in-production',
  uploadServiceUrl: process.env.UPLOAD_SERVICE_URL || 'http://localhost:3002',
};

if (!process.env.JWT_SECRET) {
  console.warn(
    'watch-service: JWT_SECRET is not set — using default. Tokens from user-service will fail unless secrets match.'
  );
}
