const config = require('../config');
const AppError = require('../errors/appError');

function buildUrl(path, query = {}) {
  const url = new URL(path, config.uploadServiceUrl);
  Object.entries(query).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== '') {
      url.searchParams.set(key, String(value));
    }
  });
  return url;
}

async function parseJsonResponse(response) {
  const body = await response.json().catch(() => ({}));
  if (!response.ok) {
    throw AppError.internal(body.error || `Upload service error (${response.status})`);
  }
  return body;
}

async function listVideos({ page = 1, limit = 20 }) {
  const response = await fetch(
    buildUrl('/api/uploads', { page, limit, mediaType: 'video' })
  );
  const { media } = await parseJsonResponse(response);
  return media ?? [];
}

async function getMedia(mediaId) {
  const response = await fetch(buildUrl(`/api/uploads/${mediaId}`));
  if (response.status === 404) {
    throw AppError.notFound('Video not found');
  }
  const body = await parseJsonResponse(response);
  return body.media;
}

async function fetchVideoStream(mediaId) {
  const response = await fetch(buildUrl(`/api/uploads/${mediaId}/stream`));
  if (response.status === 404) {
    throw AppError.notFound('Video not found');
  }
  if (!response.ok) {
    throw AppError.internal('Failed to fetch video stream from upload service');
  }
  return response;
}

module.exports = { listVideos, getMedia, fetchVideoStream };
