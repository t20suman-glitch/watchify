const AppError = require('../errors/appError');

/**
 * AWS S3 storage — stub ready for @aws-sdk/client-s3 integration.
 *
 * When implementing:
 * 1. npm install @aws-sdk/client-s3 @aws-sdk/lib-storage
 * 2. Use PutObject / Upload for save()
 * 3. Use GetObject for getReadStream() or return presigned URLs
 * 4. Use DeleteObject for delete()
 */
class S3StorageProvider {
  constructor({ bucket, region }) {
    this.bucket = bucket;
    this.region = region;
  }

  ensureConfigured() {
    if (!this.bucket || !this.region) {
      throw AppError.internal(
        'S3 is not configured. Set AWS_S3_BUCKET and AWS_REGION, then implement S3StorageProvider.'
      );
    }
  }

  async save() {
    this.ensureConfigured();
    throw AppError.notImplemented(
      'S3 upload not implemented yet. Install @aws-sdk/client-s3 and complete s3StorageProvider.js'
    );
  }

  async getReadStream() {
    this.ensureConfigured();
    throw AppError.notImplemented('S3 download not implemented yet');
  }

  async delete() {
    this.ensureConfigured();
    throw AppError.notImplemented('S3 delete not implemented yet');
  }
}

module.exports = S3StorageProvider;
