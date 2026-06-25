const config = require('../config');
const LocalStorageProvider = require('./localStorageProvider');
const S3StorageProvider = require('./s3StorageProvider');

const providerCache = new Map();

function createStorageProvider(type = config.storageProvider) {
  switch (type) {
    case 's3':
      return new S3StorageProvider({
        bucket: config.s3.bucket,
        region: config.s3.region,
        endpoint: config.s3.endpoint,
        forcePathStyle: config.s3.forcePathStyle,
        accessKeyId: config.s3.accessKeyId,
        secretAccessKey: config.s3.secretAccessKey,
      });
    case 'local':
    default:
      return new LocalStorageProvider({ uploadDir: config.uploadDir });
  }
}

function getStorageProvider(type = config.storageProvider) {
  if (!providerCache.has(type)) {
    providerCache.set(type, createStorageProvider(type));
  }
  return providerCache.get(type);
}

module.exports = { getStorageProvider, createStorageProvider };
