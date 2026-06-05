const path = require('path');
const { randomUUID } = require('crypto');
const { isAllowedContentType, detectMediaType } = require('./mediaTypes');

function sanitizeFilename(filename) {
  return path.basename(filename).replace(/[^a-zA-Z0-9._-]/g, '_');
}

function buildStorageKey(mediaType, originalFilename) {
  const safeName = sanitizeFilename(originalFilename);
  return `${mediaType}/${randomUUID()}-${safeName}`;
}

function validateUploadPayload({ title, contentType, mediaType, sizeBytes, maxSizeBytes }) {
  if (!title?.trim()) return 'Title is required';
  if (!contentType) return 'Content type is required';
  if (!isAllowedContentType(contentType)) {
    return 'File must be a supported video or audio format';
  }
  const resolvedType = mediaType || detectMediaType(contentType);
  if (!resolvedType || !['video', 'music'].includes(resolvedType)) {
    return 'mediaType must be video or music';
  }
  if (detectMediaType(contentType) && mediaType && detectMediaType(contentType) !== mediaType) {
    return 'mediaType does not match file content type';
  }
  if (sizeBytes > maxSizeBytes) {
    return `File exceeds maximum size of ${Math.floor(maxSizeBytes / 1024 / 1024)} MB`;
  }
  return null;
}

module.exports = { buildStorageKey, sanitizeFilename, validateUploadPayload };
