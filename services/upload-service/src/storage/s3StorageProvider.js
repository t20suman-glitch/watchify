const {
  S3Client,
  GetObjectCommand,
  DeleteObjectCommand,
} = require('@aws-sdk/client-s3');
const { Upload } = require('@aws-sdk/lib-storage');
const AppError = require('../errors/appError');

function isNotFoundError(err) {
  return (
    err?.name === 'NoSuchKey' ||
    err?.name === 'NotFound' ||
    err?.$metadata?.httpStatusCode === 404
  );
}

class S3StorageProvider {
  constructor({
    bucket,
    region,
    endpoint,
    forcePathStyle,
    accessKeyId,
    secretAccessKey,
  }) {
    this.bucket = bucket;
    this.region = region;

    const clientConfig = { region };
    if (endpoint) {
      clientConfig.endpoint = endpoint;
      clientConfig.forcePathStyle = forcePathStyle;
    }
    if (accessKeyId && secretAccessKey) {
      clientConfig.credentials = { accessKeyId, secretAccessKey };
    }
    this.client = new S3Client(clientConfig);
  }

  ensureConfigured() {
    if (!this.bucket || !this.region) {
      throw AppError.internal(
        'S3 is not configured. Set AWS_S3_BUCKET and AWS_REGION.'
      );
    }
  }

  async save({ buffer, key, contentType }) {
    this.ensureConfigured();

    const upload = new Upload({
      client: this.client,
      params: {
        Bucket: this.bucket,
        Key: key,
        Body: buffer,
        ContentType: contentType || 'application/octet-stream',
      },
    });

    await upload.done();
    return { key, url: null };
  }

  async getReadStream(key) {
    this.ensureConfigured();

    try {
      const response = await this.client.send(
        new GetObjectCommand({ Bucket: this.bucket, Key: key })
      );

      if (!response.Body) {
        throw AppError.notFound('File not found in storage');
      }

      return {
        stream: response.Body,
        contentType: response.ContentType,
      };
    } catch (err) {
      if (isNotFoundError(err)) {
        throw AppError.notFound('File not found in storage');
      }
      throw err;
    }
  }

  async delete(key) {
    this.ensureConfigured();
    await this.client
      .send(new DeleteObjectCommand({ Bucket: this.bucket, Key: key }))
      .catch(() => {});
  }
}

module.exports = S3StorageProvider;
