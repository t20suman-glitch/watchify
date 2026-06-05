const config = require('../config');
const LocalStorageProvider = require('./localStorageProvider');
const S3StorageProvider = require('./s3StorageProvider');

let providerInstance;

function createStorageProvider() {
  switch (config.storageProvider) {
    case 's3':
      return new S3StorageProvider({
        bucket: config.s3.bucket,
        region: config.s3.region,
        accessKeyId: config.s3.accessKeyId,
        secretAccessKey: config.s3.secretAccessKey,
      });
    case 'local':
    default:
      return new LocalStorageProvider({ uploadDir: config.uploadDir });
  }
}

function getStorageProvider() {
  if (!providerInstance) {
    providerInstance = createStorageProvider();
  }
  return providerInstance;
}

module.exports = { getStorageProvider, createStorageProvider };
