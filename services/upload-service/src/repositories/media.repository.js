const MediaUpload = require('../models/media.model');

function toResponse(doc) {
  return {
    id: doc._id.toString(),
    title: doc.title,
    description: doc.description ?? '',
    uploaded_by: doc.uploadedBy ?? '',
    media_type: doc.mediaType,
    storage_key: doc.storageKey,
    storage_provider: doc.storageProvider,
    content_type: doc.contentType,
    size_bytes: doc.sizeBytes,
    original_filename: doc.originalFilename,
    created_at: doc.createdAt?.toISOString() ?? '',
  };
}

async function create(data) {
  const doc = await MediaUpload.create(data);
  return toResponse(doc);
}

async function findById(id) {
  const doc = await MediaUpload.findById(id);
  if (!doc) return null;
  return { doc, response: toResponse(doc) };
}

async function findAll({ page, limit, mediaType }) {
  const skip = (page - 1) * limit;
  const filter = mediaType ? { mediaType } : {};
  const docs = await MediaUpload.find(filter)
    .sort({ createdAt: -1 })
    .skip(skip)
    .limit(limit);
  return docs.map(toResponse);
}

module.exports = { create, findById, findAll, toResponse };
