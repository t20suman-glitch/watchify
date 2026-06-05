const mongoose = require('mongoose');

const watchSessionSchema = new mongoose.Schema(
  {
    userId: { type: String, required: true, index: true },
    mediaId: { type: String, required: true, index: true },
    positionSeconds: { type: Number, default: 0 },
  },
  { timestamps: true, collection: 'watch_sessions' }
);

watchSessionSchema.index({ userId: 1, mediaId: 1 });

module.exports = mongoose.model('WatchSession', watchSessionSchema);
