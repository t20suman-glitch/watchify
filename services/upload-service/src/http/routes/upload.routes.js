const express = require('express');
const AppError = require('../../errors/appError');
const uploadService = require('../../services/upload.service');
const { uploadMedia, getUploadedFile, handleMulterError } = require('../middleware/upload');
const { asyncHandler } = require('../middleware/errorHandler');
const { parseUploadForm } = require('../utils/parseUploadForm');

const router = express.Router();

router.post(
  '/',
  uploadMedia,
  handleMulterError,
  asyncHandler(async (req, res) => {
    const file = getUploadedFile(req);
    if (!file) {
      throw AppError.invalidArgument(
        'A file is required. Use form field "file" (type File in Postman) for the video or audio.'
      );
    }

    const { title, description, mediaType } = parseUploadForm(req);

    const media = await uploadService.uploadMedia({
      title,
      description,
      mediaType,
      originalFilename: file.originalname,
      contentType: file.mimetype,
      buffer: file.buffer,
    });

    res.status(201).json({ media });
  })
);

router.get(
  '/',
  asyncHandler(async (req, res) => {
    const page = Number(req.query.page) || 1;
    const limit = Number(req.query.limit) || 20;
    const media_type = req.query.mediaType || req.query.media_type;
    const media = await uploadService.listMedia({ page, limit, media_type });
    res.json({ media });
  })
);

router.get(
  '/:id/stream',
  asyncHandler(async (req, res) => {
    const { stream, contentType, originalFilename, sizeBytes } =
      await uploadService.streamMedia(req.params.id);

    res.setHeader('Content-Type', contentType);
    res.setHeader('Content-Disposition', `inline; filename="${originalFilename}"`);
    if (sizeBytes) {
      res.setHeader('Content-Length', sizeBytes);
    }

    stream.pipe(res);
  })
);

router.get(
  '/:id',
  asyncHandler(async (req, res) => {
    const media = await uploadService.getMedia(req.params.id);
    res.json({ media });
  })
);

module.exports = router;
