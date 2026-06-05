const { Readable } = require('stream');
const AppError = require('../errors/appError');
const uploadClient = require('../clients/uploadService.client');
const watchRepository = require('../repositories/watch.repository');

function assertVideo(media) {
  if (!media) {
    throw AppError.notFound('Video not found');
  }
  if (media.media_type !== 'video') {
    throw AppError.failedPrecondition('Only video content can be watched here');
  }
}

function toPublicVideo(media) {
  return {
    id: media.id,
    title: media.title,
    description: media.description,
    media_type: media.media_type,
    content_type: media.content_type,
    size_bytes: media.size_bytes,
    original_filename: media.original_filename,
    created_at: media.created_at,
    watch_url: `/api/videos/${media.id}/stream`,
  };
}

async function getLatestVideos({ page = 1, limit = 20 }) {
  const media = await uploadClient.listVideos({ page, limit });
  return media.map(toPublicVideo);
}

async function getVideo(mediaId) {
  const media = await uploadClient.getMedia(mediaId);
  assertVideo(media);
  return toPublicVideo(media);
}

async function startWatchStream({ userId, mediaId }) {
  const media = await uploadClient.getMedia(mediaId);
  assertVideo(media);

  const session = await watchRepository.findOrCreateSession({ userId, mediaId });
  const upstream = await uploadClient.fetchVideoStream(mediaId);

  return {
    session,
    media: toPublicVideo(media),
    upstream,
  };
}

async function pipeWatchStream({ userId, mediaId, res }) {
  const { session, media, upstream } = await startWatchStream({ userId, mediaId });

  res.setHeader('Content-Type', upstream.headers.get('content-type') || media.content_type);
  res.setHeader('X-Watch-Session-Id', session.session_id);
  res.setHeader('X-Resume-Position-Seconds', String(session.position_seconds));

  const contentLength = upstream.headers.get('content-length');
  if (contentLength) {
    res.setHeader('Content-Length', contentLength);
  }

  const disposition = upstream.headers.get('content-disposition');
  if (disposition) {
    res.setHeader('Content-Disposition', disposition);
  }

  Readable.fromWeb(upstream.body).pipe(res);
}

async function updateProgress({ userId, mediaId, sessionId, positionSeconds }) {
  if (positionSeconds < 0) {
    throw AppError.invalidArgument('positionSeconds must be 0 or greater');
  }

  const media = await uploadClient.getMedia(mediaId);
  assertVideo(media);

  let session;
  if (sessionId) {
    session = await watchRepository.updatePosition(sessionId, userId, positionSeconds);
  } else {
    session = await watchRepository.updatePositionByMedia({
      userId,
      mediaId,
      positionSeconds,
    });
  }

  if (!session) {
    throw AppError.notFound('Watch session not found');
  }

  return session;
}

async function getWatchHistory({ userId, page = 1, limit = 20 }) {
  const sessions = await watchRepository.findByUser(userId, { page, limit });

  const history = await Promise.all(
    sessions.map(async (session) => {
      try {
        const media = await uploadClient.getMedia(session.media_id);
        return { session, video: toPublicVideo(media) };
      } catch {
        return { session, video: null };
      }
    })
  );

  return history;
}

async function startWatch({ user_id, media_id }) {
  const media = await uploadClient.getMedia(media_id);
  assertVideo(media);
  return watchRepository.findOrCreateSession({ userId: user_id, mediaId: media_id });
}

async function updateProgressGrpc({ session_id, user_id, position_seconds }) {
  if (position_seconds < 0) {
    throw AppError.invalidArgument('position_seconds must be 0 or greater');
  }

  const session = await watchRepository.updatePosition(
    session_id,
    user_id || null,
    position_seconds
  );
  if (!session) {
    throw AppError.notFound('Watch session not found');
  }
  return session;
}

module.exports = {
  getLatestVideos,
  getVideo,
  pipeWatchStream,
  updateProgress,
  getWatchHistory,
  startWatch,
  updateProgressGrpc,
};
