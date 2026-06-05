/**
 * Storage provider contract — swap implementations without changing upload logic.
 *
 * @typedef {object} SaveResult
 * @property {string} key
 * @property {string|null} url - Public or signed URL (S3); null for local
 *
 * Implementations must provide:
 * - save({ buffer, key, contentType }) => Promise<SaveResult>
 * - getReadStream(key) => Promise<{ stream, contentType? }>
 * - delete(key) => Promise<void>
 */

module.exports = {};
