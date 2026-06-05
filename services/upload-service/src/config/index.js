const path = require('path');

module.exports = {
  port: process.env.PORT || '50052',
  httpPort: process.env.HTTP_PORT || '3002',
  mongoUri: process.env.MONGO_URI,
  storageProvider: process.env.STORAGE_PROVIDER || 'local',
  uploadDir: process.env.UPLOAD_DIR || path.resolve(__dirname, '../../uploads'),
  maxFileSizeBytes:
    Number(process.env.MAX_FILE_SIZE_MB || 500) * 1024 * 1024,
  s3: {
    region: process.env.AWS_REGION || '',
    bucket: process.env.AWS_S3_BUCKET || '',
    accessKeyId: process.env.AWS_ACCESS_KEY_ID || '',
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY || '',
  },
};
