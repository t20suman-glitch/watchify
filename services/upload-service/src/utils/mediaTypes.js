const VIDEO_MIME_TYPES = new Set([
  'video/mp4',
  'video/webm',
  'video/quicktime',
  'video/x-msvideo',
  'video/x-matroska',
]);

const MUSIC_MIME_TYPES = new Set([
  'audio/mpeg',
  'audio/mp3',
  'audio/wav',
  'audio/x-wav',
  'audio/flac',
  'audio/aac',
  'audio/ogg',
  'audio/webm',
]);

const ALLOWED_MIME_TYPES = new Set([...VIDEO_MIME_TYPES, ...MUSIC_MIME_TYPES]);

function detectMediaType(contentType) {
  if (VIDEO_MIME_TYPES.has(contentType)) return 'video';
  if (MUSIC_MIME_TYPES.has(contentType)) return 'music';
  return null;
}

function isAllowedContentType(contentType) {
  return ALLOWED_MIME_TYPES.has(contentType);
}

module.exports = {
  ALLOWED_MIME_TYPES,
  detectMediaType,
  isAllowedContentType,
};
