const AppError = require('../../errors/appError');

function getBodyField(body, keys) {
  for (const key of keys) {
    const value = body?.[key];
    if (typeof value === 'string' && value.trim()) {
      return value.trim();
    }
  }
  return null;
}

function parseUploadForm(req) {
  const title = getBodyField(req.body, ['title']);
  const description = getBodyField(req.body, ['description']) ?? '';
  const mediaType = getBodyField(req.body, ['mediaType', 'media_type']);

  if (!title) {
    throw AppError.invalidArgument('title is required (form field, type Text)');
  }

  return { title, description, mediaType };
}

module.exports = { parseUploadForm };
