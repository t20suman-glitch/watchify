const mongoose = require('mongoose');

const mediaSchema = new mongoose.Schema(
  {
    title: { type: String, required: true, trim: true },
    description: { type: String, trim: true },
    uploadedBy: { type: String, index: true },
    mediaType: { type: String, required: true, enum: ['video', 'music'], index: true },
    storageKey: { type: String, required: true },
    storageProvider: { type: String, required: true, enum: ['local', 's3'], default: 'local' },
    contentType: { type: String, required: true },
    sizeBytes: { type: Number, required: true },
    originalFilename: { type: String, required: true },
  },
  { timestamps: true, collection: 'media_uploads' }
);

module.exports = mongoose.model('MediaUpload', mediaSchema);
