const multer = require('multer');
const config = require('../../config');
const AppError = require('../../errors/appError');
const { ALLOWED_MIME_TYPES } = require('../../utils/mediaTypes');

const FILE_FIELDS = [
  { name: 'file', maxCount: 1 },
  { name: 'video', maxCount: 1 },
  { name: 'media', maxCount: 1 },
  { name: 'audio', maxCount: 1 },
];

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: config.maxFileSizeBytes, files: 1 },
  fileFilter(_req, file, cb) {
    if (!ALLOWED_MIME_TYPES.has(file.mimetype)) {
      cb(AppError.invalidArgument('File must be a supported video or audio format'));
      return;
    }
    cb(null, true);
  },
});

const uploadMedia = upload.fields(FILE_FIELDS);

function getUploadedFile(req) {
  if (req.file) return req.file;
  if (!req.files) return null;

  for (const { name } of FILE_FIELDS) {
    const files = req.files[name];
    if (files?.[0]) return files[0];
  }
  return null;
}

function handleMulterError(err, _req, _res, next) {
  if (!(err instanceof multer.MulterError)) {
    next(err);
    return;
  }

  if (err.code === 'LIMIT_FILE_SIZE') {
    next(
      AppError.invalidArgument(
        `File exceeds maximum size of ${Math.floor(config.maxFileSizeBytes / 1024 / 1024)} MB`
      )
    );
    return;
  }

  if (err.code === 'LIMIT_UNEXPECTED_FILE') {
    next(
      AppError.invalidArgument(
        `Unexpected file field "${err.field}". In Postman: set title, uploadedBy, description, and mediaType as Text. ` +
          'Send the video/audio only once as field "file" (type File).'
      )
    );
    return;
  }

  if (err.code === 'LIMIT_FILE_COUNT') {
    next(AppError.invalidArgument('Send only one file per request'));
    return;
  }

  next(AppError.invalidArgument(err.message));
}

module.exports = { uploadMedia, getUploadedFile, handleMulterError };
