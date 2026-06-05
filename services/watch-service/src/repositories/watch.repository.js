const WatchSession = require('../models/watchSession.model');

function toResponse(doc) {
  return {
    session_id: doc._id.toString(),
    user_id: doc.userId,
    media_id: doc.mediaId,
    position_seconds: doc.positionSeconds,
    started_at: doc.createdAt?.toISOString() ?? '',
    updated_at: doc.updatedAt?.toISOString() ?? '',
  };
}

async function findOrCreateSession({ userId, mediaId }) {
  let doc = await WatchSession.findOne({ userId, mediaId }).sort({ updatedAt: -1 });
  if (!doc) {
    doc = await WatchSession.create({ userId, mediaId, positionSeconds: 0 });
  }
  return toResponse(doc);
}

async function updatePosition(sessionId, userId, positionSeconds) {
  const filter = userId ? { _id: sessionId, userId } : { _id: sessionId };
  const doc = await WatchSession.findOneAndUpdate(filter, { positionSeconds }, { new: true });
  if (!doc) return null;
  return toResponse(doc);
}

async function updatePositionByMedia({ userId, mediaId, positionSeconds }) {
  const doc = await WatchSession.findOneAndUpdate(
    { userId, mediaId },
    { positionSeconds },
    { new: true, sort: { updatedAt: -1 } }
  );
  if (!doc) return null;
  return toResponse(doc);
}

async function findByUser(userId, { page, limit }) {
  const skip = (page - 1) * limit;
  const docs = await WatchSession.find({ userId })
    .sort({ updatedAt: -1 })
    .skip(skip)
    .limit(limit);
  return docs.map(toResponse);
}

module.exports = {
  findOrCreateSession,
  updatePosition,
  updatePositionByMedia,
  findByUser,
  toResponse,
};
