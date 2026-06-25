const AppError = require('../errors/appError');
const config = require('../config');
const { getStorageProvider } = require('../storage');
const mediaRepository = require('../repositories/media.repository');
const { buildStorageKey, validateUploadPayload } = require('../utils/validation');
const { detectMediaType } = require('../utils/mediaTypes');

async function uploadMedia({
  title,
  description = '',
  mediaType,
  originalFilename,
  contentType,
  buffer,
}) {
  const resolvedMediaType = mediaType || detectMediaType(contentType);
  const validationError = validateUploadPayload({
    title,
    contentType,
    mediaType: resolvedMediaType,
    sizeBytes: buffer.length,
    maxSizeBytes: config.maxFileSizeBytes,
  });

  if (validationError) {
    throw AppError.invalidArgument(validationError);
  }

  const storageKey = buildStorageKey(resolvedMediaType, originalFilename);
  const storage = getStorageProvider();
  await storage.save({ buffer, key: storageKey, contentType });

  const media = await mediaRepository.create({
    title: title.trim(),
    description: description?.trim() ?? '',
    mediaType: resolvedMediaType,
    storageKey,
    storageProvider: config.storageProvider,
    contentType,
    sizeBytes: buffer.length,
    originalFilename,
  });

  return media;
}

async function uploadMediaStream(call) {
  let metadata;
  const chunks = [];

  for await (const req of call) {
    if (req.metadata) metadata = req.metadata;
    if (req.data) chunks.push(req.data);
  }

  if (!metadata) {
    throw AppError.invalidArgument('Missing upload metadata');
  }

  const buffer = Buffer.concat(chunks);
  const result = await uploadMedia({
    title: metadata.title,
    description: metadata.description,
    mediaType: metadata.media_type,
    originalFilename: metadata.filename,
    contentType: metadata.content_type,
    buffer,
  });

  return {
    media_id: result.id,
    storage_key: result.storage_key,
    storage_provider: result.storage_provider,
  };
}

async function getMedia(mediaId) {
  const found = await mediaRepository.findById(mediaId);
  if (!found) {
    throw AppError.notFound('Media not found');
  }
  return found.response;
}

async function listMedia({ page = 1, limit = 20, media_type }) {
  if (media_type && !['video', 'music'].includes(media_type)) {
    throw AppError.invalidArgument('media_type must be video or music');
  }
  return mediaRepository.findAll({ page, limit, mediaType: media_type });
}

async function streamMedia(mediaId) {
  const found = await mediaRepository.findById(mediaId);
  if (!found) {
    throw AppError.notFound('Media not found');
  }

  const storage = getStorageProvider(found.doc.storageProvider);
  const { stream } = await storage.getReadStream(found.doc.storageKey);

  return {
    stream,
    contentType: found.doc.contentType,
    originalFilename: found.doc.originalFilename,
    sizeBytes: found.doc.sizeBytes,
  };
}

module.exports = { uploadMedia, uploadMediaStream, getMedia, listMedia, streamMedia };
